function cleanEnvString(val: string | undefined): string {
  if (!val) return "";
  const cleaned = val.trim().replace(/^["']|["']$/g, "");
  if (cleaned.startsWith("<") && cleaned.endsWith(">")) return "";
  if (/^your[\s_-]+/i.test(cleaned) || /step\s+\d/i.test(cleaned) || /^placeholder/i.test(cleaned)) return "";
  return cleaned;
}

export const ENV = {
  appId: cleanEnvString(process.env.VITE_APP_ID) || "musivo",
  cookieSecret: cleanEnvString(process.env.JWT_SECRET) || "musivo-super-secret-production-key-at-least-32-chars-long",
  databaseUrl: cleanEnvString(process.env.DATABASE_URL),
  oAuthServerUrl: cleanEnvString(process.env.OAUTH_SERVER_URL),
  ownerOpenId: cleanEnvString(process.env.OWNER_OPEN_ID),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: cleanEnvString(process.env.BUILT_IN_FORGE_API_URL),
  forgeApiKey: cleanEnvString(process.env.BUILT_IN_FORGE_API_KEY),
  spotifyClientId: cleanEnvString(process.env.SPOTIFY_CLIENT_ID),
  spotifyClientSecret: cleanEnvString(process.env.SPOTIFY_CLIENT_SECRET),
  spotifyMarket: cleanEnvString(process.env.SPOTIFY_MARKET) || "US",
  spotifyRedirectUri: cleanEnvString(process.env.SPOTIFY_REDIRECT_URI),
  googleClientId: cleanEnvString(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: cleanEnvString(process.env.GOOGLE_CLIENT_SECRET),
  googleRedirectUri: cleanEnvString(process.env.GOOGLE_REDIRECT_URI),
};

