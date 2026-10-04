# AI usage disclosure

This project was built with Claude Code (Claude) as an AI coding assistant. Every commit it made carries a `Co-Authored-By: Claude` trailer; attribution has never been removed.

## Team
- Concept, game design, content direction and tone (CLAUDE.md).
- The town map pixel art, UI/UX designs (`design/`) including the character-select mockup, user testing, pitch and demo.
- The scam-awareness spec: the five core traps and their rules, real messages mixed in, results tiers, Family Warning Card, Scam Checker.
- Decisions during the build: English-only text, realistic local pay with no currency conversion, each character's own everyday scams, a shuffled order, the gauntlet loop, fences and working paths, tap to walk, editable names, the name Scam Town, a wider view, more realistic sprites, commit size rules, what to cut.

## Built together
- **The engine:** Soren and Rayan worked on it with Claude Code; its rules come from the team's spec (losses booked to ScamLoss, safe 20 / close call 10 / fell for it 0, three tiers). Claude Code wrote the current code (`src/engine/scamTown.ts`).
- **The scam encounters beyond the first five:** the team asked for everyday scams for each character, set the direction (scams that really happen, not dramatic ones) and playtested them; Claude Code drafted the scenarios and wording.
- **Local pay per currency:** the team set the rule (typical local pay, no currency conversion, no one paid lakhs) and tested it; Claude Code picked the figures.
- **The walk grid, south district and people scripts:** the team asked for working paths and fences, a bigger map with more buildings, a district that matches their map, and more realistic sprites, and tested each one; Claude Code wrote the scripts. The district is painted with the team's own map art (grass, cobblestones, trees).
- **Later features from the team's specs:** rent and food stakes with a win/lose screen, the real/scam mix, the decision record and tips, Main Street money choices, the budget calculator and the movement fixes; the team wrote the specs and tested them, Claude Code built them.
- **Character select:** the team designed the mockup and the editable names; Claude Code built the screen.
- **App icon:** the team named the game Scam Town; Claude Code drew the icon.

## Claude Code
- Code implementation: content data files, UI, state, PWA setup, and the engine code together with the team (above).
- Tests (Vitest), refactoring, animation and effect code, placeholder art (the people, portraits, cues and reveal scene), CI and Pages workflows.
- Documentation drafts: README, this file, docs/UI_NOTES.md, docs/SPRITES_NEEDED.md, docs/DEMO.md.

## Reviewed by the team (fill in)
- [ ] The scam encounters, their losses and rule cards (`src/content/scamTown.ts`, `town.*` strings)
- [ ] Local pay and prices per currency (`src/content/economy.ts`)
- [ ] The ledger and the Scam Immunity Score (`src/engine/scamTown.ts`, tests)
- [ ] The Scam Checker questions and result wording (`src/content/checker.ts`, `checker.*` strings)
- [ ] Paths and fences in the town (`scripts/build-collision.py`, `src/walk/`)

Updated 2026-10-04.
