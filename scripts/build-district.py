#!/usr/bin/env python3
"""
Build the south district (the gauntlet loop) below the team's map, painted to match it.

The ground is the team's own grass and cobblestone, cut from public/sprites/town-map.png and laid
on the map's faint grid, so the join can't be seen. The trees and bushes are cut from the map too.
Buildings, fences, the well and the sign are Kenney Tiny Town tiles (CC0, recoloured in
src/assets/pixel/tiles.png), warmed to the map's colours and lit from the top-left like it.

Output: src/assets/pixel/district.png (the painted district) and src/walk/district.ts (a blocked
flag per tile and the door spot of each building). Run: python3 scripts/build-district.py [--preview DIR]
"""
import pathlib, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src/walk/district.ts'
ART = ROOT / 'src/assets/pixel/district.png'
TILES = ROOT / 'src/assets/pixel/tiles.png'
MAP = ROOT / 'public/sprites/town-map.png'
TOP = 537           # y where the district starts (bottom of the team's map)
COLS, ROWS, T = 19, 36, 16
W, H = COLS * T, ROWS * T
FENCE_H = {'l': 80, 'm': 81, 'r': 82}
FENCE_V = {'t': 47, 'm': 59, 'b': 71}
# Trees and bushes on the team's map (x0, y0, x1, y1), cut out by colour.
CUTS = {'tree': [(104, 488, 140, 530), (246, 492, 282, 530)], 'bush': [(170, 496, 208, 532)]}

roads = [[False] * COLS for _ in range(ROWS)]
objects = [[-1] * COLS for _ in range(ROWS)]
blocked = [[False] * COLS for _ in range(ROWS)]
trees = []  # (kind, variant, x centre, y bottom) in district pixels
doors = {}
signs = {}  # buildings just for show: a name sign, no way in


def road(c0, r0, c1, r1):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            roads[r][c] = True


def put(c, r, tile, solid=True):
    objects[r][c] = tile
    blocked[r][c] = solid


