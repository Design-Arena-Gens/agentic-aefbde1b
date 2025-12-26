# Cartoon Launch Agent

Next.js automation agent that converts story scripts into stylised cartoon videos and dispatches them to every selected social media platform with one click. The system renders HD motion graphics frames with Skia Canvas, encodes an H.264 master via FFmpeg, and stages ready-to-post metadata bundles per platform.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and drop your script. The "Generate & Publish" button will:

1. Analyse the script and split it into animated scenes.
2. Paint a 1280×720 cartoon sequence (24 fps) using your palette and style keyword.
3. Encode an `.mp4` master in `public/generated/<jobId>.mp4`.
4. Produce distribution payloads for YouTube, TikTok, Instagram Reels, Facebook, X, LinkedIn, and Pinterest under `public/generated/<jobId>/<platform>.json`.

## Deployment

Production deployments run on Vercel:

```bash
npx vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-aefbde1b
```

After deploy, the app is served from `https://agentic-aefbde1b.vercel.app`.

## Scripts

- `npm run dev` – Local development with hot reload.
- `npm run build` – Production build (runs type-checking and Next.js optimisation).
- `npm start` – Serve the production build.
- `npm run lint` – ESLint against Next.js core web vitals.

## Architecture Notes

- **Rendering pipeline**: Uses `@napi-rs/canvas` with procedural gradients, character overlays, and animated HUD elements. Frames are cached to `/tmp` then compiled with `fluent-ffmpeg` (bundled binary via `@ffmpeg-installer/ffmpeg`).
- **Publishing agent**: Generates per-platform metadata (title suffixes, captions, aspect ratios) and writes JSON manifests that mimic API upload payloads.
- **API surface**: `/api/generate` accepts `title`, `script`, `style`, `palette[]`, and `platforms[]`, returning the master video URL, timeline telemetry, and publishing results.
- **Static assets**: Generated masters live under `public/generated/`; `.gitignore` skips heavy media while keeping metadata stubs via `.gitkeep`.

## Requirements

- Node.js 18+
- ffmpeg is bundled automatically; no native dependencies required.

Enjoy shipping cartoon drops to every channel in seconds. 🚀
