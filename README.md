# Amethyst

A collection of small, single-purpose web tools that run entirely in the browser — nothing is uploaded to a server unless a tool explicitly needs to (e.g. sending to a Discord webhook).

## Tools

- **Text Editor** — plain text editing utilities
- **Converter** — file/format conversion (images, archives, documents, data formats)
- **Data Tools** — JWT decoder, hash generator
- **Security** — password strength checker
- **Discord** — embed builder, webhook manager, permission calculator, snowflake decoder, timestamp generator
- **Dev Utilities** — timestamp converter

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub Pages

The project is configured for static export. Build it with a repository base path, then publish the generated `out/` directory:

```bash
NEXT_PUBLIC_BASE_PATH=/repository-name npm run build
```

Most tools run entirely in the browser. Discord Webhook Manager requires a server-side proxy and is disabled on GitHub Pages by default. To enable it on a deployment with a separately hosted proxy, set `NEXT_PUBLIC_DISCORD_WEBHOOK_PROXY_URL` to its public URL. The proxy must forward the existing `send`, `edit`, and `delete` request format; [`src/server/discord-webhook.ts`](src/server/discord-webhook.ts) contains the portable handler.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Zustand.

## Adding a tool

Each tool lives under `src/sections/<section>/<tool>/` with an `index.tsx` (the UI) and a `meta.ts` (id, name, description, keywords). Register new tools in `src/lib/registry.ts`.
