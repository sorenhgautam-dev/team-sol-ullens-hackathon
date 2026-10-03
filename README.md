# Scam Town

**Survive payday.**

**Scam Town: walk through town on payday and survive the world's most common scams. Every trap teaches one rule that protects your money.**

A mobile game (installable PWA, fully offline, no account, no network calls) for anyone who gets paid, sends money home, sells things online or looks for work. It is global: pick USD, EUR, GBP, INR or NPR in Settings and every amount becomes **typical local pay and prices for that currency, never an exchange-rate conversion** (Sita's money from abroad is Rs. 30,000, Bikash's week of deliveries Rs. 7,000). Senders are generic ("your bank", "a delivery company", "a payment app"), and no real brands appear.

*Built by **Team Sol** for the Ullens Hack-a-thon (FinTech). Earlier builds were called Next Payday.*

| Title | Pick who you are | Scam Town | The call |
|---|---|---|---|
| ![title](docs/screenshots/paytown/1-title.png) | ![pick](docs/screenshots/paytown/2-pick.png) | ![town](docs/screenshots/paytown/3-town.png) | ![call](docs/screenshots/paytown/4-call.png) |

| What it cost | Who it really was | Rule card | Results |
|---|---|---|---|
| ![outcome](docs/screenshots/paytown/5-outcome.png) | ![reveal](docs/screenshots/paytown/6-reveal.png) | ![rule](docs/screenshots/paytown/7-rule-card.png) | ![results](docs/screenshots/paytown/8-results.png) |

| Family Warning Card | Scam Checker | Payday 2: the south district |
|---|---|---|
| ![family card](docs/screenshots/paytown/9-family-card.png) | ![checker](docs/screenshots/paytown/10-checker.png) | ![district](docs/screenshots/paytown/11-district.png) |

## Why we made it

Payday is when people have the most money in their account, and it is exactly when scammers strike: a "bank" call about a blocked account, a "buyer" asking you to approve a payment, a parcel fee, a job that costs money to start. Most money apps teach budgeting. We wanted a game where you *feel* the pressure of a scam, make the call yourself, see what it cost, and walk away with one rule you can pass on to your family.

## What our team did

- **The idea and the pivot.** We started with a budgeting life-sim (still in the code, switched off), then decided to rebuild the whole game around scam awareness and make it global.
- **The scams and their rules.** We chose the five core traps (bank code call, "approve to receive" payment, parcel fee link, pay-to-work job, guaranteed returns), wrote the rule each one teaches, and asked for more everyday traps for later paydays. We insisted on real messages mixed in, so the lesson is *verify*, not *fear*.
- **The game design.** Payday as the moment of risk. Fall, close-call and safe choices with no villain shown until after you decide. The money changes first and the scammer is revealed second. "Try again" replays an encounter, a Scam Immunity Score with three tiers, a Family Warning Card to share, a Scam Checker on the phone, and a gauntlet loop of paydays.
- **Realistic money.** We called for typical local pay in every currency instead of converted amounts, so nobody is paid lakhs by accident.
- **The look.** The town map, the character-select mockup and the art direction (ink text, warm paper panels, teal actions, amber warnings, pixel world with readable text) are ours. We picked the Kenney packs and pixelarticons to fill the gaps.
- **Playtesting.** We played the builds and sent them back with changes: fences you cannot walk through, paths that lead somewhere, a bigger map, names you can change, realistic pay, a cleaner character select.
- **The pitch.** The one-line pitch above and the demo plan in [docs/DEMO.md](docs/DEMO.md).

## How we built it

We wrote the specs and briefs (`CLAUDE.md`, `NEXT_PAYDAY_MASTER_PROMPT.md`, `Next_Payday_Claude_Upgrade_Brief.md`), made the designs, and worked with **Claude Code** (Anthropic) as our AI pair-programmer: we described each feature, reviewed and playtested what came back, and asked for changes until it played the way we wanted. Claude Code wrote most of the implementation code and tests and the placeholder art; commits it worked on carry a `Co-Authored-By: Claude` trailer, and [docs/AI_USAGE.md](docs/AI_USAGE.md) lists who did what.

