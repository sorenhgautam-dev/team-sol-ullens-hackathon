# Next Payday

*Same income. Different month.* — a mobile life-sim + town-strategy game about payment timing, gap-bridging costs and scam pressure. Built for a 48-hour FinTech hackathon.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (Vitest)
npm run build      # production build + PWA (installable, offline)
npm run preview    # serve the build
```

Open it on a phone (or a 390×844 frame on desktop). On Android/Chrome use **Install the app**; on iPhone use Share → Add to Home Screen.

## What is in

- **Life Mode** — live Sita's month day by day: Home Street hub, Life Log, stat bars, Money / People / Phone / Moves tabs, event cards, timing levers, Gap Bridge, energy, hearts, mailbox, Savings Sprout, goodnight screen, calendar.
- **Scam Squad** — 8 scammers + 2 real decoys, Spot the Tells, verify / ask / wait / block, Data Leak personalisation, Scam Codex, Shield grade.
- **End of month** — Stability Score, Month Rewind, What-If cards, Capability Report.
- **Twin Wallets** intro, Bikash (gig) profile, Monte Carlo forecast band (Web Worker).
- **Fix My Dates** — Shift Finder over 60 days (Web Worker) + Ask Builder with copy/share.
- **Impact Lab** — pre/post check for testers, stored locally, copyable summary.
- **Town Mode** — 7-ward Voronoi map, desperation cycle (shortfalls ↔ scams), 8 initiatives, weekly events, win/lose/grade, 4-week outlook.

One pure engine (`src/engine/simulate.ts`) runs every household; the town engine aggregates it. The UI never calculates money. All text is in `src/i18n/en.ts` (English only).
