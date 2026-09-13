import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  test: {
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/**/*.test.ts",
      "client/**/*.spec.ts",
    ],
    env: {
      JWT_SECRET: "musivo-test-secret-at-least-32-characters-long",
      SPOTIFY_CLIENT_ID: "mock-test-client-id",
      SPOTIFY_CLIENT_SECRET: "mock-test-client-secret",
    },
  },
});
