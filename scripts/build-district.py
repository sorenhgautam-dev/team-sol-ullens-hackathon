#!/usr/bin/env python3
"""
Build the south district (the gauntlet loop) from Kenney Tiny Town tiles (CC0, recoloured
in src/assets/pixel/tiles.png). It joins the team's map where its road runs off the bottom.

Output: src/walk/district.ts with two tile layers (ground, objects), a blocked flag per tile,
and the door spot of each new building. Run: python3 scripts/build-district.py [--preview DIR]
"""
import pathlib, random, sys
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src/walk/district.ts'
TILES = ROOT / 'src/assets/pixel/tiles.png'
TOP = 537           # y where the district starts (bottom of the team's map)
COLS, ROWS, T = 19, 36, 16
LOOP_ROWS = 22       # the gauntlet loop; below it, Main Street (buildings just for show)
GRASS, GRASS2, FLOWERS, ROAD = 0, 1, 2, 25
# Autumn trees: the green ones share the grass colour after recolouring.
TREES = [3, 15, 27, 3]
FENCE_H = {'l': 80, 'm': 81, 'r': 82}
FENCE_V = {'t': 47, 'm': 59, 'b': 71}

random.seed(7)
ground = [[random.choice([GRASS] * 6 + [GRASS2, FLOWERS]) for _ in range(COLS)] for _ in range(LOOP_ROWS)]
_south = random.Random(11)  # its own generator, so the loop above stays exactly as it was
ground += [[_south.choice([GRASS] * 6 + [GRASS2, FLOWERS]) for _ in range(COLS)] for _ in range(ROWS - LOOP_ROWS)]
objects = [[-1] * COLS for _ in range(ROWS)]
blocked = [[False] * COLS for _ in range(ROWS)]
doors = {}
signs = {}  # buildings just for show: a name sign, no way in


def road(c0, r0, c1, r1):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            ground[r][c] = ROAD


def put(c, r, tile, solid=True):
    objects[r][c] = tile
    blocked[r][c] = solid


def building(key, c, r, width, roof, wall, show=False):
    """A house: two roof rows and a wall row with the door in the middle. Door spot is the tile below."""
    grey = roof == 'grey'
    top = [48, 49, 50] if grey else [52, 53, 54]
    mid = [60, 63, 62] if grey else [64, 67, 66]
    wood = wall == 'wood'
    left, plain, right, door, window = (72, 73, 75, 85, 84) if wood else (76, 77, 79, 89, 88)
    dc = c + width // 2
    for i in range(width):
        x = c + i
        put(x, r, top[0] if i == 0 else top[2] if i == width - 1 else top[1])
        put(x, r + 1, mid[0] if i == 0 else mid[2] if i == width - 1 else (mid[1] if x == dc else (61 if grey else 65)))
        put(x, r + 2, door if x == dc else (left if i == 0 else right if i == width - 1 else window))
    (signs if show else doors)[key] = (dc, r + 3)


def fence_row(c0, c1, r):
    for c in range(c0, c1 + 1):
        put(c, r, FENCE_H['l'] if c == c0 else FENCE_H['r'] if c == c1 else FENCE_H['m'])


def fence_col(c, r0, r1):
    for r in range(r0, r1 + 1):
        put(c, r, FENCE_V['t'] if r == r0 else FENCE_V['b'] if r == r1 else FENCE_V['m'])


# The loop: entry from the town road, then a ring road with two cross streets.
road(8, 0, 9, 3)
road(2, 3, 16, 3)
road(2, 17, 16, 17)
road(2, 3, 2, 17)
road(16, 3, 16, 17)
road(3, 7, 15, 7)
road(3, 14, 15, 14)
road(9, 7, 9, 14)

building('tech', 3, 0, 3, 'red', 'stone')
building('gov', 4, 4, 4, 'grey', 'stone')
building('rental', 11, 4, 3, 'red', 'wood')
building('shop', 4, 11, 4, 'red', 'stone')
building('cafe', 11, 11, 3, 'grey', 'wood')

# Gardens and trees: decoration that still blocks.
for c, r in [(0, 0), (1, 1), (17, 0), (18, 1), (0, 5), (0, 9), (18, 6), (18, 11), (0, 14), (18, 15), (6, 9), (12, 9), (7, 16), (11, 16), (1, 20), (5, 20), (13, 20), (17, 20)]:
    put(c, r, random.choice(TREES))
