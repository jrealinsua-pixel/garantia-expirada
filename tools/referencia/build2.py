import math, random, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import Canvas, save, scaled, hx, BASE, grid, SPR

OUT2 = BASE + "/assets2"
os.makedirs(OUT2, exist_ok=True)
WOFF = (23, 9)
SHOT = (150, 176)


def ramp(*h):
    return [hx(c) for c in h]


K = hx('#0e0c16')
WHITE = hx('#f4f1e8')
STEEL = ramp('#e4e8f0', '#b7bed0', '#858ea8', '#5a627c', '#3a4058')
DSTEEL = ramp('#838ca6', '#5d647e', '#434963', '#2c3048')
GLOVE = ramp('#6a708c', '#454a66', '#2e3250', '#1c1f36')
TOAST = ramp('#e0a860', '#b07a36', '#7a4e24', '#40281a')
YEL = ramp('#fff1a8', '#f6c431', '#d9932a', '#8f5a1c')
RED = ramp('#ff8a70', '#e0453b', '#a42f37', '#6a1d2a')
RUSTR = ramp('#e0a060', '#b8683a', '#8a4528', '#5e2e1e')
BLUE = ramp('#a9cbf2', '#5f93d4', '#3f66a6', '#27447a')
BROWN = ramp('#d2b184', '#a98258', '#7a5a3c', '#4f3a28')
CREAM = ramp('#f4efdc', '#d6cdb2', '#a89f86', '#756e5a')
SUIT = ramp('#5a607e', '#3e4360', '#2b2f48', '#1a1c30')
FR = ramp('#f1f4fa', '#c9d0de', '#99a3ba', '#6a7390', '#3f465e')
ICE = ramp('#ffffff', '#b6f1f0', '#69dbd8', '#3a9ea6')
CARD = ramp('#e2c797', '#b8935f', '#8f6c40', '#664a2c')
GLOW = hx('#ffb347')
GLOW2 = hx('#ff7a1f')
GREEN = hx('#58b45a')
CYAN = hx('#69dbd8')


def box(cv, x, y, w, h, R):
    cv.rect(x, y, w, h, R[1])
    cv.rect(x, y, w, 1, R[0])
    if w > 2:
        cv.rect(x, y, 1, h, R[0])
        cv.rect(x + w - 1, y, 1, h, R[2])
    cv.rect(x, y + h - 1, w, 1, R[2])
    if w > 2 and h > 2:
        cv.set(x + w - 1, y + h - 1, R[3])


def ellipse(cv, cx, cy, rx, ry, c):
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                cv.set(x, y, c)


def outline(cv, color=K):
    out = Canvas(cv.w, cv.h)
    for y in range(cv.h):
        for x in range(cv.w):
            if cv.p[y][x][3] > 0:
                out.p[y][x] = cv.p[y][x]
    for y in range(cv.h):
        for x in range(cv.w):
            if cv.p[y][x][3] == 0:
                for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < cv.w and 0 <= ny < cv.h and cv.p[ny][nx][3] > 0:
                        out.p[y][x] = color
                        break
    return out


def speckle(cv, pts, c):
    for (x, y) in pts:
        if cv.p[y][x][3] > 0:
            cv.set(x, y, c)


