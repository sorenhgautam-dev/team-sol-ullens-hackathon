# Sprites needed (placeholders currently in use)

The art below is drawn in code as placeholders. Team sprites can replace any of it: PNG sheets with frames laid out horizontally, drawn at the pixel size below (the game scales by whole numbers with `image-rendering: pixelated`), transparent background, soft dark-brown outline, the shared palette in `src/ui/palette.ts`. No weapons or prohibited items (see CLAUDE.md, code of conduct).

| Placeholder | Where it is drawn now | Size per frame | Frames | Used in |
|---|---|---|---|---|
| placeholder_people | `scripts/build-people.py` → `src/ui/pixel/people.ts` | 16×24 | 4 facings × 4 walk frames; hairstyles short, long, cap, bun; shirt or kurta | The town: the player, townsfolk, the kiosk stranger |
| placeholder_portraits | `src/ui/pixel/portraits.ts` | 32×32 | 1 per character | Character select, town header, the thought screen |
| placeholder_cues | `src/ui/pixel/cues.ts` | 12×9 desk phone, 7×11 phone, 11×8 letter, 9×9 QR, 9×8 warning | phone ring 2 | The cue above the building whose scam is next |
| placeholder_reveal | `src/ui/pixel/sprites.ts` | player 16×28, scammer 16×28 (one colour each), street 180×100 | idle, lunge, hit, flee, dissolve | "Who was it really?" reveal scene |
| placeholder_stamps | `src/ui/pixel/sprites.ts` | 48×16 | VERIFY, SCAMMED, CLOSE CALL | Reveal scene |
| team town map | `public/sprites/town-map.png` | 305×537 | 1 | The town. Collision comes from `scripts/build-collision.py`; doors live in `src/walk/map.ts` |

Suggested order: the people → the portraits → the reveal scene → the cues.
