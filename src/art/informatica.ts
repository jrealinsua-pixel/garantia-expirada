// Floor 2 (Informática) tile set: the computer department, one floor above the warehouse. Raised
// access floor (anti-static panels on pedestals, with the cables living underneath), server racks
// instead of shelving, a wall of monitors that nobody switched off, LED panels instead of
// fluorescent tubes. Dominant colour: a cold screen green-teal. Used by the room painter
// (src/art/room.ts) when it paints a room of level 2; drawn with the room's seeded RNG.
//
// Same rule as the warehouse: floor decoration stays low-contrast so it never competes with
// the bullets (red and cyan with a white core, the player's in orange and yellow).
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';
import { T, shade, stencil, type RoomStyle } from './warehouse.ts';

/** Colours of the floor. The panels are a dark green-grey; the grout is the gap between them. */
export const C = {
  floorA: hx('#304541'),
  floorB: hx('#2c403d'),
  gap: hx('#1c2a28'),
  bevel: hx('#405a54'),
  wall: hx('#1b2524'),
  seam: hx('#141c1b'),
  paint: [118, 196, 160, 95] as RGBA,
  dash: hx('#3f7a62'),
  frame: hx('#5e7a74'),
  frameDark: hx('#3a4b48'),
  light: [178, 240, 214] as const,
};

export type PanelVariant = 'plain' | 'perforated' | 'lifted' | 'grommet' | 'worn' | 'sticker';

/** Picks the variation of a floor panel. Perforated (cooling) panels are rare. */
export function pickPanel(rng: Rng, style: RoomStyle): PanelVariant {
  const v = rng.next();
  const old = style === 'secret' ? 2 : 1;
  if (v < 0.04 * old) return 'lifted';
  if (v < 0.09 * old) return 'worn';
  if (v < 0.13) return 'grommet';
  if (v < 0.15) return 'sticker';
  if (v < 0.17) return 'perforated';
  return 'plain';
}

/** A plain raised-floor panel: lit on the top and left edges, dark gap on the bottom and right, speckled vinyl. */
export function panel(S: Canvas, rng: Rng, x: number, y: number, base: RGBA): void {
  S.rect(x, y, T, T, base);
  S.rect(x, y, T - 1, 1, C.bevel);
  S.rect(x, y, 1, T - 1, C.bevel);
  S.rect(x, y + T - 1, T, 1, C.gap);
  S.rect(x + T - 1, y, 1, T, C.gap);
  // Pedestal corner: the four panels meet on a little dark square.
  S.rect(x + T - 2, y + T - 2, 2, 2, shade(C.gap, -6));
  for (let i = 0; i < 5; i++) S.set(x + rng.int(2, T - 3), y + rng.int(2, T - 3), shade(base, rng.chance(0.5) ? 7 : -7));
}

/** Cable colours (under the floor and in the ceiling tray): mostly grey, some of everything. */
const CABLES = ['#2a2f36', '#3a4048', '#3f74bd', '#c23d38', '#d9a52a', '#4b9a4e', '#d3d8e4'];

export function paintPanel(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, v: PanelVariant): void {
  switch (v) {
    case 'perforated': {
      // Cooling panel: a grid of holes with the dark plenum below.
      S.rect(x + 3, y + 3, T - 7, T - 7, shade(base, -6));
      for (let j = y + 4; j < y + T - 4; j += 3) for (let i = x + 4; i < x + T - 4; i += 3) S.set(i, j, hx('#121a19'));
      break;
    }
    case 'lifted': {
      // Somebody lifted the panel and didn't put it back straight: a dark gap along the top
      // edge with the cables showing.
      S.rect(x + 1, y + 1, T - 2, 3, hx('#0e1413'));
      for (let i = x + 2; i < x + T - 3; i += rng.int(3, 5)) {
        const c = hx(rng.pick(CABLES));
        S.rect(i, y + 2, 2, 1, [c[0], c[1], c[2], 140]);
      }
      // The panel edge catches the light.
      S.rect(x + 1, y + 4, T - 2, 1, shade(C.bevel, 10));
      break;
    }
    case 'grommet': {
      // A cable hole with a brush seal; a cable comes out and goes nowhere.
      const gx = x + rng.int(5, T - 12);
      const gy = y + rng.int(5, T - 9);
      S.rect(gx, gy, 7, 4, hx('#141c1b'));
      S.rect(gx, gy, 7, 1, hx('#27312f'));
      for (let i = gx + 1; i < gx + 6; i += 2) S.set(i, gy + 2, hx('#2c3836'));
      const c = hx(rng.pick(CABLES));
      let cx = gx + 3;
      let cy = gy + 3;
      for (let i = 0; i < rng.int(4, 8); i++) {
        cy++;
        if (rng.chance(0.4)) cx += rng.chance(0.5) ? 1 : -1;
        if (cy >= y + T - 2) break;
        S.set(cx, cy, [c[0], c[1], c[2], 170]);
      }
      break;
    }
    case 'worn': {
      // Scuffed where the office chairs roll.
      for (let j = 4; j < T - 4; j++) {
        for (let i = 4; i < T - 4; i++) if (rng.chance(0.35)) S.set(x + i, y + j, shade(S.get(x + i, y + j), 6));
      }
      for (let i = 0; i < 3; i++) {
        const sy = y + rng.int(5, T - 6);
        const sx = x + rng.int(3, 10);
        S.rect(sx, sy, rng.int(5, 10), 1, shade(base, -9));
      }
      break;
    }
    case 'sticker': {
      // An inventory sticker with a barcode, half peeled.
      const sx = x + rng.int(4, T - 13);
      const sy = y + rng.int(4, T - 9);
      const paper: RGBA = [201, 205, 194, 70];
      S.rect(sx, sy, 9, 5, paper);
      for (let i = 1; i < 8; i++) if (i % 3 !== 2) S.rect(sx + i, sy + 1, 1, 3, [30, 34, 40, 80]);
      S.set(sx + 8, sy, base);
      break;
    }
    default:
  }
}

