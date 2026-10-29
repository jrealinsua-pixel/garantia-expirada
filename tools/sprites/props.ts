// Props, bullets, effects and HUD pieces. Props and bullets are ports of tools/referencia/build2.py.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { BLUE, BROWN, BURNT, CARD, CREAM, GLOVE, GLOW, GLOW2, GREEN, ICE, K, RED, STEEL, TOASTC, WHITE, YEL, box, ellipse, hand, outline, ramp, type Ramp } from '../../src/art/lib.ts';

export function makeCaja(): Canvas {
  const cv = new Canvas(24, 24);
  box(cv, 1, 3, 22, 20, CARD);
  cv.rect(1, 8, 22, 1, CARD[3]!);
  cv.rect(10, 3, 4, 20, CARD[0]!);
  cv.rect(16, 12, 5, 5, RED[1]!);
  cv.set(18, 14, WHITE);
  cv.set(2, 20, CARD[3]!);
  return outline(cv);
}

export function makeBarril(): Canvas {
  const cv = new Canvas(16, 24);
  box(cv, 2, 2, 12, 20, RED);
  cv.rect(2, 7, 12, 1, RED[3]!);
  cv.rect(2, 16, 12, 1, RED[3]!);
  cv.rect(5, 10, 6, 4, YEL[1]!);
  cv.rect(7, 11, 2, 1, K);
  cv.rect(7, 13, 2, 1, K);
  return outline(cv);
}

export function makeCarrito(): Canvas {
  const cv = new Canvas(28, 24);
  for (const [x, y] of [[0, 2], [1, 2], [2, 2], [2, 3], [3, 4]] as const) cv.set(x, y, STEEL[1]!);
  cv.rect(4, 4, 22, 1, STEEL[1]!);
  cv.rect(6, 14, 18, 1, STEEL[2]!);
  for (const x of [4, 9, 14, 19, 24]) cv.rect(x, 4, 1, 11, STEEL[2]!);
  cv.rect(4, 9, 22, 1, STEEL[2]!);
  const goods: Array<[number, number, number, number, RGBA]> = [[7, 10, 4, 4, RED[1]!], [12, 11, 5, 3, YEL[1]!], [18, 10, 4, 4, BLUE[1]!], [8, 6, 3, 3, GREEN]];
  for (const [x, y, w, h, c] of goods) cv.rect(x, y, w, h, c);
  for (const x of [8, 21]) {
    ellipse(cv, x, 19, 2.5, 2.5, GLOVE[1]!);
    cv.set(x, 19, STEEL[1]!);
  }
  cv.rect(8, 15, 1, 2, STEEL[3]!);
  cv.rect(21, 15, 1, 2, STEEL[3]!);
  return outline(cv);
}

/** Player shot: 8x8 orange ball with a yellow core (build2.shot8). */
export function makeShot(): Canvas {
  const cv = new Canvas(8, 8);
  const pat = ['..1111..', '.122221.', '12233221', '12333321', '12333321', '12233221', '.122221.', '..1111..'];
  const cols: Record<string, RGBA> = { '1': GLOW2, '2': GLOW, '3': YEL[0]! };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/** Enemy bullet: 5x5 saturated ring with a white core (build2.bullet5). */
export function makeEnemyBullet(out: RGBA): Canvas {
  const cv = new Canvas(5, 5);
  const pat = ['.111.', '12221', '12221', '12221', '.111.'];
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, ch === '1' ? out : WHITE)));
  return cv;
}

export const enemyBulletRed = (): Canvas => makeEnemyBullet(RED[1]!);
export const enemyBulletCyan = (): Canvas => makeEnemyBullet(ICE[2]!);

/** The floating front hand (3x3 plus outline). */
export function makeHand(): Canvas {
  const cv = new Canvas(5, 5);
  hand(cv, 1, 1);
  return outline(cv);
}

