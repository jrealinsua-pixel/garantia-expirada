// Paints a room from its tile grid: the warehouse (floor 1), Informática (floor 2, src/art/informatica.ts) or
// the Juguetería (floor 3, src/art/jugueteria.ts), the Oficinas (floor 4, src/art/oficinas.ts) or Atención al Cliente
// (floor 5, src/art/atencion.ts) or the Servicio Técnico's Taller de Reacondicionado (floor 6, src/art/taller.ts). Same method as the approved mock-up
// (tools/referencia/build2.py make_scene), generalised to any size and with the game's seeded RNG.
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';
import * as W from './warehouse.ts';
import * as I from './informatica.ts';
import * as J from './jugueteria.ts';
import * as O from './oficinas.ts';
import * as A from './atencion.ts';
import * as R from './taller.ts';
import { hubHung } from './hub.ts';
import * as D from './decor.ts';

export interface PaintableRoom {
  cols: number;
  rows: number;
  tiles: Uint8Array;
  /** Door openings in pixels (src/sim/room.ts RoomDoor). */
  doors?: readonly { dir: string; x: number; y: number; w: number; h: number }[];
  /** What the room is for (src/data/types.ts RoomKind, or 'test'): picks the decoration. */
  kind?: string;
  /** Its template's id: the rare rooms (M14 (r2)) share a kind and tell themselves apart by it. */
  id?: string;
  /** The hub's stations and conveyor (src/sim/room.ts): what hangs on its back wall is kept clear of shelf signs. */
  stations?: readonly { kind: string; x: number }[];
  belt?: { x: number; w: number } | null;
  /** The workshop's conveyor belts (src/sim/room.ts RoomBelt): kept clear of decoration, framed in steel. */
  conveyors?: readonly { x: number; y: number; w: number; h: number; dirX: number; bite: number }[];
  /** Tiles outside the room's shape (M14b (h11c), ` ` in the template): solid, painted as more of the outer wall, not as shelving. Row-major, 1 = outside. */
  outside?: Uint8Array;
  /** Which floor of the store (1: the warehouse, 2: Informática, 3: Juguetería, 4: Oficinas, 5: Atención al Cliente, 6 and up: the Taller de Reacondicionado). Picks the tile set. Default 1. */
  level?: number;
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
  rare: ['LETRA PEQUEÑA'],
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
  rare: [['FINANCIACIÓN', '#2f5a3a', '#f6c431']],
};

/** Floor 2: the same jokes, with a computer department's vocabulary. */
const STENCILS_2: Record<W.RoomStyle, readonly string[]> = {
  combat: ['NO DESCONECTAR', 'REINICIE Y VUELVA', 'SIN COBERTURA', 'ACTUALIZANDO', 'LICENCIA CADUCADA', 'ACEPTE LAS COOKIES', 'CARGANDO...'],
  test: ['ZONA DE PRUEBAS'],
  start: ['SESIÓN INICIADA'],
  treasure: ['RECUPERADO'],
  shop: ['PAGUE AQUÍ'],
  secret: ['ARCHIVO NO ENCONTRADO'],
  boss: ['SOLO ADMINISTRADORES'],
  rare: ['CRÉDITO PREAPROBADO'],
};

const SIGNS_2: Record<W.RoomStyle, ReadonlyArray<readonly [string, string, string]>> = {
  combat: [
    ['INFORMÁTICA', '#2f6b5a', '#f4f1e8'],
    ['PERIFÉRICOS', '#3f66a6', '#f4f1e8'],
    ['TELEFONÍA', '#5a3f7a', '#f4f1e8'],
    ['CONSUMIBLES', '#a42f37', '#fff1a8'],
    ['REACONDICIONADOS', '#434963', '#d3d8e4'],
  ],
  test: [['SALA DE PRUEBAS', '#434963', '#f6c431']],
  start: [['PLANTA 2 · INFORMÁTICA', '#2f6b5a', '#f4f1e8']],
  treasure: [['COPIAS DE SEGURIDAD', '#8f5a1c', '#fff1a8']],
  shop: [['OFERTAS FLASH', '#a42f37', '#fff1a8']],
  secret: [['PAPELERA DE RECICLAJE', '#434963', '#858ea8']],
  boss: [['SALA DE SERVIDORES', '#1b1d2e', '#58b45a']],
  rare: [['PAGO APLAZADO', '#2f5a3a', '#f6c431']],
};

/** Floor 3: the toy department's vocabulary. */
const STENCILS_3: Record<W.RoomStyle, readonly string[]> = {
  combat: ['NO TOCAR', 'PILAS NO INCLUIDAS', 'EDAD: 3+', 'PIEZAS PEQUEÑAS', 'TEMPORADA ANTERIOR', 'ÚLTIMAS UNIDADES', 'NO APTO PARA ADULTOS'],
  test: ['ZONA DE PRUEBAS'],
  start: ['PROHIBIDO CRECER'],
  treasure: ['CARTA RECIBIDA'],
  shop: ['PAGUE AQUÍ'],
  secret: ['RETIRADO DEL MERCADO'],
  boss: ['NOVEDAD'],
  rare: ['PAGUE EN 3 PLAZOS'],
};

const SIGNS_3: Record<W.RoomStyle, ReadonlyArray<readonly [string, string, string]>> = {
  combat: [
    ['JUGUETERÍA', '#a8496a', '#fff1a8'],
    ['MUÑECAS', '#c26a8a', '#f4f1e8'],
    ['CONSTRUCCIÓN', '#c2a23a', '#1b1d2e'],
    ['PELUCHES', '#5a7ab0', '#f4f1e8'],
    ['JUEGOS DE MESA', '#3f7a42', '#f4f1e8'],
    ['VUELTA AL COLE', '#a42f37', '#fff1a8'],
  ],
  test: [['SALA DE PRUEBAS', '#434963', '#f6c431']],
  start: [['PLANTA 3 · JUGUETERÍA', '#a8496a', '#fff1a8']],
  treasure: [['CARTAS A LOS REYES', '#8f5a1c', '#fff1a8']],
  shop: [['TODO A UN TICKET', '#a42f37', '#fff1a8']],
  secret: [['RETIRADOS POR SEGURIDAD', '#434963', '#858ea8']],
  boss: [['ESCAPARATE DE NOVEDADES', '#1b1d2e', '#e88fa4']],
  rare: [['COMPRE AHORA', '#2f5a3a', '#f6c431']],
};

/** Floor 4: the offices' vocabulary (tape on the carpet, not paint: nobody paints a carpet). */
const STENCILS_4: Record<W.RoomStyle, readonly string[]> = {
  combat: ['NO MOLESTAR', 'FUERA DE HORARIO', 'OBJETIVOS Q3', 'PUESTO COMPARTIDO', 'FICHE AL SALIR', 'ESPACIO DIÁFANO', 'SIN PAPELES'],
  test: ['ZONA DE PRUEBAS'],
  start: ['VISITAS'],
  treasure: ['PIDA CITA'],
  shop: ['PAGUE AQUÍ'],
  secret: ['PARA DESTRUIR'],
  boss: ['ORDEN DEL DÍA'],
  rare: ['NÓMINA DOMICILIADA'],
};

