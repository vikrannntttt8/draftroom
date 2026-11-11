# DraftRoom — Real-time Multiplayer Drawing & Word-Guessing Game

DraftRoom is a fast, zero-friction browser-based multiplayer drawing and word-guessing party game built according to the Product Requirements Document.

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Web Audio API, Canvas Confetti, Lucide Icons.
- **Backend:** Node.js, Express, Socket.io, Zod schema validation.
- **Drawing Engine:** Native HTML5 Canvas 2D with normalized coordinates (0–1), batched stroke streaming (~30ms), quadratic Bézier curve smoothing, scanline flood fill (bucket fill), undo and clear.

---

## Features Implemented

### 1. Zero-Friction Entry & Lobby Management
- **No accounts or passwords:** Enter nickname and select custom avatar in seconds.
- **Custom Avatar Creator:** 12 curated base colors, 12 expressive face SVGs, and 12 accessories (crowns, party hats, headphones, beanies, halos, etc.).
- **Room Codes & Links:** Unique 4-letter codes (excluding ambiguous letters like `I` and `O`) or custom 4-letter codes. Shareable invite links (`/r/ABCD`) with one-click copy.
- **Host Controls:**
  - Rounds: 2 to 10 rounds (default 3)
  - Draw time: 30s to 180s (default 80s)
  - Word bank: Default (mixed), Easy, Hard, Custom-only, Default + Custom
  - Hints toggle: Reveals letters at 50% & 75% elapsed time (max 40% of word)
  - Max players: 2 to 12
  - Custom words list (comma-separated, up to 100 words)
  - Player kicking: Host can kick disruptive players (blocked from rejoining).

### 2. High-Performance Drawing Engine
- **Fixed Logical Space:** 800×600 canvas coordinate space that scales responsively with CSS.
- **Normalized coordinates (0–1):** Guarantees 100% identical rendering across different devices and screen sizes.
- **Tools:**
  - Brush with 16-color palette + custom hex picker
  - 4 stroke sizes: S (2px), M (6px), L (12px), XL (24px)
  - Eraser (draws in background color)
  - Scanline BFS Flood Fill (Bucket Tool) with color tolerance
  - Undo: pops drawer's last operation from history
  - Clear: wipes canvas and resets stroke history
- **Validation & Anti-Cheat:** Non-drawers have `pointer-events: none` and the server strictly rejects any canvas events from sockets that are not the current drawer.

### 3. Real-Time Chat & Guessing Subsystem
- **Word Masking:** Displays `_ _ _   _ _ _ _ _` with letter count pills.
- **Exact Guess Matching:** Correct guess hides guess text, awards points, broadcasts celebration banner, and moves player to the isolated guessed-channel.
- **Close Guess Detection:** Uses Levenshtein distance (= 1 for 5+ letter words) to send private `"That's close!"` nudges to the guesser without spoiling the word for others.
- **Spoil Deterrent:** Guesses containing the secret word inside longer sentences are blocked from public broadcast.
- **Anti-Cheat:** Paste, drop, and cut events are disabled on the guess input to deter automated wordlist dumping.
- **Server-Authoritative Scoring Formula:**
  - $guesserPoints = \text{round}(50 + 450 \times (t / T))$
  - $orderBonus = \max(0, n - k) \times 10$
  - $guesserTotal = guesserPoints + orderBonus$
  - $drawerPoints = \text{round}(\text{average}(guesserPoints) \times 0.5) + (20 \times \text{correctCount})$

### 4. Game State Machine & Edge Cases
- **State Machine:** `LOBBY` $\rightarrow$ `WORD_SELECT` (10s) $\rightarrow$ `DRAWING` (T) $\rightarrow$ `TURN_TALLY` (5s) $\rightarrow$ `GAME_OVER` $\rightarrow$ `LOBBY` (Rematch).
- **Drawer Disconnect Grace Period:** 10-second window to reconnect with identical `clientId` before turn tally.
- **Host Migration:** Automatically transfers host role to oldest connected player if host leaves.
- **Synthesized Sound FX (Web Audio API):**
  - Ascending chime on turn start
  - Bright major chime on correct guess
  - Blip on close guess
  - Clock tick on last 10 seconds (with urgent tempo in last 5s)
  - Round end & Game over victory fanfares
  - Mute/unmute toggle persisted in localStorage.
- **Podium & Confetti:** Final game-over modal features 1st, 2nd, and 3rd place podium with confetti fireworks.

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
Install dependencies for root, server, and client:

```bash
npm run dev
```
*(Or install manually: `cd server && npm install`, `cd client && npm install`)*

### Running in Development
Start both the Socket.io backend server (port 4000) and the Next.js frontend (port 3000) concurrently:

```bash
npm run dev
```

- Open **[http://localhost:3000](http://localhost:3000)** in your browser.
- Open multiple tabs or an incognito window to simulate multiplayer.

### Running Tests
Execute unit tests and full end-to-end Socket.io integration tests:

```bash
npm test
```

### Production Build
```bash
npm run build
```
