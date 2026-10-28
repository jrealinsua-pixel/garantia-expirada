import zlib, struct, math, random, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = BASE + "/assets"
os.makedirs(OUT, exist_ok=True)


def hx(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)


PAL = {k: hx(v) for k, v in {
    'K': '#14111f', 'W': '#f4f1e8', 'w': '#d9d5c7', 'G': '#c3c9d6', 'g': '#8a92a8', 'D': '#565c75',
    'R': '#e0453b', 'r': '#962d35', 'Y': '#f6c431', 'y': '#c28f1c', 'O': '#ec8a2c',
    'B': '#4a86d8', 'b': '#2c4f94', 'C': '#69dbd8', 'c': '#3a9ea6', 'N': '#58b45a', 'n': '#2f7a41',
    'P': '#ea93a8', 'T': '#a96a3f', 't': '#6b4128', 'M': '#b8a07a', 'L': '#e9d9a8'}.items()}

SPR = {}

SPR['hero'] = [
    "................",
    "....MM....MM....",
    "...MLLM..MLLM...",
    "...MLLM..MLLM...",
    "..KKKKKKKKKKKK..",
    ".KGGGGGGGGGGGGK.",
    ".KGWWGGGGGGGGGK.",
    ".KGWGGGGGGGGGGKR",
    ".KGGWKGGGGWKGGKR",
    ".KGGKKGGGGKKGGK.",
    ".KGGKKGGGGKKGGK.",
    ".KGPGGGGGGGGPGK.",
    ".KGGGKKKKKKGGGK.",
    ".KggggggggggggK.",
    ".KDDDDDDDDDDDDK.",
    "..KKKKKKKKKKKK..",
]

SPR['aspirador'] = [
    "................",
    "................",
    ".....KKKKKK.....",
    "...KKCCCCCCKK...",
    "..KBBBBBBBBBBK..",
    ".KBBBKKKKKKBBBK.",
    ".KBBKRRRRRRKBBK.",
    ".KBBKRYYYYRKBBK.",
    ".KBBKRRRRRRKBBK.",
    ".KbbbKKKKKKbbbK.",
    ".KbbbbbbbbbbbbK.",
    ".KDDDDDDDDDDDDK.",
    "..KKKKKKKKKKKK..",
    "...KK......KK...",
    "...KK......KK...",
    "................",
]

SPR['microondas'] = [
    "................",
    "................",
    ".KKKKKKKKKKKKKK.",
    ".KWWWWWWWWWWWWK.",
    ".KWKKKKKKKKKCCK.",
    ".KWKYYYYYYKKGGK.",
    ".KWKYKYYKYKKGRK.",
    ".KWKYKYYKYKKGGK.",
    ".KWKYYKKYYKKGRK.",
    ".KWKYYYYYYKKGGK.",
    ".KWKKKKKKKKKGGK.",
    ".KwwwwwwwwwwwwK.",
    ".KDDDDDDDDDDDDK.",
    ".KKKKKKKKKKKKKK.",
    "..KK........KK..",
    "................",
]

SPR['bombilla'] = [
    "................",
    ".....KKKKKK.....",
    "...KKYYYYYYKK...",
    "..KYYWWYYYYYYK..",
    ".KYYWYYYYYYYYYK.",
    ".KYYYYYYYYYYYYK.",
    ".KYYKKYYYYKKYYK.",
    ".KYYKRYYYYKRYYK.",
    ".KYYYYYYYYYYYYK.",
    "..KYYYKKKKYYYK..",
    "...KYYYYYYYYK...",
    "....KKGGGGKK....",
    ".....KDDDDK.....",
    ".....KGGGGK.....",
    ".....KDDDDK.....",
    "......KKKK......",
]

SPR['secador'] = [
    "................",
    "................",
    "................",
    "..KKKKKKKKKKKK..",
    ".KPPPPPPPPPPKDDK",
    ".KPWWPPPPPPPKDDK",
    ".KPPPPPPPPPPKDDK",
    "..KKKKKKKKKKKKKK",
    "......KPPK......",
    "......KPPK......",
    "......KPPK......",
    "......KRRK......",
    "......KPPK......",
    "......KKKK......",
    ".....KK.........",
    "....KK..........",
]

