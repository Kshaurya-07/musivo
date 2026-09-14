# Musivo 🎵

[![CI](https://github.com/Kshaurya-07/musivo/actions/workflows/ci.yml/badge.svg)](https://github.com/Kshaurya-07/musivo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node-20%2B-green.svg)](https://nodejs.org/)

Musivo is a modern, high-performance music streaming and discovery web application built with React, Vite, Express, and tRPC. It seamlessly integrates with Spotify and Google OAuth, offering real-time music discovery, synchronized libraries, and playback capabilities.

---

## 🌟 Key Features

- **Spotify Integration**: Connect your Spotify account to sync playlists, view recently played tracks, and play music directly via the Spotify Web Playback SDK.
- **Smart Music Discovery**: Algorithmic track discovery and AI-powered recommendations based on your listening habits.
- **Authentication**: Secure Google OAuth and Spotify OAuth integration with encrypted tokens and session management.
- **Modern Dark UI**: Fluid, responsive neon audio streaming interface built with Tailwind CSS, Radix UI, and Framer Motion.
- **Continuous Integration**: Automated test suite, TypeScript type checking, and production build validation on GitHub Actions.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- pnpm (v9 or v10)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Kshaurya-07/musivo.git
   cd musivo
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   Copy `.env` and fill in your OAuth credentials (Google and Spotify):
   ```bash
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Run the development server:
   ```bash
   pnpm run dev
   ```

---

## 🧪 Testing & Verification

Run the test suite and type check:

```bash
# Type check TypeScript
pnpm run check

# Run Vitest test suite
pnpm test

# Build for production
pnpm run build
```

---

## 📄 License

This project is licensed under the MIT License.
