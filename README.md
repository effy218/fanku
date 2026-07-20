# Fanku (饭库)

A personal food journal — remember where you ate, what you liked, and what to avoid next time.

**Live demo:** https://effy218.github.io/fanku/

## What it does

Fanku helps you keep a lightweight log of meals and restaurants:

- **Save a meal card** with place name, date, cuisine tags, taste rating, and a recommend level (must-try / recommend / okay / avoid)
- **Browse by piles** — cards are grouped by level so strong picks and avoid-list stay easy to scan
- **Add notes & dishes** — short journal text plus dish ratings
- **Photos & pixel icons** — optional photos, or pick a pixel food icon as cover
- **Custom fields** — rearrange or add dimensions (service, wait time, etc.) per card
- **Backup** — tap the logo to export / import a JSON backup (data stays in your browser)

No account required. Everything is stored locally in your browser (`localStorage`).

## Run locally

```bash
cd h5
npx --yes serve .
```

Then open the URL shown in the terminal (usually `http://localhost:3000`).

## Project layout

```
h5/
  index.html
  css/fanku.css
  js/storage.js
  js/app.js
  assets/dotown/   # pixel food icons
```

## Notes

- Clearing site data resets the app (including sample cards)
- Photos are stored as data URLs — large libraries may hit browser storage limits
- Export a backup before switching devices or clearing cache
- Import replaces all local data on this device
