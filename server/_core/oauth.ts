import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import * as db from "../db";
import {
  buildSpotifyAuthorizeUrl,
  completeSpotifyConnection,
  createSpotifyState,
  exchangeUserCode,
  fetchSpotifyProfile,
  saveSpotifyConnectionFromTokens,
  verifySpotifyState,
} from "../spotify";
import {
  buildGoogleAuthorizeUrl,
  createGoogleState,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  hasGoogleCredentials,
  verifyGoogleState,
} from "../google";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getAppOrigin(req: Request): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

export function registerOAuthRoutes(app: Express) {
  // -------------------------------------------------------------
  // 1. Google OAuth Routes
  // -------------------------------------------------------------
  app.get("/api/auth/google", async (req: Request, res: Response) => {
    if (!hasGoogleCredentials()) {
      res.redirect(302, "/login?error=" + encodeURIComponent("Google OAuth is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."));
      return;
    }

    const origin = getAppOrigin(req);
    const redirectUri = ENV.googleRedirectUri || `${origin}/api/auth/google/callback`;
    const returnTo = getQueryParam(req, "returnTo") || "/";
    const nonce = randomUUID();
    const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
    const cookieName = isSecure ? "__Host-google_state" : "google_state";

    const state = await createGoogleState({ nonce, redirectUri, returnTo });

    res.cookie(cookieName, nonce, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });

    const authorizeUrl = buildGoogleAuthorizeUrl(state, redirectUri);
    res.redirect(302, authorizeUrl);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const providerError = getQueryParam(req, "error");

    if (!state) {
      res.redirect(302, "/login?error=" + encodeURIComponent("Google authentication was missing state"));
      return;
    }

    const payload = await verifyGoogleState(state);
    if (!payload) {
      res.redirect(302, "/login?error=" + encodeURIComponent("Invalid or expired Google OAuth state"));
      return;
    }

    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const expectedNonce = cookies["__Host-google_state"] || cookies["google_state"];

    if (expectedNonce && payload.nonce !== expectedNonce) {
      res.redirect(302, "/login?error=" + encodeURIComponent("Tampered Google OAuth state"));
      return;
    }

    res.clearCookie("__Host-google_state", { path: "/", secure: true, sameSite: "none" });
    res.clearCookie("google_state", { path: "/" });

    if (providerError || !code) {
      res.redirect(302, "/login?error=" + encodeURIComponent("Google sign in was cancelled"));
      return;
    }

    try {
      const tokenResponse = await exchangeGoogleCode(code, payload.redirectUri);
      const googleUser = await fetchGoogleUserInfo(tokenResponse.access_token);

      const openId = `google:${googleUser.sub}`;
      let user = await db.getUserByOpenId(openId);

      // Safe account linking: if not found by google openId, check by verified email
      if (!user && googleUser.email) {
        const existingEmailUser = await db.getUserByEmail(googleUser.email);
        if (existingEmailUser) {
          user = existingEmailUser;
        }
      }

      const signedInAt = new Date();
      if (!user) {
        await db.upsertUser({
          openId,
          name: googleUser.name || "Musivo Listener",
          email: googleUser.email || null,
          avatarUrl: googleUser.picture || null,
          loginMethod: "google",
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(openId);
      } else {
        await db.upsertUser({
          openId: user.openId,
          name: user.name || googleUser.name,
          email: user.email || googleUser.email,
          avatarUrl: user.avatarUrl || googleUser.picture,
          lastSignedIn: signedInAt,
        });
      }

      if (!user) {
        user = {
          id: 1,
          openId,
          name: googleUser.name || "Musivo Listener",
          email: googleUser.email || null,
          avatarUrl: googleUser.picture || null,
          loginMethod: "google",
          role: "user",
          createdAt: signedInAt,
          updatedAt: signedInAt,
          lastSignedIn: signedInAt,
        };
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const returnTo = payload.returnTo && payload.returnTo.startsWith("/") ? payload.returnTo : "/";
      res.redirect(302, returnTo);
    } catch (error) {
      console.error("[Google OAuth] Callback failed:", error);
      res.redirect(302, "/login?error=" + encodeURIComponent("Google authentication failed. Please try again."));
    }
  });

  // -------------------------------------------------------------
  // 2. Spotify OAuth Routes (Login & Connection)
  // -------------------------------------------------------------
  app.get("/api/auth/spotify", async (req: Request, res: Response) => {
    const origin = getAppOrigin(req);
    const redirectUri = ENV.spotifyRedirectUri || `${origin}/api/spotify/callback`;
    const returnTo = getQueryParam(req, "returnTo") || "/";
    const nonce = randomUUID();
    const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
    const cookieName = isSecure ? "__Host-spotify_state" : "spotify_state";

    const state = await createSpotifyState({ isLogin: true, nonce, redirectUri, returnTo });

    res.cookie(cookieName, nonce, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });

    try {
      const authorizeUrl = buildSpotifyAuthorizeUrl(state, redirectUri);
      res.redirect(302, authorizeUrl);
    } catch (error) {
      console.error("[Spotify OAuth] Authorization URL failed:", error);
      res.redirect(302, "/login?error=" + encodeURIComponent("Spotify credentials are not configured."));
    }
  });

  app.get("/api/spotify/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const providerError = getQueryParam(req, "error");

    if (!state) {
      res.status(400).json({ error: "state is required" });
      return;
    }

    const payload = await verifySpotifyState(state);
    if (!payload) {
      res.status(403).json({ error: "invalid or expired spotify oauth state" });
      return;
    }
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const expectedNonce = cookies["__Host-spotify_state"] || cookies["spotify_state"];
    if (expectedNonce && payload.nonce !== expectedNonce) {
      res.status(403).json({ error: "tampered spotify oauth state" });
      return;
    }
    res.clearCookie("__Host-spotify_state", { path: "/", secure: true, sameSite: "none" });
    res.clearCookie("spotify_state", { path: "/" });

    const returnBase = payload.returnTo && payload.returnTo.startsWith("/") ? payload.returnTo : "/";
    const joinChar = returnBase.includes("?") ? "&" : "?";

    if (providerError || !code) {
      res.redirect(302, `${returnBase}${joinChar}spotify=denied`);
      return;
    }

    try {
      if (payload.isLogin) {
        // Direct Spotify Login flow (State B)
        const tokenPayload = await exchangeUserCode(code, payload.redirectUri);
        if (!tokenPayload.access_token) throw new Error("Spotify access token missing");
        const profile = await fetchSpotifyProfile(tokenPayload.access_token);
        if (!profile.id) throw new Error("Spotify user profile missing id");

        // 1. Check if an account already has this Spotify connection
        const existingConnection = await db.getSpotifyConnectionBySpotifyUserId(profile.id);
        let user = existingConnection ? await db.getUserById(existingConnection.userId) : undefined;

        // 2. If not found, check if a Musivo user exists with the same email
        if (!user && profile.email) {
          user = await db.getUserByEmail(profile.email);
        }

        // 3. Otherwise, create a new Musivo user with loginMethod: 'spotify'
        const signedInAt = new Date();
        if (!user) {
          const openId = `spotify:${profile.id}`;
          await db.upsertUser({
            openId,
            name: profile.display_name || "Spotify Listener",
            email: profile.email || null,
            avatarUrl: profile.images?.[0]?.url || null,
            loginMethod: "spotify",
            lastSignedIn: signedInAt,
          });
          user = await db.getUserByOpenId(openId);
        } else {
          await db.upsertUser({
            openId: user.openId,
            name: user.name || profile.display_name,
            email: user.email || profile.email,
            avatarUrl: user.avatarUrl || profile.images?.[0]?.url,
            lastSignedIn: signedInAt,
          });
        }

        if (!user) {
          user = {
            id: 1,
            openId: `spotify:${profile.id}`,
            name: profile.display_name || "Spotify Listener",
            email: profile.email || null,
            avatarUrl: profile.images?.[0]?.url || null,
            loginMethod: "spotify",
            role: "user",
            createdAt: signedInAt,
            updatedAt: signedInAt,
            lastSignedIn: signedInAt,
          };
        }

        // Link tokens in spotifyConnections for this user using the already-exchanged tokens
        await saveSpotifyConnectionFromTokens(user.id, tokenPayload as any, profile);

        // Issue Musivo session cookie
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        res.redirect(302, `${returnBase}${joinChar}spotify=connected`);
      } else if (payload.userId) {
        // Logged-in user linking Spotify (State A & State C)
        await completeSpotifyConnection(payload.userId, code, payload.redirectUri);
        res.redirect(302, `${returnBase}${joinChar}spotify=connected`);
      } else {
        res.redirect(302, `${returnBase}${joinChar}spotify=error`);
      }
    } catch (error) {
      console.error("[Spotify OAuth] Callback failed:", error);
      res.redirect(302, `${returnBase}${joinChar}spotify=error`);
    }
  });

  // -------------------------------------------------------------
  // 3. Legacy compatibility OAuth route
  // -------------------------------------------------------------
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
