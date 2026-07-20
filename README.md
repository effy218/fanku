# Mealdeck H5

Cream-pixel personal food journal (**Mealdeck** / 饭库). Data lives in the browser via `localStorage`.

**Live:** https://effy218.github.io/fanku/

## Purpose

Use Mealdeck when you want a simple place to remember meals:

- Which spots were worth going back to
- Which ones to skip
- What you ordered and how it tasted

Cards are sorted into four piles by recommendation level so your favorites and avoid-list stay visible.

## Features

- Home piles: Must-try / Recommend / Okay / Avoid
- Search by place, dishes, or notes
- Meal card: location, date, cuisine tags, taste stars, level, re-eat intent, photos, journal, dishes
- Arrange mode: reorder / add / remove fields; optionally save as default for new cards
- Pixel cuisine icons (auto by tag, or pick manually)
- Backup: tap the logo → export or restore a JSON file

## Open locally

```bash
cd h5
npx --yes serve .
```

Or open `index.html` directly (a local static server is more reliable).

## Files

```
index.html
css/fanku.css
js/storage.js      # localStorage
js/app.js          # UI & routing
assets/dotown/     # pixel icons
```

## Data

- Storage key: `fanku:v1`
- Export before clearing cache or changing devices
- Import overwrites all data on this device