SPR['grapadora'] = [
    "................",
    "................",
    "................",
    "................",
    "..KKKKKKKKKKKK..",
    ".KRRRRRRRRRRRRK.",
    ".KRWWRRRRRRRRRK.",
    ".KrrrrrrrrrrrrK.",
    ".KKKKKKKKKKKKKK.",
    "KGGGGGGGGGGGGGGK",
    "KKKKKKKKKKKKKKKK",
    ".KDDDDDDDDDDDDK.",
    "..KKKKKKKKKKKK..",
    "................",
    "................",
    "................",
]

SPR['manual'] = [
    "................",
    "................",
    "...KKKKKKKKKK...",
    "..KRRRRRRRRRRK..",
    "..KRYYRRRYRYRK..",
    "..KRRYRYYRRRRK..",
    "..KRYYRRYRYYRK..",
    "..KRRRRRRRRRRK..",
    "..KRYRYRYRYRRK..",
    "..KRRRRRRRRRRK..",
    "..KrrrrrrrrrrK..",
    "..KKKKKKKKKKKK..",
    "...KWWWWWWWWK...",
    "...KKKKKKKKKK...",
    "................",
    "................",
]

SPR['pila'] = [
    "................",
    "......KKKK......",
    "......KGGK......",
    "....KKKKKKKK....",
    "....KOOOOOOK....",
    "....KOOOOOOK....",
    "....KDDDDDDK....",
    "....KDDWWDDK....",
    "....KDDDDDDK....",
    "....KDKKKKDK....",
    "....KDKDDKDK....",
    "....KDKDDKDK....",
    "....KDKRRKDK....",
    "....KDKKKKDK....",
    "....KKKKKKKK....",
    "................",
]

SPR['ticket'] = [
    "................",
    "....KKKKKKKK....",
    "...KWWWWWWWWK...",
    "...KWKKKKKKWK...",
    "...KWWWWWWWWK...",
    "...KWgggggWWK...",
    "...KWWWWWWWWK...",
    "...KWggggWWWK...",
    "...KWWWWWWWWK...",
    "...KWgggggWWK...",
    "...KWWWWWWWWK...",
    "...KWRRRRRRWK...",
    "...KWWWWWWWWK...",
    "...KKWWKKWWKK...",
    "....K..KK..K....",
    "................",
]

SPR['garantia'] = [
    "................",
    "................",
    "..KKKKKKKKKKKK..",
    "..KLLLLLLLLLLK..",
    "..KLYYYYYYYYLK..",
    "..KLLLLLLLLLLK..",
    "..KLtttttttLLK..",
    "..KLLLLLLLLLLK..",
    "..KLtttttttLLK..",
    "..KLLLLLLLLLLK..",
    "..KLttttLRRRLK..",
    "..KLLLLLLRRRLK..",
    "..KLLLLLLRRRLK..",
    "..KLLLLLLLLLLK..",
    "..KKKKKKKKKKKK..",
    "................",
]

SPR['caja'] = [
    "................",
    "................",
    ".KKKKKKKKKKKKKK.",
    ".KLLLLLLLLLLLLK.",
    ".KLLLLLLLLLLLLK.",
    ".KKKKKKKKKKKKKK.",
    ".KMMMMMLLMMMMMK.",
    ".KMMMMMLLMMMMMK.",
    ".KMMMMMLLMMMMMK.",
    ".KMMMMMLLMRRRMK.",
    ".KMMMMMLLMRRRMK.",
    ".KMMMMMLLMMMMMK.",
    ".KMMMMMLLMMMMMK.",
    ".KttttttttttttK.",
    ".KKKKKKKKKKKKKK.",
    "................",
]

errors = []


def grid(name, rows, w=16, h=16):
    if len(rows) != h:
        errors.append("%s: %d rows (want %d)" % (name, len(rows), h))
    out = []
    for i, r in enumerate(rows):
        if len(r) != w:
            errors.append("%s row %d: len %d -> %r" % (name, i, len(r), r))
        row = []
        for ch in r.ljust(w, '.')[:w]:
            row.append(None if ch == '.' else PAL[ch])
        out.append(row)
    return out


class Canvas:
    def __init__(s, w, h, fill=(0, 0, 0, 0)):
        s.w, s.h = w, h
        s.p = [[fill for _ in range(w)] for _ in range(h)]

    def set(s, x, y, c):
        if c is None or not (0 <= x < s.w and 0 <= y < s.h):
            return
        if c[3] == 255:
            s.p[y][x] = c
        else:
            d = s.p[y][x]
            a = c[3] / 255.0
            s.p[y][x] = (round(c[0] * a + d[0] * (1 - a)), round(c[1] * a + d[1] * (1 - a)),
                         round(c[2] * a + d[2] * (1 - a)), 255 if d[3] == 255 else max(d[3], c[3]))

    def rect(s, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w):
                s.set(i, j, c)

    def blit(s, spr, x, y):
        for j, row in enumerate(spr):
            for i, c in enumerate(row):
                s.set(x + i, y + j, c)