# ------------------------------------------------------------------ hero
def make_hero():
    cv = Canvas(36, 32)
    for x0 in (11, 17):
        cv.rect(x0, 2, 4, 4, hx('#a8702f'))
        cv.rect(x0 + 1, 3, 2, 3, hx('#ecc882'))
        cv.p[2][x0] = (0, 0, 0, 0)
        cv.p[2][x0 + 3] = (0, 0, 0, 0)
        cv.set(x0 + 1, 3, hx('#7a4e24'))
        cv.set(x0 + 2, 4, hx('#c99a52'))
    box(cv, 9, 6, 14, 8, STEEL)
    cv.rect(11, 6, 4, 1, K)
    cv.rect(17, 6, 4, 1, K)
    cv.rect(11, 8, 10, 3, K)
    cv.rect(12, 9, 2, 1, GLOW)
    cv.rect(18, 9, 2, 1, GLOW)
    cv.set(12, 9, GLOW2)
    cv.set(19, 9, GLOW2)
    for x in (12, 14, 17, 19):
        cv.set(x, 12, STEEL[4])
    cv.set(10, 7, STEEL[0])
    cv.set(21, 7, STEEL[0])
    box(cv, 10, 15, 12, 9, STEEL)
    cv.rect(10, 23, 12, 1, STEEL[4])
    cv.rect(15, 23, 2, 1, YEL[1])
    cv.rect(12, 17, 5, 3, YEL[1])
    cv.rect(12, 18, 5, 1, RED[1])
    cv.set(12, 17, YEL[0])
    cv.rect(18, 17, 3, 3, STEEL[4])
    cv.set(19, 18, GLOW)
    box(cv, 6, 15, 3, 8, STEEL)
    box(cv, 6, 23, 3, 3, GLOVE)
    box(cv, 23, 15, 3, 5, STEEL)
    box(cv, 26, 16, 5, 3, STEEL)
    box(cv, 31, 15, 3, 5, GLOVE)
    cv.rect(4, 24, 2, 3, CREAM[0])
    cv.set(4, 26, RED[1])
    for x0 in (11, 17):
        box(cv, x0, 25, 4, 4, DSTEEL)
    box(cv, 10, 29, 5, 2, GLOVE)
    box(cv, 17, 29, 5, 2, GLOVE)
    for (x, y) in ((21, 22), (22, 23), (23, 24), (23, 25), (22, 26), (22, 27), (23, 28), (24, 29)):
        cv.set(x, y, GLOVE[2])
    box(cv, 24, 29, 3, 2, STEEL)
    cv.set(27, 29, STEEL[1])
    cv.set(27, 30, STEEL[1])
    speckle(cv, [(10, 9), (21, 12), (11, 20), (20, 21), (7, 19), (24, 17), (12, 26), (19, 27), (14, 21)], RUSTR[1])
    speckle(cv, [(12, 16), (13, 16), (20, 11), (9, 10)], STEEL[3])
    o = outline(cv)
    for (x, y) in ((12, 1), (13, 0), (18, 1), (19, 0)):
        o.set(x, y, (215, 215, 228, 150))
    return o


# ------------------------------------------------------------------ vacuum
def make_aspirador():
    cv = Canvas(32, 32)
    box(cv, 10, 4, 12, 9, BLUE)
    for (x, y) in ((10, 4), (21, 4)):
        cv.p[y][x] = (0, 0, 0, 0)
    cv.rect(12, 7, 8, 4, K)
    cv.rect(13, 8, 6, 2, RED[2])
    cv.rect(15, 8, 2, 2, RED[0])
    cv.set(15, 8, hx('#ffffff'))
    cv.rect(12, 13, 8, 1, STEEL[3])
    box(cv, 10, 14, 12, 10, BROWN)
    cv.rect(12, 16, 8, 6, K)
    for (x, y, c) in ((13, 20, RED[1]), (14, 19, YEL[1]), (16, 20, CREAM[0]), (17, 18, GREEN), (18, 20, RED[1]), (15, 21, CREAM[0]), (13, 18, STEEL[2])):
        cv.set(x, y, c)
    for y in range(14, 25):
        cv.rect(5, y, 3, 1, DSTEEL[1] if y % 2 == 0 else DSTEEL[3])
    box(cv, 3, 25, 7, 3, STEEL)
    for x in range(3, 10, 2):
        cv.set(x, 28, STEEL[4])
    box(cv, 23, 14, 3, 9, BLUE)
    box(cv, 23, 23, 3, 3, GLOVE)
    box(cv, 11, 25, 3, 2, BLUE)
    box(cv, 18, 25, 3, 2, BLUE)
    for x0 in (9, 17):
        box(cv, x0, 27, 6, 4, GLOVE)
        cv.rect(x0 + 2, 28, 2, 2, STEEL[1])
    speckle(cv, [(11, 5), (20, 10), (11, 20), (24, 18)], RUSTR[1])
    return outline(cv)


