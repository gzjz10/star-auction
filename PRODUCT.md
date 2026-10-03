# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, static build, no backend. Persistence in localStorage (versioned save). Hosted on Vercel from the public GitHub repo `gzjz10/star-auction` (auto-deploy on push to main).

## Users

Arab football fans playing together: friends at a gathering passing one phone (or sharing a laptop) for local two-player auctions, plus the same people playing solo against the AI between games. Arabic is the default language; English is fully supported.

## Product Purpose

Star Auction (مزاد النجوم) is a head-to-head football draft auction. Two managers build a starting XI round by round, bidding real-world stars against a shared budget, then the two squads play a simulated match. Success: a full auction is tense, readable at arm's length on a phone, fair, and fun to replay.

## Positioning

Every round pairs an open card you bid on with a face-down card the loser gets for free. Winning the bid is not always winning the round, so bluffing and budget timing matter as much as football knowledge.

## Operating Context

- One device, two people, often in a noisy room; turns pass hand to hand.
- Rounds are short and timed, and a whole game takes 10–15 minutes.
- Players argue about player values, so prices and ratings must feel current.

## Capabilities and Constraints

- Modes: vs AI (four difficulties) and local two-player on one device.
- Formations: 4-3-3, 4-4-2, 3-5-2, 4-2-3-1. Each slot is one auction round, and players are drawn strictly by position.
- Each team gets a budget of €450M. Prices are in € millions, based on market value as of the 2026/27 season (data as of Oct 2026).
- Scoring: player ratings + chemistry (club / nation / league links) + leftover cash. Each part can be toggled.
- The match simulation is driven by squad strength. Results are never scripted.
- Save & resume mid-auction, plus a local history of past games.
- Bilingual AR/EN with full RTL/LTR mirroring. Digits are always Western (en-US).

## Brand Commitments

The name is "مزاد النجوم / Star Auction". There are no club logos or player photos (IP), so clubs are shown as monograms in their colours.

## Evidence on Hand

- The player database is researched for this build (`src/data/`).
- There are no testimonials, user counts or partnerships, and none should be invented.

## Product Principles

1. The table is the game: the current bid, whose turn it is, and the money left must be readable instantly from across a couch.
2. Fair and transparent: rules text comes from the same constants as the engine, and there are no hidden scripts.
3. Arabic first, never an afterthought: layouts are designed RTL and mirrored to LTR.
4. Interruptions happen: every action auto-saves.

## Accessibility & Inclusion

- WCAG AA contrast and pinch-zoom allowed.
- Reduced motion respected.
- Full keyboard play on desktop.
- Colour is never the only signal for a team or turn.
