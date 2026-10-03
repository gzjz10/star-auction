---
name: "مزاد النجوم / Star Auction"
description: "Every round printed as tonight's fight bill: a letterpress wood-type poster where two corners, red and blue, bid for the headline act."
colors:
  stock: "#efe3c8"
  stock-2: "#e5d6b4"
  stock-3: "#d9c79f"
  ink: "#171512"
  ink-2: "#4a443b"
  ink-3: "#6b6355"
  red: "#b3261e"
  blue: "#1f3b73"
  on-red: "#f7eedb"
  on-blue: "#f7eedb"
  on-ink: "#efe3c8"
  ghost: "rgb(23 21 18 / 0.16)"
  night-stock: "#15120e"
  night-stock-2: "#1f1b15"
  night-stock-3: "#2b261e"
  night-ink: "#efe3c8"
  night-ink-2: "#c4b89f"
  night-ink-3: "#9d927d"
  night-red: "#e5533f"
  night-blue: "#7a9ce8"
  night-on-red: "#15120e"
  night-on-blue: "#15120e"
  night-on-ink: "#15120e"
  night-ghost: "rgb(239 227 200 / 0.16)"
typography:
  display:
    fontFamily: "'Big Shoulders Display', 'Lalezar', 'Changa', sans-serif"
    fontSize: "clamp(3.5rem, 19cqi, 9.5rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
  bid-figure:
    fontFamily: "'Big Shoulders Display', 'Lalezar', 'Changa', sans-serif"
    fontSize: "clamp(3.6rem, 17vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.9
    fontFeature: "'tnum' 1, 'lnum' 1"
  headline:
    fontFamily: "'Big Shoulders Display', 'Lalezar', 'Changa', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 0.88
  title:
    fontFamily: "'Big Shoulders Display', 'Lalezar', 'Changa', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 900
    lineHeight: 1
  slab:
    fontFamily: "'Alfa Slab One', 'Rakkas', 'Changa', serif"
    fontSize: "2.1rem"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "'Changa', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Big Shoulders Display', 'Lalezar', 'Changa', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.08em"
  label-ar:
    fontFamily: "'Changa', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
rounded:
  none: "0"
  print: "2px"
  disc: "50%"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "16px"
  xl: "24px"
  gutter: "clamp(16px, 3.2vw, 32px)"
components:
  button-solid-red:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-red}"
    typography: "{typography.title}"
    rounded: "{rounded.print}"
    padding: "0.55em 1.1em"
    height: "48px"
  button-solid-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.print}"
    padding: "0.55em 1.1em"
    height: "48px"
  button-outline-blue:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    typography: "{typography.title}"
    rounded: "{rounded.print}"
    padding: "0.55em 1.1em"
    height: "48px"
  button-outline-ink:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.print}"
    padding: "0.55em 1.1em"
    height: "48px"
  button-lg:
    height: "60px"
  button-sm:
    height: "40px"
    padding: "0.4em 0.8em"
  choice:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.print}"
    padding: "0.35em 0.9em"
    height: "44px"
  choice-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  rating-box:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-red}"
    typography: "{typography.slab}"
    rounded: "{rounded.none}"
    height: "60px"
    width: "64px"
  mystery-strip:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-blue}"
    rounded: "{rounded.none}"
    width: "54px"
    padding: "12px 4px"
  vs-disc:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.disc}"
    size: "40px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.print}"
    size: "44px"
---

# Design System: Star Auction

## Overview

**Creative North Star: "Tonight's Fight Bill"**

Every auction round is a freshly printed boxing-style poster in the Hatch Show Print tradition. The open lot is the headline act, set in condensed wood type that fills the full measure. The two managers are billed against each other as the RED corner and the BLUE corner. The ground is cream poster stock with visible paper grain. Every mark on it is ink: solid blocks that show a mottle of paper through them, heavy black rules, star ornaments, and a second ink pass that lands a hair off register.

