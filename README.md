# 🎵 Musivo

[![CI](https://github.com/Kshaurya-07/musivo/actions/workflows/ci.yml/badge.svg)](https://github.com/Kshaurya-07/musivo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)

**Musivo** is a modern, high-performance music streaming and discovery web application. It combines deep Spotify and Google OAuth integrations, real-time in-browser audio streaming, synchronized personal libraries, and smart algorithmic music discovery wrapped in an immersive dark neon interface.

---

## 📌 Table of Contents

1. [App Overview & Functions](#-app-overview--functions)
2. [Authentication Architecture](#-authentication-architecture)
3. [Languages Used](#-languages-used)
4. [Tech Stack & Things Used to Build](#-tech-stack--things-used-to-build)
5. [All APIs Used](#-all-apis-used)
6. [All Apps, Services & Platforms Used](#-all-apps-services--platforms-used)
7. [Getting Started & Setup](#-getting-started--setup)
8. [Testing & Quality Assurance](#-testing--quality-assurance)
9. [License](#-license)

---

## 🎧 App Overview & Functions

- **Full In-Browser Spotify Streaming**: Integrated with the **Spotify Web Playback SDK** for audio playback, track controls (play, pause, next, previous, seek, volume), and seamless device handoff.
- **Bi-Directional Spotify Library Sync**:
  - Syncs personal Spotify playlists, collaborative playlists, and saved albums.
  - Fetches and displays Spotify **Liked Songs** and **Recently Played** listening history.
  - Allows direct creation of private Spotify playlists with synced tracks right from the app.
- **Smart Music Discovery & AI Mix**:
  - Algorithmic recommendation engine generating custom mixes based on user listening history.
  - Built-in AI mix builder that analyzes track vibes and listening patterns (with automatic fallback to Spotify's recommendation algorithms when an AI API key is not configured).
- **Instant Audio Previews**:
  - Integration with the **Apple iTunes Search API** for rapid search queries and instant 30-second audio previews without requiring Spotify authentication.
- **Persistent Bottom Audio Player & Diagnostics**:
  - Unified playback engine supporting both Spotify Web Playback SDK streams and HTML5 audio previews.
  - Real-time animated audio equalizer that reacts to playback state.
  - **Playback Diagnostics Popover** displaying active player state, Spotify SDK script status, connected device ID, and error logs for transparent troubleshooting.
- **Personal Library & Playlist Management**:
  - Create, edit, and organize custom user playlists.
  - Like, bookmark, and curate tracks with local and synced storage.

---

## 🔐 Authentication Architecture

Musivo features a robust, multi-provider authentication and session security system:

### 1. Google OAuth 2.0
- Uses **Google Identity Services (OpenID Connect / OAuth 2.0)**.
- Securely exchanges authorization codes for ID tokens and user profile information (email, name, avatar).
- Automatically links Google accounts to user profiles.

### 2. Spotify OAuth 2.0
- Built using the **Authorization Code Flow** with cryptographic state nonces to prevent CSRF attacks.
- Authorizes rich permissions including:
  - `streaming` (for the Web Playback SDK)
  - `user-read-playback-state` & `user-modify-playback-state`
  - `user-read-currently-playing`
  - `user-library-read`
  - `playlist-read-private` & `playlist-read-collaborative`
  - `playlist-modify-private`
  - `user-read-recently-played`
  - `user-read-private` & `user-read-email`
- Supports both standalone Spotify login and linking a Spotify account to an existing Google session.

### 3. Session & Credential Security
- **Encrypted Token Storage**: Spotify access and refresh tokens are stored in the database using **AES-256-GCM symmetric encryption**.
- **Automated Silent Refresh**: Background token refresh ensures expired access tokens are rotated seamlessly without interrupting the user.
- **Cookie Security**: User sessions are persisted using HTTP-only, `SameSite=Lax`, signed JSON Web Tokens (`jose`) across both local and production domains.

---

## 💻 Languages Used

| Language | Usage Area |
| :--- | :--- |
| **TypeScript** (v5.9) | Primary language used across 100% of the frontend, backend, shared schemas, and test suites for type safety. |
| **JavaScript** (ESM) | Runtime execution, bundler configs (`vite.config.ts`), and browser SDK integrations. |
| **SQL** | Relational database schema definitions, migrations, and queries managed via Drizzle ORM. |
| **HTML5 & CSS3** | Component layouts, accessibility attributes, and responsive UI styles powered by modern Tailwind CSS. |

---

## 🛠 Tech Stack & Things Used to Build

### Frontend
- **React 19** (`react`, `react-dom`): Modern reactive user interface components.
- **Vite 7** (`vite`): High-speed frontend build tool and hot module replacement (HMR) development server.
- **Tailwind CSS 4** (`tailwindcss`, `@tailwindcss/vite`): Utility-first CSS framework for dark neon streaming aesthetics.
- **Radix UI Primitives**: Accessible headless UI components:
  - `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`
  - `@radix-ui/react-slider` (volume and scrub controls)
  - `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-switch`
  - `@radix-ui/react-accordion`, `@radix-ui/react-scroll-area`
- **Framer Motion 12** (`framer-motion`): Fluid layout animations, page transitions, and player equalizer dynamics.
- **TanStack Query v5** (`@tanstack/react-query`): Robust asynchronous state caching, refetching, and synchronization.
- **tRPC Client** (`@trpc/client`, `@trpc/react-query`): End-to-end type-safe client calling server procedures without manual API contracts.
- **Wouter 3** (`wouter`): Minimalist client-side routing.
- **Lucide React** (`lucide-react`): Consistent streaming and media control icons.
- **Sonner** (`sonner`): Toast notification system.

### Backend
- **Node.js** (v20+): Scalable JavaScript runtime.
- **Express 4** (`express`): REST and HTTP middleware server framework.
- **tRPC Server** (`@trpc/server`): Strongly typed RPC routers defining procedures for auth, search, playlists, and Spotify operations.
- **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`, `mysql2`): Type-safe ORM for relational queries, schema declarations, and migrations.
- **In-Memory Resilient Fallback**: Embedded in-memory database store that guarantees zero crashes if external database connections are unreachable.
- **JOSE** (`jose`): Cryptographic signing and verification for state nonces and session tokens.
- **esbuild** (`esbuild`): High-speed production server bundling into `dist/index.js`.

### Build & Tooling
- **pnpm** (v10): Fast, disk space-efficient package manager.
- **TypeScript Compiler** (`tsc`): Static type verification.
- **Vitest** (`vitest`): Unit and integration test runner.
- **Prettier** (`prettier`): Code formatting standards.

---

## 🌐 All APIs Used

1. **Spotify Web API**:
   - `GET /v1/search`: Searches tracks, artists, and albums.
   - `GET /v1/me`: Retrieves authenticated user profile and subscription status.
   - `GET /v1/me/playlists`: Paginates user's personal and followed playlists.
   - `GET /v1/me/player/recently-played`: Pulls recent listening history for library sync.
   - `GET /v1/me/tracks`: Reads user's saved / liked tracks.
   - `GET /v1/recommendations`: Generates algorithmic discovery mixes.
   - `POST /v1/users/{user_id}/playlists`: Creates new Spotify playlists directly from Musivo.
2. **Spotify Web Playback SDK**:
   - `https://sdk.scdn.co/spotify-player.js`: In-browser playback engine enabling direct music streaming for Spotify Premium users.
3. **Google Identity Services & OAuth 2.0 API**:
   - `https://accounts.google.com/o/oauth2/v2/auth`: Handles user consent and authentication.
   - `https://oauth2.googleapis.com/token`: Exchanges code for access and ID tokens.
   - `https://www.googleapis.com/oauth2/v3/userinfo`: Verifies user identities and retrieves email/profile pictures.
4. **Apple iTunes Search API**:
   - `https://itunes.apple.com/search`: Supplies instant search results and 30-second AAC audio previews without requiring user credentials.
5. **OpenAI API / LLM Service** *(Optional)*:
   - Used for natural language parsing and intelligent playlist generation. Includes automatic fallback to Spotify algorithmic generation when unconfigured.
6. **Render Health Check API**:
   - `/api/health`: Provides continuous live health monitoring and deployment status verification.

---

## 📱 All Apps, Services & Platforms Used

- **Spotify Developer Dashboard**:
  - Used to register the Musivo application, generate client credentials (`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`), and configure authorized callback URLs (`http://localhost:5000/api/spotify/callback` and `https://musivo-xgm4.onrender.com/api/spotify/callback`).
- **Google Cloud Console**:
  - Used to configure Google OAuth 2.0 credentials (`VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`), set up OAuth consent screens, and authorize redirect URIs.
- **Render (`render.com`)**:
  - Production cloud hosting platform managing automated builds, web service execution, and SSL/TLS certificates.
- **GitHub & GitHub Actions**:
  - Cloud source code repository and automated CI/CD pipeline running TypeScript type checking, test suites, and production build checks on every push.

---

## 🚀 Getting Started & Setup

### 1. Prerequisites
- **Node.js**: v20 or higher
- **pnpm**: v9 or v10

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/Kshaurya-07/musivo.git
cd musivo

# Install dependencies
pnpm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and populate your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Spotify Developer Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Google OAuth Credentials
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session Security (32-character random string)
COOKIE_SECRET=your_super_secret_session_encryption_key

# Database (Optional - defaults to in-memory fallback if omitted)
DATABASE_URL=mysql://user:password@localhost:3306/musivo

# OpenAI (Optional - defaults to algorithmic Spotify recommendations if omitted)
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run Development Server
```bash
pnpm run dev
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🧪 Testing & Quality Assurance

Musivo includes a full automated test suite verifying OAuth routes, session linking, Spotify synchronization, and music search:

```bash
# Run TypeScript type check
pnpm run check

# Run Vitest test suite
pnpm test

# Build production assets
pnpm run build
```

---

## 📄 License

This project is licensed under the **MIT License**.

```text
MIT License

Copyright (c) 2026 Shaurya

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