# ------------------------------------------------------------------ microwave
def make_microondas():
    cv = Canvas(32, 32)
    cv.rect(15, 1, 2, 3, STEEL[1])
    cv.rect(14, 0, 4, 1, STEEL[0])
    box(cv, 8, 3, 16, 12, CREAM)
    cv.rect(10, 5, 8, 8, K)
    cv.rect(11, 6, 6, 6, YEL[1])
    cv.rect(11, 6, 6, 1, YEL[0])
    cv.rect(11, 10, 6, 2, YEL[2])
    cv.set(12, 8, K)
    cv.set(13, 9, K)
    cv.set(16, 8, K)
    cv.set(15, 9, K)
    cv.set(12, 11, K)
    cv.set(14, 11, K)
    cv.set(16, 11, K)
    cv.rect(13, 11, 1, 1, K)
    cv.rect(19, 5, 4, 9, CREAM[2])
    cv.rect(20, 5, 2, 2, K)
    cv.set(20, 5, GREEN)
    cv.set(21, 6, GREEN)
    for (x, y, c) in ((20, 8, RED[1]), (21, 8, STEEL[2]), (20, 10, STEEL[2]), (21, 10, RED[1]), (20, 12, STEEL[2]), (21, 12, STEEL[2])):
        cv.set(x, y, c)
    box(cv, 10, 16, 12, 8, DSTEEL)
    for (y, x0, x1) in ((17, 15, 16), (18, 14, 17), (19, 13, 18), (20, 12, 19)):
        cv.rect(x0, y, x1 - x0 + 1, 1, YEL[1])
    cv.rect(15, 18, 2, 1, K)
    cv.rect(15, 19, 2, 1, K)
    cv.rect(15, 20, 2, 1, K)
    for x in (11, 13, 15, 17, 19):
        cv.set(x, 22, DSTEEL[3])
    box(cv, 5, 16, 4, 10, DSTEEL)
    box(cv, 5, 26, 4, 3, GLOVE)
    box(cv, 23, 16, 4, 10, DSTEEL)
    box(cv, 23, 26, 4, 3, GLOVE)
    box(cv, 11, 25, 4, 4, DSTEEL)
    box(cv, 17, 25, 4, 4, DSTEEL)
    box(cv, 10, 29, 5, 2, GLOVE)
    box(cv, 17, 29, 5, 2, GLOVE)
    speckle(cv, [(9, 4), (22, 13), (6, 20), (25, 21), (12, 27)], RUSTR[1])
    o = outline(cv)
    for (x, y, c) in ((13, 1, YEL[0]), (18, 2, YEL[1]), (12, 3, CYAN)):
        o.set(x, y, c)
    return o


# ------------------------------------------------------------------ bulb
def make_bombilla():
    cv = Canvas(32, 32)
    cx, cy, rx, ry = 15.5, 5.5, 6.5, 5.2
    ellipse(cv, cx, cy, rx, ry, hx('#fdf3b8'))
    for y in range(0, 12):
        for x in range(8, 24):
            if cv.p[y][x][3] > 0:
                t = ((x - cx) / rx) * 0.7 + ((y - cy) / ry) * 0.7
                if t > 0.55:
                    cv.p[y][x] = hx('#d9b24a')
                elif t > 0.2:
                    cv.p[y][x] = hx('#ecd37e')
                elif t < -0.7:
                    cv.p[y][x] = hx('#ffffff')
    for (x, y) in ((12, 4), (13, 3), (14, 4), (15, 3), (16, 4), (17, 3), (18, 4), (19, 3)):
        cv.set(x, y, GLOW2)
    cv.rect(12, 6, 3, 2, K)
    cv.rect(17, 6, 3, 2, K)
    cv.set(13, 7, GLOW)
    cv.set(18, 7, GLOW)
    for (x, y) in ((11, 8), (12, 9), (12, 10), (13, 10)):
        cv.set(x, y, K)
    for y in range(11, 15):
        cv.rect(12, y, 8, 1, STEEL[1] if y % 2 == 1 else STEEL[3])
    box(cv, 10, 16, 12, 8, SUIT)
    cv.rect(13, 16, 6, 1, CREAM[0])
    cv.rect(15, 17, 2, 6, RED[1])
    cv.rect(15, 17, 2, 2, RED[0])
    cv.rect(11, 18, 3, 2, CREAM[0])
    cv.set(11, 19, RED[1])
    box(cv, 6, 16, 3, 8, SUIT)
    box(cv, 6, 24, 3, 2, GLOVE)
    box(cv, 23, 16, 3, 7, SUIT)
    box(cv, 23, 23, 3, 2, GLOVE)
    box(cv, 26, 22, 5, 2, DSTEEL)
    box(cv, 11, 25, 4, 4, SUIT)
    box(cv, 17, 25, 4, 4, SUIT)
    box(cv, 10, 29, 5, 2, GLOVE)
    box(cv, 17, 29, 5, 2, GLOVE)
    o = outline(cv)
    o.set(31, 21, CYAN)
    o.set(31, 23, WHITE)
    o.set(30, 20, CYAN)
    return o