const SIGNS_4: Record<W.RoomStyle, ReadonlyArray<readonly [string, string, string]>> = {
  combat: [
    ['CONTABILIDAD', '#3a3d4a', '#d8dbe0'],
    ['RECURSOS HUMANOS', '#5a2f3a', '#f4f1e8'],
    ['MARKETING', '#2f4a7a', '#f4f1e8'],
    ['COMPRAS', '#3a3d4a', '#f6c431'],
    ['CALIDAD', '#2f5a4a', '#f4f1e8'],
    ['ATENCIÓN INTERNA', '#4a4a52', '#d8dbe0'],
  ],
  test: [['SALA DE PRUEBAS', '#434963', '#f6c431']],
  start: [['PLANTA 4 · OFICINAS', '#3a3d4a', '#f4f1e8']],
  treasure: [['MATERIAL DE OFICINA', '#8f5a1c', '#fff1a8']],
  shop: [['ECONOMATO', '#a42f37', '#fff1a8']],
  secret: [['CONFIDENCIAL', '#434963', '#858ea8']],
  boss: [['SALA DE JUNTAS', '#1b1d2e', '#d8dbe0']],
  rare: [['CRÉDITOS AL PERSONAL', '#2f5a3a', '#f6c431']],
};

/** Floor 5: the customer service vocabulary (the yellow paint of the line that leads nowhere). */
const STENCILS_5: Record<W.RoomStyle, readonly string[]> = {
  combat: ['SIGA LA LÍNEA', 'NO SE ATIENDE', 'VENTANILLA 0', 'TURNO PERDIDO', 'PASE SIN LLAMAR', 'HORARIO: NUNCA', 'GRACIAS POR ESPERAR'],
  test: ['ZONA DE PRUEBAS'],
  start: ['COJA NÚMERO'],
  treasure: ['NO RECLAMADO'],
  shop: ['PAGUE AQUÍ'],
  secret: ['LLAMADA GRABADA'],
  boss: ['NO CUELGUE'],
  rare: ['SU CUOTA ESPERA'],
};

const SIGNS_5: Record<W.RoomStyle, ReadonlyArray<readonly [string, string, string]>> = {
  combat: [
    ['ATENCIÓN AL CLIENTE', '#2f4a6a', '#f4f1e8'],
    ['INCIDENCIAS', '#5a2f3a', '#f4f1e8'],
    ['POSVENTA', '#2f5a6a', '#f4f1e8'],
    ['GARANTÍAS', '#3a3d4a', '#f6c431'],
    ['INFORMACIÓN', '#2f4a7a', '#f4f1e8'],
    ['BAJAS', '#4a4a52', '#d8dbe0'],
  ],
  test: [['SALA DE PRUEBAS', '#434963', '#f6c431']],
  start: [['PLANTA 5 · ATENCIÓN', '#2f4a6a', '#f4f1e8']],
  treasure: [['NO SE DEVUELVEN', '#8f5a1c', '#fff1a8']],
  shop: [['REPUESTOS ORIGINALES', '#a42f37', '#fff1a8']],
  secret: [['GRABACIONES', '#434963', '#858ea8']],
  boss: [['CENTRALITA', '#1b1d2e', '#f6c431']],
  rare: [['FINANCIACIÓN', '#2f5a3a', '#f6c431']],
};

/** Floor 6: the workshop's vocabulary (green paint, the colour of the labels). There is no shop, treasure or secret room up here, but every style has its words. */
const STENCILS_6: Record<W.RoomStyle, readonly string[]> = {
  combat: ['COMO NUEVO', 'NO REPARABLE', 'PIEZA NO ORIGINAL', 'GARANTÍA ANULADA', 'REVISADO', 'APTO', 'FUERA DE PLAZO'],
  test: ['ZONA DE PRUEBAS'],
  start: ['SIN CITA NO'],
  treasure: ['COMO NUEVO'],
  shop: ['PAGUE AQUÍ'],
  secret: ['DESGUACE'],
  boss: ['TRITURACIÓN'],
  rare: ['EMBARGADO'],
};

const SIGNS_6: Record<W.RoomStyle, ReadonlyArray<readonly [string, string, string]>> = {
  combat: [
    ['REACONDICIONADO', '#2f6b3a', '#f4f1e8'],
    ['DIAGNÓSTICO', '#3a3d34', '#f6c431'],
    ['DESMONTAJE', '#5a2f2a', '#f4f1e8'],
    ['PIEZAS', '#3a4a6a', '#f4f1e8'],
    ['EMBALAJE', '#7a5a3a', '#fff1a8'],
    ['CONTROL DE CALIDAD', '#2f6b3a', '#f4f1e8'],
  ],
  test: [['SALA DE PRUEBAS', '#434963', '#f6c431']],
  // The entrance's sign is its own light box (R.entranceSign): this is only its name.
  start: [[R.ENTRANCE, '#2f6b3a', '#f4f1e8']],
  treasure: [['COMO NUEVO', '#8f5a1c', '#fff1a8']],
  shop: [['RECAMBIOS', '#a42f37', '#fff1a8']],
  secret: [['DESGUACE', '#434963', '#858ea8']],
  boss: [['TRITURACIÓN', '#1b1d2e', '#58b45a']],
  rare: [['EMBARGOS', '#2f5a3a', '#f6c431']],
};

/** The Sorteo de Fidelización (M14 (r2b)) has its own words and sign, the same on every floor. */
const RAFFLE_STENCIL: readonly string[] = ['SIGA PARTICIPANDO'];
const RAFFLE_SIGN: readonly [string, string, string] = ['SORTEO', '#a42f37', '#f6c431'];

const STYLES: readonly W.RoomStyle[] = ['start', 'combat', 'treasure', 'shop', 'secret', 'boss', 'test', 'rare'];

