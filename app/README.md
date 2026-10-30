# App

The frontend and bundled static server for **Open Exercises**. Full documentation — quick start, project structure, data format, adding exercises, contributing — lives in the [root README](../README.md).

| File | Purpose |
|---|---|
| `index.html` | Page: sticky frosted header, search, exercise grid, iOS-style detail sheet |
| `style.css` | Apple Fitness / iOS Health styling, light + dark themes, spring sheet easing |
| `app.js` | Loads `../data/catalog.json`, renders the grid with lazy looping Lottie previews, live search, detail sheet |
| `lottie.min.js` | Bundled lottie-web player — works offline, no CDN |
| `server.js` | Dependency-free Node static server: `/` → this app, `/app/*` → this folder, everything else (e.g. `/data/...`) → the repo root |
| `_shot.html` | Optional dev harness that auto-opens the first detail sheet (used for headless-Chromium screenshot verification; gitignored) |