/** Muzzle flash: 2 frames of 12x10, hot air blast pointing right. */
export function makeMuzzle(): Canvas {
  const sheet = new Canvas(24, 10);
  const f0 = ['....11......', '..112211....', '.12233221...', '1233333221..', '1233333221..', '.12233221...', '..112211....', '....11......'];
  const f1 = ['......1.....', '...1122.1...', '..12332211..', '.123333321.1', '.123333321..', '..12332211..', '...1122.1...', '......1.....'];
  const cols: Record<string, RGBA> = { '1': GLOW2, '2': GLOW, '3': YEL[0]! };
  [f0, f1].forEach((f, k) => f.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && sheet.set(k * 12 + i, j + 1, cols[ch]!))));
  return sheet;
}

/** Lint casing ejected by the hair dryer: 3 frames of 4x4. */
export function makePelusa(): Canvas {
  const sheet = new Canvas(12, 4);
  const L = hx('#c9c4d8');
  const D = hx('#8d88a0');
  const frames = [
    ['.LL.', 'LDLL', '.LD.', '....'],
    ['..L.', '.LLD', 'LDL.', '.L..'],
    ['.L..', 'LLL.', '.DLL', '..L.'],
  ];
  frames.forEach((f, k) => f.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && sheet.set(k * 4 + i, j, ch === 'L' ? L : D))));
  return sheet;
}

/** Small spark/debris squares used by the particles: white, yellow, orange, grey. 4 frames of 2x2. */
export function makeSparks(): Canvas {
  const sheet = new Canvas(8, 2);
  [WHITE, YEL[1]!, GLOW2, STEEL[2]!].forEach((c, k) => sheet.rect(k * 2, 0, 2, 2, c));
  return sheet;
}

/** Dust puff for the roll and bullet impacts: 4 frames of 8x8. */
export function makePuff(): Canvas {
  const sheet = new Canvas(32, 8);
  const C: RGBA[] = [[200, 200, 214, 220], [160, 160, 178, 190], [120, 120, 140, 150], [95, 95, 110, 110]];
  for (let k = 0; k < 4; k++) {
    const r = 1.6 + k * 0.8;
    ellipse(sheet, k * 8 + 3.5, 3.5, r, r * 0.85, C[k]!);
    if (k > 0) ellipse(sheet, k * 8 + 3.5, 3.5, r - 1.2, (r - 1.2) * 0.85, [0, 0, 0, 0]);
  }
  // Hollow rings: clear the inside pixels so later frames read as dissipating.
  for (let k = 1; k < 4; k++) {
    const r = 1.6 + k * 0.8 - 1.2;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (((x - 3.5) / r) ** 2 + ((y - 3.5) / (r * 0.85)) ** 2 <= 1) sheet.put(k * 8 + x, y, [0, 0, 0, 0]);
  }
  return sheet;
}

/** Crosshair 15x15 (the reference reticle, with an outline so it reads on any floor). */
export function makeCrosshair(): Canvas {
  const cv = new Canvas(15, 15);
  const c = 7;
  for (const d of [4, 5, 6, 7]) for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d]] as const) cv.set(c + ox, c + oy, WHITE);
  cv.set(c, c, RED[1]!);
  return outline(cv);
}

/** Hearts: full, half, empty. 3 frames of 9x8 (heart pattern from the reference HUD plus outline). */
export function makeHearts(): Canvas {
  const sheet = new Canvas(27, 8);
  const pat = ['.11.11.', '1221111', '1111111', '.11111.', '..111..', '...1...'];
  for (let k = 0; k < 3; k++) {
    const cv = new Canvas(9, 8);
    pat.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch === '.') return;
        const empty = k === 2 || (k === 1 && i >= 4);
        const c1 = empty ? hx('#3a3f5c') : RED[1]!;
        const c2 = empty ? hx('#4c5374') : WHITE;
        cv.set(i + 1, j + 1, ch === '1' ? c1 : c2);
      }),
    );
    sheet.blit(outline(cv), k * 9, 0);
  }
  return sheet;
}

