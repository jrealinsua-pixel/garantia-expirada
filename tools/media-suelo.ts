// Herramienta de una sesión: color medio del suelo de cada planta (como tests/roomart.test.ts) y la
// distancia mínima de la planta 1 a las demás, por plantilla.
import { ROOMS } from '../src/data/rooms.ts';
import { buildRoom, doorCells } from '../src/sim/room.ts';
import { paintRoom } from '../src/art/room.ts';
let worst = 99;
let lum1 = 0;
let k = 0;
for (const t of Object.values(ROOMS).filter((t) => t.kind)) {
  const room = buildRoom(t);
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  const means: number[][] = [];
  for (const level of [1, 2, 3, 4, 5, 6]) {
    const art = paintRoom({ ...room, tiles, level }, 'c');
    const s: [number, number, number] = [0, 0, 0];
    let n = 0;
    for (let r = 2; r < room.rows - 1; r++) for (let c = 1; c < room.cols - 1; c++) {
      if (room.tiles[r * room.cols + c] === 1) continue;
      for (let y = r * 24; y < r * 24 + 24; y += 3) for (let x = c * 24; x < c * 24 + 24; x += 3) {
        const p = art.canvas.get(x, y);
        s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; n++;
      }
    }
    means.push(s.map((v) => v / n));
  }
  const [one, ...rest] = means as [[number, number, number], ...number[][]];
  for (const o of rest) worst = Math.min(worst, Math.hypot(one[0] - o[0]!, one[1] - o[1]!, one[2] - o[2]!));
  lum1 += 0.3 * one[0] + 0.59 * one[1] + 0.11 * one[2];
  k++;
}
console.log(`distancia mínima de la planta 1 a otra: ${worst.toFixed(1)} · brillo medio: ${(lum1 / k).toFixed(1)}`);