put(9, 10, 104)                      # the well in the middle of the loop
put(8, 10, 107)
put(10, 10, 130)
fence_row(3, 7, 19)
fence_row(11, 15, 19)
fence_col(0, 16, 18)
fence_col(18, 16, 19)
put(15, 0, 83)                       # a sign by the road
put(14, 1, 29)

# Main Street, south of the loop: a road down from the loop, two streets and buildings just for show.
_trees = random.Random(13)
road(8, 18, 9, 24)
road(1, 24, 17, 24)
road(1, 24, 1, 30)
road(17, 24, 17, 30)
road(1, 30, 17, 30)
road(9, 24, 9, 30)
building('bakery', 1, 21, 3, 'red', 'wood', show=True)
building('clinic', 4, 21, 4, 'grey', 'stone', show=True)
building('library', 11, 21, 4, 'grey', 'stone', show=True)
building('hotel', 15, 21, 3, 'red', 'stone', show=True)
building('school', 2, 27, 5, 'red', 'stone', show=True)
building('pharmacy', 12, 27, 4, 'grey', 'wood', show=True)
# A small park between them, and a tree line along the south edge.
for c, r in [(7, 26), (7, 28), (11, 26), (16, 26), (3, 32), (6, 33), (10, 32), (13, 33), (16, 32), (0, 34), (18, 34), (8, 35), (1, 26), (1, 33)]:
    put(c, r, _trees.choice(TREES))
put(10, 28, 104)                     # a well in the park
fence_row(2, 7, 31)
fence_row(11, 16, 31)

# Doors must sit on open ground, and so must the spot in front of each show building.
for k, (c, r) in {**doors, **signs}.items():
    assert not blocked[r][c], k


def main():
    ground_s = ',\n'.join('  [' + ', '.join(str(v) for v in row) + ']' for row in ground)
    obj_s = ',\n'.join('  [' + ', '.join(str(v) for v in row) + ']' for row in objects)
    blk_s = ',\n'.join("  '" + ''.join('#' if b else '.' for b in row) + "'" for row in blocked)
    doors_s = ',\n'.join(f"  {k}: {{ x: {c * T + T // 2}, y: {TOP + r * T + T // 2} }}" for k, (c, r) in doors.items())
    signs_s = ',\n'.join(f"  {k}: {{ x: {c * T + T // 2}, y: {TOP + r * T + T // 2} }}" for k, (c, r) in signs.items())
    OUT.write_text(
        '/**\n * Generated by scripts/build-district.py. The south district (the gauntlet loop) built from\n'
        ' * Kenney Tiny Town tiles (CC0, recoloured). Edit the script, not this file.\n */\n'
        f'export const DISTRICT_TOP = {TOP}\nexport const DISTRICT_COLS = {COLS}\nexport const DISTRICT_ROWS = {ROWS}\nexport const TILE = {T}\n'
        f'export const DISTRICT_GROUND: readonly (readonly number[])[] = [\n{ground_s},\n]\n'
        f'/** -1 = nothing on top of the ground. */\nexport const DISTRICT_OBJECTS: readonly (readonly number[])[] = [\n{obj_s},\n]\n'
        f'export const DISTRICT_BLOCKED: readonly string[] = [\n{blk_s},\n]\n'
        f'/** Where to stand to go in (the tile in front of each door). */\nexport const DISTRICT_DOORS = {{\n{doors_s},\n}} as const\n'
        f'/** Buildings just for show on Main Street: the spot in front of each, where its name sign goes. */\nexport const DISTRICT_SIGNS = {{\n{signs_s},\n}} as const\n'
    )
    print('wrote', OUT.relative_to(ROOT))
    if '--preview' in sys.argv:
        d = pathlib.Path(sys.argv[sys.argv.index('--preview') + 1])
        sheet = Image.open(TILES).convert('RGBA')
        tile = lambda i: sheet.crop(((i % 12) * 16, (i // 12) * 16, (i % 12) * 16 + 16, (i // 12) * 16 + 16))
        im = Image.new('RGBA', (COLS * T, ROWS * T))
        for r in range(ROWS):
            for c in range(COLS):
                im.alpha_composite(tile(ground[r][c]), (c * T, r * T))
                if objects[r][c] >= 0:
                    im.alpha_composite(tile(objects[r][c]), (c * T, r * T))
        dr = ImageDraw.Draw(im)
        for k, (c, r) in {**doors, **signs}.items():
            dr.rectangle([c * T + 5, r * T + 5, c * T + 10, r * T + 10], outline=(255, 0, 255, 255))
        im.resize((COLS * T * 2, ROWS * T * 2), Image.NEAREST).save(d / 'district.png')


if __name__ == '__main__':
    main()
