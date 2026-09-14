import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Extract and persist auth token from OAuth redirects if present
try {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get("auth_token");
    if (authToken) {
      localStorage.setItem("musivo_token", authToken);
      sessionStorage.setItem("musivo_token", authToken);
      sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${authToken}`);
      urlParams.delete("auth_token");
      const remainingSearch = urlParams.toString() ? `?${urlParams.toString()}` : "";
      window.history.replaceState({}, document.title, `${window.location.pathname}${remainingSearch}${window.location.hash}`);
    }
  }
} catch (e) {
  console.warn("[Auth] Token extraction skipped:", e);
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Dual storage authentication: check direct token first, then fallback to cookie mirror
        try {
          const directToken = localStorage.getItem("musivo_token") || sessionStorage.getItem("musivo_token");
          if (directToken) {
            return { Authorization: `Bearer ${directToken}` };
          }
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // storage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

// Register Musivo PWA service worker for installable app & background caching
if ("serviceWorker" in navigator && typeof window !== "undefined") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PWA] Service Worker registered with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Service Worker registration skipped/failed:", err);
      });
  });
}

