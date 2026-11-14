// Herramienta de una sesión: pinta salas sin navegador (src/art/room.ts) y las guarda a 2×.
// node tools/ver-salas.ts <carpeta> [planta] [id de sala…]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOMS } from '../src/data/rooms.ts';
import { buildRoom } from '../src/sim/room.ts';
import { paintRoom } from '../src/art/room.ts';
import { scaled } from '../src/art/canvas.ts';
import { encodePng } from './sprites/png.ts';
const dir = process.argv[2] ?? 'capturas/salas';
const level = Number(process.argv[3] ?? 1);
const ids = process.argv.slice(4);
mkdirSync(dir, { recursive: true });
for (const id of ids.length ? ids : ['sala-pruebas']) {
  const t = ROOMS[id];
  if (!t) throw new Error(`sala desconocida: ${id}`);
  const room = buildRoom(t, ['N', 'S', 'E', 'W']);
  const art = paintRoom({ ...room, level }, 'ver:' + id);
  writeFileSync(join(dir, `${id}-p${level}.png`), encodePng(scaled(art.canvas, 2)));
}
