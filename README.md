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