# ------------------------------------------------------------------ boss
def make_boss():
    cv = Canvas(56, 64)
    ARM = ramp('#9aa3ba', '#6f7894', '#4c5470', '#343a52')
    # arms first (body overlaps)
    for mir in (False, True):
        def X(x, w):
            return 55 - x - w + 1 if mir else x
        box(cv, X(5, 7), 10, 7, 6, ARM)
        box(cv, X(5, 6), 16, 6, 10, ARM)
        box(cv, X(4, 8), 26, 8, 3, STEEL)
        box(cv, X(5, 6), 29, 6, 8, ARM)
        box(cv, X(3, 9), 37, 9, 9, DSTEEL)
        for fx in (5, 8):
            cv.rect(X(fx, 1), 41, 1, 5, DSTEEL[3])
    # credit card shield in the right hand
    box(cv, 47, 33, 8, 12, YEL)
    cv.rect(49, 36, 3, 3, YEL[3])
    cv.rect(47, 41, 8, 2, K)
    # body
    box(cv, 12, 8, 32, 16, FR)
    box(cv, 12, 25, 32, 28, FR)
    # legs
    box(cv, 16, 54, 9, 6, ARM)
    box(cv, 31, 54, 9, 6, ARM)
    box(cv, 13, 60, 13, 3, DSTEEL)
    box(cv, 30, 60, 13, 3, DSTEEL)
    # crown
    box(cv, 21, 5, 14, 3, YEL)
    for x in (21, 27, 33):
        cv.rect(x, 2, 2, 3, YEL[1])
        cv.set(x, 2, YEL[0])
    cv.set(24, 6, RED[1])
    cv.set(31, 6, RED[1])
    cv.rect(27, 6, 2, 1, CYAN)
    # face
    cv.rect(15, 11, 26, 8, K)
    for (dy, x0) in ((13, 17), (14, 19), (15, 21)):
        cv.rect(x0, dy, 5, 1, RED[1])
        cv.rect(55 - x0 - 4, dy, 5, 1, RED[1])
    cv.rect(17, 13, 5, 1, RED[0])
    cv.rect(34, 13, 5, 1, RED[0])
    cv.rect(21, 16, 5, 1, RED[2])
    cv.rect(30, 16, 5, 1, RED[2])
    # mouth
    cv.rect(17, 27, 22, 1, FR[4])
    cv.rect(18, 28, 20, 13, K)
    cv.rect(19, 33, 18, 3, hx('#1d4a78'))
    for tx in (19, 23, 27, 31, 35):
        box(cv, tx, 29, 3, 4, ICE)
    for tx in (21, 25, 29, 33):
        box(cv, tx, 36, 3, 4, ICE)
    for (x, y) in ((25, 41), (25, 42), (25, 43), (31, 41), (31, 42)):
        cv.set(x, y, ICE[2])
    # handles
    box(cv, 41, 10, 2, 10, ARM)
    box(cv, 41, 28, 2, 18, ARM)
    # magnets, post-it, energy label
    cv.rect(15, 44, 7, 6, YEL[1])
    for (x, y) in ((16, 46), (17, 46), (19, 46), (16, 48), (18, 48)):
        cv.set(x, y, RED[1])
    cv.rect(18, 43, 2, 2, RED[1])
    cv.rect(29, 44, 10, 7, GREEN)
    cv.rect(29, 44, 10, 1, hx('#2f7a41'))
    cv.rect(30, 46, 6, 1, WHITE)
    cv.rect(30, 48, 3, 1, WHITE)
    # frost, dents, rust
    for (x, y) in ((12, 8), (13, 8), (14, 8), (15, 9), (42, 8), (43, 9), (12, 25), (13, 25), (43, 25), (42, 26)):
        cv.set(x, y, ICE[1])
    for (x, y) in ((14, 30), (15, 31), (16, 32), (36, 48), (35, 49), (34, 50), (13, 14), (14, 15)):
        cv.set(x, y, FR[3])
    for (x, y) in ((13, 50), (14, 51), (41, 51), (40, 52), (13, 22), (42, 21)):
        cv.set(x, y, RUSTR[1])
    o = outline(cv)
    for (x, y) in ((14, 6), (15, 5), (40, 6)):
        o.set(x, y, (225, 240, 250, 140))
    return o