/** Ammo pip for the HUD: full and spent, 2 frames of 4x6. */
export function makeAmmoPip(): Canvas {
  const sheet = new Canvas(8, 6);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(4, 6);
    if (k === 0) {
      cv.rect(1, 1, 2, 4, GLOW);
      cv.set(1, 1, YEL[0]!);
      cv.rect(1, 4, 2, 1, GLOW2);
    } else cv.rect(1, 1, 2, 4, hx('#3a3f5c'));
    sheet.blit(outline(cv), k * 4, 0);
  }
  return sheet;
}

/** Shop mannequin used as training dummy. Original design, same rules as the approved cast. */
export function makeManiqui(): Canvas {
  const cv = new Canvas(32, 40);
  const SKIN = [hx('#f6e6cc'), hx('#e2c9a2'), hx('#bf9f76'), hx('#8a6e4e')];
  const SHIRT = [hx('#ff8a70'), hx('#e0453b'), hx('#a42f37'), hx('#6a1d2a')];
  // stand: round base and pole
  cv.rect(10, 35, 12, 3, STEEL[3]!);
  cv.rect(11, 35, 10, 1, STEEL[1]!);
  cv.rect(15, 27, 2, 8, STEEL[2]!);
  cv.set(15, 27, STEEL[0]!);
  // torso with the season's t-shirt and a target drawn by staff with a marker
  box(cv, 10, 19, 12, 9, SHIRT);
  cv.rect(10, 26, 12, 1, SHIRT[3]!);
  cv.rect(14, 21, 5, 5, WHITE);
  cv.rect(15, 22, 3, 3, RED[1]!);
  cv.set(16, 23, WHITE);
  // neck
  cv.rect(14, 17, 4, 2, SKIN[2]!);
  // big egg head looking right, shaded from the top-left
  const cx = 16.5;
  const cy = 9.5;
  for (let y = 0; y < 19; y++) {
    for (let x = 6; x < 28; x++) {
      const dx = (x - cx) / 8.6;
      const dy = (y - cy) / 8.4;
      if (dx * dx + dy * dy <= 1) {
        const t = 0.7 * dx + 0.7 * dy;
        cv.set(x, y, t < -0.55 ? SKIN[0]! : t < 0.25 ? SKIN[1]! : t < 0.7 ? SKIN[2]! : SKIN[3]!);
      }
    }
  }
  // painted, bored half-closed eyes
  for (const ex of [18, 23]) {
    cv.rect(ex, 9, 3, 2, K);
    cv.rect(ex, 9, 3, 1, SKIN[2]!);
    cv.set(ex + 1, 10, WHITE);
  }
  // marker moustache somebody added
  const ink = hx('#2c4f94');
  for (const [x, y] of [[19, 13], [20, 12], [21, 12], [22, 13], [23, 12], [24, 12], [25, 13]] as const) cv.set(x, y, ink);
  // flat mouth
  cv.rect(21, 15, 3, 1, SKIN[3]!);
  // wig, slightly crooked
  const HAIR = [hx('#8a5a34'), hx('#5c3a22'), hx('#3e2616')];
  for (let x = 8; x < 23; x++) {
    const h = x < 12 ? 4 : x < 18 ? 3 : 2;
    for (let y = 1 + (x > 19 ? 1 : 0); y < 1 + h + (x > 19 ? 1 : 0); y++) cv.set(x, y, y === 1 ? HAIR[0]! : HAIR[1]!);
  }
  cv.rect(7, 4, 2, 5, HAIR[1]!);
  cv.set(7, 8, HAIR[2]!);
  // price tag hanging from the ear: «REBAJAS»
  cv.set(10, 11, CREAM[2]!);
  cv.set(9, 12, CREAM[2]!);
  cv.rect(5, 13, 5, 4, WHITE);
  cv.rect(6, 14, 3, 1, RED[1]!);
  cv.rect(6, 15, 2, 1, RED[1]!);
  // floating hands, pale plastic
  hand(cv, 6, 21, [SKIN[0]!, SKIN[1]!, SKIN[2]!, SKIN[3]!]);
  hand(cv, 23, 21, [SKIN[0]!, SKIN[1]!, SKIN[2]!, SKIN[3]!]);
  const o = outline(cv);
  // a dusty smudge on the base
  o.set(19, 37, BROWN[2]!);
  return o;
}

