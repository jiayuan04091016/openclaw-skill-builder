# OpenClaw Skill Builder

A low-cost MVP for beginners who want to turn goals, notes, articles, images, video references, or existing skills into OpenClaw-ready skill packages.

## Platform choice

This first release is a Web app.

Why:

- Lowest cost to build and maintain
- No app store review
- Fastest path to launch
- Easy free deployment on Vercel
- Works well with browser local storage and browser ZIP export

## Current MVP scope

- Home page with quick-start goal input
- Learning center for beginners
- Guided builder for:
  - goal input
  - resource collection
  - scenario setup
  - draft generation
  - ZIP export
- Existing skill import flow
- Local draft persistence in browser storage
- "My Skills" history panel
- Help / FAQ section
- Client-side ZIP generation with `SKILL.md`, `README.md`, examples, and metadata

## Tech stack

- Next.js 16
- React 19
- Tailwind CSS 4
- JSZip

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

## V2 infrastructure check

Run once your local app is up on `http://127.0.0.1:3000`:

```bash
npm run check:v2
npm run check:v2:md
```

This verifies key internal readiness endpoints and can generate:

- `docs/v2-acceptance-check.md`

## Deployment

Recommended:

1. Push this project to GitHub
2. Import the repo into Vercel
3. Use the default Next.js settings
4. Deploy

No database or server-side storage is required for the first launch.

## Product decisions for speed

- Storage is local-first: browser local storage
- No login system in V1
- No server database in V1
- No OCR or video transcription in V1
- No publishing marketplace in V1

This keeps the launch fast and cheap, while leaving room for later upgrades.
