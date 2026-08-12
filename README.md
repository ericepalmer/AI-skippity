# Skippity / Palton Games

**Live:** [games.palton.xyz](https://games.palton.xyz)

- **Landing** — static HTML at the site root (`index.html` + `landing.css`)
- **Skippity** — React game at [`/skippity/`](https://games.palton.xyz/skippity/)
- **Galaxian** — arcade shooter at [`/galaxian/`](https://games.palton.xyz/galaxian/) (deployed from the AI-Galaxian repo)
- **Hex Combat** — simultaneous hex combat at [`/hex/`](https://games.palton.xyz/hex/) (deployed from the AI-hex repo)

## Run locally

```bash
npm install
npm run dev
```

- Landing: `http://localhost:5173/`
- Game: `http://localhost:5173/skippity/`

## Build

```bash
npm run build
```

Produces `dist/` with the static landing page and `dist/skippity/` for the game.

Preview the full site:

```bash
npm run preview
```

## Deploy to DreamHost

```bash
./deploy/dreamhost.sh YOUR_USER@YOUR_DREAMHOST_SERVER
```

## Skippity rules (short)

1. 10×10 board, 100 skippers (20 of each of five colors); center four empty.
2. Jump any skipper orthogonally over an adjacent skipper onto an empty square.
3. Captures go to your collection by color; multi-jumps allowed.
4. Most complete sets of all five colors wins (tiebreak: most skippers).