# ------------------------------------------------------------------ weapons
def make_secador():
    cv = Canvas(24, 16)
    box(cv, 4, 2, 14, 6, STEEL)
    box(cv, 18, 3, 5, 4, DSTEEL)
    for y in range(3, 7):
        cv.set(22, y, GLOW)
    cv.set(22, 4, GLOW2)
    box(cv, 2, 3, 2, 4, DSTEEL)
    cv.rect(2, 4, 2, 1, K)
    box(cv, 8, 8, 4, 6, DSTEEL)
    cv.rect(12, 8, 1, 2, RED[1])
    cv.rect(10, 3, 1, 4, STEEL[3])
    for (x, y) in ((7, 13), (6, 13), (5, 12), (4, 12)):
        cv.set(x, y, GLOVE[2])
    speckle(cv, [(6, 3), (14, 6)], RUSTR[1])
    return outline(cv)


def make_grapadora():
    cv = Canvas(24, 16)
    box(cv, 4, 2, 18, 5, RED)
    cv.rect(22, 3, 1, 3, K)
    box(cv, 3, 7, 19, 3, STEEL)
    cv.rect(18, 8, 3, 1, K)
    box(cv, 9, 10, 4, 5, DSTEEL)
    cv.rect(13, 10, 1, 2, RED[1])
    cv.set(5, 3, RED[0])
    speckle(cv, [(10, 4), (16, 5)], RED[3])
    return outline(cv)


# ------------------------------------------------------------------ props
def make_caja():
    cv = Canvas(24, 24)
    box(cv, 1, 3, 22, 20, CARD)
    cv.rect(1, 8, 22, 1, CARD[3])
    cv.rect(10, 3, 4, 20, CARD[0])
    cv.rect(16, 12, 5, 5, RED[1])
    cv.set(18, 14, WHITE)
    cv.set(2, 20, CARD[3])
    return outline(cv)


def make_barril():
    cv = Canvas(16, 24)
    box(cv, 2, 2, 12, 20, RED)
    cv.rect(2, 7, 12, 1, RED[3])
    cv.rect(2, 16, 12, 1, RED[3])
    cv.rect(5, 10, 6, 4, YEL[1])
    cv.rect(7, 11, 2, 1, K)
    cv.rect(7, 13, 2, 1, K)
    return outline(cv)


def make_carrito():
    cv = Canvas(28, 24)
    for (x, y) in ((0, 2), (1, 2), (2, 2), (2, 3), (3, 4)):
        cv.set(x, y, STEEL[1])
    cv.rect(4, 4, 22, 1, STEEL[1])
    cv.rect(6, 14, 18, 1, STEEL[2])
    for x in (4, 9, 14, 19, 24):
        cv.rect(x, 4, 1, 11, STEEL[2])
    cv.rect(4, 9, 22, 1, STEEL[2])
    for (x, y, w, h, c) in ((7, 10, 4, 4, RED[1]), (12, 11, 5, 3, YEL[1]), (18, 10, 4, 4, BLUE[1]), (8, 6, 3, 3, GREEN)):
        cv.rect(x, y, w, h, c)
    for x in (8, 21):
        ellipse(cv, x, 19, 2.5, 2.5, GLOVE[1])
        cv.set(x, 19, STEEL[1])
    cv.rect(8, 15, 1, 2, STEEL[3])
    cv.rect(21, 15, 1, 2, STEEL[3])
    return outline(cv)


# ------------------------------------------------------------------ scene
def vignette(cv, strength=0.45):
    cx, cy = cv.w / 2.0, cv.h / 2.0
    md = math.hypot(cx, cy)
    for y in range(cv.h):
        for x in range(cv.w):
            c = cv.p[y][x]
            d = math.hypot(x - cx, y - cy) / md
            f = 1 - strength * (d ** 2.2)
            cv.p[y][x] = (int(c[0] * f), int(c[1] * f), int(c[2] * f), 255)


