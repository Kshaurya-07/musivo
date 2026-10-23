# 🎵 Musivo

[![CI](https://github.com/Kshaurya-07/musivo/actions/workflows/ci.yml/badge.svg)](https://github.com/Kshaurya-07/musivo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vite.dev/)

**Musivo** is a production-grade, high-density music streaming and discovery platform inspired by the visual organization, responsive content density, and seamless usability of **JioSaavn**, styled with a **Premium Monochrome & Graphite Color System** supporting both **Day Mode** and **Night Mode**.

Musivo integrates the official **Spotify Web Playback SDK**, **Apple iTunes Search API**, dual **Google & Spotify OAuth 2.0**, **AI Mix Studio**, **Podcasts with Video Embeds**, **Real-Time Listening Telemetry**, **Sleep Timer**, **Spotify Connect Device Management**, and **PWA** capabilities.

---

## 📌 Table of Contents

1. [Key Features & Highlights](#-key-features--highlights)
2. [UI/UX Architecture: JioSaavn-Inspired Density](#-uiux-architecture-jiosaavn-inspired-density)
3. [Design System: Premium Monochrome + Graphite](#-design-system-premium-monochrome--graphite)
4. [Audio Playback & Streaming Engine](#-audio-playback--streaming-engine)
5. [Authentication & Security Architecture](#-authentication--security-architecture)
6. [Tech Stack & Architecture](#-tech-stack--architecture)
7. [External APIs & Services](#-external-apis--services)
8. [Getting Started & Local Setup](#-getting-started--local-setup)
9. [Verification & Testing Suite](#-verification--testing-suite)
10. [NPM Scripts Reference](#-npm-scripts-reference)
11. [License](#-license)

---

## ✨ Key Features & Highlights

- **JioSaavn-Inspired High-Density Layout**: 7-column responsive shelves (`2xl:grid-cols-7`), Sub-Nav Ribbon, 16:9 Landscape Chart Banners, circular artist avatars, and quick-access cards.
- **Day & Night Monochrome Theme**: Switch effortlessly between a crisp light mode (porcelain white, soft silver, obsidian accents) and a cinematic dark mode (deep obsidian, dark graphite, silver typography) via the sticky header `ThemeToggle`. All content artwork retains 100% natural, vivid colors.
- **Spotify Web Playback SDK Streaming**: In-browser lossless playback for Spotify Premium accounts with track seeking, volume control, and shuffle/repeat modes.
- **Instant Audio Previews**: Integrated with Apple iTunes Search API for instantaneous 30-second audio previews when logged out or exploring unauthenticated tracks.
- **AI Mix Studio**: Neural vibe curation engine that creates custom playlists based on moods, tempo, and taste profiles, with automatic fallback to Spotify algorithmic recommendations.
- **Podcasts & Video Shows**: Dedicated podcast player with embedded video player support, episode browser, and transcript summaries.
- **Listening Telemetry & Analytics**: Real-time stats engine tracking total listening time, 7-day activity cadence, music vs. podcast split, top artists, and top songs (threshold ≥30s).
- **Edge Floating Queue & Slide-Out Drawer**: Always-accessible floating queue tab with a slide-out drawer for reordering, adding, or clearing upcoming tracks.
- **Spotify Connect Device Management**: Live device selector popover to transfer playback between web browser, desktop apps, smartphones, smart TVs, and speakers.
- **Playback Diagnostics Panel**: Popover showing live Spotify SDK script status, connected device ID, playback engine state, and active errors.
- **Configurable Sleep Timer**: Set playback to gently stop after 15, 30, 45, 60 minutes or at the end of the currently playing track.
- **Bi-Directional Spotify Library Sync**: Sync liked songs, personal playlists, and recently played tracks, or create new private Spotify playlists directly from the app.
- **Progressive Web App (PWA)**: Installable on Windows, macOS, Android, and iOS with service worker caching for fast offline app shell launches.

---

## 📐 UI/UX Architecture: JioSaavn-Inspired Density

Musivo takes direct inspiration from JioSaavn's information architecture and content density:

| Component | Description |
| :--- | :--- |
| **Sub-Nav Category Ribbon** | Sticky secondary navigation bar allowing one-click filtering across `All`, `Trending`, `Top Charts`, `New Releases`, `Discover`, `AI Mix`, `Library`, and `Podcasts`. |
| **7-Column Music Shelves** | Ultra-dense grid scaling smoothly from 2 columns on mobile up to 7 columns on 2K/4K displays (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7`). |
| **16:9 Landscape Chart Banners** | Wide rectangular cards for top charts, trending lists, and editorial mixes with hover-to-reveal quick play triggers. |
| **Quick Access Action Cards** | Compact horizontal cards for rapid resumption of recent playlists, liked songs, and daily mixes with instant play action buttons. |
| **Circular Artist Avatars** | Round portrait avatars with smooth hover scale and active ring states, linking directly to artist discography modals. |
| **Edge Floating Queue Tab** | Right-hand pinned badge displaying the current queue count, opening a comprehensive slide-out queue manager. |
| **JioSaavn-Style Bottom Dock** | Persistent audio dock featuring album art, title/artist metadata, timeline scrubber with seek tooltips, volume slider, diagnostics toggle, sleep timer, device switcher, and queue drawer toggle. |

---

## 🎨 Design System: Premium Monochrome + Graphite

The entire UI is built on a neutral monochrome palette:

```
Obsidian (#050505 / #080808) ──► Charcoal (#111111 / #151515) ──► Graphite (#1F1F1F / #242424)
Dark Grey (#2E2E2E / #363636) ──► Silver (#9A9A9A / #C2C2C2) ──► Porcelain (#F5F5F7 / #FAFAFA)
```

### Day Mode vs. Night Mode
- **Day Mode**: Clean porcelain backgrounds (`#FAFAFA` / `#F3F3F5`), light silver borders (`border-black/10`), obsidian typography (`#111111`), and high-contrast dark buttons (`bg-black text-white`).
- **Night Mode**: Deep obsidian canvas (`#080808`), graphite cards (`#141416`), translucent glass borders (`border-white/10`), and pure white typography (`#FFFFFF`).
- **Artwork Integrity**: Album art, artist portraits, and video thumbnails are **never** filtered, greyscaled, or desaturated.

---

## 🔊 Audio Playback & Streaming Engine

Musivo employs a hybrid audio engine that guarantees seamless playback in any scenario:

```
                ┌──────────────────────────────────┐
                │          Playback Engine         │
                └────────────────┬─────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│   Spotify Web Playback SDK    │       │     HTML5 Audio Fallback      │
│  (Lossless / Full Playback)   │       │  (Apple iTunes 30s Previews)  │
│  - Requires Spotify Premium   │       │  - Zero Authentication Needed │
│  - Full Track Streaming       │       │  - Instant Track Sampling     │
│  - Spotify Connect Device Sync│       │  - Works for All Visitors     │
└───────────────────────────────┘       └───────────────────────────────┘
```

- **Audio Equalizer Visualizer**: Four animated frequency bars that bounce dynamically when music is playing and rest when paused.
- **Playback Diagnostics**: Built-in modal displaying active player state, Web SDK readiness, connected device IDs, and real-time logs.
- **Token Cooldown & Resiliency**: Built-in credential validation and exponential cooldowns prevent test flakiness and API rate limits.

---

## 🔐 Authentication & Security Architecture

### 1. Google OAuth 2.0 (OpenID Connect)
- Secure authentication via Google Identity Services.
- Fetches verified email, full name, and avatar, creating or linking a Musivo account.

### 2. Spotify OAuth 2.0 (Authorization Code + PKCE)
- Authorizes comprehensive permissions:
  - `streaming` (Web Playback SDK)
  - `user-read-playback-state` & `user-modify-playback-state`
  - `user-read-currently-playing`
  - `user-library-read`
  - `playlist-read-private` & `playlist-modify-private`
  - `user-read-recently-played`
  - `user-read-private` & `user-read-email`
- Supports standalone Spotify login or linking Spotify to an existing Google session.

### 3. Session Security & Encryption
- **AES-256-GCM Token Encryption**: Spotify refresh and access tokens are encrypted before database persistence.
- **Automated Silent Refresh**: Background token rotation ensures uninterrupted streaming sessions.
- **Signed JSON Web Tokens**: Sessions persisted using HTTP-only, `SameSite=Lax`, cryptographically signed JWT cookies (`jose`).

---

## 🛠 Tech Stack & Architecture

### Frontend
- **React 19** (`react`, `react-dom`): Latest React architecture with concurrent rendering and hooks.
- **Vite 7** (`vite`): Blazing-fast development server and production bundler.
- **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/vite`): Modern utility-first CSS engine.
- **Radix UI Primitives**: Accessible headless components for dialogs, dropdowns, popovers, sliders, switches, and tabs.
- **Lucide React** (`lucide-react`): Consistent, lightweight icons.
- **Framer Motion** (`framer-motion`): Smooth layout transitions and floating queue animations.
- **TanStack Query v5** (`@tanstack/react-query`): Smart asynchronous caching, background synchronization, and optimistic UI updates.
- **tRPC Client** (`@trpc/client`, `@trpc/react-query`): End-to-end type safety from server procedures to frontend hooks.
- **Wouter** (`wouter`): Lightweight routing (~1.5KB).
- **Sonner** (`sonner`): Clean, accessible toast notifications.

### Backend
- **Node.js** (v20+): Fast, modern JavaScript runtime.
- **Express 4** (`express`): REST, OAuth redirect endpoints, and middleware pipeline.
- **tRPC Server** (`@trpc/server`): Type-safe RPC router for auth, search, playlists, analytics, and Spotify operations.
- **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`, `mysql2`): Type-safe database queries, schema migrations, and relational mapping.
- **In-Memory Fallback Storage**: Embedded resilient store ensuring 100% functionality even when external databases are offline.
- **JOSE** (`jose`): Lightweight JWT signing, verification, and AES encryption.
- **esbuild** (`esbuild`): High-speed server bundling into `dist/index.js`.

---

## 🌐 External APIs & Services

1. **Spotify Web API**: Catalog search, user profiles, playlists, liked tracks, recently played history, and recommendations.
2. **Spotify Web Playback SDK**: In-browser hardware-accelerated playback for Spotify Premium subscribers.
3. **Google Identity Services**: OAuth 2.0 OpenID Connect authentication.
4. **Apple iTunes Search API**: High-speed search query fallback and 30-second AAC audio previews.
5. **OpenAI API / LLM Service** *(Optional)*: Neural vibe parsing for AI Mix Studio (falls back to Spotify's recommendation algorithms when omitted).
6. **YouTube IFrame API**: Embedded video playback for podcast episodes with visual broadcasts.

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**: `v9.x` or `v10.x`

### 2. Clone Repository
```bash
git clone https://github.com/Kshaurya-07/musivo.git
cd musivo
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Spotify Developer Application (https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Google Cloud OAuth 2.0 (https://console.cloud.google.com/)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session Security (At least 32 random characters)
COOKIE_SECRET=super_secret_cookie_encryption_key_at_least_32_chars

# Database (Optional - falls back to embedded in-memory database if omitted)
DATABASE_URL=mysql://user:password@localhost:3306/musivo

# OpenAI API Key (Optional - falls back to Spotify algorithmic mix if omitted)
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🧪 Verification & Testing Suite

Musivo includes automated test suites covering OAuth flows, token management, session linking, and music search:

```bash
# 1. Static TypeScript verification
npx tsc --noEmit

# 2. Run Vitest test suite
npx vitest run

# 3. Build production bundle (client + server)
npm run build
```

---

## 📜 NPM Scripts Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite client and Express server concurrently with HMR. |
| `npm run build` | Compiles frontend assets with Vite and bundles server with esbuild into `dist/`. |
| `npm start` | Launches the production bundled server from `dist/index.js`. |
| `npm test` | Executes the Vitest test suite. |
| `npm run check` | Runs TypeScript compiler checks without emitting files. |
| `npm run db:push` | Pushes Drizzle schema migrations to the configured database. |

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full details.

Copyright (c) 2026 Shaurya
