# Skippity

A digital table-ready version of **[Skippity](https://boardgamegeek.com/boardgame/85563/skippity)** — the hopping set-collection game by Susan McKinley Ross (MindWare).

## How to play

1. The 10×10 board is filled with 100 skippers (20 of each of five colors). The four center spaces start empty.
2. On your turn, jump **any** skipper orthogonally over an adjacent skipper onto an empty square.
3. Captured skippers go into your collection by color. You may chain jumps or stop early.
4. When no jumps remain, the player with the most complete sets of all five colors wins. Tiebreak: most skippers.

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Modes

- **2–4 players** hot-seat
- Optional **AI opponents** (greedily multi-jumps toward complete sets)