// ---------------------------------------------------------------------------------------------
// Things on the floor.

/** A ring left by a coffee cup (several, where people waited for the update). */
export function coffeeRing(S: Canvas, cx: number, cy: number, r: number): void {
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2;
    if (a % 9 === 4) continue;
    S.set(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.7), [92, 58, 34, 120]);
  }
}

/** A toner smudge: a dark blot with grains around it. */
export function tonerSmudge(S: Canvas, rng: Rng, cx: number, cy: number): void {
  const rx = rng.int(7, 14);
  const ry = Math.max(3, Math.round(rx / 2.4));
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rng.next() * 0.3 - 0.15) S.set(x, y, [10, 12, 14, 70]);
    }
  }
  for (let k = 0; k < 14; k++) S.set(cx + rng.int(-rx - 4, rx + 4), cy + rng.int(-ry - 3, ry + 3), [10, 12, 14, 90]);
}

/** A rubber cable cover across the room (where the forklift tracks were downstairs). */
export function cableCover(S: Canvas, x: number, y: number, len: number, vertical: boolean): void {
  const body: RGBA = [14, 18, 20, 120];
  const rib: RGBA = [70, 86, 84, 90];
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < 6; k++) {
      const c = k === 0 ? rib : i % 3 === 0 && k > 1 && k < 5 ? rib : body;
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
  }
}

/** A key that came off a keyboard. */
export function keycap(S: Canvas, rng: Rng, x: number, y: number): void {
  const c = rng.chance(0.7) ? hx('#3a4048') : hx('#b7bed0');
  S.rect(x, y, 3, 3, c);
  S.rect(x, y, 3, 1, shade(c, 25));
  S.set(x + 1, y + 1, shade(c, rng.chance(0.5) ? 40 : -30));
}

/** A memory card / USB stick somebody lost (with all their photos). */
export function usbStick(S: Canvas, rng: Rng, x: number, y: number): void {
  const c = hx(rng.pick(['#3f74bd', '#c23d38', '#2a2f36']));
  S.rect(x, y, 4, 2, c);
  S.rect(x + 4, y, 2, 2, hx('#9aa2c0'));
}

/** Electrical interference (the boss room): dead pixels and green snow, stronger near the back wall. */
export function staticSnow(S: Canvas, rng: Rng, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.round(((x1 - x0) * (y1 - y0)) / 90);
  for (let i = 0; i < n; i++) {
    const x = rng.int(x0, x1 - 1);
    const y = y0 + Math.floor((y1 - y0) * rng.next() ** 1.8);
    const g = rng.chance(0.7);
    S.set(x, y, g ? [88, 180, 90, rng.int(30, 70)] : [244, 241, 232, rng.int(20, 45)]);
    if (rng.chance(0.15)) S.set(x + 1, y, g ? [88, 180, 90, 40] : [244, 241, 232, 30]);
  }
}

// ---------------------------------------------------------------------------------------------
// Walls and ceiling.

