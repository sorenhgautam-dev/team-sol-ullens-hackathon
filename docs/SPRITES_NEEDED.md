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
| placeholder_sita_topdown | `public/sprites/sita_topdown.png` | 10×16 | down 4 · up 4 · left 4 · right 4 (walk cycles) + idle 1 each | Village (walkable town on the team's map) |
| placeholder_scammer_topdown (per scammer) | `public/sprites/scammer_topdown_<id>.png` | 12×18 | walk 4 · taunt 2 · hit 1 · dissolve 4 | Village: scammers walk over to Sita |
| placeholder_message | `public/sprites/message.png` | 12×11 | fly 1 · blocked 2 · stuck 1 | Village battle (the scammer's "messages") |
| placeholder_people | `scripts/build-people.py` (templates) | 16×24 | 4 facings × 4 walk frames, 4 hairstyles, shirt or kurta | Scam Town: the player, townsfolk and the kiosk stranger (`src/ui/pixel/people.ts`) |
| placeholder_cues | `public/sprites/cues.png` | 12×9 desk phone, 7×11 phone, 11×8 letter, 9×9 QR, 9×8 warning, 14×20 stranger | phone ring 2 · stranger wave 2 | Scam Town: the cue above the building whose scam is next (`src/ui/pixel/cues.ts`) |
| team town map | `public/sprites/town-map.png` | 305×537 (in the repo) | 1 (+ optional night variant with lit windows) | Village ground. Doors and collisions live in `src/walk/map.ts`; if the map changes, update the rectangles there |

Suggested order: Sita → the Phisher and the Loan Shark App → stamps → the town map → the rest.
