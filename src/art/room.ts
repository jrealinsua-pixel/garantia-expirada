// Paints a warehouse room (floor 1) from its tile grid. Same method as the approved mock-up
// (tools/referencia/build2.py make_scene), generalised to any size and with the game's seeded RNG.
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';
import * as W from './warehouse.ts';

export interface PaintableRoom {
  cols: number;
  rows: number;
  tiles: Uint8Array;
  /** Door openings in pixels (src/sim/room.ts RoomDoor). */
  doors?: readonly { dir: string; x: number; y: number; w: number; h: number }[];
  /** What the room is for (src/data/types.ts RoomKind, or 'test'): picks the decoration. */
  kind?: string;
}

const T = 24;

export interface RoomArt {
  canvas: Canvas;
  /** Lamp centres, for the renderer's light pools / flicker. */
  lamps: Array<{ x: number; y: number }>;
  /** Where each door's shutter goes (sprites persiana-n, -s and -v). */
  doors: Array<{ dir: string; x: number; y: number; w: number; h: number }>;
  /** What was painted besides the plain plates (tile variations and decoration), for tests. */
  features: string[];
}

const shade = (c: RGBA, d: number): RGBA => W.shade([c[0], c[1], c[2], 255], d);

const BOX_COLORS = ['#c23d38', '#d9a52a', '#3f74bd', '#4b9a4e', '#d3849a', '#d9782a', '#5cc2c0', '#a8916c', '#aab1c4'];

/** One tile of a free-standing shelving unit (interior wall), with outline on the open sides. */
function shelfUnit(S: Canvas, rng: Rng, x: number, y: number, o: { front: boolean; up: boolean; left: boolean; right: boolean }): void {
  const TOP = hx('#4c5374');
  const TOP_HI = hx('#5d658a');
  const FRAME = hx('#2b3048');
  // Top surface of the unit (dusty sheet metal).
  const topH = o.front ? 7 : T;
  S.rect(x, y, T, topH, TOP);
  for (let i = 0; i < 6; i++) S.set(x + rng.int(1, T - 2), y + rng.int(1, topH - 2), shade(TOP, rng.chance(0.5) ? 9 : -9));
  if (o.up) S.rect(x, y, T, 1, TOP_HI);
  if (o.front) {
    // Front: dark frame, two planks with boxes on them.
    const fy = y + topH;
    S.rect(x, fy, T, T - topH, FRAME);
    S.rect(x, fy, T, 1, K);
    for (const [plank, hmax] of [[fy + 8, 7], [fy + 16, 6]] as const) {
      let bx = x + 1;
      while (bx < x + T - 3) {
        const w = rng.int(4, 7);
        const h = rng.int(3, hmax);
        if (bx + w > x + T - 1) break;
        const col = hx(rng.pick(BOX_COLORS));
        S.rect(bx, plank - h, w, h, col);
        S.rect(bx + w - 1, plank - h, 1, h, shade(col, -40));
        S.rect(bx, plank - h, w, 1, shade(col, 30));
        bx += w + rng.int(1, 2);
      }
      S.rect(x, plank, T, 1, hx('#5d658a'));
    }
    S.rect(x, y + T - 1, T, 1, K);
  }
  if (o.left) S.rect(x, y, 1, T, K);
  if (o.right) S.rect(x + T - 1, y, 1, T, K);
  if (o.up) S.rect(x, y, T, 1, K);
  if (o.up) S.rect(x + (o.left ? 1 : 0), y + 1, T - (o.left ? 1 : 0) - (o.right ? 1 : 0), 1, TOP_HI);
}

/** Words painted on the floor, by room kind. */
const STENCILS: Record<W.RoomStyle, readonly string[]> = {
  combat: ['NO PISAR', 'PASO DE CARRETILLAS', 'ZONA DE DESCARTE', 'MANTENGA LA COLA', 'NO REPARABLE', 'PROHIBIDO RECLAMAR', 'ESPERE SU TURNO'],
  test: ['ZONA DE PRUEBAS'],
  start: ['SIN DEVOLUCIÓN'],
  treasure: ['NO SE ACEPTAN RECLAMACIONES'],
  shop: ['PAGUE AQUÍ'],
  secret: ['ESTA SALA NO EXISTE'],
  boss: ['SOLO PERSONAL DIRECTIVO'],
};

