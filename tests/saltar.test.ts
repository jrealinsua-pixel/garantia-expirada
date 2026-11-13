// M14b (h7): rolling jumps the low things of a room (bargain tables, standing or tipped, return
// boxes, oil drums, trolleys), as in the Gungeon. Walking they are in the way, enemies go round
// them, and a roll never ends on top of one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROPS } from '../src/data/props.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import type { PropInstance } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, isRolling, NO_INPUT, onLowProp, spawnEnemy, step, worldHash, type Input, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const LOW = ['mesa', 'caja', 'barril', 'carrito'] as const;
const HIGH = ['autocobro', 'mostrador', 'archivador', 'pila-cajas', 'mesa-juntas', 'cofre'] as const;

function bare(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  return w;
}

function put(w: World, id: string, x: number, y: number): PropInstance {
  const def = PROPS[id]!;
  const pr: PropInstance = { def, x, y, box: { x: x + def.box.x, y: y + def.box.y, w: def.box.w, h: def.box.h } };
  w.room.props.push(pr);
  return pr;
}

function run(w: World, s: number, input: Input, events: SimEvent[] = []): SimEvent[] {
  for (let i = 0; i < ticks(s); i++) {
    step(w, input);
    events.push(...w.events);
    assert.deepEqual(checkInvariants(w), []);
    if (!isRolling(w.player)) assert.ok(!onLowProp(w, w.player), 'nunca se queda encima');
  }
  return events;
}

/** Puts the toaster `gap` px before `pr` coming from `dir` and rolls that way (or walks, `roll` false). */
function across(w: World, pr: PropInstance, dir: 'left' | 'right' | 'up' | 'down', gap: number, roll: boolean): SimEvent[] {
  const p = w.player;
  const mx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const my = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
  const r = p.def.footRadius;
  p.x = mx > 0 ? pr.box.x - r - gap : mx < 0 ? pr.box.x + pr.box.w + r + gap : pr.x;
  // Feet box: y - 3 .. y + 1.
  p.y = my > 0 ? pr.box.y - 1 - gap : my < 0 ? pr.box.y + pr.box.h + 3 + gap : pr.box.y + pr.box.h / 2 + 1;
  p.vx = 0;
  p.vy = 0;
  p.rollT = -1;
  p.rollCooldown = 0;
  const input: Input = { ...NO_INPUT, moveX: mx, moveY: my };
  const ev: SimEvent[] = [];
  if (roll) {
    step(w, { ...input, roll: true });
    ev.push(...w.events);
  }
  return run(w, 1.4, input, ev);
}

function beyond(p: { x: number; y: number }, pr: PropInstance, dir: 'left' | 'right' | 'up' | 'down'): boolean {
  if (dir === 'right') return p.x > pr.box.x + pr.box.w;
  if (dir === 'left') return p.x < pr.box.x;
  if (dir === 'down') return p.y - 3 > pr.box.y + pr.box.h;
  return p.y + 1 < pr.box.y;
}

test('las cosas bajas se saltan rodando; las altas, no', () => {
  for (const id of LOW) assert.equal(PROPS[id]!.low, true, `${id} se salta`);
  for (const id of HIGH) assert.ok(!PROPS[id]!.low, `${id} no se salta`);
});

test('andando, una cosa baja corta el paso; rodando, se cruza desde cualquier lado', () => {
  for (const id of LOW) {
    for (const dir of ['left', 'right', 'up', 'down'] as const) {
      const w = bare(`saltar-${id}-${dir}`);
      const pr = put(w, id, 240, 200);
      across(w, pr, dir, 2, false);
      assert.ok(!beyond(w.player, pr, dir), `andando, ${id} no deja pasar (${dir})`);
      for (const gap of [1, 6, 14]) {
        const v = bare(`saltar-${id}-${dir}-${gap}`);
        const q = put(v, id, 240, 200);
        const ev = across(v, q, dir, gap, true);
        assert.ok(beyond(v.player, q, dir), `rodando, ${id} se cruza (${dir}, desde ${gap} px: ${v.player.x.toFixed(1)},${v.player.y.toFixed(1)})`);
        const vault = ev.filter((e) => e.type === 'vault');
        assert.equal(vault.length, 1, `un salto por voltereta (${id}, ${dir})`);
        assert.equal(vault[0]!.type === 'vault' && vault[0]!.prop, id);
      }
    }
  }
});

test('la mesa volcada también se salta, y sigue cubriendo después', () => {
  const w = bare('saltar-volcada');
  const pr = put(w, 'mesa', 240, 200);
  pr.tipped = 'E';
  across(w, pr, 'right', 4, true);
  assert.ok(beyond(w.player, pr, 'right'));
  assert.equal(pr.tipped, 'E', 'saltarla no la mueve');
  assert.ok(w.room.props.includes(pr));
});

test('una cosa alta sigue parando la voltereta', () => {
  const w = bare('saltar-alta');
  const pr = put(w, 'archivador', 240, 200);
  const ev = across(w, pr, 'right', 4, true);
  assert.ok(!beyond(w.player, pr, 'right'));
  assert.equal(ev.filter((e) => e.type === 'vault').length, 0);
});

test('si al otro lado no hay sitio, la deja al lado y no encima', () => {
  const w = bare('saltar-pared');
  // Two tables and a filing cabinet in a row: the second table cannot be got off rolling.
  const a = put(w, 'mesa', 240, 200);
  put(w, 'mesa', 262, 200);
  put(w, 'archivador', 284, 203);
  across(w, a, 'right', 2, true);
  assert.ok(!onLowProp(w, w.player));
  assert.ok(!isRolling(w.player));
});

test('un aspirador no la cruza: la rodea', () => {
  const w = bare('saltar-enemigos');
  // A row of tables across the room, with a gap at the right end.
  const row: PropInstance[] = [];
  for (let k = 0; k < 12; k++) row.push(put(w, 'mesa', 60 + k * 22, 200));
  const en = spawnEnemy(w.nextId++, ENEMIES['aspirador']!, 150, 160);
  w.enemies.push(en);
  w.player.x = 150;
  w.player.y = 260;
  for (let i = 0; i < ticks(3); i++) {
    step(w, NO_INPUT);
    w.player.invulnerable = 1;
    for (const t of row) {
      const inside = en.x > t.box.x && en.x < t.box.x + t.box.w && en.y > t.box.y + 1 && en.y < t.box.y + t.box.h;
      assert.ok(!inside, `el aspirador dentro de una mesa (${en.x.toFixed(1)},${en.y.toFixed(1)})`);
    }
  }
  assert.ok(Math.hypot(en.x - 150, en.y - 160) > 10, 'se ha movido');
});

test('es determinista', () => {
  const play = () => {
    const w = bare('saltar-det');
    const pr = put(w, 'caja', 240, 200);
    across(w, pr, 'right', 3, true);
    return worldHash(w);
  };
  assert.equal(play(), play());
});