def bullet5(cv, cx, cy, out, core):
    pat = [".111.", "12221", "12221", "12221", ".111."]
    for j, row in enumerate(pat):
        for i, ch in enumerate(row):
            if ch == '1':
                cv.set(cx - 2 + i, cy - 2 + j, out)
            elif ch == '2':
                cv.set(cx - 2 + i, cy - 2 + j, core)


def shot8(cv, cx, cy):
    pat = ["..1111..", ".122221.", "12233221", "12333321", "12333321", "12233221", ".122221.", "..1111.."]
    cols = {'1': GLOW2, '2': GLOW, '3': YEL[0]}
    for j, row in enumerate(pat):
        for i, ch in enumerate(row):
            if ch != '.':
                cv.set(cx - 4 + i, cy - 4 + j, cols[ch])


def heart(cv, x, y, full=True):
    pat = [".11.11.", "1221111", "1111111", ".11111.", "..111..", "...1..."]
    c1 = RED[1] if full else hx('#3a3f5c')
    c2 = WHITE if full else hx('#4c5374')
    for j, row in enumerate(pat):
        for i, ch in enumerate(row):
            if ch == '1':
                cv.set(x + i, y + j, c1)
            elif ch == '2':
                cv.set(x + i, y + j, c2)


def shadow2(cv, cx, cy, rx, ry, a=105):
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) / float(rx)) ** 2 + ((y - cy) / float(ry)) ** 2 <= 1:
                cv.set(x, y, (8, 6, 16, a))


