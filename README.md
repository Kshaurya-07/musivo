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

Musivo is a music streaming and discovery application inspired by the content density and usability of JioSaavn-style layouts. It combines Spotify playback and library features with Apple iTunes search previews, so visitors can sample tracks without signing in, and signed-in Spotify Premium users can play full tracks in the browser, subject to Spotify's own requirements.

The interface uses a monochrome and graphite colour system with both day and night modes. Album art and artist imagery are presented in their natural colours.

## Features

- **Dense music shelves:** Responsive grids, a sub-navigation ribbon, chart banners, artist avatars, and quick-access cards.
- **Day and night modes:** A light mode and a dark mode, switchable from the header.
- **Spotify playback:** In-browser playback through the Spotify Web Playback SDK for Spotify Premium accounts, with seeking, volume control, and shuffle and repeat modes, as described in the original README.
- **Instant previews:** 30-second audio previews through the Apple iTunes Search API for unauthenticated exploration.
- **AI Mix Studio:** Playlist creation based on moods, tempo, and taste profiles, with fallback to Spotify recommendations when no AI provider is configured, as described in the original README.
- **Podcasts and video:** A podcast player with embedded video support, episode browsing, and transcript summaries, as described in the original README.
- **Listening analytics:** Tracking of listening time, activity over recent days, music versus podcast split, and top artists and songs, as described in the original README.
- **Queue management:** A floating queue tab with a slide-out drawer for reordering, adding, or clearing upcoming tracks.
- **Spotify Connect:** A device selector to transfer playback between supported devices, as described in the original README.
- **Playback diagnostics:** A panel showing SDK status, connected device information, and playback state, as described in the original README.
- **Sleep timer:** Stop playback after a set duration or at the end of the current track.
- **Library sync:** Sync liked songs, playlists, and recently played tracks, or create private Spotify playlists from the app, as described in the original README.
- **Progressive web app:** Installable on desktop and mobile, with service worker caching for the app shell, as described in the original README.

## Design System

The UI is built on a neutral monochrome palette, from obsidian and charcoal through graphite and silver to porcelain white.

- **Day mode:** Light backgrounds, light silver borders, dark typography, and high-contrast dark buttons.
- **Night mode:** Deep obsidian backgrounds, graphite cards, translucent borders, and white typography.
- **Artwork integrity:** Album art, artist portraits, and video thumbnails are not filtered, greyscaled, or desaturated, as described in the original README.

## Audio Playback

Musivo uses a hybrid playback approach:

- **Spotify Web Playback SDK:** Full-track playback for Spotify Premium subscribers, with Spotify Connect device sync.
- **HTML5 audio fallback:** Apple iTunes 30-second previews, with no authentication required.

Additional playback features described in the original README include an equalizer visualiser, playback diagnostics, and token refresh and cooldown handling to reduce API rate-limit issues.

## Authentication and Security

### Google OAuth 2.0

Secure authentication through Google Identity Services, fetching verified email, name, and avatar, and creating or linking a Musivo account.

### Spotify OAuth 2.0

Authorization Code flow with PKCE, covering the scopes described in the original README, including streaming, playback state, current playback, library access, private playlist access, recently played history, and basic profile and email access. Spotify can be used for standalone login or linked to an existing Google session.

### Session security

- Spotify tokens are encrypted before database persistence, using AES-256-GCM as described in the original README.
- Background token refresh is intended to keep streaming sessions uninterrupted.
- Sessions use HTTP-only, SameSite=Lax, signed JWT cookies, as described in the original README.

## Tech Stack

### Frontend

- React 19, Vite 7, Tailwind CSS v4
- Radix UI primitives for dialogs, dropdowns, popovers, sliders, switches, and tabs
- Lucide React icons
- Framer Motion for transitions and queue animations
- TanStack Query v5 for caching and background synchronisation
- tRPC client for type-safe server communication
- Wouter for routing
- Sonner for toast notifications

### Backend

- Node.js 20 or higher, Express 4
- tRPC server for auth, search, playlists, analytics, and Spotify operations
- Drizzle ORM with MySQL, plus an in-memory fallback store as described in the original README
- JOSE for JWT signing, verification, and AES encryption
- esbuild for server bundling

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

The database setting is optional in the original README; an embedded in-memory store is used if it is omitted.

### Run the development server

```bash
npm run dev
```

Open http://localhost:5000 in your browser, as described in the original README.

## Testing

The original README describes automated tests covering OAuth flows, token management, session linking, and music search. Run:

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
| `npm start` | Launch the production bundled server |
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
