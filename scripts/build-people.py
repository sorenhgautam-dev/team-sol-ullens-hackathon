#!/usr/bin/env python3
"""
Hand-drawn pixel templates for the people walking around Scam Town (the player and the
townsfolk): 16x24, four facings, a four-frame walk, shaded from the top-left with soft
brown outlines so they sit in the team's painted map. Our own art (placeholder_people).

Letters are paint, not colours: each person's look fills them in (src/ui/pixel/people.ts).
  .  clear            o  outline
  h H d  hair, hair light, hair shadow
  s S    skin, skin shadow           e  eye        m  mouth
  c C k  clothes, light, shadow      t  trim
  p P    trousers, trousers shadow   f  shoes      F  shoe light
Output: src/ui/pixel/peopleArt.ts. Run: python3 scripts/build-people.py [--preview DIR]
"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src/ui/pixel/peopleArt.ts'
W, H = 16, 24


def r(col, pixels=''):
    """One row: `pixels` starting at column `col`, padded to the sprite width."""
    row = '.' * col + pixels
    assert len(row) <= W, (col, pixels)
    return row + '.' * (W - len(row))


# Heads (rows 0-9, ending with the neck), per hairstyle and facing.
HEADS = {
    'short': {
        'down': [r(6, 'oooo'), r(4, 'oohHhhoo'), r(3, 'ohHHhhhhdo'), r(3, 'ohHhhhhhdo'), r(3, 'ohhsssshdo'),
                 r(4, 'osssssSo'), r(4, 'osesseSo'), r(4, 'osesseSo'), r(4, 'ossmmSSo'), r(5, 'oSssSo')],
        'up': [r(6, 'oooo'), r(4, 'oohHhhoo'), r(3, 'ohHHhhhhdo'), r(3, 'ohHhhhhhdo'), r(3, 'ohhhhhhhdo'),
               r(3, 'ohhhhhhddo'), r(4, 'ohhhhddo'), r(4, 'odhhhddo'), r(4, 'osddddSo'), r(5, 'oSssSo')],
        'right': [r(6, 'ooooo'), r(4, 'oohHhhhoo'), r(3, 'ohHHhhhhhho'), r(3, 'ohHhhhhssdo'), r(3, 'ohhhhhsssSo'),
                  r(3, 'odhhhssssSo'), r(4, 'odhhssesSo'), r(4, 'oddhssesSo'), r(5, 'odsssmSo'), r(5, 'ooSssSo')],
    },
    'long': {
        'down': [r(6, 'oooo'), r(4, 'oohHhhoo'), r(3, 'ohHHhhhhdo'), r(3, 'ohHhhhhhdo'), r(3, 'ohhsssshdo'),
                 r(3, 'ohsssssSdo'), r(3, 'ohsesseSdo'), r(3, 'ohsesseSdo'), r(3, 'ohssmmSSdo'), r(3, 'ohdSssSddo')],
        'up': [r(6, 'oooo'), r(4, 'oohHhhoo'), r(3, 'ohHHhhhhdo'), r(3, 'ohHhhhhhdo'), r(3, 'ohhhhhhhdo'),
               r(3, 'ohhhhhhhdo'), r(3, 'ohhhhhhddo'), r(3, 'ohhhhhhddo'), r(3, 'odhhhhhddo'), r(4, 'oddhhddo')],
        'right': [r(6, 'ooooo'), r(4, 'oohHhhhoo'), r(3, 'ohHHhhhhhho'), r(3, 'ohHhhhhssdo'), r(3, 'ohhhhhsssSo'),
                  r(3, 'ohhhhssssSo'), r(3, 'ohhhhssesSo'), r(3, 'odhhhssesSo'), r(3, 'odhhosssmSo'), r(3, 'oddo.oSssSo')],
    },
    'cap': {
        'down': [r(5, 'oooooo'), r(4, 'otttttto'), r(3, 'otttttttto'), r(3, 'ocCccccckko'[:10]), r(3, 'oooooooooo'),
                 r(4, 'ohsssshdo'[:8]), r(4, 'osesseSo'), r(4, 'osesseSo'), r(4, 'ossmmSSo'), r(5, 'oSssSo')],
        'up': [r(5, 'oooooo'), r(4, 'otttttto'), r(3, 'otttttttto'), r(3, 'otttttttto'), r(3, 'okkkkkkkko'),
               r(3, 'ohhhhhhddo'), r(4, 'ohhhhddo'), r(4, 'odhhhddo'), r(4, 'osddddSo'), r(5, 'oSssSo')],
        'right': [r(5, 'oooooo'), r(4, 'otttttto'), r(3, 'ottttttttoooo'), r(3, 'okkkkkkkkkkko'), r(3, 'ohhhhhsssSo'),
                  r(3, 'odhhhssssSo'), r(4, 'odhhssesSo'), r(4, 'oddhssesSo'), r(5, 'odsssmSo'), r(5, 'ooSssSo')],
    },
    'bun': {
        'down': [r(6, 'oooo'), r(5, 'ohHhho'), r(4, 'oohHhhoo'), r(3, 'ohHHhhhhdo'), r(3, 'ohhsssshdo'),
                 r(4, 'osssssSo'), r(4, 'osesseSo'), r(4, 'osesseSo'), r(4, 'ossmmSSo'), r(5, 'oSssSo')],
        'up': [r(6, 'oooo'), r(5, 'ohHhho'), r(4, 'oohHhhoo'), r(3, 'ohHHhhhhdo'), r(3, 'ohhhhhhhdo'),
               r(3, 'ohhhhhhddo'), r(4, 'ohhhhddo'), r(4, 'odhhhddo'), r(4, 'osddddSo'), r(5, 'oSssSo')],
        'right': [r(4, 'ooo'), r(3, 'ohHho'), r(3, 'ohhdooooo'), r(3, 'odhHHhhhhho'), r(3, 'ohhhhhsssSo'),
                  r(3, 'odhhhssssSo'), r(4, 'odhhssesSo'), r(4, 'oddhssesSo'), r(5, 'odsssmSo'), r(5, 'ooSssSo')],
    },
}

NECK = {'down': r(6, 'oSSo'), 'up': r(6, 'oSSo'), 'right': r(6, 'oSSo')}

# Bodies (rows 11-17): shoulders wider than the head, arms at the sides, hands at the hem.
BODIES = {
    'down': [r(3, 'ooCcttckoo'), r(2, 'oCCccttcckko'), r(2, 'oCcccttccckko'[:12]), r(2, 'oCoccccccoko'),
             r(2, 'oCocccccckko'), r(2, 'osocccccckSo'), r(2, 'oSottttttoSo')],
    'up': [r(3, 'ooCcccckoo'), r(2, 'oCCccccccdko'[:12].replace('d', 'c')), r(2, 'oCcccccccckko'[:12]), r(2, 'oCoccccccoko'),
           r(2, 'oCocccccckko'), r(2, 'osocccccckSo'), r(2, 'oSottttttoSo')],
    # Side view: the near arm hangs down the middle of the body, hand at the hem; it swings forward on a step.
    'right': [r(4, 'ooCccckoo'), r(4, 'oCCcCkcko'), r(4, 'oCccCkcko'), r(4, 'oCccCkcko'),
              r(4, 'oCccCkcko'), r(4, 'oCccsSkko'), r(4, 'ottttttto')],
    'right_swing': [r(4, 'ooCccckoo'), r(4, 'oCCccCkko'), r(4, 'oCcccCkko'), r(4, 'oCccccCko'),
                    r(4, 'oCcccccsSo'), r(4, 'oCcccccko'), r(4, 'ottttttto')],
}
# A long kurta covers the top of the legs.
KURTA = {'down': r(3, 'oCccccckko'), 'up': r(3, 'oCcccccko'), 'right': r(4, 'oCcccccko')}

# Legs (rows 18-23) per walk frame.
LEGS = {
    'down': {
        'stand': [r(4, 'oppppPPo'), r(4, 'oppooPPo'), r(4, 'oppo.oPPo'[:8]), r(4, 'oppo.oPo'), r(4, 'offo.oFo'), r(4, 'oooo.ooo')],
        'stepA': [r(4, 'oppppPPo'), r(4, 'oppooPPo'), r(3, 'oppo..oPo'), r(3, 'oppo..oPo'), r(3, 'offo..oFo'), r(3, 'oooo..ooo')],
        'stepB': [r(4, 'oppppPPo'), r(4, 'oppooPPo'), r(4, 'opo..oPPo'), r(4, 'opo..oPPo'), r(4, 'ofo..oFFo'), r(4, 'ooo..oooo')],
    },
    'right': {
        'stand': [r(5, 'opppPo'), r(5, 'opppPo'), r(5, 'oppPPo'), r(5, 'oppPPo'), r(5, 'offFFoo'), r(5, 'ooooooo')],
        'stepA': [r(5, 'opppPPo'), r(4, 'oppooPPo'), r(3, 'oppo..oPPo'), r(3, 'opo....oPo'), r(2, 'offo....oFFo'), r(2, 'oooo....oooo')],
        'stepB': [r(5, 'opppPo'), r(5, 'oppPPo'), r(4, 'oppooPo'), r(4, 'opo.oPo'), r(4, 'ofo.oFFo'), r(4, 'ooo.oooo')],
    },
}


def check(name, rows, n):
    assert len(rows) == n, (name, len(rows))
    for i, r in enumerate(rows):
        assert len(r) == W, (name, i, len(r), r)


def frames():
    """Every hairstyle x top x facing x walk frame, as 24 rows of 16 letters."""
    out = {}
    walk = ['stand', 'stepA', 'stand', 'stepB']
    for style, heads in HEADS.items():
        for top in ('shirt', 'kurta'):
            for face in ('down', 'up', 'right'):
                for i, leg in enumerate(walk):
                    body = BODIES['right_swing' if face == 'right' and leg == 'stepA' else face]
                    legs = LEGS['right' if face == 'right' else 'down'][leg]
                    if top == 'kurta':
                        legs = [KURTA[face]] + legs[1:]
                    rows = heads[face] + [NECK[face]] + body + legs
                    out[f'{style}_{top}_{face}{i}'] = rows
    for k, rows in out.items():
        check(k, rows, H)
    return out


# Preview looks (the game fills these in from each person's look).
LOOKS = [
    {'h': '#2a1d1a', 's': '#c98a5a', 'c': '#d9734e', 't': '#f5c26b', 'p': '#5b4b6b', 'f': '#3a2a20'},
    {'h': '#3a2418', 's': '#b07850', 'c': '#3f7fa6', 't': '#e0a93b', 'p': '#4a3a2a', 'f': '#2b1d10'},
    {'h': '#1e1a1f', 's': '#d8a07a', 'c': '#5fae5f', 't': '#fbf4e2', 'p': '#2b4566', 'f': '#2b1d10'},
]


def shade(hexc, f):
    r, g, b = int(hexc[1:3], 16), int(hexc[3:5], 16), int(hexc[5:7], 16)
    if f >= 0:
        r, g, b = (int(v + (255 - v) * f) for v in (r, g, b))
    else:
        r, g, b = (int(v * (1 + f)) for v in (r, g, b))
    return (r, g, b, 255)


def palette(look):
    return {
        'o': (59, 38, 28, 255), 'h': shade(look['h'], 0), 'H': shade(look['h'], 0.28), 'd': shade(look['h'], -0.35),
        's': shade(look['s'], 0), 'S': shade(look['s'], -0.18), 'e': (38, 26, 22, 255), 'm': shade(look['s'], -0.38),
        'c': shade(look['c'], 0), 'C': shade(look['c'], 0.22), 'k': shade(look['c'], -0.25), 't': shade(look['t'], 0),
        'p': shade(look['p'], 0), 'P': shade(look['p'], -0.25), 'f': shade(look['f'], 0), 'F': shade(look['f'], 0.25),
    }


def render(rows, look, mirror=False):
    from PIL import Image
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    pal = palette(look)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in pal:
                im.putpixel((W - 1 - x if mirror else x, y), pal[ch])
    return im


def main():
    fr = frames()
    body = ',\n'.join(f"  {k}: [\n" + ',\n'.join(f"    '{r}'" for r in rows) + ',\n  ]' for k, rows in fr.items())
    OUT.write_text(
        '/**\n * Generated by scripts/build-people.py: hand-drawn pixel templates for the people in\n'
        ' * Scam Town (16x24, four facings, four walk frames). Edit the script, not this file.\n */\n'
        f'export const PERSON_W = {W}\nexport const PERSON_H = {H}\n'
        f'export const PERSON_FRAMES: Record<string, readonly string[]> = {{\n{body},\n}}\n'
    )
    print('wrote', OUT.relative_to(ROOT))
    if '--preview' in sys.argv:
        from PIL import Image
        d = pathlib.Path(sys.argv[sys.argv.index('--preview') + 1])
        k = 8
        styles = [('long', 'kurta'), ('cap', 'shirt'), ('short', 'shirt'), ('bun', 'shirt')]
        sheet = Image.new('RGBA', ((W + 2) * 13 * k, (H + 2) * len(styles) * k), (232, 217, 181, 255))
        for li, (style, top) in enumerate(styles):
            look = LOOKS[li % len(LOOKS)]
            col = 0
            for face in ['down', 'up', 'right', 'left']:
                for i in range(4 if face != 'left' else 1):
                    key = f"{style}_{top}_{'right' if face == 'left' else face}{i}"
                    im = render(fr[key], look, mirror=face == 'left').resize((W * k, H * k), Image.NEAREST)
                    sheet.alpha_composite(im, (col * (W + 2) * k + k, li * (H + 2) * k + k))
                    col += 1
        sheet.save(d / 'people_sheet.png')
        # In place on the map, at the game's 2x.
        town = Image.open(ROOT / 'public/sprites/town-map.png').convert('RGBA').crop((110, 290, 210, 380))
        for i, look in enumerate(LOOKS):
            key = ['long_kurta_down0', 'cap_shirt_right1', 'short_shirt_down0'][i]
            town.alpha_composite(render(fr[key], look), (20 + i * 26, 50))
        town.resize((town.width * 4, town.height * 4), Image.NEAREST).save(d / 'people_onmap.png')


if __name__ == '__main__':
    main()