/** The sign bolted to the back shelving: text, plate colour, letters. */
const SIGNS: Record<W.RoomStyle, ReadonlyArray<readonly [string, string, string]>> = {
  combat: [['DEVOLUCIONES', '#3f66a6', '#f4f1e8'], ['RECLAMACIONES', '#3f66a6', '#f4f1e8'], ['SALDOS', '#a42f37', '#fff1a8'], ['REACONDICIONADOS', '#434963', '#d3d8e4']],
  test: [['SALA DE PRUEBAS', '#434963', '#f6c431']],
  start: [['ENTRADA DE PERSONAL', '#2f6b3a', '#f4f1e8']],
  treasure: [['OBJETOS PERDIDOS', '#8f5a1c', '#fff1a8']],
  shop: [['OFERTAS', '#a42f37', '#fff1a8']],
  secret: [['ARCHIVO MUERTO', '#434963', '#858ea8']],
  boss: [['DIRECCIÓN', '#1b1d2e', '#69dbd8']],
};

const STYLES: readonly W.RoomStyle[] = ['start', 'combat', 'treasure', 'shop', 'secret', 'boss', 'test'];

export function paintRoom(room: PaintableRoom, seed: string): RoomArt {
  const rng = new Rng('room-art:' + seed);
  const style: W.RoomStyle = STYLES.includes(room.kind as W.RoomStyle) ? (room.kind as W.RoomStyle) : 'combat';
  const features: string[] = [];
  const W_ = room.cols * T;
  const H = room.rows * T;
  const S = new Canvas(W_, H, K);
  const wall = (c: number, r: number): boolean => c < 0 || r < 0 || c >= room.cols || r >= room.rows || room.tiles[r * room.cols + c] === 1;
  const doorsIn = room.doors ?? [];

  // Where floor decoration may go: whole floor tiles, not in front of a door, not on top of
  // another piece of decoration.
  const used: Array<{ x: number; y: number; w: number; h: number }> = [];
  const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const free = (x: number, y: number, w: number, h: number): boolean => {
    for (let r = Math.floor(y / T); r <= Math.floor((y + h - 1) / T); r++) {
      for (let c = Math.floor(x / T); c <= Math.floor((x + w - 1) / T); c++) if (r < 2 || wall(c, r)) return false;
    }
    const me = { x, y, w, h };
    for (const d of doorsIn) if (hit(me, { x: d.x - T, y: d.y - T, w: d.w + 2 * T, h: d.h + 2 * T })) return false;
    return !used.some((u) => hit(me, u));
  };
  const place = (w: number, h: number, tries = 30, snap = 1): { x: number; y: number } | null => {
    for (let i = 0; i < tries; i++) {
      const x = Math.floor(rng.int(T, W_ - T - w) / snap) * snap;
      const y = Math.floor(rng.int(2 * T, H - T - h) / snap) * snap;
      if (free(x, y, w, h)) {
        used.push({ x, y, w, h });
        return { x, y };
      }
    }
    return null;
  };

  // Floor tiles: checker, grout, rivets in the corners; some cracked, worn, patched or a grate.
  const FA = hx('#3a4060');
  const FB = hx('#353b58');
  const GR = hx('#262b40');
  const variants = new Map<W.TileVariant, number>();
  const count = (v: string): void => {
    features.push(v);
  };
  let lastGrate = -9;
  let grates = 0;
  const maxGrates = Math.max(1, Math.round((room.cols * room.rows) / 220));
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (wall(c, r)) continue;
      const x = c * T;
      const y = r * T;
      const base = (c + r) % 2 === 0 ? FA : FB;
      S.rect(x, y, T, T, base);
      S.rect(x, y, T, 1, GR);
      S.rect(x, y, 1, T, GR);
      for (const [ox, oy] of [[2, 2], [T - 3, 2], [2, T - 3], [T - 3, T - 3]] as const) {
        S.set(x + ox, y + oy, hx('#58608a'));
        S.set(x + ox + 1, y + oy + 1, hx('#20243a'));
      }
      let v = r >= 2 ? W.pickVariant(rng, style) : 'plain';
      if (v === 'grate' && (grates >= maxGrates || r * room.cols + c - lastGrate < 3 || !free(x, y, T, T))) v = 'plain';
      if (v === 'grate') {
        lastGrate = r * room.cols + c;
        grates++;
      }
      if (v !== 'plain') {
        W.paintVariant(S, rng, x, y, base, v);
        variants.set(v, (variants.get(v) ?? 0) + 1);
      }
    }
  }
  for (const v of variants.keys()) count(`casilla:${v}`);
  // A patch of diamond plate where the heavy stuff gets dragged.
  if (style !== 'secret' && style !== 'start' && rng.chance(0.55)) {
    const tw = rng.int(2, 3);
    const p = place(tw * T, 2 * T, 30, T);
    if (p) {
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < tw; i++) {
          const x = p.x + i * T;
          const y = p.y + j * T;
          const base = ((x + y) / T) % 2 === 0 ? FA : FB;
          S.rect(x + 1, y + 1, T - 1, T - 1, base);
          W.paintVariant(S, rng, x, y, base, 'checker');
        }
      }
      S.rect(p.x, p.y, tw * T, 1, hx('#58608a'));
      count('chapa');
    }
  }
  // Pixel noise.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W_; x++) {
      const v = rng.next();
      if (v < 0.045) S.put(x, y, shade(S.get(x, y), 11));
      else if (v < 0.085) S.put(x, y, shade(S.get(x, y), -11));
    }
  }
  const floorX0 = T;
  const floorY0 = 2 * T;
  const floorX1 = W_ - T;
  const floorY1 = H - T;
  const randFloor = (m: number): { x: number; y: number } => ({ x: rng.int(floorX0 + m, floorX1 - m), y: rng.int(floorY0 + m, floorY1 - m) });
  const onFloor = (x: number, y: number): boolean => y >= floorY0 && !wall(Math.floor(x / T), Math.floor(y / T));

  // Grime: oil puddles and rust stains (more of both in the forgotten rooms).
  const area = (W_ * H) / (480 * 288);
  const dirt = style === 'secret' ? 2 : style === 'shop' || style === 'start' ? 0.5 : 1;
  for (let i = 0; i < Math.round(3 * area * dirt); i++) {
    const { x: cx, y: cy } = randFloor(30);
    const rx = rng.int(12, 26);
    const ry = Math.max(4, Math.round(rx / 2.8));
    const a = rng.int(65, 95);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rng.next() * 0.25 - 0.1) S.set(x, y, [12, 10, 22, a]);
      }
    }
  }
  for (let i = 0; i < Math.round(3 * area * dirt); i++) {
    const { x: cx, y: cy } = randFloor(12);
    for (let k = 0; k < 26; k++) S.set(cx + rng.int(-6, 6), cy + rng.int(-4, 4), hx('#6e4a34'));
  }

  // Forklift tracks across the room.
  if ((style === 'combat' || style === 'test') && rng.chance(0.6)) {
    const vertical = rng.chance(0.4);
    if (vertical) W.tyreTracks(S, rng.int(floorX0 + 20, floorX1 - 32), floorY0, floorY1 - floorY0, true);
    else W.tyreTracks(S, floorX0, rng.int(floorY0 + 20, floorY1 - 32), floorX1 - floorX0, false);
    count('rodadas');
  }
  // A painted loading bay.
  if ((style === 'combat' || style === 'test') && rng.chance(0.45)) {
    const w = rng.int(3, 4) * T;
    const p = place(w, 2 * T, 30, T);
    if (p) {
      W.loadingBay(S, p.x + 3, p.y + 3, w - 6, 2 * T - 6, rng.pick(['CARGA', 'DESCARGA', 'DESCARTES', 'MERMA']));
      count('muelle');
    }
  }
  // Words painted on the floor.
  const nStencils = style === 'combat' && area > 1.6 ? 2 : 1;
  for (const text of rng.shuffle([...STENCILS[style]]).slice(0, nStencils)) {
    const tw = W.stencilWidth(text);
    const p = place(tw + 4, 9);
    if (p) {
      W.floorStencil(S, p.x + 2, p.y + 2, text);
      count(`letrero:${text}`);
    }
  }
  // Arrows pointing at a couple of doors.
  if (style === 'combat' || style === 'start') {
    let n = 0;
    for (const d of rng.shuffle([...doorsIn])) {
      if (style === 'start' && d.dir === 'S') continue; // the doormat is there
      if (n >= 2 || rng.chance(0.4)) continue;
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      const tip = d.dir === 'N' ? { x: cx, y: floorY0 + 8 } : d.dir === 'S' ? { x: cx, y: floorY1 - 8 } : d.dir === 'W' ? { x: floorX0 + 10, y: cy } : { x: floorX1 - 11, y: cy };
      if (!onFloor(tip.x, tip.y)) continue;
      W.chevrons(S, Math.round(tip.x), Math.round(tip.y), d.dir);
      n++;
    }
    if (n > 0) count('flechas');
  }
  // Odds and ends: receipts, screws, a cable.
  const litter = style === 'shop' ? 0.4 : style === 'secret' ? 1.6 : 1;
  for (let i = 0; i < Math.round(9 * area * litter); i++) {
    const { x, y } = randFloor(4);
    if (onFloor(x, y) && onFloor(x + 5, y + 2)) W.receipt(S, rng, x, y);
  }
  for (let i = 0; i < Math.round(6 * area * litter); i++) {
    const { x, y } = randFloor(4);
    if (onFloor(x, y)) W.screw(S, x, y);
  }
  for (let i = 0; i < Math.max(1, Math.round(area * litter)); i++) {
    const { x, y } = randFloor(12);
    if (onFloor(x - 2, y - 3) && onFloor(x + 12, y + 3)) W.cable(S, rng, x, y);
  }
  count('basura');

  // What each kind of room has of its own on the floor.
  const southDoor = doorsIn.find((d) => d.dir === 'S');
  const midX = Math.round(W_ / 2);
  if (style === 'start') {
    const x = (southDoor ? southDoor.x + southDoor.w / 2 : midX) - 26;
    W.doormat(S, Math.round(x), floorY1 - 16, 52, 'BIENVENIDO');
    count('felpudo');
  } else if (style === 'shop') {
    const top = floorY0 + 2 * T;
    W.carpet(S, midX - 22, top, 44, floorY1 - top - 2);
    count('alfombra');
  } else if (style === 'boss') {
    for (let i = 0; i < Math.round(4 * area); i++) {
      const { x, y } = randFloor(20);
      W.frost(S, rng, x, Math.min(y, floorY0 + rng.int(10, 70)), rng.int(14, 26));
    }
    // Cold air: everything a little bluer.
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, [105, 219, 216, 14]);
    count('escarcha');
  } else if (style === 'secret') {
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, [110, 74, 52, 22]);
    count('polvo');
  }

  // Painted safety lines, 16 px inside the walls (nobody painted the secret room).
  if (style !== 'secret') {
    const dash = hx('#8a7424');
    const lx0 = floorX0 + 16;
    const lx1 = floorX1 - 16;
    const ly0 = floorY0 + 12;
    const ly1 = floorY1 - 12;
    for (let x = lx0; x < lx1; x++) {
      if (Math.floor(x / 10) % 2 === 0) {
        S.set(x, ly0, dash);
        S.set(x, ly1, dash);
      }
    }
    for (let y = ly0; y <= ly1; y++) {
      if (Math.floor(y / 10) % 2 === 0) {
        S.set(lx0, y, dash);
        S.set(lx1 - 1, y, dash);
      }
    }
  }

  // Walls.
  const WALL = hx('#222638');
  const SEAM = hx('#1a1d2c');
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (!wall(c, r)) continue;
      S.rect(c * T, r * T, T, T, WALL);
      if (r >= 2 && (c === 0 || c === room.cols - 1) && r % 2 === 0) S.rect(c * T, r * T, T, 1, SEAM);
      if (r === room.rows - 1 && c % 2 === 1) S.rect(c * T, r * T, 1, T, SEAM);
    }
  }
  // Interior walls are free-standing shelving units seen in three-quarter view: the top of the
  // unit on every tile, and the front (shelves full of returns) on the tiles with floor below.
  const interior = (c: number, r: number): boolean => c > 0 && r > 1 && c < room.cols - 1 && r < room.rows - 1 && wall(c, r);
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (!interior(c, r)) continue;
      shelfUnit(S, rng, c * T, r * T, {
        front: !wall(c, r + 1),
        up: !wall(c, r - 1),
        left: !wall(c - 1, r),
        right: !wall(c + 1, r),
      });
      // Its shadow on the floor below.
      if (!wall(c, r + 1)) for (let y = 0; y < 5; y++) for (let x = 0; x < T; x++) S.set(c * T + x, (r + 1) * T + y, [12, 10, 22, 110 - y * 20]);
    }
  }
  for (let x = 0; x < W_; x += 48) S.rect(x, 0, 1, 48, SEAM);

  // Side and front walls: a conduit with brackets, electrical boxes, an extinguisher, vents.
  const nearDoor = (x: number, y: number, w: number, h: number): boolean => doorsIn.some((d) => hit({ x, y, w, h }, { x: d.x - 6, y: d.y - 6, w: d.w + 12, h: d.h + 12 }));
  for (const wx of [0, W_ - T]) {
    const px = wx + 7;
    for (let y = floorY0; y < floorY1; y++) {
      if (nearDoor(px, y, 3, 1)) continue;
      S.rect(px, y, 3, 1, hx('#3a4058'));
      S.set(px, y, hx('#5a627c'));
      S.set(px + 2, y, hx('#262b40'));
      if (y % 36 === 0) S.rect(px - 1, y, 5, 2, hx('#5d658a'));
    }
  }
  {
    let boxes = 0;
    for (let i = 0; i < 12 && boxes < Math.max(1, Math.round(area)); i++) {
      const wx = rng.chance(0.5) ? 0 : W_ - T;
      const y = rng.int(floorY0 + 6, floorY1 - 20);
      if (nearDoor(wx, y - 2, T, 16)) continue;
      if (boxes === 0 && style !== 'secret') W.extinguisher(S, wx + 9, y);
      else W.junctionBox(S, wx + 5, y);
      boxes++;
    }
    if (boxes > 0) count('pared');
  }
  for (let x = T * 2; x < W_ - T * 2; x += T * 4) {
    if (nearDoor(x, H - T, 20, T) || !rng.chance(0.5)) continue;
    S.rect(x, H - 15, 18, 8, hx('#14162a'));
    for (let j = H - 14; j < H - 8; j += 2) S.rect(x + 1, j, 16, 1, hx('#3a4058'));
  }

  // Ceiling pipe and fluorescent lamps (the secret room got one, and it was a cheap one).
  S.rect(0, 2, W_, 5, hx('#3e4560'));
  S.rect(0, 2, W_, 1, hx('#5d658a'));
  S.rect(0, 6, W_, 1, hx('#262b40'));
  for (let x = 30; x < W_; x += 90) S.rect(x, 1, 3, 7, hx('#2a2f48'));
  const lamps: RoomArt['lamps'] = [];
  const nLamps = style === 'secret' ? 1 : Math.max(2, Math.round(W_ / 240));
  for (let i = 0; i < nLamps; i++) {
    const lx = Math.round(((i + 0.5) * W_) / nLamps) - 22;
    S.rect(lx, 8, 44, 3, hx('#cfc9a8'));
    S.rect(lx + 2, 11, 40, 1, WHITE);
    lamps.push({ x: lx + 22, y: floorY0 + (floorY1 - floorY0) * 0.42 });
  }

  // Shelves full of returned boxes.
  for (const [plankY, hmax, hmin] of [[26, 14, 8], [40, 11, 7]] as const) {
    let x = 26;
    while (x < W_ - 28) {
      const w = rng.int(8, 15);
      const h = rng.int(hmin, hmax);
      const col = hx(rng.pick(BOX_COLORS));
      const dark: RGBA = [Math.trunc(col[0] * 0.7), Math.trunc(col[1] * 0.7), Math.trunc(col[2] * 0.7), 255];
      S.rect(x, plankY - h, w, h, col);
      S.rect(x + w - 2, plankY - h, 2, h, dark);
      S.rect(x, plankY - h, w, 1, [255, 255, 255, 60]);
      if (rng.chance(0.5)) S.rect(x + 2, plankY - Math.floor(h / 2), Math.max(1, w - 6), 1, WHITE);
      x += w + rng.int(1, 4);
    }
    S.rect(0, plankY, W_, 2, hx('#4c5374'));
    S.rect(0, plankY, W_, 1, hx('#5d658a'));
  }
  S.rect(0, 47, W_, 1, K);

  // On the back shelving: the room's sign, a queue display and a clock stopped at twelve, in
  // spots away from the north door and from each other.
  {
    const north = doorsIn.find((d) => d.dir === 'N');
    const nx = north ? north.x + north.w / 2 : -999;
    const spots = rng.shuffle([0.16, 0.3, 0.44, 0.58, 0.72, 0.86].map((f) => Math.round(f * W_))).filter((x) => Math.abs(x - nx) > 46);
    const taken: number[] = [];
    const spot = (half: number): number | null => {
      const x = spots.find((s) => s - half > 20 && s + half < W_ - 20 && taken.every((t) => Math.abs(t - s) > half + 34));
      if (x === undefined) return null;
      taken.push(x);
      return x;
    };
    const [text, bg, fg] = rng.pick(SIGNS[style]);
    const sx = spot(W.stencilWidth(text) / 2 + 6);
    if (sx !== null) {
      W.signPlate(S, sx, 14, text, hx(bg), hx(fg));
      count(`cartel:${text}`);
    }
    if (style !== 'secret' && style !== 'treasure') {
      const tx = spot(12);
      if (tx !== null) {
        W.turnDisplay(S, rng, tx - 11, 28);
        count('turno');
      }
    }
    const cx = spot(6);
    if (cx !== null) {
      W.clock(S, cx, 19);
      count('reloj');
    }
    if (style === 'shop') {
      W.priceTags(S, rng, 24, W_ - 24, 41);
      count('etiquetas');
    }
  }

  // Yellow and black hazard tape on the inner edge of the walls.
  const ya = hx('#b08a1c');
  const yb = hx('#191622');
  for (let y = floorY0; y < floorY1; y++) {
    for (let x = T - 5; x < T; x++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);
    for (let x = W_ - T; x < W_ - T + 5; x++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);
  }
  for (let x = T; x < W_ - T; x++) for (let y = H - T; y < H - T + 5; y++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);

  // Cobwebs in the corners of the room nobody visits.
  if (style === 'secret') {
    W.cobweb(S, floorX0, floorY0, 1, 1);
    W.cobweb(S, floorX1 - 1, floorY0, -1, 1);
    W.cobweb(S, floorX0, floorY1 - 1, 1, -1);
    W.cobweb(S, floorX1 - 1, floorY1 - 1, -1, -1);
    count('telarañas');
  }

  // Doorways: a dark hole in the wall with a steel frame; the renderer puts the shutter on top.
  const doors: RoomArt['doors'] = [];
  for (const d of doorsIn) {
    const hole = d.dir === 'N' ? { x: d.x, y: 14, w: d.w, h: 34 } : { x: d.x, y: d.y, w: d.w, h: d.h };
    S.rect(hole.x, hole.y, hole.w, hole.h, hx('#0b0a12'));
    if (d.dir === 'N' || d.dir === 'S') {
      S.rect(hole.x - 2, hole.y - (d.dir === 'N' ? 2 : 0), 2, hole.h + 2, hx('#5d658a'));
      S.rect(hole.x + hole.w, hole.y - (d.dir === 'N' ? 2 : 0), 2, hole.h + 2, hx('#3e4560'));
      if (d.dir === 'N') S.rect(hole.x - 2, hole.y - 2, hole.w + 4, 2, hx('#5d658a'));
      doors.push({ dir: d.dir, x: hole.x, y: hole.y, w: hole.w, h: d.dir === 'N' ? 33 : hole.h });
    } else {
      S.rect(hole.x, hole.y - 2, hole.w, 2, hx('#5d658a'));
      S.rect(hole.x, hole.y + hole.h, hole.w, 2, hx('#3e4560'));
      doors.push({ dir: d.dir, ...hole });
    }
  }

  // Warm light pools under the lamps (stronger over the treasure: it wants to be seen).
  const pool = style === 'treasure' ? 46 : style === 'secret' ? 16 : 26;
  const pools = style === 'treasure' ? [{ x: W_ / 2, y: floorY0 + (floorY1 - floorY0) / 2 }] : lamps;
  for (const l of pools) {
    const rx = 90;
    const ry = 60;
    for (let y = Math.round(l.y - ry); y <= l.y + ry; y++) {
      for (let x = Math.round(l.x - rx); x <= l.x + rx; x++) {
        const d = ((x - l.x) / rx) ** 2 + ((y - l.y) / ry) ** 2;
        if (d <= 1 && y >= floorY0 && x >= T && x < W_ - T && y < floorY1) S.set(x, y, [255, 226, 150, Math.trunc(pool * (1 - d))]);
      }
    }
  }
  return { canvas: S, lamps, doors, features };
}
