// M12 (1): el cartel de «Cita previa» del Mostrador, en la pared y abierto como panel. Que enseñe
// cada requisito con su casilla y cuánto falta, el sello al concederse, y que quepa a los dos
// tamaños de texto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { citaLayout, CITA_DONE } from '../src/render/cita.ts';
import { boardTextBox } from '../src/render/board.ts';
import { HUD_H, HUD_W } from '../src/render/hud.ts';
import { emptyProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { serviceBoard } from '../src/sim/unlocks.ts';
import { buildRoom } from '../src/sim/room.ts';
import { HUB } from '../src/data/rooms.ts';
import { FLOOR_BOSSES, SERVICE } from '../src/data/servicio.ts';
import { EXPEDIENTE, LORE } from '../src/data/lore.ts';
import { CITA_BOXES, CITA_H, CITA_STAMP, CITA_W, WALL_CITA_Y, hubHung } from '../src/art/hub.ts';
import { paintRoom } from '../src/art/room.ts';

const run = (over: Partial<RunResult> = {}): RunResult => ({
  character: 'tostadora', outcome: 'down', seconds: 200, kills: 10, coupons: 5, bosses: [], level: 1,
  cause: { by: 'microondas', how: 'bullet' }, items: [], weapons: ['secador'], ...over,
});
const SECRETS = LORE.filter((l) => 'secret' in l.source).map((l) => l.id);

const profiles = (): Profile[] => {
  let p = emptyProfile();
  const out = [p];
  p = recordRun(p, run({ bosses: ['nevera-suprema', 'router-wifi'], level: 3, docs: SECRETS.slice(0, 2) }));
  out.push(p);
  p = recordRun(p, run({ outcome: 'floor', level: 5, bosses: [...FLOOR_BOSSES], cause: undefined }));
  out.push(p);
  p = recordRun(p, run({ docs: SECRETS }));
  out.push(p);
  return out;
};

test('el cartel cuenta lo que falta, pone «Cumplido» a lo hecho y el sello al final', () => {
  const [fresh, two, won, all] = profiles().map((p) => citaLayout(serviceBoard(p)));
  assert.deepEqual(fresh!.boxes.map((b) => b.ticked), [false, false, false]);
  assert.ok(fresh!.texts.some((t) => t.text === '0/5'));
  assert.ok(fresh!.texts.some((t) => t.text === `0/${EXPEDIENTE.length}`));
  assert.ok(fresh!.texts.some((t) => t.text === SERVICE.pending));
  assert.ok(two!.texts.some((t) => t.text === '2/5'));
  assert.ok(two!.texts.some((t) => t.text === `4/${EXPEDIENTE.length}`), 'dos de jefe y dos de secreta');
  assert.deepEqual(won!.boxes.map((b) => b.ticked).slice(0, 2), [true, true]);
  assert.equal(won!.texts.filter((t) => t.text === CITA_DONE).length, 2);
  assert.deepEqual(all!.boxes.map((b) => b.ticked), [true, true, true]);
  assert.ok(all!.texts.some((t) => t.role === 'granted'), 'el sello');
  assert.ok(!all!.texts.some((t) => t.text === SERVICE.pending));
});

test('el cartel cabe en la pantalla y nada se sale ni se pisa, a los dos tamaños', () => {
  for (const p of profiles()) {
    for (const scale of [1, 2]) {
      const L = citaLayout(serviceBoard(p), scale);
      assert.ok(L.x >= 0 && L.y >= 0 && L.x + L.w <= HUD_W && L.y + L.h <= HUD_H, `el panel se sale (escala ${scale}): ${JSON.stringify([L.x, L.y, L.w, L.h])}`);
      const line = 10 * scale;
      for (const t of L.texts) {
        const b = boardTextBox({ ...t, role: 'text' }, L.size);
        assert.ok(b.left >= L.x + 2 && b.right <= L.x + L.w - 2, `«${t.text}» se sale de lado (escala ${scale})`);
        assert.ok(t.y >= L.y && t.y + line <= L.y + L.h, `«${t.text}» se sale por abajo (escala ${scale})`);
      }
      for (const a of L.texts) for (const b of L.texts) {
        if (a === b || a.y !== b.y) continue;
        const A = boardTextBox({ ...a, role: 'text' }, L.size);
        const B = boardTextBox({ ...b, role: 'text' }, L.size);
        assert.ok(A.right + 4 <= B.left || B.right + 4 <= A.left, `«${a.text}» pisa «${b.text}» (escala ${scale})`);
      }
      for (const b of L.boxes) {
        assert.ok(b.x >= L.x && b.y >= L.y + L.barH && b.y + b.side <= L.y + L.h);
        assert.ok(L.texts.every((t) => t.role === 'title' || t.x >= b.x + b.side + 2 || t.y >= L.boxes[L.boxes.length - 1]!.y + b.side), 'la casilla no pisa texto');
      }
    }
  }
});

test('el cartel cuelga en la pared del Mostrador, sin tapar el tablón ni el teléfono, y los carteles pintados se apartan', () => {
  const room = buildRoom(HUB);
  const cita = room.stations.find((s) => s.kind === 'cita');
  assert.ok(cita, 'el Mostrador tiene el cartel');
  assert.ok(WALL_CITA_Y + CITA_H <= 2 * 24, 'acaba en la pared (dos filas de estantería)');
  for (const b of CITA_BOXES) assert.ok(b.x + 5 <= CITA_W && b.y + 5 <= CITA_STAMP.y, 'las casillas, encima del sello');
  assert.ok(CITA_STAMP.y + 11 <= CITA_H - 1);
  const spans = hubHung(room.stations, room.belt);
  for (let i = 0; i < spans.length; i++) for (let j = i + 1; j < spans.length; j++) {
    const [a, b] = [spans[i]!, spans[j]!];
    assert.ok(a[1] < b[0] || b[1] < a[0], `lo colgado no se pisa: ${a} y ${b}`);
  }
  // A pie del cartel se llega andando, y está lejos de las otras estaciones.
  for (const o of room.stations) if (o !== cita) assert.ok(Math.hypot(o.x - cita.x, o.y - cita.y) > 40, `${o.kind} queda lejos`);
  // La pared del Mostrador ya está llena (lo colgado y, en medio, el rótulo de la sala): el pintor no
  // pone encima su cartel de estantería, su pantalla de turnos ni su reloj. En otra sala, sí.
  const placed = (r: Parameters<typeof paintRoom>[0], seed: string): string[] =>
    paintRoom(r, seed).features.filter((f) => f.startsWith('cartel:') || f === 'turno' || f === 'reloj');
  assert.deepEqual(placed({ ...room, level: 1 }, 'mostrador'), []);
  assert.ok(placed({ ...room, kind: 'combat', stations: [], belt: null, level: 1 }, 'mostrador').length >= 1);
});