## How a game goes

**Title → pick who you are → walk through town → face the scams → results → next payday.**

1. **Pick a citizen.** A home tailor whose family's savings come from abroad, a gig delivery rider, or a first-time office worker. Each has a fixed story, job, pay and the scams that often target people like them, but **the name is yours**: tap the pencil and play as yourself (or "Y/N"). Every message uses that name and that life: the tailor waits for a parcel from abroad, the rider is offered a "team leader" job.
2. **Payday.** You start at home with your pay. The HUD shows only who you are, which payday it is, your balance, "Scams faced X/N" and your phone.
3. **Buildings glow.** Walk to them in any order, on the roads and grass: fences, trees, walls, stalls and water block you, and the garden gate is the way out. Arrows at the screen edge point to buildings you cannot see yet. On the first payday these five glow:

| Building | The trap | The rule on the card |
|---|---|---|
| Bank | A "security team" call: read out the one-time code or the account is blocked | Banks never ask for your one-time code, PIN or password. |
| Market | Selling your old phone; the "buyer" sends a payment request: "approve to receive" | You never need to approve a payment or enter your PIN to receive money. |
| Post office | A text: your parcel is held, pay a small fee through a link | Never pay a fee through a link in a message. Check with the company's official app or website. |
| Job centre | A great remote job, but first pay for "training" or a "kit" | Real employers never ask you to pay to get a job. |
| Investment kiosk | A friendly stranger: "double your money in 30 days, guaranteed" | Guaranteed high returns are a warning sign. Check the company is registered with your country's financial regulator. |

4. **The encounter.** A short thought, then the scam arrives as a realistic call, text or chat with a countdown and personal details. **No villain is shown yet.** Three choices in shuffled order: one falls for it, one is a close call, one is safe.
5. **The outcome.** Your balance changes on screen (losses are booked in the ledger as ScamLoss). *Then* the sender is revealed in a pixel battle scene: a shield and a VERIFY stamp if you were safe, coins stolen if not.
6. **The rule card.** Why it was a trap, the rule, and one money tip. **Try again** replays the same encounter as practice so you can see what the other choices would have done; your first answer still counts.
7. **Two real messages** arrive on your phone along the way (your bank confirming your pay, a family member checking in). They are safe to act on: the lesson is *verify*, not *everything is a scam*.
8. **Results.** What you kept of your pay, your **Scam Immunity Score** for that payday (safe 20, close call 10, fell for it 0, scaled to 100; 80–100 "Scam-proof", 50–70 "Getting wiser", under 50 "Easy target"), every rule card you have collected, and a **Family Warning Card** with those rules and Share and Copy buttons.
9. **The gauntlet loop.** **Next payday** starts the next round: pay lands again, your money carries over, and every countdown is 15% faster (down to 60%). Payday 2 opens the south district, a loop road built from Kenney Tiny Town tiles, with six everyday traps:

| Place | The trap | The rule |
|---|---|---|
| Home | A "family member" texts from a new number: phone broke, send money today, don't call | If "family" messages from a new number asking for money, call their old number first. |
| Café | A QR sticker on the table asks for your card number and PIN | Check where a QR code takes you before you pay, and never type your PIN into a web page. |
| Phone repair | "3 viruses found, call support, install our app, pay for cleaning" | Real warnings never ask you to call a number or install an app to "fix" your phone. |
| Tax office | "You owe tax. Pay in gift cards today or police come tonight" | Government offices never ask for gift cards or crypto, and never threaten arrest on the phone. |
| Rental office | A cheap room, the owner is abroad, send the deposit to get the keys | Never pay a deposit before you have seen the place and met the owner in person. |
| Shop | Branded shoes 80% off, bank transfer only | If a deal looks too good and they only take bank transfer, it is a trap. |

   From payday 3, a seeded mix of five from all eleven places glows. A third real message, a parcel update with no link and no fee, arrives on payday 2.