/** Roll-up shutter door with a red pilot light (build2.shutter), as a standalone sprite. */
export function makeShutter(w: number, h: number, light: 'red' | 'green' = 'red'): Canvas {
  const cv = new Canvas(w, h);
  cv.rect(0, 0, w, h, hx('#3a4058'));
  for (let j = 2; j < h; j += 3) cv.rect(0, j, w, 1, hx('#2b3048'));
  cv.rect(0, 0, w, 1, K);
  cv.rect(0, 0, 1, h, K);
  cv.rect(w - 1, 0, 1, h, K);
  cv.rect(Math.floor(w / 2) - 6, 4, 12, 4, K);
  cv.rect(Math.floor(w / 2) - 4, 5, 8, 2, light === 'red' ? RED[1]! : GREEN);
  cv.rect(Math.floor(w / 2) - 4, 5, 3, 1, light === 'red' ? RED[0]! : hx('#a8e89a'));
  return cv;
}

/**
 * The shutters of a room's doors, two frames each (pilot light red: shut; green: open). Bottom
 * edge: a black lip and a worn yellow-and-black kick strip, so it reads as the moving part.
 */
export function makeShutterFrames(w: number, h: number): Canvas {
  const out = new Canvas(w * 2, h);
  (['red', 'green'] as const).forEach((light, i) => {
    const f = makeShutter(w, h, light);
    for (let x = 1; x < w - 1; x++) {
      f.set(x, h - 4, Math.floor(x / 3) % 2 === 0 ? hx('#b08a1c') : hx('#191622'));
      f.set(x, h - 3, Math.floor((x + 1) / 3) % 2 === 0 ? hx('#b08a1c') : hx('#191622'));
    }
    f.rect(0, h - 2, w, 2, K);
    out.blit(f, i * w, 0);
  });
  return out;
}

/** Screen vignette for 480x270: transparent centre, darker corners. */
export function makeVignette(w = 480, h = 270, strength = 0.5): Canvas {
  const cv = new Canvas(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const md = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy) / md;
      const a = Math.round(255 * strength * d ** 2.2);
      // Quantise to a few levels so the vignette stays in the no-smooth-gradients spirit.
      const q = Math.round(a / 16) * 16;
      if (q > 0) cv.put(x, y, [8, 6, 16, Math.min(255, q)]);
    }
  }
  return cv;
}

/**
 * Discount coupon (the currency): a yellow ticket with a perforated stub and a red «%».
 * 2 frames of 12x9: plain and with a glint, so the ones on the floor catch the eye.
 */
export function makeCoupon(): Canvas {
  const sheet = new Canvas(24, 9);
  const pct = ['X.X', '..X', '.X.', 'X..', 'X.X'];
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(12, 9);
    cv.rect(1, 1, 10, 7, YEL[1]!);
    cv.rect(1, 1, 10, 1, YEL[0]!);
    cv.rect(1, 7, 10, 1, YEL[2]!);
    cv.rect(1, 2, 1, 5, YEL[2]!);
    // Perforation between the stub and the body.
    for (const y of [2, 4, 6]) cv.set(3, y, YEL[3]!);
    pct.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && cv.set(6 + i, 2 + j, RED[2]!)));
    // Notches cut in both edges.
    cv.put(1, 4, [0, 0, 0, 0]);
    cv.put(10, 4, [0, 0, 0, 0]);
    if (k === 1) {
      for (const [x, y] of [[4, 2], [5, 2], [4, 3], [9, 5], [9, 6], [8, 6]] as const) cv.set(x, y, WHITE);
    }
    sheet.blit(outline(cv), k * 12, 0);
  }
  return sheet;
}