export function paintRoom(room: PaintableRoom, seed: string): RoomArt {
  const rng = new Rng('room-art:' + seed);
  const two = room.level === 2;
  const three = room.level === 3;
  const four = room.level === 4;
  const five = room.level === 5;
  const six = (room.level ?? 1) >= 6;
  /** Any floor above the warehouse. */
  const up = two || three || four || five || six;
  const style: W.RoomStyle = STYLES.includes(room.kind as W.RoomStyle) ? (room.kind as W.RoomStyle) : 'combat';
  const features: string[] = [];
  const W_ = room.cols * T;
  const H = room.rows * T;
  const S = new Canvas(W_, H, K);
  const wall = (c: number, r: number): boolean => c < 0 || r < 0 || c >= room.cols || r >= room.rows || room.tiles[r * room.cols + c] === 1;
  // M14b (h11c): the tiles cut out of the room's shape (an L, a cross, a corner cut off).
  const out = (c: number, r: number): boolean => c >= 0 && r >= 0 && c < room.cols && r < room.rows && room.outside?.[r * room.cols + c] === 1;
  // The stretch of the back wall still in view (between the cut-out corners), for the lamps and the signs.
  // How far down the wall comes at each column (1: the back wall; deeper over a cut-out corner,
  // whose face is the back wall brought forward): a sign hangs whole on one stretch of one face.
  const faceRow = (c: number): number => {
    let r = 1;
    while (r + 1 < room.rows && wall(c, r + 1) && out(c, r + 1)) r++;
    return r;
  };
  const onOneFace = (x0: number, x1: number): boolean => {
    const c0 = Math.floor(x0 / T);
    const c1 = Math.floor((x1 - 1) / T);
    if (c0 < 1 || c1 > room.cols - 2) return false;
    for (let c = c0; c <= c1; c++) if (faceRow(c) !== faceRow(c0) || !floorBelowFace(c)) return false;
    return true;
  };
  const floorBelowFace = (c: number): boolean => !wall(c, faceRow(c) + 1);
  let openX0 = T;
  let openX1 = W_ - T;
  if (room.outside) {
    const open = Array.from({ length: room.cols - 2 }, (_, i) => i + 1).filter((c) => !out(c, 2));
    if (open.length > 0) {
      openX0 = open[0]! * T;
      openX1 = (open[open.length - 1]! + 1) * T;
    }
  }
  const doorsIn = room.doors ?? [];
  const belts = room.conveyors ?? [];

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
    for (const b of belts) if (hit(me, { x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8 })) return false;
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
  const variants = new Map<W.TileVariant | I.PanelVariant | J.MatVariant | O.CarpetVariant | A.LinoVariant | R.WorkshopVariant, number>();
  // Floor 3: each mat's colour and variation (the jigsaw tabs and the cut-outs go on after).
  const mats: Array<RGBA | undefined> = [];
  const matVariant: J.MatVariant[] = [];
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
      if (six) {
        // Small square tiles, four to a cell, from two boxes that alternate cell by cell.
        const base = (c + r) % 2 === 0 ? R.C.tileA : R.C.tileB;
        R.workshopTile(S, rng, x, y, base);
        let v = r >= 2 ? R.pickWorkshopVariant(rng, style) : 'plain';
        // Drains: as few as the grates downstairs, never two close together.
        if (v === 'drain' && (grates >= maxGrates || r * room.cols + c - lastGrate < 3 * room.cols)) v = 'plain';
        if (v === 'drain') {
          lastGrate = r * room.cols + c;
          grates++;
        }
        if (v !== 'plain') {
          R.paintWorkshop(S, rng, x, y, base, v);
          variants.set(v, (variants.get(v) ?? 0) + 1);
        }
        continue;
      }
      if (five) {
        // Linoleum in sheets two tiles wide, the two dye lots alternating sheet by sheet.
        const base = Math.floor(c / 2) % 2 === 0 ? A.C.linoA : A.C.linoB;
        A.linoTile(S, rng, x, y, base, c % 2 === 0);
        const v = r >= 2 ? A.pickLinoVariant(rng, style) : 'plain';
        if (v !== 'plain') {
          A.paintLino(S, rng, x, y, base, v);
          variants.set(v, (variants.get(v) ?? 0) + 1);
        }
        continue;
      }
      if (four) {
        // Carpet tiles laid quarter-turned: the pile goes across on one, along on the next.
        const across = (c + r) % 2 === 0;
        O.carpetTile(S, rng, x, y, across ? O.C.carpetA : O.C.carpetB, across);
        const v = r >= 2 ? O.pickCarpetVariant(rng, style) : 'plain';
        if (v !== 'plain') {
          O.paintCarpet(S, rng, x, y, across ? O.C.carpetA : O.C.carpetB, v);
          variants.set(v, (variants.get(v) ?? 0) + 1);
        }
        continue;
      }
      if (three) {
        const base = J.pickMat(rng, [mats[r * room.cols + c - 1], mats[(r - 1) * room.cols + c]]);
        mats[r * room.cols + c] = base;
        const v = r >= 2 ? J.pickMatVariant(rng, style) : 'plain';
        matVariant[r * room.cols + c] = v;
        if (v === 'missing') J.missingMat(S, rng, x, y);
        else J.mat(S, rng, x, y, base);
        if (v !== 'plain') variants.set(v, (variants.get(v) ?? 0) + 1);
        continue;
      }
      if (two) {
        const base = (c + r) % 2 === 0 ? I.C.floorA : I.C.floorB;
        I.panel(S, rng, x, y, base);
        let v = r >= 2 ? I.pickPanel(rng, style) : 'plain';
        if (v === 'perforated' && (grates >= maxGrates * 2 || r * room.cols + c - lastGrate < 3)) v = 'plain';
        if (v === 'perforated') {
          lastGrate = r * room.cols + c;
          grates++;
        }
        if (v !== 'plain') {
          I.paintPanel(S, rng, x, y, base, v);
          variants.set(v, (variants.get(v) ?? 0) + 1);
        }
        continue;
      }
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
  if (three) {
    // The jigsaw tabs where two mats meet (none into or out of a missing one), then the
    // variations on top, so a letter or a bite is not cut by a neighbour's tab.
    for (let r = 2; r < room.rows; r++) {
      for (let c = 0; c < room.cols; c++) {
        const i = r * room.cols + c;
        if (wall(c, r) || matVariant[i] === 'missing') continue;
        if (!wall(c + 1, r) && matVariant[i + 1] !== 'missing') {
          const out = (c + r) % 2 === 0;
          J.matTab(S, (c + 1) * T, r * T + 12, out ? 1 : -1, 0, mats[out ? i : i + 1]!);
        }
        if (r + 1 < room.rows && !wall(c, r + 1) && matVariant[i + room.cols] !== 'missing') {
          const out = (c + r) % 2 === 1;
          J.matTab(S, c * T + 12, (r + 1) * T, 0, out ? 1 : -1, mats[out ? i : i + room.cols]!);
        }
      }
    }
    for (let r = 2; r < room.rows; r++) {
      for (let c = 0; c < room.cols; c++) {
        const v = matVariant[r * room.cols + c];
        if (!wall(c, r) && v && v !== 'plain' && v !== 'missing') J.paintMat(S, rng, c * T, r * T, mats[r * room.cols + c]!, v);
      }
    }
  }
  for (const v of variants.keys()) count(`casilla:${v}`);
  // A patch of diamond plate where the heavy stuff gets dragged.
  if (!up && style !== 'secret' && style !== 'start' && rng.chance(0.55)) {
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
  const dirt = style === 'secret' ? 2 : style === 'shop' || style === 'start' || style === 'rare' ? 0.5 : 1;
  if (three) {
    // Crayon on the mats, glitter that will never come off.
    for (let i = 0; i < Math.round(4 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(14);
      J.crayonScribble(S, rng, cx, cy);
    }
    for (let i = 0; i < Math.round(2 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(20);
      J.glitter(S, rng, cx, cy, rng.int(8, 14));
    }
  }
  if (six) {
    // Oil that dripped off whatever was carried through, grease where something was opened.
    for (let i = 0; i < Math.round(3 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(20);
      R.oilDrips(S, rng, cx, cy);
    }
  }
  if (five) {
    // The polisher's swirls (the floor is cleaned every night; nothing else is), heel marks.
    for (let i = 0; i < Math.round(3 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(24);
      A.polisherSwirl(S, rng, cx, cy);
    }
    for (let i = 0; i < Math.round(4 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(16);
      A.heelStreak(S, rng, cx, cy);
    }
  }
  if (four) {
    // Coffee that missed the cup, and the arcs of the chairs that swivelled there for years.
    for (let i = 0; i < Math.round(4 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(14);
      O.coffeeStain(S, rng, cx, cy, rng.int(3, 5));
    }
    for (let i = 0; i < Math.round(2 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(24);
      O.chairArcs(S, rng, cx, cy);
    }
  }
  if (two) {
    // Coffee rings where people waited for the update, toner where the printer gave up.
    for (let i = 0; i < Math.round(4 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(14);
      I.coffeeRing(S, cx, cy, rng.int(3, 4));
      if (rng.chance(0.4)) I.coffeeRing(S, cx + rng.int(4, 7), cy + rng.int(-2, 3), 3);
    }
    for (let i = 0; i < Math.round(2 * area * dirt); i++) {
      const { x: cx, y: cy } = randFloor(24);
      I.tonerSmudge(S, rng, cx, cy);
    }
  }
  for (let i = 0; i < (up ? 0 : Math.round(3 * area * dirt)); i++) {
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
  for (let i = 0; i < (up ? 0 : Math.round(3 * area * dirt)); i++) {
    const { x: cx, y: cy } = randFloor(12);
    for (let k = 0; k < 26; k++) S.set(cx + rng.int(-6, 6), cy + rng.int(-4, 4), hx('#6e4a34'));
  }

  // Forklift tracks across the room (on floor 5, the yellow line that leads nowhere).
  if (five && (style === 'combat' || style === 'test' || style === 'start') && rng.chance(style === 'start' ? 1 : 0.7)) {
    // In from a wall at a door-free spot, a corner or two, and it stops in the middle of the floor.
    const fromWest = rng.chance(0.5);
    const y0 = rng.int(floorY0 + 18, floorY1 - 24);
    const pts = [{ x: fromWest ? floorX0 : floorX1 - 4, y: y0 }];
    const turnX = fromWest ? rng.int(floorX0 + 40, Math.round((floorX0 + floorX1) / 2)) : rng.int(Math.round((floorX0 + floorX1) / 2), floorX1 - 44);
    pts.push({ x: turnX, y: y0 });
    const down = y0 < (floorY0 + floorY1) / 2;
    const y1 = down ? rng.int(y0 + 30, Math.max(y0 + 31, floorY1 - 20)) : rng.int(Math.min(floorY0 + 20, y0 - 31), y0 - 30);
    pts.push({ x: turnX, y: y1 });
    if (rng.chance(0.5)) pts.push({ x: fromWest ? turnX + rng.int(30, 70) : turnX - rng.int(30, 70), y: y1 });
    A.followLine(S, pts);
    count('linea');
  } else if (!five && (style === 'combat' || style === 'test') && rng.chance(0.6)) {
    const vertical = rng.chance(0.4);
    const tracks = (x: number, y: number, len: number, v: boolean): void =>
      six ? R.walkway(S, x, y, len, v) : four ? O.runner(S, rng, x, y, len, v) : three ? J.roadRug(S, rng, x, y, len, v) : (two ? I.cableCover : W.tyreTracks)(S, x, y, len, v);
    if (vertical) tracks(rng.int(floorX0 + 20, floorX1 - 32), floorY0, floorY1 - floorY0, true);
    else tracks(floorX0, rng.int(floorY0 + 20, floorY1 - 32), floorX1 - floorX0, false);
    count(six ? 'pasarela' : four ? 'pasillo' : three ? 'carretera' : two ? 'cubrecables' : 'rodadas');
  }
  // A painted loading bay.
  if ((style === 'combat' || style === 'test') && rng.chance(0.45)) {
    const w = rng.int(3, 4) * T;
    const p = place(w, 2 * T, 30, T);
    if (p) {
      if (six) W.loadingBay(S, p.x + 3, p.y + 3, w - 6, 2 * T - 6, rng.pick(['EN REPARACIÓN', 'SIN PIEZA', 'DIAGNÓSTICO']), [104, 176, 96], [26, 26, 20, 200]);
      else if (five) W.loadingBay(S, p.x + 3, p.y + 3, w - 6, 2 * T - 6, rng.pick(['ESPERE AQUÍ', 'COLA', 'NO PASAR']), [214, 176, 48], [24, 36, 48, 200]);
      else if (four) W.loadingBay(S, p.x + 3, p.y + 3, w - 6, 2 * T - 6, rng.pick(['PUESTO LIBRE', 'NO RESERVAR', 'REUNIÓN 5 MIN']), [196, 192, 206], [30, 29, 34, 200]);
      else if (three) W.loadingBay(S, p.x + 3, p.y + 3, w - 6, 2 * T - 6, rng.pick(['ZONA DE JUEGO', 'NO TOCAR', 'AGOTADO', 'DEMO']), [236, 156, 186], [40, 26, 40, 200]);
      else if (two) W.loadingBay(S, p.x + 3, p.y + 3, w - 6, 2 * T - 6, rng.pick(['DEMO', 'EXPOSICIÓN', 'SIN STOCK', 'AGOTADO']), [118, 196, 160], [20, 32, 30, 200]);
      else W.loadingBay(S, p.x + 3, p.y + 3, w - 6, 2 * T - 6, rng.pick(['CARGA', 'DESCARGA', 'DESCARTES', 'MERMA']));
      count(six ? 'zona-banco' : five ? 'zona-espera' : four ? 'puesto-libre' : three ? 'zona-juego' : two ? 'expositor' : 'muelle');
    }
  }
  // Words painted on the floor.
  const nStencils = style === 'combat' && area > 1.6 ? 2 : 1;
  const raffle = room.id === 'sorteo';
  const words = rng.shuffle([...(six ? STENCILS_6 : five ? STENCILS_5 : four ? STENCILS_4 : three ? STENCILS_3 : two ? STENCILS_2 : STENCILS)[style]]).slice(0, nStencils);
  for (const text of raffle ? RAFFLE_STENCIL : words) {
    const tw = W.stencilWidth(text);
    const p = place(tw + 4, 9);
    if (p) {
      if (six) W.floorStencil(S, p.x + 2, p.y + 2, text, R.C.paint);
      else if (five) W.floorStencil(S, p.x + 2, p.y + 2, text, A.C.paint);
      else if (four) W.floorStencil(S, p.x + 2, p.y + 2, text, O.C.paint);
      else if (three) W.floorStencil(S, p.x + 2, p.y + 2, text, J.C.paint);
      else if (two) W.floorStencil(S, p.x + 2, p.y + 2, text, I.C.paint);
      else W.floorStencil(S, p.x + 2, p.y + 2, text);
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
      W.chevrons(S, Math.round(tip.x), Math.round(tip.y), d.dir, six ? R.C.paint : five ? A.C.paint : four ? O.C.paint : three ? J.C.paint : two ? I.C.paint : undefined);
      n++;
    }
    if (n > 0) count('flechas');
  }
  // Odds and ends: receipts, screws, a cable.
  const litter = style === 'shop' || style === 'rare' ? 0.4 : style === 'secret' ? 1.6 : 1;
  for (let i = 0; i < Math.round(9 * area * litter); i++) {
    const { x, y } = randFloor(4);
    if (onFloor(x, y) && onFloor(x + 5, y + 2)) W.receipt(S, rng, x, y);
  }
  for (let i = 0; i < Math.round(6 * area * litter); i++) {
    const { x, y } = randFloor(4);
    if (!onFloor(x, y)) continue;
    if (six) {
      const k = rng.next();
      if (k < 0.4) W.screw(S, x, y);
      else if (k < 0.65 && onFloor(x + 6, y + 2)) R.spring(S, x, y);
      else if (k < 0.85) R.washer(S, x, y);
      else if (onFloor(x + 5, y + 3)) R.lostSticker(S, x, y);
    } else if (five) {
      if (rng.chance(0.6) && onFloor(x + 4, y + 5)) A.queueTicket(S, rng, x, y);
      else A.paperCup(S, x, y);
    } else if (four) {
      if (rng.chance(0.4) && onFloor(x + 5, y + 5)) O.postIt(S, rng, x, y);
      else O.paperClip(S, x, y);
    } else if (three) {
      if (rng.chance(0.7)) J.brick(S, rng, x, y);
      else J.marble(S, rng, x, y);
    } else if (!two) W.screw(S, x, y);
    else if (rng.chance(0.75)) I.keycap(S, rng, x, y);
    else if (onFloor(x + 6, y + 2)) I.usbStick(S, rng, x, y);
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
    if (six) W.doormat(S, Math.round(x), floorY1 - 16, 52, 'TRAIGA CITA', hx('#2a2c24'), hx('#9ad08e'), hx('#14150f'));
    else if (five) W.doormat(S, Math.round(x), floorY1 - 16, 52, 'COJA NÚMERO', hx('#22303e'), hx('#a9cbf2'), hx('#121a24'));
    else if (four) W.doormat(S, Math.round(x), floorY1 - 16, 52, 'FICHE AQUÍ', hx('#33343e'), hx('#b8bcc8'), hx('#1a1a20'));
    else if (three) W.doormat(S, Math.round(x), floorY1 - 16, 52, 'A JUGAR', hx('#6a3a52'), hx('#f2c0d0'), hx('#341c2a'));
    else if (two) W.doormat(S, Math.round(x), floorY1 - 16, 52, 'CONECTANDO', hx('#26384a'), hx('#8fb8d8'), hx('#141e28'));
    else W.doormat(S, Math.round(x), floorY1 - 16, 52, 'BIENVENIDO');
    count('felpudo');
  } else if (style === 'shop') {
    const top = floorY0 + 2 * T;
    if (six) W.carpet(S, midX - 22, top, 44, floorY1 - top - 2, hx('#2a3a2c'), hx('#8c9088'));
    else if (five) W.carpet(S, midX - 22, top, 44, floorY1 - top - 2, hx('#4a2a3a'), hx('#c9b44a'));
    else if (four) W.carpet(S, midX - 22, top, 44, floorY1 - top - 2, hx('#2f3f5f'), hx('#9aa0aa'));
    else if (three) W.carpet(S, midX - 22, top, 44, floorY1 - top - 2, hx('#6a2f5a'), hx('#e0b23c'));
    else if (two) W.carpet(S, midX - 22, top, 44, floorY1 - top - 2, hx('#2a4a7a'), hx('#9aa2c0'));
    else W.carpet(S, midX - 22, top, 44, floorY1 - top - 2);
    count('alfombra');
 } else if (style === 'rare') {
    // The Oficina de Financiación (M14 (r2)): the bank's carpet, green with a gold border, the
    // same on every floor (the bank is the same everywhere).
    const top = floorY0 + 2 * T;
    // The Sorteo's (M14 (r2b)), red: the colour of the numbers you never get.
    if (room.id === 'sorteo') W.carpet(S, midX - 30, top, 60, floorY1 - top - 2, hx('#5a2430'), hx('#c9a23a'));
    else W.carpet(S, midX - 30, top, 60, floorY1 - top - 2, hx('#24442e'), hx('#c9a23a'));
    count('alfombra-banco');
  } else if (style === 'boss' && six) {
    // The crusher's room: swarf all over the floor, and the cold of the workshop's tubes on everything.
    R.swarf(S, rng, floorX0, floorY0, floorX1, floorY1);
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, [200, 236, 210, 10]);
    count('virutas');
  } else if (style === 'boss' && five) {
    // The switchboard's room: telephone cords all over the floor, from the back wall.
    A.phoneCords(S, rng, floorX0, floorY0, floorX1, floorY1);
    count('cables');
  } else if (style === 'boss' && four) {
    // The board room: the good carpet (charcoal with a burgundy border, the only one that gets cleaned)
    // and air conditioning set to 17 degrees: everything a little colder.
    const top = floorY0 + T;
    W.carpet(S, floorX0 + 2 * T, top, floorX1 - floorX0 - 4 * T, floorY1 - top - T, hx('#323138'), hx('#7a3a44'));
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, [200, 220, 240, 10]);
    count('moqueta-juntas');
  } else if (style === 'boss' && three) {
    // The shop window of the new arrivals: confetti from a launch nobody came to, and a pink glow.
    J.confetti(S, rng, floorX0, floorY0, floorX1, floorY1);
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, [232, 143, 164, 12]);
    count('confeti');
  } else if (style === 'boss' && two) {
    // The servers' interference: snow and dead pixels, and everything a little greener.
    I.staticSnow(S, rng, floorX0, floorY0, floorX1, floorY1);
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, [88, 180, 90, 12]);
    count('interferencias');
  } else if (style === 'boss') {
    for (let i = 0; i < Math.round(4 * area); i++) {
      const { x, y } = randFloor(20);
      W.frost(S, rng, x, Math.min(y, floorY0 + rng.int(10, 70)), rng.int(14, 26));
    }
    // Cold air: everything a little bluer.
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, [105, 219, 216, 14]);
    count('escarcha');
  } else if (style === 'secret') {
    if (four) {
      O.shreds(S, rng, floorX0, floorY0, floorX1, floorY1);
      count('tiras');
    }
    if (five) {
      A.tapeRibbons(S, rng, floorX0, floorY0, floorX1, floorY1);
      count('cinta');
    }
    // Dust: brown downstairs; up here, the grey dust of paper (on floor 5, a bluish grey).
    const dust: RGBA = six ? [126, 122, 104, 22] : five ? [118, 130, 140, 22] : four ? [120, 118, 128, 22] : [110, 74, 52, 22];
    for (let y = floorY0; y < floorY1; y++) for (let x = floorX0; x < floorX1; x++) S.set(x, y, dust);
    count('polvo');
  }

  // Painted safety lines, 16 px inside the walls (nobody painted the secret room).
  if (style !== 'secret') {
    const dash = six ? R.C.dash : five ? A.C.dash : four ? O.C.dash : three ? J.C.dash : two ? I.C.dash : hx('#8a7424');
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

  // The floor's own junk (M14b (h11b)): the walls' shadow, clutter piled in the corners and odd
  // pieces along the walls. Its own generator, so the rest of the room keeps its look.
  if (room.kind !== 'hub') {
    const lv = room.level ?? 1;
    const drng = new Rng('room-deco:' + seed);
    D.wallShadow(S, floorX0, floorY0, floorX1, floorY1, (x, y) => !wall(Math.floor(x / T), Math.floor(y / T)));
    count('sombra-paredes');
    const at = (p: D.Piece, x: number, y: number): boolean => {
      const w = p.canvas.w;
      const h = p.canvas.h;
      if (x < floorX0 || y < floorY0 || x + w > floorX1 || y + h > floorY1 || !free(x, y, w, h)) return false;
      used.push({ x, y, w, h });
      D.putPiece(S, p, x, y);
      count(`trasto:${p.name}`);
      return true;
    };
    // Corners: three or four pieces, the first against both walls, the rest beside it.
    const cornerChance = style === 'secret' ? 0.7 : style === 'shop' || style === 'rare' ? 0.3 : style === 'boss' ? 0.5 : 0.7;
    let corners = 0;
    for (const [right, bottom] of [[false, false], [true, false], [false, true], [true, true]] as const) {
      if (!drng.chance(cornerChance)) continue;
      const n = drng.int(3, 4);
      let placed = 0;
      let reach = 2;
      let last: string | undefined;
      for (let k = 0; k < n + 4 && placed < n; k++) {
        const p = D.junk(drng, lv, last);
        const w = p.canvas.w;
        const h = p.canvas.h;
        // Along the back or front wall first, then one step out along the side wall.
        const along = placed === 0 || drng.chance(0.6);
        const ox = along ? reach : drng.int(1, 4);
        const oy = along ? drng.int(0, 2) : reach + drng.int(0, 2);
        const x = right ? floorX1 - ox - w : floorX0 + ox;
        const y = bottom ? floorY1 - oy - h : floorY0 + oy;
        if (at(p, x, y)) {
          last = p.name;
          placed++;
          reach += along ? w + drng.int(0, 2) : 0;
          if (!along) reach = Math.max(reach, h + 2);
        }
      }
      if (placed > 0) corners++;
    }
    if (corners > 0) count('rincones');
    // Pieces left against the free-standing shelving, at the foot of its front.
    for (let r = 2; r < room.rows - 2; r++) {
      for (let c = 1; c < room.cols - 1; c++) {
        if (!wall(c, r) || wall(c, r + 1) || c === 0 || c === room.cols - 1 || !drng.chance(0.3)) continue;
        const p = D.junk(drng, lv);
        at(p, c * T + drng.int(0, Math.max(0, T - p.canvas.w)), (r + 1) * T + drng.int(0, 2));
      }
    }
    // Odd pieces along the walls.
    const alongN = Math.round((style === 'secret' ? 1.5 : style === 'shop' || style === 'rare' ? 0.5 : 2.5) * area);
    for (let i = 0, tries = 0; i < alongN && tries < 20; tries++) {
      const p = D.junk(drng, lv);
      const w = p.canvas.w;
      const h = p.canvas.h;
      const side = drng.int(0, 3);
      const x = side === 0 ? floorX0 + drng.int(1, 3) : side === 1 ? floorX1 - w - drng.int(1, 3) : drng.int(floorX0 + 30, floorX1 - 30 - w);
      const y = side === 2 ? floorY0 + drng.int(0, 2) : side === 3 ? floorY1 - h - drng.int(1, 2) : drng.int(floorY0 + 24, floorY1 - 24 - h);
      if (at(p, x, y)) i++;
    }
  }

  // Walls.
  const WALL = six ? R.C.wall : five ? A.C.wall : four ? O.C.wall : three ? J.C.wall : two ? I.C.wall : hx('#222638');
  const SEAM = six ? R.C.seam : five ? A.C.seam : four ? O.C.seam : three ? J.C.seam : two ? I.C.seam : hx('#1a1d2c');
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
  const interior = (c: number, r: number): boolean => c > 0 && r > 1 && c < room.cols - 1 && r < room.rows - 1 && wall(c, r) && !out(c, r);
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (!interior(c, r)) continue;
      (six ? R.cageUnit : five ? A.counterUnit : four ? O.partitionUnit : three ? J.toyShelfUnit : two ? I.rackUnit : shelfUnit)(S, rng, c * T, r * T, {
        front: !wall(c, r + 1),
        up: !wall(c, r - 1),
        left: !wall(c - 1, r),
        right: !wall(c + 1, r),
      });
      // Its shadow on the floor below.
      if (!wall(c, r + 1)) for (let y = 0; y < 5; y++) for (let x = 0; x < T; x++) S.set(c * T + x, (r + 1) * T + y, [12, 10, 22, 110 - y * 20]);
    }
  }
  if (six) R.backWall(S, rng, W_, 47);
  else if (five) A.backWall(S, rng, W_, 47);
  else if (four) O.backWall(S, rng, W_, 47);
  else if (three) J.cloudWallpaper(S, rng, W_, 47);
  else for (let x = 0; x < W_; x += 48) S.rect(x, 0, 1, 48, SEAM);

  // Side and front walls: a conduit with brackets, electrical boxes, an extinguisher, vents.
  const nearDoor = (x: number, y: number, w: number, h: number): boolean => doorsIn.some((d) => hit({ x, y, w, h }, { x: d.x - 6, y: d.y - 6, w: d.w + 12, h: d.h + 12 }));
  if (two) for (const wx of [0, W_ - T]) I.duct(S, wx + 7, floorY0, floorY1, (y) => nearDoor(wx + 6, y, 6, 4));
  if (three) for (const wx of [0, W_ - T]) J.heightChart(S, wx + 9, floorY0, floorY1, (y) => nearDoor(wx + 8, y, 6, 4));
  if (four) {
    for (const wx of [0, W_ - T]) {
      for (let y = floorY0 + 10; y < floorY1 - 24; y += 72) if (!nearDoor(wx + 8, y - 2, 8, 22)) O.radiator(S, wx + 9, y);
    }
  }
  if (six) for (const wx of [0, W_ - T]) R.airLine(S, wx + 7, floorY0, floorY1, (y) => nearDoor(wx + 6, y, 8, 14));
  if (five) {
    for (const wx of [0, W_ - T]) {
      for (let y = floorY0 + 14; y < floorY1 - 24; y += 80) if (!nearDoor(wx + 8, y - 2, 8, 22)) A.leafletRack(S, rng, wx + 8, y);
    }
  }
  for (const wx of up ? [] : [0, W_ - T]) {
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
      else if (six) R.safetyPoster(S, wx + 7, y);
      else if (five) A.complaintsNotice(S, wx + 7, y);
      else if (four) O.poster(S, rng, wx + 7, y);
      else if (three) J.kidDrawing(S, rng, wx + 7, y);
      else if (two) I.wallSwitch(S, rng, wx + 5, y);
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
  if (six) R.truss(S, rng, W_);
  else if (five) A.ceiling(S, rng, W_);
  else if (four) O.dropCeiling(S, rng, W_);
  else if (three) J.bunting(S, rng, W_);
  else if (two) I.cableTray(S, rng, W_);
  else {
    S.rect(0, 2, W_, 5, hx('#3e4560'));
    S.rect(0, 2, W_, 1, hx('#5d658a'));
    S.rect(0, 6, W_, 1, hx('#262b40'));
    for (let x = 30; x < W_; x += 90) S.rect(x, 1, 3, 7, hx('#2a2f48'));
  }
  const lamps: RoomArt['lamps'] = [];
  const nLamps = style === 'secret' ? 1 : Math.max(2, Math.round(W_ / 240));
  for (let i = 0; i < nLamps; i++) {
    const lx0 = Math.round(((i + 0.5) * W_) / nLamps) - 22;
    // Over a cut-out corner there is no ceiling: the lamp goes along to the open stretch.
    const lx = room.outside ? Math.max(openX0 + 4, Math.min(openX1 - 48, lx0)) : lx0;
    if (room.outside && lamps.some((l) => Math.abs(l.x - (lx + 22)) < 60)) continue;
    if (six) R.lamp(S, lx, 8);
    else if (five) A.lamp(S, lx, 3);
    else if (four) O.officeLamp(S, lx, 4);
    else if (three) {
      S.rect(lx, 12, 44, 3, hx('#e6d2c4'));
      S.rect(lx + 2, 15, 40, 1, WHITE);
      S.rect(lx, 12, 44, 1, hx('#b49a8e'));
    } else if (two) I.ledPanel(S, lx, 8);
    else {
      S.rect(lx, 8, 44, 3, hx('#cfc9a8'));
      S.rect(lx + 2, 11, 40, 1, WHITE);
    }
    lamps.push({ x: lx + 22, y: floorY0 + (floorY1 - floorY0) * 0.42 });
  }

  // Shelves full of returned boxes.
  if (six) R.partsBins(S, rng, W_, 36);
  if (five) A.waitingChairs(S, rng, W_, 34);
  if (four) {
    O.binderShelf(S, rng, W_, 26, 13, 8);
    O.deskShelf(S, rng, W_, 40);
  }
  if (three) {
    J.toyShelf(S, rng, W_, 26, 13, 8);
    J.toyShelf(S, rng, W_, 40, 11, 7);
  }
  if (two) {
    I.monitorShelf(S, rng, W_, 26, 14, 9);
    I.monitorShelf(S, rng, W_, 40, 12, 8);
  }
  for (const [plankY, hmax, hmin] of up ? [] : ([[26, 14, 8], [40, 11, 7]] as const)) {
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
    // On floors 5 and 6 the wall pieces are wider (the slogan, the entrance's light box, the pegboard), so it also checks whole spans, and the north door's.
    const spans: Array<readonly [number, number]> = [];
    const clear = (s: number, half: number): boolean => Math.abs(s - nx) > half + 30 && spans.every(([a, b]) => s + half + 8 < a || s - half - 8 > b);
    // The Mostrador's board, phone, notice and curtain hang on the shelving: nothing behind them.
    // The room's name plate, at the top of the screen, also covers the middle of it (the hub is never scrolled sideways).
    const hung = room.kind === 'hub' ? [...hubHung(room.stations ?? [], room.belt ?? null), [W_ / 2 - 58, W_ / 2 + 58] as const] : [];
    const bare = (s: number, half: number): boolean => hung.every(([a, b]) => s + half + 4 < a || s - half - 4 > b) && (!room.outside || onOneFace(s - half - 4, s + half + 4));
    const spot = (half: number): number | null => {
      const x = spots.find((s) => s - half > 20 && s + half < W_ - 20 && taken.every((t) => Math.abs(t - s) > half + 34) && (!(five || six) || clear(s, half)) && bare(s, half));
      if (x === undefined) return null;
      taken.push(x);
      spans.push([x - half, x + half]);
      return x;
    };
    const [text, bg, fg] = room.id === 'sorteo' ? (rng.next(), RAFFLE_SIGN) : rng.pick((six ? SIGNS_6 : five ? SIGNS_5 : four ? SIGNS_4 : three ? SIGNS_3 : two ? SIGNS_2 : SIGNS)[style]);
    const entrance = six && style === 'start';
    const signHalf = entrance ? Math.ceil(R.entranceSignWidth() / 2) + 2 : W.stencilWidth(text) / 2 + 6;
    // The entrance's light box is wide: try first the middle of the wall on each side of the north door.
    if (entrance && north) spots.unshift(Math.round((20 + nx - 30) / 2), Math.round((nx + 30 + W_ - 20) / 2));
    const sx = spot(signHalf);
    if (sx !== null) {
      if (entrance) {
        R.entranceSign(S, sx, 11);
        count('rotulo-servicio');
      } else W.signPlate(S, sx, 14, text, hx(bg), hx(fg));
      count(`cartel:${text}`);
    }
    if (six && style !== 'secret') {
      // The pegboard of tools, where it fits.
      const pw = 6 * rng.int(7, 9);
      const px = spot(pw / 2 + 2);
      if (px !== null) {
        R.pegboard(S, rng, px - pw / 2, 15, pw);
        count('herramientas');
      }
    }
    if (five && style !== 'secret') {
      // «Su satisfacción es nuestra prioridad», with its one star of five, where it fits.
      const gx = spot(Math.ceil(A.sloganWidth() / 2) + 2);
      if (gx !== null) {
        A.slogan(S, gx, 14);
        count('eslogan');
      }
    }
    if (style !== 'secret' && style !== 'treasure') {
      const tx = spot(12);
      if (tx !== null) {
        if (six) R.incidentBoard(S, tx - 12, 14);
        else if (five) A.queueScreen(S, tx - 12, 22);
        else if (four) O.targetsBoard(S, rng, tx - 11, 28);
        else if (three) J.priceBoard(S, rng, tx - 11, 28);
        else if (two) I.progressDisplay(S, tx - 11, 28);
        else W.turnDisplay(S, rng, tx - 11, 28);
        count(six ? 'sin-incidencias' : five ? 'pantalla' : four ? 'objetivos' : three ? 'precios' : two ? 'progreso' : 'turno');
      }
    }
    const cx = spot(6);
    if (cx !== null) {
      if (five) A.clockAt(S, cx, 19, rng.int(0, 11), rng.int(0, 11) * 5);
      else W.clock(S, cx, 19);
      count('reloj');
    }
    if (five) {
      // Clocks that do not agree with each other (one more, if there is room).
      const cx2 = spot(6);
      if (cx2 !== null) A.clockAt(S, cx2, 19, rng.int(0, 11), rng.int(0, 11) * 5);
      // Notices taped up wherever there is still wall.
      A.notices(S, rng, W_, (x) => taken.some((t) => Math.abs(t - x) < 82) || Math.abs(x - nx) < 40);
    }
    if (style === 'shop') {
      W.priceTags(S, rng, 24, W_ - 24, 41);
      count('etiquetas');
    }
  }

  // Yellow and black hazard tape on the inner edge of the walls.
  if (up) {
    const sk = six ? R.skirting : five ? A.skirting : four ? O.skirting : three ? J.skirting : I.skirting;
    sk(S, T - 5, floorY0, 5, floorY1 - floorY0, true);
    sk(S, W_ - T, floorY0, 5, floorY1 - floorY0, true, true);
    sk(S, T, H - T, W_ - 2 * T, 5, false);
  }
  const ya = hx('#b08a1c');
  const yb = hx('#191622');
  for (let y = floorY0; y < (up ? floorY0 : floorY1); y++) {
    for (let x = T - 5; x < T; x++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);
    for (let x = W_ - T; x < W_ - T + 5; x++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);
  }
  for (let x = T; x < (up ? T : W_ - T); x++) for (let y = H - T; y < H - T + 5; y++) S.set(x, y, Math.floor((x + y) / 4) % 2 === 0 ? ya : yb);

  // Cobwebs in the corners of the room nobody visits.
  if (style === 'secret') {
    W.cobweb(S, floorX0, floorY0, 1, 1);
    W.cobweb(S, floorX1 - 1, floorY0, -1, 1);
    W.cobweb(S, floorX0, floorY1 - 1, 1, -1);
    W.cobweb(S, floorX1 - 1, floorY1 - 1, -1, -1);
    count('telarañas');
  }

  // Conveyor belts (M12 (3b3)): the renderer runs the belt itself over its rectangle; here, its
  // steel frame (a lit lip along the top, a dark one with its shadow along the bottom, bolts every
  // tile) and the drum at the end it comes from. The rollers end is the renderer's.
  for (const b of belts) {
    const lip = R.C.frame;
    const lipD = R.C.frameDark;
    S.rect(b.x, b.y - 3, b.w, 3, lip);
    S.rect(b.x, b.y - 3, b.w, 1, hx('#b4b8ae'));
    S.rect(b.x, b.y + b.h, b.w, 3, lipD);
    S.rect(b.x, b.y + b.h + 3, b.w, 2, [0, 0, 0, 90]);
    for (let x = b.x + 5; x < b.x + b.w; x += T) {
      S.set(x, b.y - 2, R.C.seam);
      S.set(x, b.y + b.h + 1, R.C.seam);
    }
    // The tail drum: a steel cap, rounded, where the belt comes up from under the floor.
    const tx = b.dirX > 0 ? b.x - 4 : b.x + b.w;
    S.rect(tx, b.y - 3, 4, b.h + 6, lipD);
    S.rect(tx + (b.dirX > 0 ? 1 : 0), b.y - 2, 3, b.h + 4, lip);
    for (let y = b.y + 2; y < b.y + b.h; y += 6) S.rect(tx + 1, y, 2, 2, R.C.seam);
    // No rollers: the far end just drops off onto the floor, with a worn yellow edge.
    if (b.bite === 0) {
      const ex = b.dirX > 0 ? b.x + b.w : b.x - 3;
      S.rect(ex, b.y - 3, 3, b.h + 6, lipD);
      for (let y = b.y - 3; y < b.y + b.h + 3; y++) if (((y - b.y) >> 2) % 2 === 0) S.rect(ex, y, 3, 1, hx('#a08a3a'));
    }
    count('cinta-transportadora');
  }

  // Doorways: a dark hole in the wall with a steel frame; the renderer puts the shutter on top.
  const doors: RoomArt['doors'] = [];
  const FR = six ? R.C.frame : five ? A.C.frame : four ? O.C.frame : three ? J.C.frame : two ? I.C.frame : hx('#5d658a');
  const FR_D = six ? R.C.frameDark : five ? A.C.frameDark : four ? O.C.frameDark : three ? J.C.frameDark : two ? I.C.frameDark : hx('#3e4560');
  for (const d of doorsIn) {
    const hole = d.dir === 'N' ? { x: d.x, y: 14, w: d.w, h: 34 } : { x: d.x, y: d.y, w: d.w, h: d.h };
    S.rect(hole.x, hole.y, hole.w, hole.h, hx('#0b0a12'));
    if (d.dir === 'N' || d.dir === 'S') {
      S.rect(hole.x - 2, hole.y - (d.dir === 'N' ? 2 : 0), 2, hole.h + 2, FR);
      S.rect(hole.x + hole.w, hole.y - (d.dir === 'N' ? 2 : 0), 2, hole.h + 2, FR_D);
      if (d.dir === 'N') S.rect(hole.x - 2, hole.y - 2, hole.w + 4, 2, FR);
      doors.push({ dir: d.dir, x: hole.x, y: hole.y, w: hole.w, h: d.dir === 'N' ? 33 : hole.h });
    } else {
      S.rect(hole.x, hole.y - 2, hole.w, 2, FR);
      S.rect(hole.x, hole.y + hole.h, hole.w, 2, FR_D);
      doors.push({ dir: d.dir, ...hole });
    }
  }

  // Warm light pools under the lamps (stronger over the treasure: it wants to be seen).
  const pool = style === 'treasure' ? 46 : style === 'secret' ? 16 : 26;
  // Downstairs the tubes are warm; upstairs the LED panels are cold.
  const glow = six ? R.C.light : five ? A.C.light : four ? O.C.light : three ? J.C.light : two ? I.C.light : ([255, 226, 150] as const);
  const pools = style === 'treasure' ? [{ x: W_ / 2, y: floorY0 + (floorY1 - floorY0) / 2 }] : lamps;
  for (const l of pools) {
    const rx = 90;
    const ry = 60;
    for (let y = Math.round(l.y - ry); y <= l.y + ry; y++) {
      for (let x = Math.round(l.x - rx); x <= l.x + rx; x++) {
        const d = ((x - l.x) / rx) ** 2 + ((y - l.y) / ry) ** 2;
        if (d <= 1 && y >= floorY0 && x >= T && x < W_ - T && y < floorY1) S.set(x, y, [glow[0], glow[1], glow[2], Math.trunc(pool * (1 - d))]);
      }
    }
  }
  if (room.outside) cutOut(S, room, out, wall, WALL, SEAM, room.level ?? 1, () => count('recorte'));
  return { canvas: S, lamps, doors, features };
}

/**
 * M14b (h11c): the corners cut out of a room's shape. They are more of the outer wall, not
 * shelving: the dark top of the wall, and where there is floor below, the back wall itself (the
 * same painted band, its shelves and its dado) brought forward, so an L or a cross reads as the
 * room's walls turning the corner. Along the floor, the floor's own skirting (the warehouse's
 * hazard tape) and the wall's shadow.
 */
function cutOut(
  S: Canvas,
  room: PaintableRoom,
  out: (c: number, r: number) => boolean,
  wall: (c: number, r: number) => boolean,
  WALL: RGBA,
  SEAM: RGBA,
  level: number,
  counted: () => void,
): void {
  const band = new Canvas(S.w, 48);
  for (let y = 0; y < 48; y++) for (let x = 0; x < S.w; x++) band.put(x, y, S.get(x, y));
  const face = new Set<string>();
  const floorAt = (c: number, r: number): boolean => !wall(c, r);
  const sk = level >= 6 ? R.skirting : level === 5 ? A.skirting : level === 4 ? O.skirting : level === 3 ? J.skirting : level === 2 ? I.skirting : null;
  const tape = (x: number, y: number, w: number, h: number): void => {
    const ya = hx('#b08a1c');
    const yb = hx('#191622');
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) S.set(i, j, Math.floor((i + j) / 4) % 2 === 0 ? ya : yb);
  };
  let any = false;
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (!out(c, r)) continue;
      any = true;
      S.rect(c * T, r * T, T, T, WALL);
      if (r % 2 === 0) S.rect(c * T, r * T, T, 1, SEAM);
    }
  }
  if (!any) return;
  counted();
  // The faces: the back wall's band, bottom on the last tile before the floor.
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (!out(c, r) || !floorAt(c, r + 1)) continue;
      const top = (r + 1) * T - 48;
      for (let y = 0; y < 48; y++) {
        const ty = Math.floor((top + y) / T);
        if (top + y < 0 || !wall(c, ty)) continue;
        if (ty !== r && !out(c, ty)) continue;
        face.add(`${c},${ty}`);
        for (let x = 0; x < T; x++) S.put(c * T + x, top + y, band.get(c * T + x, y));
      }
      // Its ends: a dark edge where the face meets open floor beside it.
      for (const [dc, ex] of [[-1, 0], [1, T - 1]] as const) {
        if (!floorAt(c + dc, r)) continue;
        S.rect(c * T + ex, Math.max(0, top), 1, (r + 1) * T - Math.max(0, top), K);
      }
    }
  }
  // Skirting along the floor (not on the faces: the back wall has none either).
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (!out(c, r) || face.has(`${c},${r}`)) continue;
      const x = c * T;
      const y = r * T;
      if (floorAt(c + 1, r)) (sk ? sk(S, x + T - 5, y, 5, T, true) : tape(x + T - 5, y, 5, T));
      if (floorAt(c - 1, r)) (sk ? sk(S, x, y, 5, T, true, true) : tape(x, y, 5, T));
      if (floorAt(c, r - 1)) (sk ? sk(S, x, y, T, 5, false) : tape(x, y, T, 5));
    }
  }
  // The wall's shadow on the floor next to it: long under a face, short beside the others.
  const shadeAt = (x: number, y: number, a: number): void => {
    if (a <= 0 || !floorAt(Math.floor(x / T), Math.floor(y / T))) return;
    const col = S.get(x, y);
    const k = 1 - a / 255;
    S.put(x, y, [Math.round(col[0] * k), Math.round(col[1] * k), Math.round(col[2] * k), col[3]]);
  };
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      if (!out(c, r)) continue;
      const x = c * T;
      const y = r * T;
      if (floorAt(c, r + 1)) for (let j = 0; j < 14; j++) for (let i = 0; i < T; i++) shadeAt(x + i, y + T + j, 120 * (1 - j / 14) ** 1.6);
      if (floorAt(c + 1, r)) for (let i = 0; i < 6; i++) for (let j = 0; j < T; j++) shadeAt(x + T + i, y + j, 70 * (1 - i / 6) ** 1.3);
      if (floorAt(c - 1, r)) for (let i = 0; i < 6; i++) for (let j = 0; j < T; j++) shadeAt(x - 1 - i, y + j, 70 * (1 - i / 6) ** 1.3);
    }
  }
}
