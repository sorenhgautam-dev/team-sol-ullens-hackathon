# Next Payday

**Survive payday.**

**Next Payday: walk through town on payday and survive five of the world's most common scams. Every trap teaches one rule that protects your money.**

A mobile game (installable PWA, fully offline, no account, no network calls) for anyone who gets paid, sends money home, sells things online or looks for work. It is global: amounts default to US dollars (switch to EUR, GBP, INR or NPR in Settings), senders are generic ("your bank", "a delivery company", "a payment app"), and no real brands appear.

| Title | Pick who you are | Payday Town | The call |
|---|---|---|---|
| ![title](docs/screenshots/paytown/1-title.png) | ![pick](docs/screenshots/paytown/2-pick.png) | ![town](docs/screenshots/paytown/3-town.png) | ![call](docs/screenshots/paytown/4-call.png) |

| What it cost | Who it really was | Rule card | Results |
|---|---|---|---|
| ![outcome](docs/screenshots/paytown/5-outcome.png) | ![reveal](docs/screenshots/paytown/6-reveal.png) | ![rule](docs/screenshots/paytown/7-rule-card.png) | ![results](docs/screenshots/paytown/8-results.png) |

## How a game goes

**Title → pick who you are → walk through town → face five scams → results.**

1. **Pick a character.** Sita sews at home while her husband sends money from abroad. Bikash delivers food on his bike. Aarav just got his first salary. Each one's messages use their name and their life: Sita waits for a parcel from her husband, Bikash is offered a "team leader" job.
2. **Payday.** You start in town with your pay. The HUD shows only who you are, your balance, "Scams faced X/5" and your phone.
3. **Five buildings glow.** Walk to them in any order:

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
8. **Results.** What you kept of your pay, your **Scam Immunity Score** (safe 20, close call 10, fell for it 0; 80–100 "Scam-proof", 50–70 "Getting wiser", under 50 "Easy target"), the five rule cards, and a **Family Warning Card** with all five rules and Share and Copy buttons.

**The phone's Scam Checker** is a guided checklist, not a keyword score: does it ask for a code or PIN, rush you, contact you first, want an upfront fee, promise guaranteed money? It always ends with "Verify through an official number or website" and says it can miss new scams. Anything you paste is never stored.

**Demo mode** (long-press the coin on the title, or Settings): one character, starting at the bank door, so the first scam is a few seconds away. See [docs/DEMO.md](docs/DEMO.md).

## How it is built

- **Vite + React 18 + TypeScript (strict)**, Tailwind, Framer Motion, Zustand (UI state only), Vitest, vite-plugin-pwa, NumberFlow. No backend, no login, no network calls, no API keys.
- **The money is in an engine, not the UI.** `src/engine/scamTown.ts` books payday and every scam loss as balanced double-entry postings (Wallet, Income, ScamLoss), computes the Scam Immunity Score, and shuffles choices with a seeded random generator (never `Math.random`). Only the first answer per encounter counts, so practice replays never change your balance.
- **Content is data.** The five traps, their three choices, losses, rule cards and the two real messages are in `src/content/scamTown.ts`; characters in `src/content/characters.ts`; all text in `src/i18n/en.ts`.
- **The earlier budgeting game is still in the code, switched off.** `src/config/features.ts` has `FEATURES.budgeting = false`. Setting it to `true` brings back the Money Calendar, forecast, Plan Your Week, Gap Bridge, Twin Wallets, Town Mode, Fix My Dates, Impact Lab, energy and hearts, with their engine (`simulate()`) and tests untouched.
- **166 tests** (`npm test`): the Scam Town ledger and score, practice replays, content completeness, no brand or local names in the scam text, the Scam Checker (always says verify, stores nothing), the currency helper, and every test of the budgeting engine.

## Tools, libraries and assets

**AI coding assistant.** We used **Claude Code** (Anthropic) to write code, tests, animation and effect code, placeholder art and documentation drafts. Every commit it helped with carries a `Co-Authored-By: Claude` trailer. See [docs/AI_USAGE.md](docs/AI_USAGE.md) for who did what.

**Runtime libraries** (shipped in the app)

| Library | Version | License | Used for |
|---|---|---|---|
| react, react-dom | 18.3.1 | MIT | UI |
| zustand | 5.0.15 | MIT | UI state and saved games |
| framer-motion | 11.18.2 | MIT | Transitions and sheets |
| @number-flow/react | 0.5.14 | MIT | Animated balance |
| @use-gesture/react | 10.3.1 | MIT | Swipeable event cards |
| d3-delaunay | 6.0.4 | ISC | Town Mode ward geometry |
| zzfx | 1.4.0 | MIT | Sound effects, generated in code |
| canvas-confetti | 1.9.4 | ISC | Celebration effect |
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
| UI/UX screen designs | Our team, during the event | `design/`, `docs/UI_NOTES.md` |
| Sita, the courier, scammers and world props | Code-drawn placeholders (`placeholder_*`) by Claude Code, to be replaced by team sprites | `src/ui/pixel/`, list in `docs/SPRITES_NEEDED.md` |
| App icons | Drawn in SVG by Claude Code | `public/icon.svg` and PNG exports |
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
- Amounts and currency conversions are illustrative, not live rates.
- The game teaches five common patterns. Real scams change; the Scam Checker says so and always points to verifying through an official number or website.
- It is a game about scams, not financial advice. Nothing you type leaves the phone.