/** Scrap an enemy leaves when it comes apart: screw, nut, spring and a bent plate. 4 frames of 6x6. */
export function makeScrap(): Canvas {
  const sheet = new Canvas(24, 6);
  const frames: string[][] = [
    // screw: head and thread
    ['....', '.LL.', '.BB.', '..B.', '..D.', '....'],
    // nut with its hole
    ['....', '.LB.', 'LKB.', '.BD.', '....', '....'],
    // spring
    ['....', '.LB.', '..D.', '.LB.', '..D.', '....'],
    // bent plate
    ['....', 'LL..', 'BBB.', '.DDD', '....', '....'],
  ];
  const col: Record<string, RGBA> = { L: STEEL[0]!, B: STEEL[2]!, D: STEEL[3]!, K };
  frames.forEach((f, k) => {
    const cv = new Canvas(6, 6);
    f.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i + 1, j, col[ch]!)));
    sheet.blit(outline(cv), k * 6, 0);
  });
  return sheet;
}

/** HUD slot for the active item: a dark recessed square with a bevel. 20x20. */
export function makeSlot(): Canvas {
  const cv = new Canvas(20, 20);
  cv.rect(1, 1, 18, 18, hx('#3a3f5c'));
  cv.rect(2, 2, 16, 16, hx('#1c1f36'));
  cv.rect(1, 1, 18, 1, hx('#5a627c'));
  cv.rect(1, 1, 1, 18, hx('#5a627c'));
  // Corner screws.
  for (const [x, y] of [[2, 2], [17, 2], [2, 17], [17, 17]] as const) cv.set(x, y, STEEL[2]!);
  return outline(cv);
}

/**
 * What the toaster comes apart into: a slice of toast, the burnt slice, the big spring of the
 * lever mechanism and the lever knob. 4 frames of 8x8.
 */
export function makeToasterBits(): Canvas {
  const sheet = new Canvas(32, 8);
  const slice = (T: Ramp): Canvas => {
    const cv = new Canvas(8, 8);
    cv.rect(1, 1, 5, 6, T[1]!);
    cv.rect(1, 1, 5, 1, T[3]!);
    cv.rect(1, 1, 1, 6, T[2]!);
    cv.rect(5, 1, 1, 6, T[3]!);
    cv.rect(1, 6, 5, 1, T[3]!);
    cv.set(2, 3, T[0]!);
    cv.set(3, 4, T[2]!);
    cv.set(4, 2, T[0]!);
    return outline(cv);
  };
  sheet.blit(slice(TOASTC), 0, 0);
  sheet.blit(slice(BURNT), 8, 0);
  // Spring: four coils, light on top, dark underneath.
  const sp = new Canvas(8, 8);
  for (const y of [1, 3, 5]) {
    sp.rect(2, y, 3, 1, STEEL[0]!);
    sp.set(5, y + 1, STEEL[2]!);
    sp.set(1, y + 1, STEEL[3]!);
  }
  sp.rect(2, 7, 3, 1, STEEL[2]!);
  sheet.blit(outline(sp), 16, 0);
  // Lever knob: the little black handle with a red dot (the toaster's own).
  const kn = new Canvas(8, 8);
  kn.rect(2, 3, 4, 3, hx('#3a3f5c'));
  kn.rect(2, 3, 4, 1, hx('#5a627c'));
  kn.set(3, 4, RED[1]!);
  kn.rect(1, 4, 1, 1, STEEL[2]!);
  sheet.blit(outline(kn), 24, 0);
  return sheet;
}

/**
 * La Nevera Suprema's ice cube: 6x6, a cube in three-quarter view (white top, cyan front, dark
 * left side) with the saturated cyan rim of the enemy bullets, so it reads as one.
 */
export function makeIceCube(): Canvas {
  const cv = new Canvas(6, 6);
  // Square corners (a cube, not a ball): white top face, pale front, cyan side on the left.
  const pat = ['111111', '133331', '142221', '142221', '142221', '111111'];
  const cols: Record<string, RGBA> = { '1': ICE[2]!, '2': ICE[1]!, '3': WHITE, '4': ICE[2]! };
  pat.forEach((row, j) => [...row].forEach((ch, i) => cv.set(i, j, cols[ch]!)));
  cv.set(3, 2, WHITE);
  return cv;
}