/** One tile of a free-standing server rack (interior wall), with outline on the open sides. */
export function rackUnit(S: Canvas, rng: Rng, x: number, y: number, o: { front: boolean; up: boolean; left: boolean; right: boolean }): void {
  const TOP = hx('#3a4846');
  const TOP_HI = hx('#4f625f');
  const FRAME = hx('#161d1d');
  const topH = o.front ? 7 : T;
  S.rect(x, y, T, topH, TOP);
  // Vent slots on the top of the rack.
  for (let j = y + 2; j < y + topH - 1; j += 2) if (rng.chance(0.6)) S.rect(x + 4, j, T - 8, 1, shade(TOP, -10));
  if (o.front) {
    // Front: black frame with 1U units, each with a status LED.
    const fy = y + topH;
    S.rect(x, fy, T, T - topH, FRAME);
    S.rect(x, fy, T, 1, K);
    for (let j = fy + 2; j < y + T - 3; j += 4) {
      const u = rng.pick([hx('#2c3436'), hx('#3a4246'), hx('#252b2e')]);
      S.rect(x + 2, j, T - 4, 3, u);
      S.rect(x + 2, j, T - 4, 1, shade(u, 18));
      S.set(x + 4, j + 1, rng.chance(0.8) ? hx('#58b45a') : rng.chance(0.5) ? hx('#f6c431') : hx('#e0453b'));
      if (rng.chance(0.5)) S.set(x + 6, j + 1, hx('#58b45a'));
      for (let i = x + 10; i < x + T - 3; i += 2) S.set(i, j + 2, shade(u, -12));
    }
    S.rect(x, y + T - 1, T, 1, K);
  }
  if (o.left) S.rect(x, y, 1, T, K);
  if (o.right) S.rect(x + T - 1, y, 1, T, K);
  if (o.up) S.rect(x, y, T, 1, K);
  if (o.up) S.rect(x + (o.left ? 1 : 0), y + 1, T - (o.left ? 1 : 0) - (o.right ? 1 : 0), 1, TOP_HI);
}

/** A white plastic cable duct along a side wall, with a socket now and then. */
export function duct(S: Canvas, x: number, y0: number, y1: number, skip: (y: number) => boolean): void {
  for (let y = y0; y < y1; y++) {
    if (skip(y)) continue;
    S.rect(x, y, 4, 1, hx('#8f9b98'));
    S.set(x, y, hx('#b9c3c0'));
    S.set(x + 3, y, hx('#5e6866'));
    if (y % 40 === 0) {
      S.rect(x - 1, y, 6, 4, hx('#b9c3c0'));
      S.rect(x + 1, y + 1, 2, 2, K);
    }
  }
}

/** A network switch on the wall: dark box, a row of ports, green LEDs. */
export function wallSwitch(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x - 1, y - 1, 12, 9, K);
  S.rect(x, y, 10, 7, hx('#2c3436'));
  S.rect(x, y, 10, 1, hx('#4a5456'));
  for (let i = 0; i < 4; i++) {
    S.rect(x + 1 + i * 2, y + 3, 1, 2, K);
    S.set(x + 1 + i * 2, y + 2, rng.chance(0.7) ? hx('#58b45a') : hx('#f6c431'));
  }
  // A cable hanging out of it.
  for (let j = 0; j < rng.int(3, 6); j++) S.set(x + 8, y + 7 + j, hx('#3f74bd'));
}

/** The ceiling cable tray: a ladder rail with cables drooping out of it. */
export function cableTray(S: Canvas, rng: Rng, w: number): void {
  S.rect(0, 2, w, 5, hx('#2a3533'));
  S.rect(0, 2, w, 1, hx('#55625f'));
  S.rect(0, 6, w, 1, hx('#55625f'));
  for (let x = 2; x < w; x += 6) S.rect(x, 3, 1, 3, hx('#3e4a48'));
  for (let x = 20; x < w - 20; x += rng.int(30, 60)) {
    const c = hx(rng.pick(CABLES));
    const span = rng.int(10, 22);
    const sag = rng.int(2, 4);
    for (let i = 0; i <= span; i++) S.set(x + i, 7 + Math.round(Math.sin((i / span) * Math.PI) * sag), c);
  }
}

/** A flat LED panel lamp (cold light). */
export function ledPanel(S: Canvas, x: number, y: number): void {
  S.rect(x, y, 44, 3, hx('#cfe6dc'));
  S.rect(x + 2, y + 3, 40, 1, WHITE);
  S.rect(x, y, 44, 1, hx('#9fb4ad'));
}

/** What the screens on the back wall show. */
const SCREENS = ['blue', 'bars', 'off', 'text', 'nosignal', 'update'] as const;

