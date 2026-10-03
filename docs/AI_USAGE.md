# AI usage disclosure

This project was built with Claude Code (Claude) as an AI coding assistant. Every commit it made carries a `Co-Authored-By: Claude` trailer; attribution has never been removed.

## Team
- Concept, game design, content direction and tone (CLAUDE.md).
- The town map pixel art, UI/UX designs (`design/`) including the character-select mockup, user testing, pitch and demo.
- The scam-awareness spec: the five core traps and their rules, real messages mixed in, results tiers, Family Warning Card, Scam Checker.
- Decisions during the build: English-only text, realistic local pay with no currency conversion, each character's own everyday scams, a shuffled order, the gauntlet loop, fences and working paths, tap to walk, editable names, the name Scam Town, a wider view, more realistic sprites, commit size rules, what to cut.

## Claude Code
- Code implementation: engine, content data files, UI, state, PWA setup.
- Tests (Vitest), refactoring, animation and effect code, placeholder art (the people, portraits, cues and reveal scene), CI and Pages workflows.
- Documentation drafts: README, this file, docs/UI_NOTES.md, docs/SPRITES_NEEDED.md, docs/DEMO.md.
- The scam encounters beyond the team's first five and their wording, the local pay figures per currency, the walk grid, south district and people scripts, the character-select screen built from the team's mockup, the app icon.

## Reviewed by the team (fill in)
- [ ] The scam encounters, their losses and rule cards (`src/content/scamTown.ts`, `town.*` strings)
- [ ] Local pay and prices per currency (`src/content/economy.ts`)
- [ ] The ledger and the Scam Immunity Score (`src/engine/scamTown.ts`, tests)
- [ ] The Scam Checker questions and result wording (`src/content/checker.ts`, `checker.*` strings)
- [ ] Paths and fences in the town (`scripts/build-collision.py`, `src/walk/`)

Updated 2026-10-04.
