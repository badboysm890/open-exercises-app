# Open Exercises — Browser App

**URL: http://localhost:8899/** (open it and just refresh after code changes)

## What is in `app/`

| File | Purpose |
|---|---|
| `index.html` | Page: sticky frosted header (title, count, pill search), exercise grid, iOS-style detail sheet |
| `style.css` | Apple Fitness / iOS Health styling: light `#F5F5F7` + `prefers-color-scheme` dark (`#000`/`#1C1C1E`), 20px-radius cards, soft shadows, spring sheet easing, `prefers-reduced-motion` |
| `app.js` | Loads `../data/catalog.json` (75 exercises) via fetch, renders the grid with lazy looping Lottie preview thumbnails (IntersectionObserver), live search, and the detail sheet (animation + Title Case name + numbered instructions; Esc / button / backdrop closes it). Supports `?theme=light|dark`. |
| `lottie.min.js` | Lottie web runtime (copied from `exercies/lottie.min.js`) — works offline, no CDN |
| `server.js` | Small dependency-free Node static server: `/` → this app, `/app/*` → this folder, `/data/...` → the repo's exercise catalog + Lottie JSON |
| `_shot.html` | Optional harness that auto-opens the first detail sheet — used for headless-Chromium screenshot verification |

Data source: `data/catalog.json` + `data/exercises/*.json` (JSON fetched over HTTP — no sql.js needed in the browser).

## Run / stop / restart the server

```sh
cd /home/zenitsu/Downloads/sixpack-lottie/open-exercises

# start (background)
PORT=8899 nohup node app/server.js > /tmp/open-exercises-server.log 2>&1 &

# confirm it is listening
curl -sI http://localhost:8899/

# stop
pkill -f 'node app/server.js'
```
