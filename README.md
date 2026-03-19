## Grain

Grain is a local finance tracker PWA

## Features

- Offline/local-first data via IndexedDB (no account required).
- Nothing-inspired monochrome matrix and glyph-like UI language.
- Dashboard with live balance, month delta, wallet snapshot, and recent history.
- Monthly budgets with progress bars and over-limit alerts.
- Insights with weekly/monthly spend trends, category breakdown, and highlights.
- Transaction CRUD with wallet selection, split support, and fast entry flow.
- Advanced history filters: type, category, wallet, date range, min/max amount.
- Smart search operators in history:
  - `cat:food`
  - `wallet:main`
  - `type:expense`
  - `min:10 max:200`
- Recurring templates (weekly/monthly) with due-run processing.
- Multi-wallet support, wallet-to-wallet transfers, and goal tracking.
- Category management, local export/import JSON backups, and hard reset.
- Installable PWA (manifest + service worker).

## Run

```bash
npm install
npm run dev
```

## Deploy To Cloudflare Workers

1. Authenticate Wrangler once:

```bash
npx wrangler login
```

2. Set the Worker name in `wrangler.toml` (`name = "grain"`).

3. Deploy:

```bash
npm run deploy
```

4. (Optional) Preview in the Workers runtime locally:

```bash
npm run preview
```

### Cloudflare Workers Builds (Git Integration)

If deploying via Cloudflare dashboard build pipeline (the `/opt/buildhome/...` logs), set:

- Build command: `npm run build:cf`
- Deploy command: `npm run deploy:cf`

This ensures OpenNext artifacts are generated before deploy.