def png_bytes(cv):
    raw = bytearray()
    for row in cv.p:
        raw.append(0)
        for p in row:
            raw.extend(bytes(p))

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", cv.w, cv.h, 8, 6, 0, 0, 0)) +
            chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


def save(cv, path):
    with open(path, "wb") as f:
        f.write(png_bytes(cv))


def scaled(cv, k):
    out = Canvas(cv.w * k, cv.h * k)
    for y in range(cv.h):
        for x in range(cv.w):
            c = cv.p[y][x]
            for j in range(k):
                row = out.p[y * k + j]
                for i in range(k):
                    row[x * k + i] = c
    return out


# ---------------------------------------------------------------- boss
def make_boss():
    cv = Canvas(32, 32)
    P = PAL
    r, s = cv.rect, cv.set
    r(3, 3, 26, 28, P['K'])
    r(4, 4, 24, 26, P['G'])
    r(26, 4, 2, 26, P['g'])
    r(4, 28, 24, 2, P['g'])
    r(5, 5, 1, 23, P['W'])
    r(3, 14, 26, 1, P['K'])
    # crown
    r(11, 1, 10, 2, P['Y'])
    for x in (11, 15, 16, 20):
        s(x, 0, P['Y'])
    r(11, 2, 10, 1, P['y'])
    r(15, 1, 2, 1, P['R'])
    # eyes
    for ex in (7, 17):
        r(ex, 8, 8, 6, P['K'])
        r(ex + 1, 9, 6, 4, P['W'])
    r(11, 10, 2, 3, P['K'])
    r(19, 10, 2, 3, P['K'])
    s(11, 10, P['R'])
    s(20, 10, P['R'])
    brow = [(7, 5), (8, 5), (8, 6), (9, 6), (10, 6), (10, 7), (11, 7), (12, 7), (13, 7)]
    for (x, y) in brow:
        s(x, y, P['K'])
        s(31 - x, y, P['K'])
    # freezer handle
    r(26, 6, 2, 7, P['D'])
    # mouth
    r(5, 16, 20, 10, P['D'])
    r(6, 17, 18, 8, P['K'])
    r(7, 20, 16, 2, P['b'])
    for tx in (7, 10, 13, 16, 19):
        r(tx, 17, 2, 3, P['C'])
        s(tx, 17, P['W'])
        s(tx + 1, 18, P['c'])
        s(tx + 1, 19, P['c'])
    for tx in (8, 11, 14, 17, 20):
        r(tx, 22, 2, 3, P['C'])
        s(tx, 22, P['W'])
        s(tx + 1, 23, P['c'])
        s(tx + 1, 24, P['c'])
    # fridge handle, magnets, energy label
    r(26, 17, 2, 11, P['D'])
    r(6, 26, 5, 3, P['Y'])
    s(8, 26, P['R'])
    r(16, 26, 8, 3, P['N'])
    for x in (17, 18, 19):
        s(x, 27, P['W'])
    r(16, 28, 8, 1, P['n'])
    # feet
    r(5, 31, 5, 1, P['D'])
    r(22, 31, 5, 1, P['D'])
    return cv


# ---------------------------------------------------------------- scene
def shadow(cv, cx, cy, rx, ry, a=95):
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) / float(rx)) ** 2 + ((y - cy) / float(ry)) ** 2 <= 1:
                cv.set(x, y, (10, 8, 20, a))


def bullet(cv, cx, cy, out, core):
    pat = [".11.", "1221", "1221", ".11."]
    for j, row in enumerate(pat):
        for i, ch in enumerate(row):
            if ch == '1':
                cv.set(cx - 2 + i, cy - 2 + j, out)
            elif ch == '2':
                cv.set(cx - 2 + i, cy - 2 + j, core)


def big_shot(cv, cx, cy):
    pat = ["..11..", ".1221.", "122221", "122221", ".1221.", "..11.."]
    for j, row in enumerate(pat):
        for i, ch in enumerate(row):
            if ch == '1':
                cv.set(cx - 3 + i, cy - 3 + j, PAL['O'])
            elif ch == '2':
                cv.set(cx - 3 + i, cy - 3 + j, PAL['Y'])