def tree(x, y, kind='tree'):
    """A tree from the team's map standing at (x, y); its trunk blocks the two tiles above y."""
    trees.append((kind, len(trees) % len(CUTS[kind]), x, y))
    for r in ((y - 1) // T, (y - 1) // T - 1):
        blocked[r][x // T] = True


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


# The loop: the town's road comes down into a ring road with two cross streets, and a small
# square with a well where the middle street crosses them.
road(8, 0, 9, 3)
road(2, 3, 16, 3)
road(2, 17, 16, 17)
road(2, 3, 2, 17)
road(16, 3, 16, 17)
road(3, 7, 15, 7)
road(3, 14, 15, 14)
road(9, 7, 9, 14)
road(8, 9, 10, 11)
put(9, 10, 104)

building('tech', 3, 0, 3, 'red', 'stone')
building('gov', 4, 4, 4, 'grey', 'stone')
building('rental', 11, 4, 3, 'red', 'wood')
building('shop', 4, 11, 4, 'red', 'stone')
building('cafe', 11, 11, 3, 'grey', 'wood')
put(15, 0, 83)                       # a sign by the road

# Trees line the edges, bushes fill the blocks between the cross streets.
for x, y in [(14, 44), (14, 122), (14, 200), (14, 270), (290, 44), (290, 122), (290, 200), (290, 270), (110, 44), (204, 44)]:
    tree(x, y)
for x, y in [(88, 172), (200, 172)]:
    tree(x, y, 'bush')

# Main Street, south of the loop: a road down from the loop, two streets and buildings just for show.
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
# Back gardens behind Main Street, a hedged park in the middle, and an orchard past the fence.
fence_row(3, 7, 19)
fence_row(11, 15, 19)
tree(24, 334)
tree(280, 334)
for x, y in [(126, 432), (126, 474), (178, 432), (178, 474)]:
    tree(x, y, 'bush')
fence_row(2, 7, 31)
fence_row(11, 16, 31)
for x, y in [(40, 540), (104, 540), (200, 540), (264, 540), (14, 576), (72, 576), (136, 576), (168, 576), (232, 576), (290, 576)]:
    tree(x, y)

# Doors must sit on open ground, and so must the spot in front of each show building.
for k, (c, r) in {**doors, **signs}.items():
    assert not blocked[r][c], k


def cut(mp, box):
    """A tree from the map: the patch around the centre that isn't grass, road or path, holes filled."""
    a = mp[box[1]:box[3], box[0]:box[2]]
    r, g, b = (a[..., i].astype(int) for i in range(3))
    s = (r + g + b) / 3
    grass = (r > b + 25) & (g > r + 8) & (s > 76)
    stone = (abs(r - g) < 22) & (abs(g - b) < 26) & (s > 95)
    keep = ~grass & ~stone & ~((r > g + 10) & (s > 110)) & ~(b > r + 60)
    h, w = keep.shape
    comp = np.zeros_like(keep)
    q = deque([(w // 2, h // 2)])
    while q:
        x, y = q.popleft()
        if 0 <= x < w and 0 <= y < h and keep[y, x] and not comp[y, x]:
            comp[y, x] = True
            q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    out = np.zeros((h, w), bool)
    q = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    while q:
        x, y = q.popleft()
        if 0 <= x < w and 0 <= y < h and not comp[y, x] and not out[y, x]:
            out[y, x] = True
            q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    rgba = np.dstack([a, np.where(out, 0, 255).astype(np.uint8)])
    im = Image.fromarray(rgba, 'RGBA')
    return im.crop(im.getbbox())


def grid_lines(mp, axis):
    """Where the map's faint grid lines are along one axis (grass is darker on the line)."""
    v = mp.sum(axis=2).astype(float)
    r, g, b = (mp[..., i].astype(int) for i in range(3))
    grass = (g > r + 8) & (r > b + 15)
    if axis == 'y':
        v, grass = v.T, grass.T
    ok = grass[:, :-2] & grass[:, 1:-1] & grass[:, 2:]
    d = np.where(ok, (v[:, :-2] + v[:, 2:]) / 2 - v[:, 1:-1], 0).sum(0) / np.maximum(ok.sum(0), 1)
    score = np.concatenate([[0], d, [0]])
    peaks = [i for i in range(3, len(score) - 3) if score[i] == score[i - 3:i + 4].max() and score[i] > score.max() * 0.35]
    # Lines hidden under buildings and roads: split each long gap evenly, then carry on to the edges.
    out = [peaks[0]]
    for a, b in zip(peaks, peaks[1:]):
        n = max(1, round((b - a) / 17.6))
        out += [round(a + (b - a) * k / n) for k in range(1, n + 1)]
    step = float(np.median(np.diff(out)))
    while out[0] - step > 0:
        out.insert(0, round(out[0] - step))
    while out[-1] + step < len(score):
        out.append(round(out[-1] + step))
    return out


def paint():
    mp = np.asarray(Image.open(MAP).convert('RGB'))
    mh, mw, _ = mp.shape
    cols, rows = grid_lines(mp, 'x'), grid_lines(mp, 'y')
    r, g, b = (mp[..., i].astype(int) for i in range(3))
    s = (r + g + b) / 3
    is_grass = (g > r + 8) & (g > b + 8)
    is_stone = (abs(r - g) < 22) & (abs(g - b) < 26) & (s > 95) & (s < 170)
    # Clean cells of the map's grid (inside the lines): the texture the district is painted with.
    src = {'grass': [], 'stone': []}
    for y0, y1 in zip(rows, rows[1:]):
        for x0, x1 in zip(cols, cols[1:]):
            if not (14 <= y1 - y0 <= 21 and 14 <= x1 - x0 <= 21):
                continue
            box = (slice(y0 + 1, y1), slice(x0 + 1, x1))
            if (b[box] > g[box] + 10).any():   # the map's blue frame and water stay out
                continue
            if is_grass[box].mean() >= 0.93 and (s[box] < 70).mean() < 0.03:
                src['grass'].append(mp[box])
            elif is_stone[box].mean() >= 0.85 and s[box].mean() < 160:
                src['stone'].append(mp[box])
    # Plain grass only: no cells much darker or lighter than the map's usual grass.
    mid = np.median([c.mean() for c in src['grass']])
    src['grass'] = [c for c in src['grass'] if abs(c.mean() - mid) < mid * 0.07]
    print('texture cells: grass', len(src['grass']), 'stone', len(src['stone']))
    # The district's grid carries on from the map: same columns, rows at the map's spacing.
    step = float(np.median(np.diff(rows[-6:])))
    dy = [round(rows[-1] + step * k) - TOP for k in range(1, 60)]
    dy = [y for y in dy if y < H]
    dx = [x for x in cols if x < W]
    rng = np.random.default_rng(7)
    layers = {}
    for kind in ('grass', 'stone'):
        out = np.zeros((H, W, 3), float)
        ys = [-1] + dy + [H]
        xs = [-1] + dx + [W]
        for y0, y1 in zip(ys, ys[1:]):
            for x0, x1 in zip(xs, xs[1:]):
                cell = src[kind][rng.integers(len(src[kind]))]
                ch, cw, _ = cell.shape
                yy, xx = np.mgrid[max(y0 + 1, 0):y1, max(x0 + 1, 0):x1]
                out[yy, xx] = cell[(yy - y0 - 1) % ch, (xx - x0 - 1) % cw]
        for y in dy:
            out[y] = out[min(y + 1, H - 1)] * 0.85
        for x in dx:
            out[:, x] = out[:, min(x + 1, W - 1)] * 0.85
        layers[kind] = out
    # Roads: the tiles' layout with soft corners and a ragged edge, like the map's cobbles.
    mask = np.zeros((H, W), np.uint8)
    for rr in range(ROWS):
        for cc in range(COLS):
            if roads[rr][cc]:
                x0, x1 = (140, 162) if rr <= 2 and cc in (8, 9) else (cc * T, cc * T + T)
                mask[rr * T:rr * T + T, x0:x1] = 255
    soft = np.asarray(Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1.6)), float) / 255
    noise = np.asarray(Image.fromarray((rng.random((H // 3 + 1, W // 3 + 1)) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), float) / 255
    road = (soft + (noise - 0.5) * 0.45) > 0.5
    road[:3] = mask[:3] > 0                      # meet the map's road exactly
    ground = np.where(road[..., None], layers['stone'], layers['grass'])
    near = np.asarray(Image.fromarray((road * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    ground[near & ~road] *= 0.84                 # grass darkens where it meets the cobbles
    edge = road & ~(np.asarray(Image.fromarray((road * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))) > 0)
    ground[edge] *= 0.9
    art = Image.fromarray(np.clip(ground, 0, 255).astype(np.uint8)).convert('RGBA')
    # Kenney pieces, warmed to the map's colours, each with a soft shadow down and to the right.
    sheet = Image.open(TILES).convert('RGBA')
    shadows = Image.new('RGBA', (W, H))
    pieces = Image.new('RGBA', (W, H))
    for rr in range(ROWS):
        for cc in range(COLS):
            o = objects[rr][cc]
            if o < 0:
                continue
            t = np.asarray(sheet.crop(((o % 12) * T, (o // 12) * T, (o % 12) * T + T, (o // 12) * T + T)), float)
            green = (t[..., 1] > t[..., 0]) & (t[..., 1] > t[..., 2])
            t[..., :3] *= np.where(green[..., None], [0.96, 0.79, 0.64], [0.88, 0.8, 0.7])
            tile = Image.fromarray(t.astype(np.uint8), 'RGBA')
            pieces.alpha_composite(tile, (cc * T, rr * T))
            sh = np.zeros((T, T, 4), np.uint8)
            sh[..., :3] = (30, 20, 10)
            sh[..., 3] = (t[..., 3] > 0) * 82
            shadows.alpha_composite(Image.fromarray(sh, 'RGBA'), (cc * T + 3, rr * T + 3))
    art.alpha_composite(shadows)
    art.alpha_composite(pieces)
    sprites = {k: [cut(mp, bx) for bx in v] for k, v in CUTS.items()}
    for kind, v, x, y in sorted(trees, key=lambda t: t[3]):
        sp = sprites[kind][v]
        layer = Image.new('RGBA', (W, H))
        layer.paste(sp, (x - sp.width // 2, y - sp.height))
        art.alpha_composite(layer)
    art.convert('RGB').save(ART, optimize=True)
    return art


def main():
    blk_s = ',\n'.join("  '" + ''.join('#' if b else '.' for b in row) + "'" for row in blocked)
    doors_s = ',\n'.join(f"  {k}: {{ x: {c * T + T // 2}, y: {TOP + r * T + T // 2} }}" for k, (c, r) in doors.items())
    signs_s = ',\n'.join(f"  {k}: {{ x: {c * T + T // 2}, y: {TOP + r * T + T // 2} }}" for k, (c, r) in signs.items())
    OUT.write_text(
        '/**\n * Generated by scripts/build-district.py. The south district (the gauntlet loop), painted in\n'
        ' * src/assets/pixel/district.png. Edit the script, not this file.\n */\n'
        f'export const DISTRICT_TOP = {TOP}\nexport const DISTRICT_COLS = {COLS}\nexport const DISTRICT_ROWS = {ROWS}\nexport const TILE = {T}\n'
        f'export const DISTRICT_BLOCKED: readonly string[] = [\n{blk_s},\n]\n'
        f'/** Where to stand to go in (the tile in front of each door). */\nexport const DISTRICT_DOORS = {{\n{doors_s},\n}} as const\n'
        f'/** Buildings just for show on Main Street: the spot in front of each, where its name sign goes. */\nexport const DISTRICT_SIGNS = {{\n{signs_s},\n}} as const\n'
    )
    art = paint()
    print('wrote', OUT.relative_to(ROOT), 'and', ART.relative_to(ROOT))
    if '--preview' in sys.argv:
        d = pathlib.Path(sys.argv[sys.argv.index('--preview') + 1])
        top = Image.open(MAP).convert('RGBA').crop((0, TOP - 120, W, TOP))
        im = Image.new('RGBA', (W, H + 120))
        im.paste(top, (0, 0))
        im.paste(art, (0, 120))
        dr = ImageDraw.Draw(im)
        for k, (c, r) in {**doors, **signs}.items():
            dr.rectangle([c * T + 5, 120 + r * T + 5, c * T + 10, 120 + r * T + 10], outline=(255, 0, 255, 255))
        im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(d / 'district.png')


if __name__ == '__main__':
    main()
