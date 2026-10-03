# AI usage disclosure

This project was built with Claude Code (Claude) as an AI coding assistant. Every commit it made carries a `Co-Authored-By: Claude` trailer; history was reorganised into small commits but attribution was never removed.

## Team
- Concept, game design, the financial scenario and its exact numbers (CLAUDE.md), content direction and tone.
- Pixel art and sprites, UI/UX designs (`design/`), user testing, pitch and demo.
- Decisions during the build: English-only text, commit size rules, what to cut.

## Claude Code
- Code implementation: engine, content data files, UI, state, workers, PWA setup.
- Tests (Vitest), refactoring, animation and effect code, placeholder art, CI and Pages workflows.
- Documentation drafts: README, this file, docs/ASSESSMENT.md, docs/UI_NOTES.md, docs/AUDIT.md.
- Upgrade-brief pass: walkable village, cash-flow strip, consequence cards, parchment art direction, Impact Lab rewrite.
- Scam-awareness pivot: Payday Town, encounter screens, Scam Town engine, Scam Checker, results and Family Warning Card; budgeting hidden behind a flag.

## Reviewed by the team (fill in)
- [ ] Engine daily order and the Section 3 numbers (`src/engine/simulate.ts`, tests)
- [ ] Gap Bridge costs and hidden costs (`src/content/bridges.ts`)
- [ ] Scam Squad content and tells (`src/content/enemies.ts`, `src/i18n/en.ts`)
- [ ] Shift Finder ranking (`src/engine/shiftFinder.ts`)
- [ ] Town Mode rules (`src/engine/town.ts`, `src/engine/spread.ts`)
- [ ] Impact Lab situations and their best answers (`src/content/impactQuestions.ts`)
- [ ] Consequence card wording (`src/engine/consequence.ts`, `conseq.*` strings)
- [ ] The five scam encounters, their losses and rule cards (`src/content/scamTown.ts`, `town.*` strings)

Updated after the upgrade-brief pass (2026-10-03).
