import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

export type GoogleStatePayload = {
  nonce: string;
  redirectUri: string;
  returnTo?: string;
};

export type GoogleUserInfo = {
  sub: string;
  email: string;
  name: string;
  picture?: string | null;
  email_verified?: boolean;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

function getSessionKey() {
  const secret = ENV.cookieSecret || ENV.spotifyClientSecret || "musivo-google-oauth-secret-key-32b";
  return new TextEncoder().encode(secret);
}

export function hasGoogleCredentials() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}

export async function createGoogleState(payload: GoogleStatePayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSessionKey());
}

export async function verifyGoogleState(state: string): Promise<GoogleStatePayload | null> {
  try {
    const { payload } = await jwtVerify(state, getSessionKey(), { algorithms: ["HS256"] });
    const nonce = typeof payload.nonce === "string" ? payload.nonce : "";
    const redirectUri = typeof payload.redirectUri === "string" ? payload.redirectUri : "";
    const returnTo = typeof payload.returnTo === "string" ? payload.returnTo : undefined;
    if (!nonce || !redirectUri) return null;
    return { nonce, redirectUri, returnTo };
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizeUrl(state: string, redirectUri: string) {
  if (!hasGoogleCredentials()) {
    throw new Error("Google OAuth credentials are not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", ENV.googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  if (!hasGoogleCredentials()) {
    throw new Error("Google OAuth credentials are not configured.");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const payload = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) {
    const detail = payload.error_description || payload.error || `HTTP ${response.status}`;
    throw new Error(`Google token exchange failed (${response.status}): ${detail}`);
  }
  return payload;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google user profile with HTTP ${response.status}`);
  }

  const data = (await response.json()) as GoogleUserInfo;
  if (!data.sub || !data.email) {
    throw new Error("Google user profile is missing required sub or email field");
  }
  return data;
}