def heart(cv, x, y, full=True):
    pat = [".11.11.", "1221111", "1111111", ".11111.", "..111..", "...1..."]
    c1 = PAL['R'] if full else hx('#3a3f5c')
    c2 = PAL['W'] if full else hx('#4c5374')
    for j, row in enumerate(pat):
        for i, ch in enumerate(row):
            if ch == '1':
                cv.set(x + i, y + j, c1)
            elif ch == '2':
                cv.set(x + i, y + j, c2)


def shutter(cv, x, y, w, h):
    cv.rect(x, y, w, h, hx('#3a4058'))
    for j in range(y + 2, y + h, 3):
        cv.rect(x, j, w, 1, hx('#2b3048'))
    cv.rect(x, y, w, 1, PAL['K'])
    cv.rect(x, y, 1, h, PAL['K'])
    cv.rect(x + w - 1, y, 1, h, PAL['K'])
    cv.rect(x + w // 2 - 4, y + 3, 8, 3, PAL['K'])
    cv.rect(x + w // 2 - 3, y + 4, 6, 1, PAL['R'])


def make_scene(G):
    rng = random.Random(11)
    S = Canvas(320, 192, hx('#14111f'))
    FA, FB, GR = hx('#3f4565'), hx('#394060'), hx('#2c3149')
    for ty in range(12):
        for tx in range(20):
            S.rect(tx * 16, ty * 16, 16, 16, FA if (tx + ty) % 2 == 0 else FB)
            for i in range(16):
                S.set(tx * 16 + i, ty * 16, GR)
                S.set(tx * 16, ty * 16 + i, GR)
    for y in range(192):
        for x in range(320):
            v = rng.random()
            c = S.p[y][x]
            if v < 0.05:
                S.p[y][x] = (min(255, c[0] + 12), min(255, c[1] + 12), min(255, c[2] + 14), 255)
            elif v < 0.09:
                S.p[y][x] = (max(0, c[0] - 11), max(0, c[1] - 11), max(0, c[2] - 12), 255)
    # warehouse floor line (dashed)
    dash = hx('#7c6a22')
    for x in range(28, 292):
        if (x // 8) % 2 == 0:
            S.set(x, 44, dash)
            S.set(x, 163, dash)
    for y in range(44, 164):
        if (y // 8) % 2 == 0:
            S.set(28, y, dash)
            S.set(291, y, dash)
    # walls
    WALL = hx('#232739')
    S.rect(0, 0, 320, 32, WALL)
    S.rect(0, 0, 16, 192, WALL)
    S.rect(304, 0, 16, 192, WALL)
    S.rect(0, 176, 320, 16, WALL)
    for x in range(0, 320, 32):
        S.rect(x, 0, 1, 32, hx('#1c1f2e'))
    for y in range(32, 176, 32):
        S.rect(0, y, 16, 1, hx('#1c1f2e'))
        S.rect(304, y, 16, 1, hx('#1c1f2e'))
    for x in range(16, 304, 32):
        S.rect(x, 176, 1, 16, hx('#1c1f2e'))
    # shelves on the top wall
    colors = ['#e0453b', '#f6c431', '#4a86d8', '#58b45a', '#ea93a8', '#ec8a2c', '#69dbd8', '#b8a07a', '#c3c9d6']
    for (plank_y, hmax, hmin) in ((14, 11, 6), (29, 12, 7)):
        x = 17
        while x < 300:
            w = rng.randint(7, 12)
            h = rng.randint(hmin, hmax)
            col = hx(rng.choice(colors))
            dark = (int(col[0] * .72), int(col[1] * .72), int(col[2] * .72), 255)
            S.rect(x, plank_y - h, w, h, col)
            S.rect(x + w - 2, plank_y - h, 2, h, dark)
            S.rect(x, plank_y - h, w, 1, (255, 255, 255, 60))
            if rng.random() < .5:
                S.rect(x + 2, plank_y - h // 2, w - 5, 1, PAL['W'])
            x += w + rng.randint(1, 3)
        S.rect(0, plank_y, 320, 2, hx('#4c5374'))
        S.rect(0, plank_y, 320, 1, hx('#5d658a'))
    S.rect(0, 31, 320, 1, PAL['K'])
    # hazard stripes on the inner edges
    ya, yb = hx('#b58f1e'), hx('#1a1726')
    for y in range(32, 176):
        for x in range(12, 16):
            S.set(x, y, ya if ((x + y) // 3) % 2 == 0 else yb)
        for x in range(304, 308):
            S.set(x, y, ya if ((x + y) // 3) % 2 == 0 else yb)
    for x in range(16, 304):
        for y in range(176, 180):
            S.set(x, y, ya if ((x + y) // 3) % 2 == 0 else yb)
    # shutters (doors closed while enemies are alive)
    shutter(S, 144, 8, 32, 24)
    shutter(S, 144, 176, 32, 16)

    ents = []

    def put(spr, x, y, sh=True):
        ents.append((y, spr, x, sh))

    for (x, y) in ((20, 36), (286, 36), (20, 154), (284, 152)):
        put(G['caja'], x, y)
    hx0, hy0 = 64, 104
    put(G['hero'], hx0, hy0)
    put(G['aspirador'], 264, 128)
    put(G['microondas'], 216, 72)
    put(G['bombilla'], 160, 64)
    ents.sort(key=lambda e: e[0])
    for (y, spr, x, sh) in ents:
        shadow(S, x + 8, y + 15, 7, 2)
    # charge lines behind the vacuum
    for (dx, dy, dw) in ((284, 134, 10), (286, 138, 12), (284, 142, 8)):
        S.rect(dx, dy, dw, 1, PAL['g'])
    for (y, spr, x, sh) in ents:
        S.blit(spr, x, y)
        if spr is G['hero']:
            S.blit(G['secador'], x + 9, y + 4)
    # microwave bullet rings
    cx, cy = 224, 80
    for k in range(12):
        a = math.radians(k * 30)
        bullet(S, round(cx + 22 * math.cos(a)), round(cy + 22 * math.sin(a)), PAL['R'], PAL['W'])
    for k in range(16):
        a = math.radians(11.25 + k * 22.5)
        bullet(S, round(cx + 38 * math.cos(a)), round(cy + 38 * math.sin(a)), PAL['R'], PAL['W'])
    # bulb spiral
    bx, by = 168, 72
    for i in range(10):
        a = math.radians(i * 42)
        rr = 13 + i * 2
        bullet(S, round(bx + rr * math.cos(a)), round(by + rr * math.sin(a)), PAL['C'], PAL['W'])
    # player's shots
    for t in (.12, .26, .40):
        big_shot(S, round(96 + 175 * t), round(116 + 20 * t))
    # reticle
    rx, ry = 272, 136
    for d in (3, 4, 5):
        for (ox, oy) in ((d, 0), (-d, 0), (0, d), (0, -d)):
            S.set(rx + ox, ry + oy, PAL['W'])
    S.set(rx, ry, PAL['R'])
    # HUD
    S.rect(14, 3, 36, 14, (10, 8, 20, 170))
    for i, full in enumerate((True, True, False)):
        heart(S, 18 + i * 10, 7, full)
    S.rect(254, 1, 60, 21, (10, 8, 20, 170))
    for i, name in enumerate(('pila', 'manual', 'garantia')):
        S.blit(G[name], 258 + i * 18, 3)
    return S


def main():
    G = {k: grid(k, v) for k, v in SPR.items()}
    if errors:
        print("\n".join(errors))
        sys.exit(1)
    boss = make_boss()
    names = ['hero', 'aspirador', 'microondas', 'bombilla', 'secador', 'grapadora', 'manual', 'pila', 'ticket', 'garantia', 'caja']
    for n in names:
        cv = Canvas(16, 16)
        cv.blit(G[n], 0, 0)
        save(cv, "%s/%s.png" % (OUT, n))
    save(boss, OUT + "/boss.png")
    scene = make_scene(G)
    save(scene, OUT + "/scene.png")
    # previews for my own check
    sheet = Canvas(240, 66, hx('#1a1e2b'))
    for i, n in enumerate(names):
        sheet.blit(G[n], 4 + i * 19, 4)
    sheet.blit(boss.p and G['hero'], 4, 24)
    for y in range(32):
        for x in range(32):
            sheet.set(40 + x, 26 + y, boss.p[y][x])
    save(scaled(sheet, 5), BASE + "/preview_sprites.png")
    save(scaled(scene, 3), BASE + "/preview_scene.png")
    print("ok")


if __name__ == "__main__":
    main()