/** A ball of frost flying through the air: 8x8 snowball with an icy rim and a black outline. */
export function makeFrostBall(): Canvas {
  const cv = new Canvas(9, 9);
  ellipse(cv, 4, 4, 3.2, 3.2, ICE[1]!);
  ellipse(cv, 3.6, 3.6, 2.4, 2.4, WHITE);
  cv.set(3, 2, ICE[0]!);
  cv.set(5, 6, ICE[2]!);
  cv.set(6, 5, ICE[2]!);
  cv.set(6, 6, ICE[3]!);
  return outline(cv);
}

/**
 * A patch of frost on the floor (radius 22, flattened to 0.6 for the three-quarter view): a
 * see-through icy sheet with a brighter, broken rim, cracks and a few crystals standing up.
 * Two frames: the second has the glints in other places, so it sparkles.
 */
export function makeFrostPatch(): Canvas {
  const W = 46;
  const H = 28;
  const sheet = new Canvas(W * 2, H);
  const cx = 23;
  const cy = 14;
  const rx = 22;
  const ry = 13.2;
  for (let f = 0; f < 2; f++) {
    const ox = f * W;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const d = Math.sqrt(dx * dx + dy * dy);
        // A wobbly edge, the same in both frames.
        const wob = 0.06 * Math.sin(Math.atan2(dy, dx) * 7 + 1.3) + 0.04 * Math.sin(Math.atan2(dy, dx) * 13);
        if (d > 0.98 + wob) continue;
        const edge = d > 0.84 + wob;
        // put(), not set(): blending onto a transparent pixel would darken it.
        sheet.put(ox + x, y, edge ? hx('#e4fbfa', 215) : hx('#b6f1f0', d < 0.55 ? 95 : 130));
      }
    }
    // Cracks in the ice.
    const cracks: Array<[number, number, number, number]> = [[-12, -2, 7, 1], [-4, 4, 9, -1], [5, -5, 6, 2], [-15, 5, 5, -1], [9, 3, 7, 1]];
    for (const [x0, y0, len, slope] of cracks) for (let i = 0; i < len; i++) sheet.put(ox + cx + x0 + i, cy + y0 + Math.round((i * slope) / 3), hx('#f4f1e8', 190));
    // Little crystals standing up (with the dark side on the left, as everything else).
    for (const [x, y] of [[-16, -3], [12, -6], [3, 6], [-6, -8], [16, 4]] as const) {
      sheet.set(ox + cx + x, cy + y - 1, WHITE);
      sheet.set(ox + cx + x, cy + y, ICE[1]!);
      sheet.set(ox + cx + x - 1, cy + y, ICE[3]!);
    }
    // Glints that move from one frame to the other.
    const glints = f === 0 ? [[-9, -5], [7, 1], [-2, 8]] : [[-13, 2], [10, -3], [1, -2]];
    for (const [x, y] of glints) {
      sheet.set(ox + cx + x!, cy + y!, WHITE);
      sheet.put(ox + cx + x! + 1, cy + y!, hx('#f4f1e8', 200));
      sheet.put(ox + cx + x!, cy + y! - 1, hx('#f4f1e8', 200));
    }
  }
  return sheet;
}

/** Paints a grid of characters onto `cv` at (ox, oy); '.' is left transparent. */
function paintGrid(cv: Canvas, ox: number, oy: number, rows: readonly string[], cols: Record<string, RGBA>): void {
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const c = cols[ch];
    if (c) cv.set(ox + i, oy + j, c);
  }));
}

/**
 * La Nevera Suprema's loyalty card («Tarjeta Club Suprema»), spinning as it flies: 4 frames of
 * 10x8. Red with a white band (the saturated colour and white core of the enemy bullets), a little
 * gold chip on the front and the black magnetic stripe on the back.
 */
