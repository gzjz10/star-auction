# Star Auction (مزاد النجوم)

A bilingual (AR/EN) head-to-head football draft auction. Two corners, red and blue, each start with €450M and build an XI one position at a time. The squads then play a simulated match.

- Live: https://star-auction.vercel.app. Vercel is Git-connected, so a push to `main` deploys in about 20 seconds.
- Repo: https://github.com/gzjz10/star-auction (public).
- Product and design context: `PRODUCT.md` and `DESIGN.md`. Read them before any UI work. The look is a letterpress "fight bill", designed with the impeccable skill in `.claude/skills/impeccable`.

## Commands

```bash
npm run dev       # dev server
npm test          # vitest: engine, data, online protocol
npm run build     # tsc -b + vite build (must stay green)
npx oxlint src    # lint src only; the root also lints the impeccable scripts
npx vite preview --port 4331   # 4173 and 4319 are often taken on this PC
```

On this PC, Node is not on PATH in tool shells. Prefix commands with `export PATH="/c/Program Files/nodejs:$PATH"`.

## Architecture

- `src/engine/` holds the pure game logic and is fully tested. `auction.ts` is a reducer (`reduce(state, action)`). Every accepted action bumps `seq`, and any action carrying a stale `seq` is ignored. `rules.ts` holds every number the game uses, and the How to play page is generated from it. Draws and the match are seeded, so a given seed always plays out the same.
- `src/data/` is the 200-player database, with `DATA_AS_OF` set to 2026-10. Values are partly best guesses, so re-check them when updating.
- `src/screens/` has one component per screen. `App.tsx` owns `game` state, routing between screens, autosave and history.
- `src/online/` is online play:
  - It is peer-to-peer over WebRTC. The public PeerJS broker only introduces the two browsers, so there is no backend.
  - `protocol.ts` defines the messages and validates anything that comes in. Bump `PROTOCOL` whenever a message or the `GameState` shape changes.
  - `room.ts` is the transport. It handles the heartbeat and guest reconnects, and it loads `peerjs` lazily.
  - `useOnline.ts` is the session logic. The host (red, seat 0) runs the reducer and broadcasts the full state. The guest (blue, seat 1) only sends actions, and the host checks them with `guestAction`.
- Persistence is `localStorage` (`engine/save.ts`). Online games never take the resume slot, but both sides log them in the history.

## Conventions

- Arabic is the default language, and layouts are RTL-first. Every string goes in both `en` and `ar` in `src/i18n/strings.ts`.
- Always show Western digits. Format numbers with `en-US` through `fmtNumber` and `fmtMoney`.
- Never use club logos or player photos. Clubs are shown as monograms in kit colours.
- Colour is never the only signal for a team or turn. Respect reduced motion.
- The git identity is set locally in the repo (gzjz10). Pushing to `main` deploys to production.

## Testing online play

The repo has no e2e suite. The online feature was verified with a two-browser puppeteer-core script, using headless Edge at `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`, run against the real PeerJS broker. The script had 23 checks: join via link, turn locking, sync, guest reload and rejoin, room full, wrong code, results and rematch on both devices, and host leaving. All passed locally and on the live site on 2026-10-07.

## Status (2026-10-07)

Done:
- vs AI with four difficulty levels
- two players on one device
- online play, shipped in commit `38bb2e4`
- match simulation
- record book
- day and night themes

## Next steps

1. **Host can resume an online room.** Today the room ends if the host reloads or closes the page. To fix that:
   - Save the host's online game and room code, in `sessionStorage` or a separate `localStorage` key, never the resume slot.
   - On reload, reclaim the same peer id `star-auction-v1-<CODE>`. The broker may briefly return `unavailable-id`, so retry with backoff.
   - The guest already retries the same code and is recognised by `clientId`, so they will reattach on their own.
2. **TURN relay for blocked networks.** Some mobile carriers block direct WebRTC links, and right now there are only STUN defaults. To fix that:
   - The user creates a free TURN account, for example Metered or Cloudflare Calls.
   - Set `VITE_ICE_SERVERS` (a JSON array of `RTCIceServer`) in Vercel's project env vars, then redeploy. No code change is needed.
3. **Optional polish:**
   - The host should confirm before leaving a live online bout, because leaving ends it for both players.
   - Show the opponent's connection state on the results and match screens.
   - Add the two-browser e2e script to the repo as `npm run e2e:online`.
