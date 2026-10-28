// npm run sprites: draws every sprite by code and exports them to public/assets/.
// public/assets/sprites.json lists each sheet and its frame size; the game loads from it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Canvas, hx, scaled } from '../../src/art/canvas.ts';
import { buildRoom } from '../../src/sim/room.ts';
import { ROOMS } from '../../src/data/rooms.ts';
import { paintRoom } from '../../src/art/room.ts';
import { HERO_FRAMES, makeAspirador, makeBombillaFrames, makeHeroPose, makeMicroondas, makeNevera, makePolilla, miniDryer, miniStapler } from './characters.ts';
import { ITEM_GRIDS, makeItem } from './items.ts';
import * as P from './props.ts';
import { encodePng } from './png.ts';
import { ROOT } from '../lib/deps.ts';

export interface SheetInfo {
  file: string;
  frameW: number;
  frameH: number;
  frames: number;
}

function strip(frames: Canvas[]): Canvas {
  const w = frames[0]!.w;
  const h = frames[0]!.h;
  const out = new Canvas(w * frames.length, h);
  frames.forEach((f, i) => out.blit(f, i * w, 0));
  return out;
}

export function allSheets(): Record<string, { canvas: Canvas; frameW: number; frameH: number }> {
  const one = (c: Canvas) => ({ canvas: c, frameW: c.w, frameH: c.h });
  const hero = HERO_FRAMES.map((f) => makeHeroPose(f.pose));
  const sheets: Record<string, { canvas: Canvas; frameW: number; frameH: number }> = {
    tostadora: { canvas: strip(hero), frameW: 40, frameH: 41 },
    aspirador: one(makeAspirador()),
    microondas: one(makeMicroondas()),
    bombilla: { canvas: strip(makeBombillaFrames()), frameW: 32, frameH: 39 },
    polilla: { canvas: strip(makePolilla()), frameW: 11, frameH: 9 },
    'nevera-suprema': one(makeNevera()),
    maniqui: one(P.makeManiqui()),
    'arma-secador': one(miniDryer()),
    'arma-grapadora': one(miniStapler()),
    mano: one(P.makeHand()),
    caja: one(P.makeCaja()),
    barril: one(P.makeBarril()),
    carrito: one(P.makeCarrito()),
    'bala-jugador': one(P.makeShot()),
    'bala-roja': one(P.enemyBulletRed()),
    'bala-cian': one(P.enemyBulletCyan()),
    fogonazo: { canvas: P.makeMuzzle(), frameW: 12, frameH: 10 },
    pelusa: { canvas: P.makePelusa(), frameW: 4, frameH: 4 },
    chispas: { canvas: P.makeSparks(), frameW: 2, frameH: 2 },
    polvo: { canvas: P.makePuff(), frameW: 8, frameH: 8 },
    mira: one(P.makeCrosshair()),
    corazones: { canvas: P.makeHearts(), frameW: 11, frameH: 9 },
    municion: { canvas: P.makeAmmoPip(), frameW: 4, frameH: 6 },
    vineta: one(P.makeVignette()),
  };
  for (const n of Object.keys(ITEM_GRIDS)) sheets['objeto-' + n] = one(makeItem(n));
  return sheets;
}

function main(): void {
  const out = join(ROOT, 'public/assets');
  mkdirSync(out, { recursive: true });
  const manifest: Record<string, SheetInfo> = {};
  for (const [key, s] of Object.entries(allSheets())) {
    const file = `${key}.png`;
    writeFileSync(join(out, file), encodePng(s.canvas));
    manifest[key] = { file, frameW: s.frameW, frameH: s.frameH, frames: Math.floor(s.canvas.w / s.frameW) };
  }
  writeFileSync(join(out, 'sprites.json'), JSON.stringify(manifest, null, 2) + '\n');

  // Previews for checking by eye (not committed): capturas/sprites-*.png
  mkdirSync(join(ROOT, 'capturas'), { recursive: true });
  const sheets = allSheets();
  const sheet = new Canvas(400, 100, hx('#1a1e2b'));
  let x = 4;
  for (const k of ['tostadora', 'maniqui', 'aspirador', 'microondas', 'bombilla', 'polilla']) {
    const c = sheets[k]!.canvas;
    sheet.blit(c, x, 96 - c.h);
    x += c.w + 4;
  }
  x = 4;
  for (const k of ['caja', 'barril', 'carrito', 'bala-jugador', 'bala-roja', 'fogonazo', 'pelusa', 'polvo', 'mira', 'corazones', 'municion', 'mano', 'arma-secador']) {
    const c = sheets[k]!.canvas;
    sheet.blit(c, x, 4);
    x += c.w + 3;
  }
  writeFileSync(join(ROOT, 'capturas/sprites-hoja.png'), encodePng(scaled(sheet, 3)));
  const room = buildRoom(ROOMS['sala-pruebas']!);
  writeFileSync(join(ROOT, 'capturas/sprites-sala.png'), encodePng(paintRoom(room, 'preview').canvas));
  console.log(`${Object.keys(manifest).length} hojas de sprites en public/assets/.`);
}

if (import.meta.main) main();