export function makeLoyaltyCard(): Canvas {
  const W = 10;
  const H = 8;
  const frames: Array<readonly string[]> = [
    ['aaaaaaaa', 'wwwwwwww', 'byybbbbb', 'bbbbbbwb', 'cccccccc'],
    ['aaaaa', 'wwwww', 'bybbb', 'bbbwb', 'ccccc'],
    ['aw', 'ww', 'bw', 'bw', 'cw'],
    ['aaaaa', 'kkkkk', 'bbbbb', 'bwwwb', 'ccccc'],
  ];
  const cols: Record<string, RGBA> = { a: RED[0]!, b: RED[1]!, c: RED[2]!, w: WHITE, y: YEL[1]!, k: K };
  const sheet = new Canvas(W * frames.length, H);
  frames.forEach((rows, f) => {
    const cv = new Canvas(W, H);
    paintGrid(cv, Math.floor((W - rows[0]!.length) / 2), 1, rows, cols);
    sheet.blit(outline(cv), f * W, 0);
  });
  return sheet;
}

/**
 * What the fridge spits in its second phase (see EXPIRED_PRODUCTS): 3 frames of 12x14.
 * A yogurt with its lid swollen and green, a milk carton with a mouldy stain and a dented can.
 */
export function makeExpiredProducts(): Canvas {
  const W = 12;
  const H = 14;
  const MOLD = ramp('#b5d36a', '#7fa83f', '#4f6e2a');
  const frames: Array<readonly string[]> = [
    // Yogur: swollen foil lid (green), cream cup, red label with a white cross-out.
    ['...gggg...', '..gGGGGg..', '.gGGgGGGg.', '.ssssssss.', '.cwwwwwwc.', '.cwmwwwwc.', '..rrrrrr..', '..rwrrwr..', '..rrwwrr..', '..rwrrwr..', '..cwwwwc..', '...cccc...'],
    // Brick de leche: gabled top, blue band, a green stain and the date stamped.
    ['....ww....', '...wwww...', '..wwwwww..', '..ssssss..', '..wwwwwm..', '..bbbbbb..', '..bwbbwb..', '..wwwwww..', '..wkwkww..', '..wwmmww..', '..wwwmww..', '..ssssss..'],
    // Lata abollada: grey rims, red label with a dent, a bulge at the top.
    ['...hhhh...', '..hHHHHh..', '..hhhhhh..', '..rrrrrr..', '..rwwrrr..', '..rr.rrr..', '..rrrrrr..', '..rrwrrr..', '..rrrrrr..', '..hhhhhh..', '...hhhh...'],
  ];
  const cols: Record<string, RGBA> = {
    g: MOLD[1]!, G: MOLD[0]!, m: MOLD[2]!, s: STEEL[2]!, c: CREAM[1]!, w: WHITE, r: RED[1]!, b: BLUE[1]!, k: K, h: STEEL[2]!, H: STEEL[0]!,
  };
  const sheet = new Canvas(W * frames.length, H);
  frames.forEach((rows, f) => {
    const cv = new Canvas(W, H);
    paintGrid(cv, 1, H - 1 - rows.length, rows, cols);
    sheet.blit(outline(cv), f * W, 0);
  });
  return sheet;
}

/**
 * The goods lift (montacargas) that appears where a boss fell and takes the toaster down to the
 * next floor. A raised steel plate seen from above in three-quarter view, with a worn
 * yellow-and-black hazard edge, a grid of treads and a big painted arrow pointing down, plus a
 * little control post on the back left. Two frames of 44 × 34: closed (red light, dull arrow)
 * and ready (green light, bright arrow).
 */