**The phone's Scam Checker** is a guided checklist, not a keyword score: does it ask for a code or PIN, rush you, contact you first, want an upfront fee, promise guaranteed money? It always ends with "Verify through an official number or website" and says it can miss new scams. Anything you paste is never stored.

**Demo mode** (long-press the coin on the title, or Settings): one character, starting at the bank door, so the first scam is a few seconds away. See [docs/DEMO.md](docs/DEMO.md).

## How it is built

- **Vite + React 18 + TypeScript (strict)**, Tailwind, Framer Motion, Zustand (UI state only), Vitest, vite-plugin-pwa, NumberFlow. No backend, no login, no network calls, no API keys.
- **The money is in an engine, not the UI.** `src/engine/scamTown.ts` books payday and every scam loss as balanced double-entry postings (Wallet, Income, ScamLoss), computes the Scam Immunity Score, and shuffles choices with a seeded random generator (never `Math.random`). Only the first answer per encounter counts, so practice replays never change your balance.
- **Content is data.** The eleven traps, their three choices, losses (as shares of the character's pay), rule cards and the three real messages are in `src/content/scamTown.ts`; local pay and prices per currency in `src/content/economy.ts`; characters in `src/content/characters.ts`; all text in `src/i18n/en.ts`.
- **The paths work.** `scripts/build-collision.py` reads the team's map into a 4-pixel walk grid (fences, trees, buildings, stalls and water blocked; roads, grass and the plaza open). `scripts/build-district.py` builds the south district from tiles with its own blocked tiles. The walker's whole foot box is checked, and they slide around posts and door frames toward gaps.
- **The earlier budgeting game is still in the code, switched off.** `src/config/features.ts` has `FEATURES.budgeting = false`. Setting it to `true` brings back the Money Calendar, forecast, Plan Your Week, Gap Bridge, Twin Wallets, Town Mode, Fix My Dates, Impact Lab, energy and hearts, with their engine (`simulate()`) and tests untouched.
- **181 tests** (`npm test`): the Scam Town ledger, rounds and score, practice replays, local pay (no rupee pay reaches a lakh), every message filling its placeholders in every currency, collision (fences block, the gate opens, every door reachable on foot), editable names, no brand or local names in the scam text, the Scam Checker (always says verify, stores nothing), the currency helper, and every test of the budgeting engine.

## Tools, libraries and assets

**Tools we used**

| Tool | What for |
|---|---|
| Claude Code (Anthropic) | AI pair-programmer under our direction (see "How we built it") |
| Node.js 20, npm | Running, testing and building the app |
| Vite, React, TypeScript, Tailwind | The app itself (versions below) |
| Vitest | 181 automated tests |
| Python 3 + Pillow | Our asset scripts: recolouring the vendor art (`scripts/unify-assets.py`), building the walk grid from the town map (`scripts/build-collision.py`), building the south district from tiles (`scripts/build-district.py`) |
| Headless Chromium | Scripted playtests and the screenshots in this README |
| Git, GitHub, GitHub Actions, GitHub Pages | Version control, CI (typecheck, tests, build) and the live site |

**Runtime libraries** (shipped in the app)

| Library | Version | License | Used for |
|---|---|---|---|
| react, react-dom | 18.3.1 | MIT | UI |
| zustand | 5.0.15 | MIT | UI state and saved games |
| framer-motion | 11.18.2 | MIT | Transitions and sheets |
| @number-flow/react | 0.5.14 | MIT | Animated balance |
| @use-gesture/react | 10.3.1 | MIT | Pinch-zoom on the old town map, swipeable cards (budgeting mode) |
| d3-delaunay | 6.0.4 | ISC | Ward shapes in the old Town Mode (budgeting mode) |
| zzfx | 1.4.0 | MIT | Sound effects, generated in code |
| canvas-confetti | 1.9.4 | ISC | Celebration when you score Scam-proof |
| @fontsource/nunito | 5.3.0 | OFL-1.1 | Font package (see Fonts) |
| @fontsource/silkscreen | 5.3.0 | OFL-1.1 | Font package (see Fonts) |
| @fontsource/pixelify-sans | 5.3.0 | OFL-1.1 | Font package (see Fonts) |
| pixelarticons | 2.4.1 | MIT | Pixel UI icons (only the ~30 we use are bundled) |

**Development tools** (not shipped)

| Tool | Version | License |
|---|---|---|
| vite | 5.4.21 | MIT |
| vite-plugin-pwa | 0.20.5 | MIT |
| @vitejs/plugin-react | 4.7.0 | MIT |
| typescript | 5.6.3 | Apache-2.0 |
| vitest | 2.1.9 | MIT |
| tailwindcss | 3.4.19 | MIT |
| postcss | 8.5.28 | MIT |
| autoprefixer | 10.6.1 | MIT |
| @types/react, @types/react-dom, @types/node, @types/canvas-confetti, @types/d3-delaunay | various | MIT |

**Fonts.** All are bundled through @fontsource and work offline. None are loaded from the internet.

| Font | License | Used for |
|---|---|---|
| Nunito | SIL Open Font License 1.1 | Body text, money, dates |
| Silkscreen | SIL Open Font License 1.1 | Pixel headings and buttons |
| Pixelify Sans | SIL Open Font License 1.1 | Pixel accents |

**Pre-made asset packs.** Originals and their licence files are in `public/assets/vendor/`. `scripts/unify-assets.py` recolours them into the game's single palette (`src/ui/palette.ts`) and adds the same ink outline as the rest of the art. The style guide at `/styleguide` shows every result.

| Pack | Author | Licence | What we use |
|---|---|---|---|
| [Pixel UI Pack](https://kenney.nl/assets/pixel-ui-pack) | Kenney | CC0 1.0 | Nine-slice panels and buttons, recoloured |
| [Tiny Town](https://kenney.nl/assets/tiny-town) | Kenney | CC0 1.0 | 16×16 town tiles, recoloured. Weapon, tool and explosive tiles were left out (list in `public/assets/vendor/README.md`) |
| [pixelarticons](https://github.com/halfmage/pixelarticons) | Gerrit Halfmann | MIT | UI icons |

CC0 needs no credit, but we credit Kenney anyway. We used no other stock images or third-party sprites.

**Our own art.**

| Asset | Made by | Where |
|---|---|---|
| Town map | Our team, during the event | `public/sprites/town-map.png`, `design/town-map-concept.png` |
| UI/UX screen designs, including the character select | Our team, during the event | `design/`, `docs/UI_NOTES.md` |
| Character portraits, walking sprites, scammers and world props | Code-drawn placeholders (`placeholder_*`), made with Claude Code to our art direction; to be replaced by team sprites | `src/ui/pixel/`, list in `docs/SPRITES_NEEDED.md` |
| App icon (coin, S and shield) | Drawn in SVG with Claude Code | `public/icon.svg` and PNG exports |
| Sound effects | Generated in code with ZzFX | `src/audio/sfx.ts` |
| Emoji | The device's own system emoji, not bundled | — |

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest engine tests
npm run typecheck
npm run build && npm run preview
```

Long-press the coin on the title screen for **demo mode**: one character, straight to the bank door. The live site at https://sorenhgautam-dev.github.io/team-sol-ullens-hackathon/ is built from `main` and still shows the earlier budgeting game until this branch is merged.

## Honest notes

- All people, messages, phone numbers and links in the game are made up. Links use the reserved `.example` domain.
- Pay and prices are typical local figures chosen for the game, not data. Nothing in the scam game is converted between currencies.
- The game teaches eleven common patterns. Real scams change; the Scam Checker says so and always points to verifying through an official number or website.
- It is a game about scams, not financial advice. Nothing you type leaves the phone.
