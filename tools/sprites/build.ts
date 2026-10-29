// npm run sprites: draws every sprite by code and exports them to public/assets/.
// public/assets/sprites.json lists each sheet and its frame size; the game loads from it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Canvas, hx, scaled } from '../../src/art/canvas.ts';
import { buildRoom } from '../../src/sim/room.ts';
import { ROOMS } from '../../src/data/rooms.ts';
import { paintRoom } from '../../src/art/room.ts';
import {
  ASPIRADOR_LEGS, HERO_FRAMES, MICROONDAS_LEGS, NEVERA_POSES, makeAspirador, makeBombillaFrames, makeHeroPose, makeMicroondas, makeNevera, makePolilla, miniDryer, miniStapler,
} from './characters.ts';
import { narrowPoseCycle, poseCycle } from './pose.ts';
import { makeBatidoraFrames, makeCargadorFrames, makeImpresoraFrames, makeMandoFrames, makeRatonFrames } from './enemies.ts';
import { ITEM_GRIDS, makeItem } from './items.ts';
import * as P from './props.ts';
import { makeRepetidorFrames, makeRouterFrames } from './router.ts';
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
    // Frame 0 of every enemy sheet is its approved (or first) sprite; the order of the rest is in
    // the enemy's `anim` (src/data/enemies.ts).
    aspirador: { canvas: strip(narrowPoseCycle(...ASPIRADOR_LEGS).map((f) => makeAspirador(f.pose))), frameW: 32, frameH: 36 },
    // It never walks (bullets only nudge it): just its breathing.
    microondas: { canvas: strip(poseCycle(...MICROONDAS_LEGS).slice(0, 2).map((f) => makeMicroondas(f.pose))), frameW: 32, frameH: 40 },
    bombilla: { canvas: strip(makeBombillaFrames()), frameW: 32, frameH: 39 },
    polilla: { canvas: strip(makePolilla()), frameW: 11, frameH: 9 },
    batidora: { canvas: strip(makeBatidoraFrames()), frameW: 32, frameH: 38 },
    mando: { canvas: strip(makeMandoFrames()), frameW: 22, frameH: 32 },
    impresora: { canvas: strip(makeImpresoraFrames()), frameW: 34, frameH: 32 },
    cargador: { canvas: strip(makeCargadorFrames()), frameW: 22, frameH: 26 },
    'raton-inalambrico': { canvas: strip(makeRatonFrames()), frameW: 26, frameH: 26 },
    // Frames 0-5, door shut (breathing and walking, NEVERA_POSES); 6-11, the same with the door open.
    'nevera-suprema': { canvas: strip([false, true].flatMap((open) => NEVERA_POSES.map((f) => makeNevera(open, f.pose)))), frameW: 72, frameH: 76 },
    // Floor 2's boss: 0-5 awake (rest, breathing, walking), 6-11 rebooting with 0 to 5 LEDs lit.
    'router-wifi': { canvas: strip(makeRouterFrames()), frameW: 72, frameH: 76 },
    // Its repeater: 0-1 on (the LED blinks), 2 unplugged.
    repetidor: { canvas: strip(makeRepetidorFrames()), frameW: 20, frameH: 24 },
    maniqui: one(P.makeManiqui()),
    'arma-secador': one(miniDryer()),
    'arma-grapadora': one(miniStapler()),
    'arma-plancha': one(P.makeMiniIron()),
    'bala-grapa': one(P.makeStaple()),
    'bala-vapor': one(P.makeSteam()),
    mano: one(P.makeHand()),
    caja: one(P.makeCaja()),
    barril: one(P.makeBarril()),
    carrito: one(P.makeCarrito()),
    // Floor 2 (Informática): the same obstacles and shutters with the floor's look (`<id>-2`).
    'caja-2': one(P.makeMonitorCrt()),
    'barril-2': one(P.makeWaterCooler()),
    'carrito-2': one(P.makeOfficeChair()),
    'bala-jugador': one(P.makeShot()),
    'bala-roja': one(P.enemyBulletRed()),
    'bala-cian': one(P.enemyBulletCyan()),
    'bala-cubito': one(P.makeIceCube()),
    'bola-escarcha': one(P.makeFrostBall()),
    'bala-tarjeta': { canvas: P.makeLoyaltyCard(), frameW: 10, frameH: 8 },
    'bala-factura': { canvas: P.makeInvoice(), frameW: 10, frameH: 10 },
    'producto-caducado': { canvas: P.makeExpiredProducts(), frameW: 12, frameH: 14 },
    escarcha: { canvas: P.makeFrostPatch(), frameW: 46, frameH: 28 },
    fogonazo: { canvas: P.makeMuzzle(), frameW: 12, frameH: 10 },
    pelusa: { canvas: P.makePelusa(), frameW: 4, frameH: 4 },
    chispas: { canvas: P.makeSparks(), frameW: 2, frameH: 2 },
    polvo: { canvas: P.makePuff(), frameW: 8, frameH: 8 },
    mira: one(P.makeCrosshair()),
    corazones: { canvas: P.makeHearts(), frameW: 9, frameH: 8 },
    municion: { canvas: P.makeAmmoPip(), frameW: 4, frameH: 6 },
    vineta: one(P.makeVignette()),
    cupon: { canvas: P.makeCoupon(), frameW: 12, frameH: 9 },
    chatarra: { canvas: P.makeScrap(), frameW: 6, frameH: 6 },
    ranura: one(P.makeSlot()),
    despiece: { canvas: P.makeToasterBits(), frameW: 8, frameH: 8 },
    // Door shutters: in the back wall (north), the front wall (south) and the side walls.
    'persiana-n': { canvas: P.makeShutterFrames(48, 33), frameW: 48, frameH: 33 },
    'persiana-s': { canvas: P.makeShutterFrames(48, 24), frameW: 48, frameH: 24 },
    'persiana-v': { canvas: P.makeShutterFrames(24, 48), frameW: 24, frameH: 48 },
    'persiana-n-2': { canvas: P.makeShutterFrames(48, 33, 2), frameW: 48, frameH: 33 },
    'persiana-s-2': { canvas: P.makeShutterFrames(48, 24, 2), frameW: 48, frameH: 24 },
    'persiana-v-2': { canvas: P.makeShutterFrames(24, 48, 2), frameW: 24, frameH: 48 },
    montacargas: { canvas: P.makeGoodsLift(), frameW: 44, frameH: 34 },
    'corazon-suelo': { canvas: P.makeSpareHeart(), frameW: 13, frameH: 12 },
    cofre: { canvas: P.makeChest(), frameW: 26, frameH: 24 },
    ticket: { canvas: P.makeTicket(), frameW: 9, frameH: 11 },
    autocobro: { canvas: P.makeSelfCheckout(), frameW: 30, frameH: 36 },
    expositor: one(P.makeShopStand()),
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
  for (const k of ['tostadora', 'maniqui', 'aspirador', 'microondas', 'bombilla', 'polilla', 'batidora', 'mando']) {
    const c = sheets[k]!.canvas;
    sheet.blit(c, x, 96 - c.h);
    x += c.w + 4;
  }
  x = 4;
  const row = ['caja', 'barril', 'carrito', 'bala-jugador', 'bala-roja', 'bala-cubito', 'bola-escarcha', 'escarcha', 'fogonazo'];
  const row2 = ['pelusa', 'polvo', 'mira', 'corazones', 'municion', 'mano', 'arma-secador', 'arma-grapadora', 'arma-plancha', 'bala-grapa', 'bala-vapor'];
  for (const k of [...row, ...row2, 'cupon', 'chatarra', 'despiece', 'montacargas', 'corazon-suelo', 'cofre', 'ticket', 'autocobro', 'expositor']) {
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