export function makeGoodsLift(): Canvas {
  const W = 44;
  const H = 34;
  const out = new Canvas(W * 2, H);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(W, H);
    const x0 = 2;
    const y0 = 10;
    const pw = 40;
    const ph = 20;
    // Front face of the plate (it stands a little off the floor).
    cv.rect(x0, y0 + ph, pw, 3, hx('#2c3048'));
    cv.rect(x0, y0 + ph, pw, 1, hx('#434963'));
    // Hazard edge: diagonal stripes, worn.
    for (let y = y0; y < y0 + ph; y++) {
      for (let x = x0; x < x0 + pw; x++) {
        const edge = x < x0 + 3 || x >= x0 + pw - 3 || y < y0 + 3 || y >= y0 + ph - 3;
        if (!edge) continue;
        const stripe = Math.floor((x + y) / 3) % 2 === 0;
        cv.set(x, y, stripe ? hx('#d9a326') : hx('#1b1d2e'));
      }
    }
    for (const [x, y] of [[x0 + 5, y0], [x0 + 18, y0 + 1], [x0 + pw - 2, y0 + 9], [x0 + 27, y0 + ph - 1], [x0, y0 + 14]] as const) cv.set(x, y, hx('#6b5a3a'));
    // Steel treads inside.
    cv.rect(x0 + 3, y0 + 3, pw - 6, ph - 6, hx('#5d647e'));
    for (let y = y0 + 4; y < y0 + ph - 3; y += 3) for (let x = x0 + 4 + ((y >> 1) % 2); x < x0 + pw - 4; x += 3) cv.set(x, y, hx('#838ca6'));
    cv.rect(x0 + 3, y0 + 3, pw - 6, 1, hx('#838ca6'));
    cv.rect(x0 + 3, y0 + ph - 4, pw - 6, 1, hx('#434963'));
    // Painted arrow pointing down (towards the next floor).
    const arrow = ['..XXX..', '..XXX..', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    const ac = k === 1 ? YEL[1]! : hx('#8f7a3c');
    const al = k === 1 ? YEL[0]! : hx('#a8915a');
    arrow.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && cv.set(x0 + 17 + i, y0 + 6 + j, j === 0 || (j === 3 && i < 2) ? al : ac)));
    // Rivets in the corners of the treads.
    for (const [x, y] of [[x0 + 4, y0 + 4], [x0 + pw - 5, y0 + 4], [x0 + 4, y0 + ph - 5], [x0 + pw - 5, y0 + ph - 5]] as const) cv.set(x, y, hx('#b7bed0'));
    // Control post on the back left: a box on a pole with the pilot light and a down button.
    box(cv, x0 + 2, 0, 7, 8, STEEL);
    cv.rect(x0 + 4, 8, 3, 4, hx('#434963'));
    cv.rect(x0 + 4, 8, 1, 4, hx('#5d647e'));
    cv.rect(x0 + 3, 2, 5, 3, K);
    cv.rect(x0 + 4, 3, 3, 1, k === 1 ? GREEN : RED[1]!);
    cv.set(x0 + 4, 3, k === 1 ? hx('#a8e89a') : RED[0]!);
    cv.set(x0 + 5, 6, YEL[1]!);
    out.blit(outline(cv), k * W, 0);
  }
  return out;
}

/**
 * A spare heart lying on the floor (a boss's reward): a red heart with a highlight and a little
 * «original part» tag, 13 × 12. Two frames: the second catches the light.
 */
export function makeSpareHeart(): Canvas {
  const out = new Canvas(26, 12);
  const pat = ['.111.111.', '122111111', '121111111', '111111113', '.1111113.', '..11113..', '...113...', '....3....'];
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(13, 12);
    pat.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch === '.') return;
        cv.set(i + 1, j + 1, ch === '1' ? RED[1]! : ch === '2' ? (k === 1 ? WHITE : RED[0]!) : RED[2]!);
      }),
    );
    // The tag on a string: a tiny cream label hanging off the right lobe.
    cv.set(9, 2, CREAM[2]!);
    cv.rect(10, 3, 2, 3, CREAM[1]!);
    cv.set(10, 3, CREAM[0]!);
    cv.set(11, 5, CREAM[2]!);
    out.blit(outline(cv), k * 13, 0);
  }
  return out;
}