The density is that of a bill, not an app. Bands run edge to edge and are separated by 3–4px rules. Type is sized to fill its measure rather than picked from a fixed scale (see FitText). Numbers are the loudest thing on screen because the table has to be read from across a couch. There is a night-print variant: the same inks on black stock, chosen by `data-theme="night"` or by the OS dark preference.

Motion is the press. A new bid is pulled onto the poster as one impression, the previous bid stays behind as a dry ghost, and SOLD is a rubber stamp slammed at an angle. The system refuses the category default of glowing gold player cards on a dark pitch-green background.

**Key Characteristics:**
- Cream poster stock with multiply grain (paper) or screen grain (night), fixed over everything and never intercepting input.
- Two corner inks, barn red and deep blue. Each always appears with a text label, so colour is never the only signal.
- Condensed wood type for display, a slab face for figures, and Changa for reading text. Arabic-first, with Arabic fallbacks in every stack.
- Square printed blocks (2px radius) with an inner printed hairline.
- Flat print depth: rules, outlines and ink, never floating cards.
- Motion grammar is press-in, stamp-slam and rise. Under reduced motion these become an instant swap.

## Colors

The palette is wood-ink on poster stock, plus two corner inks that do all of the team signalling.

### Primary
- **Barn Red** (`red`): the red corner, the primary action ink (solid bid blocks, Home's main act), the SOLD stamp, the rating box, the current-round star, the low-time fuse, text selection and the caret. Night print lifts it to a hot vermilion (`night-red`) that carries dark text.

### Secondary
- **Deep Blue** (`blue`): the blue corner, outlined secondary blocks, the position line on a lot, the folded mystery strip and the focus ring. Night print lifts it to a cornflower (`night-blue`).

### Neutral
- **Poster Stock** (`stock`, `stock-2`, `stock-3`): the page ground and two deeper tans for linen bands, wells and the scrollbar track. At night these become black stock (`night-stock` family).
- **Wood Ink** (`ink`): text, rules, outlined blocks, the VS disc and selected choices. At night it inverts to cream (`night-ink`).
- **Pressed Gray** (`ink-2`, `ink-3`): secondary text, labels, empty slots and the unheld bid.
- **On-colours** (`on-red`, `on-blue`, `on-ink`): text printed out of a solid block. They are cream by day and black stock by night.
- **Ghost Impression** (`ghost`): ink at 16%. Used for hairline dividers inside tables, icon-button hover and flag keylines.

### Named Rules
**The Two Corners Rule.** Red and blue mean only "red corner" and "blue corner" (plus red as primary action and SOLD). Never introduce a third team or status hue. Every red or blue mark has a text partner, such as the corner label, the name or "RED/BLUE".

**The Overprint Rule.** A tinted surface is the corner ink mixed into transparent (`color-mix(in srgb, var(--corner) 10–12%, transparent)`), never a new pastel token. This is how the bout side whose turn it is, and the current squad row, are lit.

**The Night Print Rule.** Night is the same poster pulled on black stock, not a separate theme. Every token swaps in place. Grain flips from multiply (0.32) to screen (0.22), and on-colours flip to black stock.

## Typography

**Display Font:** Big Shoulders Display 800/900 (Lalezar for Arabic, then Changa)
**Slab Font:** Alfa Slab One 400 (Rakkas for Arabic, then Changa)
**Body Font:** Changa 400/600/700 (with system-ui)

**Character:** Condensed, uppercase wood type does the shouting, a fat slab carries ratings and values like a stamped ticket, and Changa keeps the rules readable in both scripts. All faces are self-hosted via @fontsource.

### Hierarchy
- **Display** (900, fills the measure via `cqi` clamps or FitText, line-height 0.88, uppercase, `text-wrap: balance`): the title, the lot's player name and the SOLD word. In Arabic the line-height is 1.22 with no tracking, because Lalezar needs air for its dots.
- **Bid Figure** (900, `clamp(3.6rem, 17vw, 6rem)`, line-height 0.9, tabular lining figures): the current bid, printed in the holder's ink.
- **Headline / Title** (900, 1.3–1.75rem): section heads, corner names and the topbar title.
- **Slab** (400, 1.2–2.1rem, line-height 1, or 1.35 in Arabic): ratings, OVR columns and values.
- **Body** (400, 1rem, line-height 1.5): rules text, notes and hints.
- **Label** (800, 0.875rem, 0.08em tracking, uppercase): corner tags, stat heads and bid labels. In Arabic it switches to Changa 700 at 0.9375rem with no tracking.

### Named Rules
**The Full Measure Rule.** Headline wood type is sized to its container (`container-type: inline-size` with `cqi` clamps, or FitText between min and max px). It is not chosen from a fixed ramp. A line of wood type spans the bill.

**The Western Digits Rule.** Every number uses `.num`: tabular lining figures, `direction: ltr` and isolated bidi. Digits are always en-US, including in Arabic.

## Layout

The layout is a single poster column inside `.page` (max 1240px, side gutter `clamp(16px, 3.2vw, 32px)`, 12px top and 40px bottom padding). A ruled topbar (52px minimum, 3px bottom rule) heads every screen. Stacked gaps use 8, 10, 14, 16 and 24px.

The auction table on a phone stacks a ruled round header (star row), the bout band (two columns, VS disc centred on the seam), then the lot beside a 54px mystery strip. Below 1080px the bid, fuse and controls dock to the bottom as a sticky band with a 4px top rule, keeping the bid in thumb reach. Raise blocks sit in a three-column grid of 60px blocks. At 1080px and wider the stage becomes three columns: red squad sheet (270px), lot broadside, blue squad sheet (270px). The sheets are sticky and the mystery strip widens to 76px. Secondary screens break at 760px, 820px and 860px into two columns.

Layouts are designed RTL and mirrored. Use logical properties (`inset-inline`, `border-inline-start`, `padding-inline`). Directional icons flip under `[dir='rtl']`, and the fuse burns from the start edge.

## Elevation & Depth

The system is flat print. Depth comes from rule weight (4px band rules, 3px block borders, 2px table rules, 1px ghost hairlines), solid ink versus outline, and inset printed frames (a 1.5px outline inset 5–8px inside a block). Nothing floats.

Two shadow-like devices are native print effects rather than elevation. The off-register second pass is a hard 30% colour text-shadow offset by 0.035em. The double rule is built from stacked zero-blur box-shadows.

### Named Rules
**The Ink, Not Air Rule.** Separate things with a rule, an outline or a change of ink, never a blurred drop shadow or a lifted card.

## Shapes

Corners are square cut. Blocks, chips and icon buttons use a 2px radius, which is just enough to read as a wood block. Rating boxes, the mystery strip and the stamp have 0 radius. The only round forms are the VS disc, club monogram roundels and pitch tokens (50%). Recurring silhouettes include a double frame (border plus an inset outline), five-point star ornaments in rows, the vertical folded strip, and the stamp rotated −9° (red) or 8° (blue). Team crests are generated from four shapes (shield, round, pennant, diamond) and six marks, printed in corner ink.

## Components

### Buttons (ink blocks)
- **Character:** blocks of ink pulled from a press. They are heavy, square and uppercase.
- **Shape:** printed block (2px radius), a 3px border in the block's ink, and an inner printed hairline (1.5px, currentColor at 55%, inset 3px). Minimum height is 48px (sm 40px, lg 60px, raises 60px).
- **Solid:** corner ink fill with the on-colour, overlaid with a 260px paper mottle so the ink never prints perfectly flat. Red is primary.
- **Outline:** a transparent block in blue or ink, with stars where the action is billed.
- **Hover (pointer devices only):** lift 1px. Outline blocks also take a 9% ink wash.
- **Active:** `translateY(1px) scale(0.985)`, which is the press.
- **Focus:** a 3px blue outline offset 3px (global `:focus-visible`).
- **Disabled:** a dry ghost impression at 32% opacity with 60% grayscale and a not-allowed cursor.

### Chips (choices)
- **Style:** printed tickets, 44px minimum, with a 2px ink border and 2px radius. Display 800 uppercase in English, Changa 600 in Arabic. An optional `small` line is set in body type.
- **State:** selected (`aria-pressed` or `aria-checked`) prints solid ink with on-ink text. Unselected is an outline.

### Cards / Containers (the lot broadside)
- **Corner Style:** square. A 3px rule border plus a 1.5px outline inset 8px.
- **Background:** stock. The rating box is a solid red block with an inset hairline.
- **Shadow Strategy:** none (see Elevation).
- **Internal Padding:** 14px 16px 16px. Stats sit in a six-column ruled row with ghost dividers.

### Navigation
- **Topbar:** a ruled band holding a 44px icon-button back, the display title and tools.
- **Squad tabs (phone):** display 900 uppercase in ink-3. The selected tab takes its corner ink and a 5px underline.

### Bout Band (signature)
Red corner versus blue corner, with a 4px rule above and below. Each side shows its crest, corner label, name and a large budget figure. The side whose turn it is takes a 10% corner wash and a 6px corner bar along its top edge. The VS disc (ink, 40px, or 52px on desktop) sits on the seam.

### Bid and Fuse (signature)
The current bid is the Bid Figure in the holder's ink, or ink-3 when nobody holds it. Behind it, the previous bid stays as a ghost at 8% opacity, offset slightly. The timer is a fuse: a 5px rule in the turn's corner ink that scales down linearly. At 5 seconds or less it thickens to 7px and turns red.

### SOLD Stamp (signature)
A rubber stamp has a 5px border plus a 2px outline offset 4px, in the winner's ink, over 82% stock. It is rotated −9° for red and 8° for blue, and slammed once.

### Mystery Strip (signature)
The hidden lot is a narrow folded strip in solid blue with an inset cream hairline. It carries vertical "MYSTERY ★ TBA" type. When revealed it opens to full width as an outlined block in the winning corner's ink.

### Motion
- **press-in** (340ms, `cubic-bezier(0.16, 1, 0.3, 1)`): scales from 1.12 with a 1.5px blur and 0.2 opacity, overshoots to 0.985, then settles at 1. Used for each new bid.
- **stamp-slam** (420ms, same easing): scales from 2.2 to 0.94 to 1 at the stamp's rotation. Used for SOLD.
- **rise** (260–420ms, staggered delays of 260–420ms): an 8px lift plus fade-in. Used for reveals, resume, the next-round control and match events.
- **State transitions:** `--press` 180ms on transform, colour and opacity. The bout turn wash takes 240ms.
- **Reduced motion:** every animation and transition collapses to 1ms, so it reads as an instant swap. The final state is always correct without motion.

### Identity Marks (IP constraint)
There are no club logos, crests or player photos. Clubs are monogram roundels in kit colours: primary fill, secondary ring and a three-letter code in Big Shoulders 900. Nations are flags with a ghost keyline and their name in alt text. Team crests are generated shapes and marks in corner ink.

## Do's and Don'ts

### Do:
- **Do** separate regions with ink rules (4px bands, 3px blocks, 2px tables, 1px ghost) and inset outlines.
- **Do** fill the measure with display wood type using container-query clamps or FitText.
- **Do** pair every red or blue signal with a text label for the corner, name or turn.
- **Do** print solid blocks with the paper mottle and an inner hairline, so ink never reads as a flat digital fill.
- **Do** set every number with `.num` in Western digits.
- **Do** design RTL first using logical properties, with Arabic fallbacks in every font stack.
- **Do** honour reduced motion by making it an instant swap. A stamp or bid must be legible at its final state with no animation.
- **Do** render clubs as kit-colour monogram roundels and teams as generated crests.

### Don't:
- **Don't** use club logos, official crests, player photos or likenesses.
- **Don't** add a third accent hue or a gold or glow treatment. The palette is stock, ink, red and blue.
- **Don't** use rounded cards, pill buttons or blurred drop shadows to create depth.
- **Don't** make colour the only carrier of team or turn.
- **Don't** use system display faces. The wood type is Big Shoulders Display or Lalezar, and the slab is Alfa Slab One or Rakkas.