def shutter(cv, x, y, w, h):
    cv.rect(x, y, w, h, hx('#3a4058'))
    for j in range(y + 2, y + h, 3):
        cv.rect(x, j, w, 1, hx('#2b3048'))
    cv.rect(x, y, w, 1, K)
    cv.rect(x, y, 1, h, K)
    cv.rect(x + w - 1, y, 1, h, K)
    cv.rect(x + w // 2 - 6, y + 4, 12, 4, K)
    cv.rect(x + w // 2 - 4, y + 5, 8, 2, RED[1])
    cv.rect(x + w // 2 - 4, y + 5, 3, 1, RED[0])


def make_scene(G):
    rng = random.Random(23)
    W, H, T = 480, 288, 24
    S = Canvas(W, H, K)
    FA, FB, GR = hx('#3a4060'), hx('#353b58'), hx('#262b40')
    for ty in range(H // T):
        for tx in range(W // T):
            S.rect(tx * T, ty * T, T, T, FA if (tx + ty) % 2 == 0 else FB)
            S.rect(tx * T, ty * T, T, 1, GR)
            S.rect(tx * T, ty * T, 1, T, GR)
            for (ox, oy) in ((2, 2), (T - 3, 2), (2, T - 3), (T - 3, T - 3)):
                S.set(tx * T + ox, ty * T + oy, hx('#58608a'))
                S.set(tx * T + ox + 1, ty * T + oy + 1, hx('#20243a'))
    for y in range(H):
        for x in range(W):
            v = rng.random()
            c = S.p[y][x]
            if v < 0.045:
                S.p[y][x] = (min(255, c[0] + 11), min(255, c[1] + 11), min(255, c[2] + 13), 255)
            elif v < 0.085:
                S.p[y][x] = (max(0, c[0] - 11), max(0, c[1] - 11), max(0, c[2] - 12), 255)
    # grime: oil puddles, rust stains, drain
    for (cx, cy, rx, ry, a) in ((150, 215, 26, 9, 90), (385, 120, 20, 7, 80), (260, 190, 14, 5, 70)):
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                if ((x - cx) / float(rx)) ** 2 + ((y - cy) / float(ry)) ** 2 <= 1 + rng.random() * 0.25 - 0.1:
                    S.set(x, y, (12, 10, 22, a))
    for (cx, cy) in ((90, 120), (330, 235), (430, 200)):
        for i in range(26):
            S.set(cx + rng.randint(-6, 6), cy + rng.randint(-4, 4), hx('#6e4a34'))
    S.rect(216, 244, 48, 14, hx('#1a1d2e'))
    for x in range(218, 262, 4):
        S.rect(x, 246, 2, 10, hx('#3a4058'))
    # painted safety lines
    dash = hx('#8a7424')
    for x in range(40, 440):
        if (x // 10) % 2 == 0:
            S.set(x, 60, dash)
            S.set(x, 252, dash)
    for y in range(60, 253):
        if (y // 10) % 2 == 0:
            S.set(40, y, dash)
            S.set(439, y, dash)
    # walls
    WALL = hx('#222638')
    S.rect(0, 0, W, 48, WALL)
    S.rect(0, 0, T, H, WALL)
    S.rect(W - T, 0, T, H, WALL)
    S.rect(0, H - T, W, T, WALL)
    for x in range(0, W, 48):
        S.rect(x, 0, 1, 48, hx('#1a1d2c'))
    for y in range(48, H - T, 48):
        S.rect(0, y, T, 1, hx('#1a1d2c'))
        S.rect(W - T, y, T, 1, hx('#1a1d2c'))
    # ceiling pipe + lamps
    S.rect(0, 2, W, 5, hx('#3e4560'))
    S.rect(0, 2, W, 1, hx('#5d658a'))
    S.rect(0, 6, W, 1, hx('#262b40'))
    for x in range(30, W, 90):
        S.rect(x, 1, 3, 7, hx('#2a2f48'))
    for lx in (110, 340):
        S.rect(lx, 8, 44, 3, hx('#cfc9a8'))
        S.rect(lx + 2, 11, 40, 1, hx('#f4f1e8'))
    # shelves
    colors = ['#c23d38', '#d9a52a', '#3f74bd', '#4b9a4e', '#d3849a', '#d9782a', '#5cc2c0', '#a8916c', '#aab1c4']
    for (plank_y, hmax, hmin) in ((26, 14, 8), (40, 11, 7)):
        x = 26
        while x < 452:
            w = rng.randint(8, 15)
            h = rng.randint(hmin, hmax)
            col = hx(rng.choice(colors))
            dark = (int(col[0] * .7), int(col[1] * .7), int(col[2] * .7), 255)
            S.rect(x, plank_y - h, w, h, col)
            S.rect(x + w - 2, plank_y - h, 2, h, dark)
            S.rect(x, plank_y - h, w, 1, (255, 255, 255, 60))
            if rng.random() < .5:
                S.rect(x + 2, plank_y - h // 2, max(1, w - 6), 1, WHITE)
            x += w + rng.randint(1, 4)
        S.rect(0, plank_y, W, 2, hx('#4c5374'))
        S.rect(0, plank_y, W, 1, hx('#5d658a'))
    S.rect(0, 47, W, 1, K)
    # hazard stripes inner edges
    ya, yb = hx('#b08a1c'), hx('#191622')
    for y in range(48, H - T):
        for x in range(T - 5, T):
            S.set(x, y, ya if ((x + y) // 4) % 2 == 0 else yb)
        for x in range(W - T, W - T + 5):
            S.set(x, y, ya if ((x + y) // 4) % 2 == 0 else yb)
    for x in range(T, W - T):
        for y in range(H - T, H - T + 5):
            S.set(x, y, ya if ((x + y) // 4) % 2 == 0 else yb)
    shutter(S, 216, 14, 48, 33)
    shutter(S, 216, H - T, 48, 24)
    # light pools
    for (cx, cy, rx, ry) in ((132, 150, 90, 60), (362, 150, 90, 60)):
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                d = ((x - cx) / float(rx)) ** 2 + ((y - cy) / float(ry)) ** 2
                if d <= 1 and y >= 48 and 24 <= x < W - 24:
                    S.set(x, y, (255, 226, 150, int(26 * (1 - d))))

    ents = []

    def put(spr, x, y, w=None):
        ents.append((y + spr.h, spr, x, y))

    put(G['caja'], 30, 54)
    put(G['barril'], 428, 54)
    put(G['carrito'], 30, 222)
    put(G['caja'], 424, 224)
    put(G['barril'], 408, 232)
    hx0, hy0 = 84, 150
    put(G['hero'], hx0, hy0)
    put(G['aspirador'], 350, 190)
    put(G['microondas'], 310, 86)
    put(G['bombilla'], 200, 100)
    ents.sort(key=lambda e: e[0])
    for (b, spr, x, y) in ents:
        shadow2(S, x + spr.w // 2, y + spr.h - 1, max(6, spr.w // 2 - 3), 3)
    for (dx, dy, dw) in ((384, 202, 14), (388, 208, 18), (384, 214, 12), (390, 196, 10)):
        S.rect(dx, dy, dw, 1, hx('#7c84a0'))
    for (b, spr, x, y) in ents:
        S.blit(spr, x, y)
        if spr is G['hero']:
            S.blit(G.get('arma', G['secador']), x + WOFF[0], y + WOFF[1])
    cx, cy = 326, 102
    for k in range(12):
        a = math.radians(k * 30)
        bullet5(S, round(cx + 34 * math.cos(a)), round(cy + 34 * math.sin(a)), RED[1], WHITE)
    for k in range(18):
        a = math.radians(10 + k * 20)
        bullet5(S, round(cx + 56 * math.cos(a)), round(cy + 56 * math.sin(a)), RED[1], WHITE)
    bx, by = 216, 112
    for i in range(11):
        a = math.radians(i * 40)
        rr = 22 + i * 3
        bullet5(S, round(bx + rr * math.cos(a)), round(by + rr * math.sin(a)), ICE[2], WHITE)
    for t in (.12, .27, .42):
        shot8(S, round(SHOT[0] + 220 * t), round(SHOT[1] + 40 * t))
    rx, ry = 366, 206
    for d in (4, 5, 6, 7):
        for (ox, oy) in ((d, 0), (-d, 0), (0, d), (0, -d)):
            S.set(rx + ox, ry + oy, WHITE)
    S.set(rx, ry, RED[1])
    vignette(S, 0.5)
    S.rect(18, 6, 44, 18, (10, 8, 20, 190))
    for i, full in enumerate((True, True, False)):
        heart(S, 24 + i * 12, 12, full)
    S.rect(368, 4, 106, 26, (10, 8, 20, 190))
    for i, name in enumerate(('pila', 'manual', 'garantia')):
        S.blit(G[name], 376 + i * 32, 9)
    return S


def main():
    G = {k: grid(k, v) for k, v in SPR.items()}
    G2 = {}
    makers = {'hero': make_hero, 'aspirador': make_aspirador, 'microondas': make_microondas,
              'bombilla': make_bombilla, 'boss': make_boss, 'secador': make_secador,
              'grapadora': make_grapadora, 'caja': make_caja, 'barril': make_barril, 'carrito': make_carrito}
    for n, f in makers.items():
        G2[n] = f()
    # hand grids for scene use (Canvas -> grid of tuples)
    SC = {}
    for n, cv in G2.items():
        spr = type('S', (), {})()
        SC[n] = cv
    # Canvas objects act as sprites: provide .p rows for blit
    class Wrap(list):
        pass
    scene_G = {}
    for n, cv in G2.items():
        g = Wrap([[(c if c[3] > 0 else None) for c in row] for row in cv.p])
        g.w, g.h = cv.w, cv.h
        scene_G[n] = g
    for n in ('pila', 'manual', 'garantia', 'ticket'):
        g = Wrap(G[n])
        g.w, g.h = 16, 16
        scene_G[n] = g
    for n, cv in G2.items():
        save(cv, "%s/%s2.png" % (OUT2, n))
    scene = make_scene(scene_G)
    save(scene, OUT2 + "/scene2.png")
    sheet = Canvas(300, 80, hx('#1a1e2b'))
    x = 4
    for n in ('hero', 'aspirador', 'microondas', 'bombilla'):
        sheet.blit(scene_G[n], x, 4)
        x += scene_G[n].w + 4
    sheet.blit(scene_G['boss'], x, 4)
    x += 60
    sheet.blit(scene_G['secador'], x, 4)
    sheet.blit(scene_G['grapadora'], x, 24)
    sheet.blit(scene_G['caja'], x, 44)
    sheet.blit(scene_G['barril'], x + 28, 44)
    sheet.blit(scene_G['carrito'], x + 48, 44)
    save(scaled(sheet, 4), BASE + "/preview_sprites2.png")
    save(scaled(scene, 2), BASE + "/preview_scene2.png")
    print("ok")


if __name__ == "__main__":
    main()
