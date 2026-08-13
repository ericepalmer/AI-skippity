# Skippity / Palton Games

**Live:** [games.palton.xyz](https://games.palton.xyz)

- **Landing** — static HTML in `portal/` (deployed to the site root)
- **Skippity** — React game at [`/skippity/`](https://games.palton.xyz/skippity/) · counts: [`/skippity/count.html`](https://games.palton.xyz/skippity/count.html)
- **Galaxian** — arcade shooter at [`/galaxian/`](https://games.palton.xyz/galaxian/) · counts: [`/galaxian/count.html`](https://games.palton.xyz/galaxian/count.html)
- **Hex Combat** — hex combat at [`/hex/`](https://games.palton.xyz/hex/) · counts: [`/hex/count.html`](https://games.palton.xyz/hex/count.html)

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

## Game-start counters (no database)

Each game keeps **its own** log + `count.html` in its folder:

| Game | Hit URL | Counts page |
|------|---------|-------------|
| Skippity | `/skippity/hit.php?event=game_start` | [`/skippity/count.html`](https://games.palton.xyz/skippity/count.html) |
| Galaxian | `/galaxian/hit.php?event=game_start` | [`/galaxian/count.html`](https://games.palton.xyz/galaxian/count.html) |
| Hex Combat | `/hex/hit.php?event=game_start` | [`/hex/count.html`](https://games.palton.xyz/hex/count.html) |

On each hit the PHP script appends to that game’s `game-starts.log` and rebuilds that game’s `count.html` (weekly top 5 + per-day IPs).

The `.log` file is blocked from web download. `count.html` is public — lock it in DreamHost if you want it private.

Local `npm run dev` / static servers have no PHP, so the ping fails quietly.

## Skippity rules (short)

1. 10×10 board, 100 skippers (20 of each of five colors); center four empty.
2. Jump any skipper orthogonally over an adjacent skipper onto an empty square.
3. Captures go to your collection by color; multi-jumps allowed.
4. Most complete sets of all five colors wins (tiebreak: most skippers).