/** One monitor on the back shelf (bezel, stand, screen). */
export function monitor(S: Canvas, rng: Rng, x: number, plankY: number, w: number, h: number): void {
  const y = plankY - h;
  S.rect(x + Math.floor(w / 2) - 1, plankY - 2, 3, 2, hx('#1a1f22'));
  S.rect(x, y, w, h - 2, hx('#1a1f22'));
  const sx = x + 1;
  const sy = y + 1;
  const sw = w - 2;
  const sh = h - 4;
  const kind = rng.pick(SCREENS);
  if (kind === 'blue') {
    S.rect(sx, sy, sw, sh, hx('#2f5fbf'));
    for (let j = sy + 1; j < sy + sh - 1; j += 2) S.rect(sx + 1, j, rng.int(1, Math.max(1, sw - 2)), 1, hx('#9fb8e8'));
  } else if (kind === 'bars') {
    const cols = ['#d3d8e4', '#f6c431', '#5cc2c0', '#58b45a', '#d3849a', '#c23d38', '#3f74bd'];
    for (let i = 0; i < sw; i++) S.rect(sx + i, sy, 1, sh, hx(cols[Math.floor((i / sw) * cols.length)]!));
  } else if (kind === 'off') {
    S.rect(sx, sy, sw, sh, hx('#20272a'));
    S.set(sx + 1, sy + 1, hx('#4a5456'));
    S.set(sx + 2, sy + 1, hx('#3a4246'));
  } else if (kind === 'text') {
    S.rect(sx, sy, sw, sh, hx('#0e1a12'));
    for (let j = sy + 1; j < sy + sh; j += 2) S.rect(sx + 1, j, rng.int(1, Math.max(1, sw - 2)), 1, hx('#58b45a'));
  } else if (kind === 'nosignal') {
    S.rect(sx, sy, sw, sh, hx('#14181a'));
    S.rect(sx + Math.floor(sw / 2) - 2, sy + Math.floor(sh / 2), 4, 1, hx('#858ea8'));
  } else {
    // «Actualizando»: a progress bar stuck near the end.
    S.rect(sx, sy, sw, sh, hx('#1b2a3e'));
    const by = sy + Math.floor(sh / 2);
    S.rect(sx + 1, by, sw - 2, 1, hx('#2f3d52'));
    S.rect(sx + 1, by, Math.max(1, sw - 3), 1, hx('#69dbd8'));
  }
  // Glass glint, top left (light from the top left, like everything else).
  S.set(sx, sy, [255, 255, 255, 90]);
}

/** The back shelf of floor 2: monitors switched on, laptop boxes in between. */
export function monitorShelf(S: Canvas, rng: Rng, w: number, plankY: number, hmax: number, hmin: number): void {
  let x = 26;
  while (x < w - 28) {
    const mw = rng.int(9, 15);
    const mh = rng.int(hmin, hmax);
    if (rng.chance(0.75)) monitor(S, rng, x, plankY, mw, mh);
    else {
      // A laptop box: white or black, with the brand stripe.
      const col = rng.chance(0.5) ? hx('#d3d8e4') : hx('#2a2f36');
      const h = Math.max(4, mh - 3);
      S.rect(x, plankY - h, mw, h, col);
      S.rect(x + mw - 2, plankY - h, 2, h, shade(col, -40));
      S.rect(x + 2, plankY - Math.floor(h / 2), Math.max(1, mw - 6), 1, hx('#3f7a62'));
    }
    x += mw + rng.int(1, 4);
  }
  S.rect(0, plankY, w, 2, hx('#3a4846'));
  S.rect(0, plankY, w, 1, hx('#4f625f'));
}

/** «Actualizando 99 %»: a wall display with a progress bar that will never finish. */
export function progressDisplay(S: Canvas, x: number, y: number): void {
  S.rect(x - 1, y - 1, 24, 13, K);
  S.rect(x, y, 22, 11, hx('#141c1b'));
  S.rect(x, y, 22, 1, hx('#2c3836'));
  stencil(S, x + 3, y + 3, '99%', hx('#58b45a'));
  S.rect(x + 2, y + 8, 18, 1, hx('#2c3836'));
  S.rect(x + 2, y + 8, 17, 1, hx('#58b45a'));
}

/** The skirting cable duct that runs along the inner edge of the walls (5 px), with sockets. */
export function skirting(S: Canvas, x: number, y: number, w: number, h: number, vertical: boolean, flip = false): void {
  const ramp = [hx('#7e8a87'), hx('#6a7572'), hx('#5b6563'), hx('#4d5755'), hx('#2a3231')];
  const len = vertical ? h : w;
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < 5; k++) {
      const c = ramp[flip ? 4 - k : k]!;
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
    if (i % 48 === 20) {
      // A double socket.
      if (vertical) S.rect(x + 1, y + i, 3, 4, hx('#b9c3c0'));
      else S.rect(x + i, y + 1, 6, 3, hx('#b9c3c0'));
      if (vertical) S.set(x + 2, y + i + 1, K);
      else {
        S.set(x + i + 1, y + 2, K);
        S.set(x + i + 4, y + 2, K);
      }
    }
  }
}

