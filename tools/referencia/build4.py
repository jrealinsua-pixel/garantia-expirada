import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build2
from build2 import *
from build import SPR, grid

OUT4 = BASE + "/assets4"
os.makedirs(OUT4, exist_ok=True)

TOPS = ramp('#f2f4f8', '#d3d8e4', '#aab1c4', '#7d8499')
PINK = ramp('#f7c0cc', '#e88fa4', '#bd6680', '#86435c')
TOASTC = ramp('#f2cf8c', '#d9a35a', '#a8702f', '#6b4220')
FRT = ramp('#ffffff', '#e2e7f0', '#b9c1d3', '#8a93ab')
SUITB = ramp('#5d6386', '#40445f', '#2c2f45', '#1b1d2e')


def clear(cv, pts):
    for (x, y) in pts:
        if 0 <= x < cv.w and 0 <= y < cv.h:
            cv.p[y][x] = (0, 0, 0, 0)


def cube(cv, x, y, w, h, sw, th, F, S, T):
    """3/4 box seen from the front-right: top face, darker side face on the left, front face on the right."""
    # top face (slanted: starts one pixel in on each row going up)
    for j in range(th):
        cv.rect(x + (th - j) // 2, y + j, w - (th - j) // 2, 1, T[1] if j else T[0])
    # side face
    cv.rect(x, y + th, sw, h - th, S[1])
    cv.rect(x, y + th, 1, h - th, S[2])
    cv.rect(x + sw - 1, y + th, 1, h - th, S[3])
    # front face
    cv.rect(x + sw, y + th, w - sw, h - th, F[1])
    cv.rect(x + sw, y + th, w - sw, 1, F[0])
    cv.rect(x + w - 1, y + th, 1, h - th, F[2])
    cv.rect(x + sw, y + h - 2, w - sw, 2, F[2])
    cv.rect(x, y + h - 1, sw, 1, S[3])
    clear(cv, [(x, y), (x + 1, y), (x, y + 1), (x + w - 1, y), (x + w - 1, y + h - 1), (x, y + h - 1)])


def hand(cv, x, y, R=GLOVE):
    cv.rect(x, y, 3, 3, R[1])
    cv.set(x, y, R[0])
    cv.set(x + 2, y + 2, R[2])
    clear(cv, [])


SNEAK = ramp('#f4f1e8', '#d64a3e', '#9e2f33', '#5e1d24')
OFFICE = ramp('#5a5f7a', '#262a3e', '#16182a', '#0e0c16')
RUBBER = ramp('#d6cdb2', '#a89f86', '#756e5a', '#4a4538')
PANTL = ramp('#6a708c', '#454a66', '#2e3250', '#1c1f36')


def feet(cv, xb, xf, y, R=GLOVE, L=4, leg=PANTL, shoe=None):
    """Legs of length L plus shoes. Back leg slightly behind, front leg mid-stride."""
    shoe = shoe or R
    cv.rect(xb + 1, y, 2, L, leg[2])
    cv.set(xb + 1, y, leg[3])
    cv.rect(xf + 1, y, 2, L, leg[1])
    cv.set(xf + 1, y, leg[0])
    yb = y + L
    cv.rect(xb, yb, 4, 2, shoe[2])
    cv.set(xb, yb, shoe[1])
    cv.rect(xf, yb, 5, 2, shoe[1])
    cv.rect(xf, yb, 4, 1, shoe[0])
    cv.rect(xf, yb + 1, 5, 1, shoe[2])


def pad(cv, top):
    out = Canvas(cv.w, cv.h + top)
    for y in range(cv.h):
        out.p[y + top] = list(cv.p[y])
    return out


BURNT = ramp('#8a5a34', '#5c3a22', '#3e2616', '#24160c')
SMOKE = [(150, 150, 165, 200), (120, 120, 138, 170), (95, 95, 110, 140)]


def eyes(cv, xs, y, lid=None, glow=None):
    for x in xs:
        cv.rect(x, y, 2, 3, K)
        cv.set(x, y, glow or WHITE)
        if lid:
            cv.rect(x, y, 2, 1, lid)


def flip(cv):
    out = Canvas(cv.w, cv.h)
    for y in range(cv.h):
        out.p[y] = list(reversed(cv.p[y]))
    return out


# ------------------------------------------------------------------ weapons
def mini_dryer():
    cv = Canvas(18, 11)
    box(cv, 0, 2, 3, 4, DSTEEL)
    cv.rect(1, 3, 1, 2, K)
    box(cv, 2, 1, 10, 6, PINK)
    cv.rect(3, 2, 6, 1, PINK[0])
    cv.rect(5, 3, 1, 3, PINK[2])
    box(cv, 12, 2, 5, 4, DSTEEL)
    cv.rect(16, 2, 1, 4, GLOW)
    cv.set(16, 3, GLOW2)
    cv.set(16, 4, GLOW2)
    box(cv, 5, 7, 3, 4, PINK)
    cv.set(8, 7, RED[1])
    return outline(cv)


def mini_stapler():
    cv = Canvas(18, 11)
    box(cv, 1, 1, 15, 4, RED)
    cv.rect(2, 1, 10, 1, RED[0])
    box(cv, 0, 5, 17, 2, STEEL)
    cv.rect(14, 5, 2, 1, K)
    box(cv, 5, 7, 3, 4, DSTEEL)
    cv.set(8, 7, YEL[1])
    return outline(cv)


# ------------------------------------------------------------------ hero: toaster
def make_hero(with_gun=True):
    cv = Canvas(40, 36)
    hand(cv, 9, 21)
    feet(cv, 12, 18, 25, L=4, shoe=SNEAK)
    box(cv, 12, 19, 10, 6, DSTEEL)
    cv.rect(12, 22, 10, 1, YEL[1])
    for x in (13, 16, 19):
        cv.set(x, 22, K)
    cube(cv, 6, 5, 22, 15, 5, 4, STEEL, DSTEEL, TOPS)
    # slots + toast (the second slice is burnt)
    for (sx, top, T) in ((14, 0, TOASTC), (20, 1, BURNT)):
        cv.rect(sx - 1, 7, 6, 1, K)
        cv.rect(sx, top, 4, 8 - top, T[1])
        cv.rect(sx, top, 4, 1, T[3])
        cv.rect(sx, top, 1, 8 - top, T[2])
        cv.rect(sx + 3, top, 1, 8 - top, T[3])
        cv.set(sx + 1, top + 2, T[0])
        cv.set(sx + 2, top + 3, T[2])
    # band-aid on the side
    cv.rect(7, 9, 4, 2, hx('#e9c9a8'))
    cv.set(8, 9, hx('#c99a7a'))
    cv.set(9, 10, hx('#c99a7a'))
    # side lever
    cv.rect(8, 11, 1, 6, K)
    cv.rect(7, 13, 3, 2, RED[1])
    cv.set(7, 13, RED[0])
    # face
    # tired, fed-up eyes: heavy lids, bags underneath
    for ex in (18, 24):
        cv.rect(ex, 11, 3, 4, K)
        cv.rect(ex, 11, 3, 2, STEEL[3])
        cv.rect(ex - 1, 11, 4, 1, K)
        cv.set(ex + 1, 13, WHITE)
        cv.rect(ex, 15, 3, 1, STEEL[2])
    # lopsided frown
    cv.rect(21, 17, 3, 1, K)
    cv.set(20, 18, K)
    cv.set(24, 16, K)
    # sticker and wear
    cv.rect(12, 14, 4, 3, YEL[1])
    cv.rect(12, 15, 4, 1, RED[1])
    for (x, y) in ((26, 10), (27, 11), (13, 18), (25, 17), (10, 9), (17, 11)):
        cv.set(x, y, RUSTR[1])
    cv.rect(13, 10, 2, 1, STEEL[0])
    if with_gun:
        g = mini_dryer()
        for y in range(g.h):
            for x in range(g.w):
                c = g.p[y][x]
                if c[3]:
                    cv.set(x + 20, y + 17, c)
        hand(cv, 25, 24)
    o = outline(cv)
    # frayed cord tail dragging on the floor
    for (x, y) in ((11, 24), (10, 25), (9, 26), (8, 27), (7, 28), (6, 29), (5, 30), (4, 31), (3, 31)):
        o.set(x, y, K)
    o.set(2, 31, STEEL[1])
    o.set(2, 30, GLOW)
    # crumbs
    for (x, y) in ((24, 30), (27, 33), (9, 33)):
        o.set(x, y, TOASTC[1])
    o = pad(o, 5)
    # smoke from the burnt slice
    for (x, y, k) in ((22, 4, 0), (23, 3, 0), (22, 2, 1), (21, 1, 1), (22, 0, 2), (24, 2, 1)):
        o.set(x, y, SMOKE[k])
    return o


# ------------------------------------------------------------------ vacuum
def make_aspirador():
    cv = Canvas(32, 36)
    hand(cv, 6, 20, BLUE)
    # legs on roller skates
    feet(cv, 9, 14, 24, L=4, shoe=ramp('#8fb5e6', '#5f93d4', '#3f66a6', '#27447a'))
    for wx in (10, 12, 15, 17):
        cv.rect(wx, 30, 2, 2, K)
        cv.set(wx, 30, STEEL[2])
    box(cv, 9, 19, 9, 5, GLOVE)
    # price tag hanging from the handle: -70 %
    for (x, y) in ((9, 2), (8, 3), (7, 4)):
        cv.set(x, y, CREAM[2])
    cv.rect(2, 4, 6, 4, WHITE)
    cv.rect(3, 5, 4, 1, RED[1])
    cv.rect(3, 6, 2, 1, RED[1])
    cv.set(2, 4, CREAM[2])
    # handle
    cv.rect(10, 1, 9, 2, DSTEEL[1])
    cv.rect(10, 1, 9, 1, DSTEEL[0])
    cv.rect(10, 1, 2, 5, DSTEEL[1])
    cv.rect(17, 1, 2, 5, DSTEEL[2])
    cube(cv, 3, 5, 22, 15, 5, 3, BLUE, ramp('#3f66a6', '#2f4f88', '#22396a', '#16264a'), ramp('#c6dcf6', '#8fb5e6', '#5f93d4', '#3f66a6'))
    # visor + cyclops eye
    cv.rect(13, 10, 12, 5, K)
    cv.rect(14, 11, 10, 3, hx('#2a0f18'))
    cv.rect(19, 11, 4, 3, RED[1])
    cv.rect(20, 11, 2, 2, RED[0])
    cv.set(20, 11, WHITE)
    # angry brow plate over the visor
    for i in range(8):
        cv.set(16 + i, 9 + (i // 3), K)
    # gritted grille
    for x in range(16, 24, 2):
        cv.set(x, 16, K)
    # dust bag window
    cv.rect(4, 11, 3, 6, BROWN[2])
    cv.set(5, 12, BROWN[0])
    cv.set(4, 15, GREEN)
    cv.rect(10, 16, 7, 1, BLUE[3])
    for (x, y) in ((23, 8), (12, 18), (4, 9)):
        cv.set(x, y, RUSTR[1])
    # hose to a floor nozzle in front
    pts = [(25, 15), (26, 16), (27, 17), (28, 18), (28, 19), (28, 20), (27, 21), (27, 22), (27, 23)]
    for (x, y) in pts:
        cv.rect(x, y, 2, 1, DSTEEL[1] if y % 2 else DSTEEL[3])
    for (x, y) in ((27, 24), (27, 25), (27, 26), (26, 27)):
        cv.rect(x, y, 2, 1, DSTEEL[1] if y % 2 else DSTEEL[3])
    box(cv, 23, 28, 9, 3, STEEL)
    cv.rect(23, 30, 9, 1, K)
    hand(cv, 25, 19, BLUE)
    o = outline(cv)
    # dust it kicks up behind
    for (x, y, k) in ((5, 31, 0), (3, 30, 1), (2, 32, 2), (6, 33, 1)):
        o.set(x, y, SMOKE[k])
    return o


# ------------------------------------------------------------------ microwave
def make_microondas():
    cv = Canvas(32, 36)
    hand(cv, 5, 21, CREAM)
    feet(cv, 10, 16, 25, L=4, shoe=RUBBER)
    box(cv, 10, 20, 10, 5, DSTEEL)
    cv.rect(10, 22, 10, 1, CREAM[2])
    # fork stuck in the top
    for i in range(6):
        cv.set(18 + i // 2, 1 + i, STEEL[1])
    cv.rect(19, 0, 4, 1, STEEL[0])
    for x in (19, 21):
        cv.set(x, 1, STEEL[2])
    cube(cv, 3, 5, 25, 16, 4, 3, CREAM, ramp('#a89f86', '#8a8270', '#6c6556', '#4a4538'), ramp('#fffaf0', '#efe8d4', '#d6cdb2', '#a89f86'))
    # door window with a face inside
    cv.rect(8, 10, 13, 9, K)
    cv.rect(9, 11, 11, 7, YEL[2])
    cv.rect(9, 11, 11, 2, YEL[1])
    cv.rect(10, 11, 2, 1, YEL[0])
    cv.rect(12, 13, 2, 2, K)
    cv.rect(17, 13, 2, 2, K)
    cv.set(11, 12, K)
    cv.set(12, 12, K)
    cv.set(19, 12, K)
    cv.set(18, 12, K)
    # shouting mouth inside the door
    cv.rect(13, 15, 5, 3, K)
    cv.rect(14, 16, 3, 1, RED[2])
    cv.rect(13, 15, 5, 1, WHITE)
    for x in range(9, 20, 3):
        cv.set(x, 17, YEL[3])
    # control panel
    # the eternal blinking 12:00
    cv.rect(22, 9, 4, 3, K)
    for x in (22, 23, 25):
        cv.set(x, 10, GREEN)
    for (x, y, c) in ((22, 13, RED[1]), (24, 13, STEEL[2]), (22, 15, STEEL[2]), (24, 15, STEEL[2]), (22, 17, STEEL[2]), (24, 17, RED[1])):
        cv.rect(x, y, 2, 1, c)
    for (x, y) in ((4, 9), (26, 19), (6, 18), (20, 8)):
        cv.set(x, y, RUSTR[1])
    hand(cv, 24, 21, CREAM)
    o = outline(cv)
    o = pad(o, 4)
    # sparks from the fork, steam from the vents
    for (x, y, c) in ((17, 4, YEL[0]), (24, 5, CYAN), (25, 3, YEL[1]), (23, 2, WHITE)):
        o.set(x, y, c)
    for (x, y, k) in ((8, 6, 0), (7, 4, 1), (8, 2, 2), (11, 5, 1), (12, 3, 2)):
        o.set(x, y, SMOKE[k])
    return o


# ------------------------------------------------------------------ bulb
def make_bombilla():
    cv = Canvas(32, 36)
    feet(cv, 11, 17, 26, L=4, leg=SUITB, shoe=OFFICE)
    box(cv, 11, 21, 10, 5, SUITB)
    cv.rect(15, 21, 3, 3, CREAM[0])
    # loosened tie
    cv.set(16, 21, RED[1])
    cv.set(17, 22, RED[1])
    cv.rect(17, 23, 1, 2, RED[1])
    cv.set(19, 22, CREAM[0])
    # "#1 JEFE" mug in the back hand
    box(cv, 4, 20, 5, 5, CREAM)
    cv.rect(5, 22, 3, 1, RED[1])
    cv.set(3, 22, CREAM[2])
    cv.set(3, 23, CREAM[2])
    hand(cv, 7, 22, GLOVE)
    # screw base
    for y in range(16, 21):
        cv.rect(12, y, 8, 1, STEEL[1] if y % 2 == 0 else STEEL[3])
    cv.rect(13, 20, 6, 1, DSTEEL[2])
    # glass
    cx, cy, rx, ry = 16, 8.5, 9.5, 8.3
    for y in range(0, 18):
        for x in range(4, 28):
            dx, dy = (x - cx) / rx, (y - cy) / ry
            if dx * dx + dy * dy <= 1:
                t = 0.75 * dx + 0.6 * dy
                c = hx('#fff9d6') if t < -0.6 else hx('#f9eba0') if t < 0.15 else hx('#e3c96a') if t < 0.6 else hx('#b8973e')
                cv.set(x, y, c)
    cv.rect(9, 3, 2, 1, WHITE)
    cv.rect(8, 4, 1, 2, WHITE)
    # filament face (looking right)
    cv.rect(13, 14, 1, 3, STEEL[3])
    cv.rect(19, 14, 1, 3, STEEL[3])
    for ex in (16, 22):
        cv.rect(ex, 8, 2, 3, K)
        cv.set(ex, 8, GLOW)
    for i in range(4):
        cv.set(15 + i, 5 + i // 2, K)
        cv.set(24 - i, 5 + i // 2, K)
    # smug half-grin
    cv.rect(18, 13, 5, 1, K)
    cv.set(23, 12, K)
    cv.rect(19, 13, 3, 1, hx('#8f7a3a'))
    cv.rect(18, 13, 1, 1, K)
    # filament supports
    cv.rect(14, 12, 1, 4, STEEL[3])
    cv.rect(17, 14, 1, 2, STEEL[3])
    cv.rect(14, 12, 4, 1, GLOW2)
    # crack
    for (x, y) in ((22, 2), (23, 3), (22, 4), (23, 5), (24, 6)):
        cv.set(x, y, hx('#8f7a3a'))
    # briefcase in front hand
    box(cv, 22, 24, 8, 5, BROWN)
    cv.rect(25, 23, 3, 1, BROWN[3])
    cv.rect(25, 26, 2, 1, YEL[1])
    hand(cv, 23, 22, GLOVE)
    o = outline(cv)
    o = pad(o, 3)
    # a moth that won't leave it alone
    MOTH = hx('#b8a07a')
    for (x, y, c) in ((27, 3, MOTH), (29, 3, MOTH), (28, 4, K), (27, 4, hx('#8a7454')), (29, 4, hx('#8a7454'))):
        o.set(x, y, c)
    for (x, y) in ((26, 6), (25, 8)):
        o.set(x, y, (200, 200, 210, 120))
    return o


# ------------------------------------------------------------------ boss: fridge
def make_boss():
    cv = Canvas(72, 76)
    # back hand
    for (x, y) in ((4, 36),):
        cv.rect(x, y, 7, 7, GLOVE[1])
        cv.rect(x, y, 6, 1, GLOVE[0])
        cv.rect(x + 6, y, 1, 7, GLOVE[2])
    # stubby but proper legs and feet
    cv.rect(21, 62, 5, 8, PANTL[2])
    cv.rect(41, 62, 5, 8, PANTL[1])
    cv.rect(41, 62, 1, 8, PANTL[0])
    cv.rect(18, 69, 10, 4, GLOVE[2])
    cv.rect(18, 69, 9, 1, GLOVE[1])
    cv.rect(38, 69, 12, 4, GLOVE[1])
    cv.rect(38, 69, 11, 1, GLOVE[0])
    cube(cv, 10, 6, 46, 58, 9, 5, FRT, ramp('#a7b0c4', '#8790a8', '#6a7390', '#4a5170'), ramp('#ffffff', '#eef2f8', '#c9d0de', '#99a3ba'))
    # crown on top face
    box(cv, 26, 2, 18, 4, YEL)
    for x in (26, 34, 42):
        cv.rect(x, 0, 2, 2, YEL[1])
    cv.rect(33, 3, 3, 2, RED[1])
    cv.set(28, 3, CYAN)
    cv.set(40, 3, CYAN)
    # door seam
    cv.rect(19, 25, 37, 1, FRT[3])
    cv.rect(19, 26, 37, 1, FRT[0])
    # handles on the left of the front
    for (y0, h) in ((13, 9), (30, 22)):
        cv.rect(21, y0, 2, h, STEEL[2])
        cv.rect(21, y0, 1, h, STEEL[1])
        cv.rect(23, y0, 1, h, K)
    # eyes on the freezer door, angry, looking right
    for ex in (32, 45):
        cv.rect(ex, 14, 7, 7, K)
        cv.rect(ex + 2, 16, 4, 4, RED[1])
        cv.rect(ex + 3, 16, 2, 2, RED[0])
        cv.set(ex + 3, 16, WHITE)
    for i in range(8):
        cv.set(31 + i, 11 + i // 3, K)
        cv.set(31 + i, 12 + i // 3, K)
        cv.set(52 - i, 11 + i // 3, K)
        cv.set(52 - i, 12 + i // 3, K)
    # open-mouth fridge interior with ice teeth
    cv.rect(27, 31, 26, 17, K)
    cv.rect(28, 32, 24, 15, hx('#1d3d63'))
    cv.rect(28, 39, 24, 1, hx('#69a8d8'))
    for tx in range(28, 52, 4):
        box(cv, tx, 32, 3, 4, ICE)
    for tx in range(30, 50, 4):
        box(cv, tx, 43, 3, 4, ICE)
    cv.rect(31, 38, 3, 1, GREEN)
    cv.rect(44, 38, 4, 1, RED[1])
    # magnets, energy label, post-it
    cv.rect(41, 51, 11, 8, GREEN)
    cv.rect(41, 51, 11, 1, hx('#2f7a41'))
    cv.rect(42, 53, 7, 1, WHITE)
    cv.rect(42, 55, 4, 1, WHITE)
    cv.rect(42, 57, 2, 1, WHITE)
    cv.rect(27, 51, 8, 7, YEL[1])
    cv.rect(28, 53, 5, 1, YEL[3])
    cv.rect(28, 55, 4, 1, YEL[3])
    cv.rect(30, 50, 2, 2, RED[1])
    # side vent and wear
    for y in range(40, 58, 3):
        cv.rect(12, y, 6, 1, hx('#4a5170'))
    for (x, y) in ((14, 13), (15, 14), (54, 58), (53, 59), (11, 60), (25, 60), (50, 28)):
        cv.set(x, y, RUSTR[1])
    for (x, y) in ((20, 12), (21, 11), (55, 12), (54, 11)):
        cv.set(x, y, ICE[1])
    # front hand with loyalty card
    box(cv, 56, 38, 13, 9, YEL)
    cv.rect(56, 41, 13, 2, K)
    cv.rect(58, 44, 4, 1, YEL[3])
    cv.rect(64, 44, 3, 2, RED[1])
    cv.rect(54, 44, 7, 7, GLOVE[1])
    cv.rect(54, 44, 6, 1, GLOVE[0])
    cv.rect(60, 44, 1, 7, GLOVE[2])
    o = outline(cv)
    for (x, y) in ((8, 8), (9, 7), (62, 10)):
        o.set(x, y, (225, 240, 250, 140))
    return o


def wrap(cv):
    g = type('W', (list,), {})([[(c if c[3] > 0 else None) for c in row] for row in cv.p])
    g.w, g.h = cv.w, cv.h
    return g


def main():
    G0 = {k: grid(k, v) for k, v in SPR.items()}
    chars = {'hero': make_hero(), 'aspirador': make_aspirador(), 'microondas': make_microondas(),
             'bombilla': make_bombilla(), 'boss': make_boss()}
    for n, cv in chars.items():
        save(cv, "%s/%s4.png" % (OUT4, n))
    save(mini_dryer(), OUT4 + "/secador4.png")
    save(mini_stapler(), OUT4 + "/grapadora4.png")
    G = {'hero': wrap(chars['hero'])}
    G['aspirador'] = wrap(flip(chars['aspirador']))
    G['microondas'] = wrap(flip(chars['microondas']))
    G['bombilla'] = wrap(flip(chars['bombilla']))
    empty = Canvas(1, 1)
    G['arma'] = wrap(empty)
    G['secador'] = wrap(empty)
    for n, f in (('caja', build2.make_caja), ('barril', build2.make_barril), ('carrito', build2.make_carrito)):
        G[n] = wrap(f())
    for n in ('pila', 'manual', 'garantia'):
        g = type('W', (list,), {})(G0[n])
        g.w, g.h = 16, 16
        G[n] = g
    build2.SHOT = (128, 172)
    scene = build2.make_scene(G)
    save(scene, OUT4 + "/scene4.png")
    sheet = Canvas(260, 84, hx('#1a1e2b'))
    x = 4
    for n in ('hero', 'aspirador', 'microondas', 'bombilla'):
        sheet.blit(wrap(chars[n]), x, 80 - chars[n].h)
        x += chars[n].w + 4
    sheet.blit(wrap(chars['boss']), x, 4)
    save(scaled(sheet, 4), BASE + "/preview_sprites4.png")
    save(scaled(scene, 2), BASE + "/preview_scene4.png")
    print("ok")


main()
