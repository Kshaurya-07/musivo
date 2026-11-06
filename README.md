# Musivo

A music streaming and discovery platform with a dense, responsive interface, Spotify playback, Apple iTunes previews, podcasts, and a progressive web app experience.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Design System](#design-system)
- [Audio Playback](#audio-playback)
- [Authentication and Security](#authentication-and-security)
- [Tech Stack](#tech-stack)
- [External APIs](#external-apis)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Overview

Musivo is a music streaming and discovery application inspired by the content density and usability of JioSaavn-style layouts. It combines Spotify playback and library features with Apple iTunes search previews, so visitors can sample tracks without signing in, and Spotify Premium users can play full tracks in the browser, subject to Spotify's own requirements.

The interface uses a monochrome and graphite colour system with day and night modes. Album art and artist imagery are shown in their natural colours, without filtering or desaturation.

## Features

- **Dense music shelves:** Responsive grids that scale from 2 columns on mobile to 7 columns on wide displays, a sub-navigation ribbon for All, Trending, Top Charts, New Releases, Discover, AI Mix, Library, and Podcasts, 16:9 chart banners, circular artist avatars, and quick-access cards.
- **Day and night modes:** Light and dark modes, switchable from the header.
- **Spotify playback:** In-browser playback through the Spotify Web Playback SDK for Spotify Premium accounts, with seeking, volume control, and shuffle and repeat modes.
- **Instant previews:** 30-second audio previews through the Apple iTunes Search API for unauthenticated exploration.
- **AI Mix Studio:** Playlist creation based on moods, tempo, and taste profiles, with fallback to Spotify recommendations when no AI provider is configured.
- **Podcasts and video:** A podcast player with embedded video support, episode browsing, and transcript summaries.
- **Listening analytics:** Total listening time, 7-day activity, music versus podcast split, and top artists and songs, counted from 30 seconds of listening.
- **Queue management:** A floating queue tab with a slide-out drawer for reordering, adding, or clearing upcoming tracks.
- **Spotify Connect:** A device selector to transfer playback between the web player, desktop apps, smartphones, smart TVs, and speakers.
- **Playback diagnostics:** A panel showing SDK status, connected device information, playback state, and active errors.
- **Sleep timer:** Stop playback after 15, 30, 45, or 60 minutes, or at the end of the current track.
- **Library sync:** Sync liked songs, playlists, and recently played tracks, or create private Spotify playlists from the app.
- **Progressive web app:** Installable on Windows, macOS, Android, and iOS, with service worker caching for the app shell.

## Design System

The UI is built on a neutral monochrome palette, from obsidian and charcoal through graphite and silver to porcelain white.

- **Palette:** Obsidian (`#050505` / `#080808`), charcoal (`#111111` / `#151515`), graphite (`#1F1F1F` / `#242424`), dark grey (`#2E2E2E` / `#363636`), silver (`#9A9A9A` / `#C2C2C2`), and porcelain (`#F5F5F7` / `#FAFAFA`).
- **Day mode:** Porcelain backgrounds (`#FAFAFA` / `#F3F3F5`), light silver borders, obsidian typography (`#111111`), and high-contrast dark buttons.
- **Night mode:** Deep obsidian backgrounds (`#080808`), graphite cards (`#141416`), translucent borders, and white typography (`#FFFFFF`).
- **Artwork integrity:** Album art, artist portraits, and video thumbnails are not filtered, greyscaled, or desaturated.

A persistent bottom dock keeps playback controls in reach, with album art, title and artist details, a timeline scrubber, volume control, diagnostics, sleep timer, device switching, and the queue drawer.

## Audio Playback

Musivo uses a hybrid playback approach:

- **Spotify Web Playback SDK:** Full-track playback for Spotify Premium subscribers, subject to Spotify's requirements, with Spotify Connect device sync.
- **HTML5 audio fallback:** Apple iTunes 30-second previews, with no authentication required.

Playback also includes an equalizer visualiser with four animated bars that move while music is playing and rest when paused, playback diagnostics, and token refresh and cooldown handling intended to reduce API rate-limit issues.

## Authentication and Security

### Google OAuth 2.0

Authentication through Google Identity Services using OpenID Connect, fetching verified email, name, and avatar, and creating or linking a Musivo account.

### Spotify OAuth 2.0

Authorization Code flow with PKCE, covering these scopes:

- `streaming`
- `user-read-playback-state` and `user-modify-playback-state`
- `user-read-currently-playing`
- `user-library-read`
- `playlist-read-private` and `playlist-modify-private`
- `user-read-recently-played`
- `user-read-private` and `user-read-email`

Spotify can be used for standalone login or linked to an existing Google session.

### Session security

- Spotify tokens are encrypted with AES-256-GCM before database persistence.
- Background token refresh is intended to keep streaming sessions uninterrupted.
- Sessions use HTTP-only, `SameSite=Lax`, signed JWT cookies.

## Tech Stack

### Frontend

- React 19, Vite 7, Tailwind CSS v4
- Radix UI primitives for dialogs, dropdowns, popovers, sliders, switches, and tabs
- Lucide React icons
- Framer Motion for transitions and queue animations
- TanStack Query v5 for caching and background synchronisation
- tRPC client for type-safe server communication
- Wouter for lightweight routing
- Sonner for toast notifications

### Backend

- Node.js 20 or higher, Express 4
- tRPC server for auth, search, playlists, analytics, and Spotify operations
- Drizzle ORM with MySQL, plus an in-memory fallback store when no database is configured
- JOSE for JWT signing, verification, and AES encryption
- esbuild for server bundling into `dist/index.js`

## External APIs

1. Spotify Web API — Catalog search, profiles, playlists, liked tracks, recently played history, and recommendations
2. Spotify Web Playback SDK — In-browser playback for Spotify Premium subscribers
3. Google Identity Services — OAuth 2.0 authentication
4. Apple iTunes Search API — Search fallback and 30-second audio previews
5. OpenAI API / LLM service — Optional, for AI Mix Studio; falls back to Spotify recommendations when omitted
6. YouTube IFrame API — Embedded video playback for podcast episodes

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 9 or higher, or pnpm 10 or higher

### Installation

```bash
git clone https://github.com/Kshaurya-07/musivo.git
cd musivo
npm install
```

### Configuration

Create a `.env` file in the project root with your own values. Replace every placeholder below:

```env
PORT=5000
NODE_ENV=development
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
COOKIE_SECRET=your_cookie_secret_at_least_32_characters
DATABASE_URL=mysql://user:password@localhost:3306/musivo
OPENAI_API_KEY=your_openai_api_key
```

`DATABASE_URL` is optional; an embedded in-memory store is used if it is omitted. `OPENAI_API_KEY` is also optional; AI Mix Studio falls back to Spotify recommendations without it.

### Run the development server

```bash
npm run dev
```

Open http://localhost:5000 in your browser.

## Testing

Automated tests cover OAuth flows, token management, session linking, and music search. Run:

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

## Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Start the client and server concurrently with hot reload |
| `npm run build` | Build frontend assets and bundle the server |
| `npm start` | Launch the production bundled server from `dist/index.js` |
| `npm test` | Run the test suite |
| `npm run check` | Run TypeScript checks without emitting files |
| `npm run db:push` | Push Drizzle schema migrations |

## Contributing

Issues and pull requests are welcome. Please do not commit real API keys, client secrets, or tokens, and keep OAuth and playback changes well tested.

## License

This project is licensed under the MIT License. See the LICENSE file in the repository for details.

Copyright (c) 2026 Shaurya

## Author

Kumar Shaurya — https://github.com/Kshaurya-07
