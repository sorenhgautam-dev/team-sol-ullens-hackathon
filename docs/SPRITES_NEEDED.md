# Sprites needed (placeholders currently in use)

All sprites are PNG sheets with frames laid out horizontally, drawn at the internal pixel size below (the game scales by whole numbers and renders `image-rendering: pixelated`). Transparent background, 1 px dark outline, shared palette (dusk navy, cream, marigold, terracotta, sage, sky, danger red). No weapons or prohibited items (Section 3b).

| Placeholder | File to add | Size per frame | Frames | Used in |
|---|---|---|---|---|
| placeholder_sita | `public/sprites/sita.png` | 16×28 | idle 2 · phone 2 · worried 2 · happy 2 | Life scene, battle stage |
| placeholder_scammer (per scammer) | `public/sprites/scammer_<id>.png` | 16×28 | idle 2 · taunt 2 · lunge 2 · hit 1 · flee 2 · dissolve 4 | Battle stage. ids: phisher, loan_shark, impersonator, otp_snatcher, fine_print, prize_ghost, job_recruiter, investment_guru |
| placeholder_street | `public/sprites/street.png` | 180×100 | 1 (+ optional 2-frame window flicker) | Battle stage backdrop |
| placeholder_room | `public/sprites/room.png` | 180×72 | 1 | Life scene (Sita's lane and room front) |
| placeholder_skyline | `public/sprites/skyline_{far,mid,near}.png` | 390×260 each | 1 | Title parallax |
| placeholder_town_map | `public/sprites/town-map.png` | 586×1046 (the team's map) | 1 | Town Mode (**missing in the repo, re-add**) |
| placeholder_stamp | `public/sprites/stamps.png` | 48×16 | VERIFY, BLOCKED, WAIT, ASKED, REAL, DEPLOYED | Battle stage, town map |
| placeholder_coin | `public/sprites/coin.png` | 6×6 | spin 4 | Coin bursts |
| pixel UI frame | `public/sprites/frame.png` | 24×24 (9-slice, 8 px corners) | 1 | Panels, buttons, sheets (currently CSS box-shadow frames) |
| ward state badges | `public/sprites/badges.png` | 24×12 | SAFE, WARNING, CRISIS | Town map |

Suggested order: Sita → the Phisher and the Loan Shark App → stamps → the town map → the rest.
