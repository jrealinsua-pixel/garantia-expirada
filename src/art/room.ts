// Paints a warehouse room (floor 1) from its tile grid. Same method as the approved mock-up
// (tools/referencia/build2.py make_scene), generalised to any size and with the game's seeded RNG.
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';

export interface PaintableRoom {
  cols: number;
  rows: number;
  tiles: Uint8Array;
  /** Door openings in pixels (src/sim/room.ts RoomDoor). */
  doors?: readonly { dir: string; x: number; y: number; w: number; h: number }[];
}

const T = 24;

export interface RoomArt {
  canvas: Canvas;
  /** Lamp centres, for the renderer's light pools / flicker. */
  lamps: Array<{ x: number; y: number }>;
  /** Where each door's shutter goes (sprites persiana-n, -s and -v). */
  doors: Array<{ dir: string; x: number; y: number; w: number; h: number }>;
}

const shade = (c: RGBA, d: number): RGBA => [
  Math.max(0, Math.min(255, c[0] + d)),
  Math.max(0, Math.min(255, c[1] + d)),
  Math.max(0, Math.min(255, c[2] + Math.round(d * 1.15))),
  255,
];

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

export function paintRoom(room: PaintableRoom, seed: string): RoomArt {
  const rng = new Rng('room-art:' + seed);
  const W = room.cols * T;
  const H = room.rows * T;
  const S = new Canvas(W, H, K);
  const wall = (c: number, r: number): boolean => c < 0 || r < 0 || c >= room.cols || r >= room.rows || room.tiles[r * room.cols + c] === 1;

  // Floor tiles: checker, grout, rivets in the corners.
  const FA = hx('#3a4060');
  const FB = hx('#353b58');
  const GR = hx('#262b40');
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (wall(c, r)) continue;
      const x = c * T;
      const y = r * T;
      S.rect(x, y, T, T, (c + r) % 2 === 0 ? FA : FB);
      S.rect(x, y, T, 1, GR);
      S.rect(x, y, 1, T, GR);
      for (const [ox, oy] of [[2, 2], [T - 3, 2], [2, T - 3], [T - 3, T - 3]] as const) {
        S.set(x + ox, y + oy, hx('#58608a'));
        S.set(x + ox + 1, y + oy + 1, hx('#20243a'));
      }
    }
  }
  // Pixel noise.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = rng.next();
      if (v < 0.045) S.put(x, y, shade(S.get(x, y), 11));
      else if (v < 0.085) S.put(x, y, shade(S.get(x, y), -11));
    }
  }
  const floorX0 = T;
  const floorY0 = 2 * T;
  const floorX1 = W - T;
  const floorY1 = H - T;
  const randFloor = (m: number): { x: number; y: number } => ({ x: rng.int(floorX0 + m, floorX1 - m), y: rng.int(floorY0 + m, floorY1 - m) });

  // Grime: oil puddles, rust stains, a drain.
  const area = (W * H) / (480 * 288);
  for (let i = 0; i < Math.round(3 * area); i++) {
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
  for (let i = 0; i < Math.round(3 * area); i++) {
    const { x: cx, y: cy } = randFloor(12);
    for (let k = 0; k < 26; k++) S.set(cx + rng.int(-6, 6), cy + rng.int(-4, 4), hx('#6e4a34'));
  }
  {
    const { x, y } = randFloor(40);
    const dx = Math.floor(x / T) * T;
    S.rect(dx, y, 48, 14, hx('#1a1d2e'));
    for (let i = dx + 2; i < dx + 46; i += 4) S.rect(i, y + 2, 2, 10, hx('#3a4058'));
  }

  // Painted safety lines, 16 px inside the walls.
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
  for (let x = 0; x < W; x += 48) S.rect(x, 0, 1, 48, SEAM);

  // Ceiling pipe and fluorescent lamps.
  S.rect(0, 2, W, 5, hx('#3e4560'));
  S.rect(0, 2, W, 1, hx('#5d658a'));
  S.rect(0, 6, W, 1, hx('#262b40'));
  for (let x = 30; x < W; x += 90) S.rect(x, 1, 3, 7, hx('#2a2f48'));
  const lamps: RoomArt['lamps'] = [];
  const nLamps = Math.max(2, Math.round(W / 240));
  for (let i = 0; i < nLamps; i++) {
    const lx = Math.round(((i + 0.5) * W) / nLamps) - 22;
    S.rect(lx, 8, 44, 3, hx('#cfc9a8'));
    S.rect(lx + 2, 11, 40, 1, WHITE);
    lamps.push({ x: lx + 22, y: floorY0 + (floorY1 - floorY0) * 0.42 });
  }

  // Shelves full of returned boxes.
  const colors = ['#c23d38', '#d9a52a', '#3f74bd', '#4b9a4e', '#d3849a', '#d9782a', '#5cc2c0', '#a8916c', '#aab1c4'];
  for (const [plankY, hmax, hmin] of [[26, 14, 8], [40, 11, 7]] as const) {
    let x = 26;
    while (x < W - 28) {
      const w = rng.int(8, 15);
      const h = rng.int(hmin, hmax);
      const col = hx(rng.pick(colors));
      const dark: RGBA = [Math.trunc(col[0] * 0.7), Math.trunc(col[1] * 0.7), Math.trunc(col[2] * 0.7), 255];
      S.rect(x, plankY - h, w, h, col);
      S.rect(x + w - 2, plankY - h, 2, h, dark);
      S.rect(x, plankY - h, w, 1, [255, 255, 255, 60]);
      if (rng.chance(0.5)) S.rect(x + 2, plankY - Math.floor(h / 2), Math.max(1, w - 6), 1, WHITE);
      x += w + rng.int(1, 4);
    }
    S.rect(0, plankY, W, 2, hx('#4c5374'));
    S.rect(0, plankY, W, 1, hx('#5d658a'));
  }
  S.rect(0, 47, W, 1, K);

  // Yellow and black hazard tape on the inner edge of the walls.
  const ya = hx('#b08a1c');
  const yb = hx('#191622');
  for (let y = floorY0; y < floorY1; y++) {
    for (let x = T - 5; x < T; x++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);
    for (let x = W - T; x < W - T + 5; x++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);
  }
  for (let x = T; x < W - T; x++) for (let y = H - T; y < H - T + 5; y++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);

  // Doorways: a dark hole in the wall with a steel frame; the renderer puts the shutter on top.
  const doors: RoomArt['doors'] = [];
  for (const d of room.doors ?? []) {
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

  // Warm light pools under the lamps.
  for (const l of lamps) {
    const rx = 90;
    const ry = 60;
    for (let y = Math.round(l.y - ry); y <= l.y + ry; y++) {
      for (let x = Math.round(l.x - rx); x <= l.x + rx; x++) {
        const d = ((x - l.x) / rx) ** 2 + ((y - l.y) / ry) ** 2;
        if (d <= 1 && y >= floorY0 && x >= T && x < W - T && y < floorY1) S.set(x, y, [255, 226, 150, Math.trunc(26 * (1 - d))]);
      }
    }
  }
  return { canvas: S, lamps, doors };
}
