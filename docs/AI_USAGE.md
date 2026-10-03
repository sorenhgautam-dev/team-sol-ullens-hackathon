# AI usage disclosure

This project was built with Claude Code (Claude) as an AI coding assistant. Every commit it made carries a `Co-Authored-By: Claude` trailer; history was reorganised into small commits but attribution was never removed.

## Team
- Concept, game design, the financial scenario and its exact numbers (CLAUDE.md), content direction and tone.
- The town map pixel art, UI/UX designs (`design/`) including the character-select mockup, user testing, pitch and demo.
- The scam-awareness pivot spec: the five core traps and their rules, real messages mixed in, results tiers, Family Warning Card, Scam Checker.
- Decisions during the build: English-only text, realistic local pay with no currency conversion, more everyday traps, the gauntlet loop, fences and working paths, editable names, the name Scam Town, commit size rules, what to cut.

## Claude Code
- Code implementation: engine, content data files, UI, state, workers, PWA setup.
- Tests (Vitest), refactoring, animation and effect code, placeholder art, CI and Pages workflows.
- Documentation drafts: README, this file, docs/ASSESSMENT.md, docs/UI_NOTES.md, docs/AUDIT.md.
- Upgrade-brief pass: walkable village, cash-flow strip, consequence cards, parchment art direction, Impact Lab rewrite.
- Scam-awareness pivot (the game is now called Scam Town): the town, encounter screens, Scam Town engine, Scam Checker, results and Family Warning Card; budgeting hidden behind a flag.
- The six later traps and their wording, the local pay figures per currency, the walk grid and south district scripts, the character-select screen built from the team's mockup, the app icon.

## Reviewed by the team (fill in)
- [ ] Engine daily order and the Section 3 numbers (`src/engine/simulate.ts`, tests)
- [ ] Gap Bridge costs and hidden costs (`src/content/bridges.ts`)
- [ ] Scam Squad content and tells (`src/content/enemies.ts`, `src/i18n/en.ts`)
- [ ] Shift Finder ranking (`src/engine/shiftFinder.ts`)
- [ ] Town Mode rules (`src/engine/town.ts`, `src/engine/spread.ts`)
- [ ] Impact Lab situations and their best answers (`src/content/impactQuestions.ts`)
- [ ] Consequence card wording (`src/engine/consequence.ts`, `conseq.*` strings)
- [ ] The eleven scam encounters, their losses and rule cards (`src/content/scamTown.ts`, `town.*` strings)
- [ ] Local pay and prices per currency (`src/content/economy.ts`)

Updated after the Scam Town rename (2026-10-04).
