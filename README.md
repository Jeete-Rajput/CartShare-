# CartShare

CartShare is a responsive collaborative shopping room for coordinating shared orders. It is built with HTML, CSS, and vanilla JavaScript so it can run on GitHub Pages, Netlify, or Vercel without a backend.

## Features

- Create or join a room with a unique room code.
- Add and remove priced items from a shared cart.
- Persist room data in browser `localStorage`.
- Sync cart changes between browser tabs with the `storage` event.
- Show a live activity log with the participant responsible for each action.
- Track progress toward the $75 free-delivery threshold.
- Generate and print an audit-ready group receipt.
- Responsive desktop and mobile layouts.

## Run locally

Because this is a static site, no build step is required. Open `index.html` directly in a browser, or use any static server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Test collaboration

1. Open the app in two browser tabs.
2. Enter different names and the same room code in both tabs.
3. Add or remove an item in one tab.
4. The second tab receives the update automatically.

## Project structure

```text
CartShare/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   └── app.js
└── assets/
```

## Deployment

Upload the repository to GitHub and import it into Vercel or Netlify, or enable GitHub Pages from the repository settings. The root `index.html` is the entry point.
