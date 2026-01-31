# Exhaust Manager (Vite + React + shadcn/ui + TanStack Table + Tauri + SQLite)

This is a minimal desktop app you can ship with **Tauri**:
- **Vite + React (TS)**
- **shadcn/ui-style components** (Button, Dialog, Table, etc.)
- **TanStack Table** (with virtualization via `@tanstack/react-virtual`)
- **SQLite storage** using the official Tauri **SQL plugin**.

## Quick start

### 1) Install deps
```bash
pnpm install
```

### 2) Run as desktop (Tauri)
```bash
pnpm tauri:dev
```

### 3) Build installers / bundles
```bash
pnpm tauri:build
```

## Notes

- The Prisma model you shared is used here as the schema for the SQLite `exhaust` table (via migrations in Rust).
- The SQLite file is created in your OS AppConfig folder under the name `exhaust.db`.
- Printing uses `window.print()` from a popup window and generates a QR code image with the `qrcode` package.

## Files to look at

- `src/features/exhaust/exhaust-table.tsx` — table columns: **Code-barres / Désignation / Date / Imprimer**
- `src/features/exhaust/add-exhaust-dialog.tsx` — dialog form to add new rows
- `src/lib/print-product-label.tsx` — label printing helper (edit HTML/CSS here)
- `src-tauri/src/lib.rs` — SQLite migrations + SQL plugin init
