# Project context

Amethyst is a collection of browser-based utility tools built with Next.js App Router, React, TypeScript, Tailwind CSS, and Zustand. Tool implementations are under `src/sections/`, registered in `src/lib/registry.ts`, and rendered by the dynamic route in `src/app/tools/[section]/[module]/page.tsx`.

## Commands

- `npm run dev` — run the development server.
- `npm run build` — produce the static `out/` export.

## Deployment

The app is statically exported for GitHub Pages (`next.config.ts`). Set `NEXT_PUBLIC_BASE_PATH` to the repository path when deploying under `username.github.io/repository-name`; `.github/workflows/deploy-pages.yml` does this automatically for `main`.

GitHub Pages cannot serve Next.js API routes. The Discord Webhook Manager remains in the UI but is disabled unless `NEXT_PUBLIC_DISCORD_WEBHOOK_PROXY_URL` points to a separately deployed proxy. Its reusable validated handler is in `src/server/discord-webhook.ts`.
