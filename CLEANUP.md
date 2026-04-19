# RuviaOS — Files You Can Safely Delete

## ❌ DELETE THESE (redundant / superseded)

### Duplicate dark mode scripts
- `add-dark-mode-to-all.js`    — one-time migration script, no longer needed
- `add-darkmode-to-all.js`     — duplicate of above (different spelling!)
- `darkmode.js`                — superseded by ruvia-core.js + new darkmode.css
- `dark-mode.css`              — if this exists, it's superseded by new darkmode.css

### Duplicate navbar files
- `navbar.html`                — the new navbar.js is self-contained, no HTML file needed
- `navbar-fast.js.js`          — misnamed duplicate (note the .js.js), superseded

### Duplicate/one-time scripts
- `add-offline-support.js`     — one-time migration script, not runtime code
- `update-currency.js`         — one-time migration script, not runtime code

### Offline system (broken / unused in browser context)
- `offline-api.js`             — references RuviaOffline which conflicts with ruvia-core
- `offline-core.js`            — replaced by ruvia-core.js
- `offline-storage.js`         — IndexedDB wrapper, not wired to any page
- `offline-dashboard.html`     — standalone page with broken references
- `offline-status.html`        — fragment that fetch() was loading (fragile pattern)
- `offline-backup.js`          — Node.js CLI tool, not a browser file

### Test / debug files
- `test-guests.html`           — development test page, not for production
- `email-test.html`            — development test page (email test UI)
- `mugas`                      — unnamed scratch file (no extension), not needed

### Superseded by server.js
- `shared-data.js`             — stub file, logic is in server.js and ruvia-store.js

### Node scripts (keep if you use them, delete if not)
- `email-scheduler.js`         — only needed if you run it separately; it's in server.js too

---

## ✅ KEEP THESE (all needed)

### Core frontend
- `ruvia-core.js`              — NEW: auth, RBAC, attendance, notifications
- `ruvia-store.js`             — localStorage data layer (all pages depend on this)
- `navbar.js`                  — NEW: professional navbar with badges
- `darkmode.css`               — NEW: professional dark mode system
- `currency.js`                — UGX formatting (used everywhere)
- `currency-config.js`         — currency configuration

### New utility files (from last session)
- `ruvia-receipt.js`           — print receipts
- `ruvia-rate-calc.js`         — room rate calculator
- `ruvia-menu-print.js`        — menu print + QR
- `ruvia-statusbar.js`         — activity feed

### Pages (all needed)
- `index.html`, `login.html`, `dashboard.html`
- `frontdesk.html`, `pms.html`, `pos.html`
- `housekeeping.html`, `tables.html`, `stock.html`
- `menu-management.html`, `reports.html`, `staff.html`
- `backup-dashboard.html`

### Backend
- `server.js`                  — Express API server
- `schema.sql`                 — PostgreSQL schema
- `main.js`                    — Electron wrapper (keep if using desktop app)
- `package.json`, `package-lock.json`

### Backup scripts (keep if you use them)
- `backup-to-usb.bat` / `.sh`  — USB backup scripts
- `quick-backup.bat`           — Quick backup
- `restore-backup.bat`         — Restore from backup

### Config
- `.env`                       — ⚠️ REMOVE FROM GIT (add to .gitignore)
- `.gitignore`                 — keep and add .env to it!

---

## ⚠️ URGENT: Fix .gitignore

Your `.env` file with `DB_PASSWORD=Kawasiima` is public on GitHub.

Add this to `.gitignore`:
```
.env
node_modules/
backups/
*.log
.DS_Store
.vscode/
notes for me/
mugas
```

Then remove it from git history:
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## Summary
**Delete: 15 files** · **Keep: ~35 files**

Biggest wins: removing the 5 offline-*.js files (they conflict with ruvia-core), 
the 3 duplicate dark mode files, and the 3 one-time migration scripts.
