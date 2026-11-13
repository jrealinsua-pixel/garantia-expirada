// M14b (h10a2): floor 2's bosses, each with a way of moving only it has.
// - The Router del Wifi hops to its repeaters: now and then, between attacks, it swaps places with
//   the repeater nearest the toaster (never one right on top of it), after a warning.
// - The Nube de Almacenamiento hangs over the toaster like a raincloud: north of it (south if north
//   is the wall), swaying, drifting after it and floating over the furniture.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS } from '../src/data/props.ts';
import type { BossBrain } from '../src/data/types.ts';
import { relaysOf } from '../src/sim/enemies.ts';
import { BACK_WALL_ROWS, TILE } from '../src/sim/room.ts';
import { createWorld, DT, NO_INPUT, playerFeetBox, step, worldHash, type Enemy, type SimEvent, type World } from '../src/sim/world.ts';
import { overlaps } from '../src/sim/vec.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const ROUTER = ENEMIES['router-wifi']!;
const HOP = (ROUTER.brain as BossBrain).handoff!;
const NUBE = ENEMIES['nube-almacenamiento']!;
const CLOUD = (NUBE.brain as BossBrain).hover!;

function fight(id: 'router-wifi' | 'nube-almacenamiento', seed: string): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-informatica', level: 2, ...(id === 'nube-almacenamiento' ? { boss: 'Ç' } : {}) });
  w.intro = null;
  w.noDamage = true;
  return { w, boss: w.enemies.find((e) => e.def.id === id)! };
}

test('los datos: solo el Router salta a sus repetidores y solo la Nube flota encima', () => {
  assert.ok(HOP.every[0] > 2 && HOP.every[1] >= HOP.every[0] && HOP.warn >= 0.5 && HOP.clear >= 60);
  assert.ok(CLOUD.above > 60 && CLOUD.sway > 30 && CLOUD.accel > 0);
  for (const d of Object.values(ENEMIES)) {
    if (d.brain.kind !== 'boss') continue;
    if (d.id !== 'router-wifi') assert.ok(!d.brain.handoff, `${d.id} también salta a repetidores`);
    if (d.id !== 'nube-almacenamiento') assert.ok(!d.brain.hover, `${d.id} también flota encima`);
  }
});

test('el Router avisa y luego cambia el sitio con el repetidor más cercano a la tostadora', () => {
  for (let s = 0; s < 4; s++) {
    const { w, boss } = fight('router-wifi', `salta-${s}`);
    let hops = 0;
    let warned: { relay: number; at: number; x: number; y: number; tx: number; ty: number } | null = null;
    for (let i = 0; i < ticks(30); i++) {
      // The toaster walks about a little, so the nearest repeater changes.
      step(w, { ...NO_INPUT, moveX: Math.sin(i / 90), moveY: Math.cos(i / 130) * 0.6, aimX: boss.x, aimY: boss.y });
      for (const e of w.events) {
        if (e.type === 'handoffWarn') {
          assert.equal(warned, null, 'dos avisos a la vez');
          warned = { relay: e.relay, at: i, x: e.x, y: e.y, tx: e.tx, ty: e.ty };
          const relays = relaysOf(w, boss);
          const p = w.player;
          const target = relays.find((r) => r.id === e.relay)!;
          assert.ok(Math.hypot(target.x - p.x, target.y - p.y) >= HOP.clear, 'salta a un repetidor encima de la tostadora');
          // Better coverage: nearer the toaster than the Router itself, and the nearest of those.
          assert.ok(Math.hypot(target.x - p.x, target.y - p.y) < Math.hypot(boss.x - p.x, boss.y - p.y));
          for (const r of relays) {
            if (Math.hypot(r.x - p.x, r.y - p.y) < HOP.clear || Math.hypot(r.x - boss.x, r.y - boss.y) < 60) continue;
            if (Math.hypot(r.x - p.x, r.y - p.y) >= Math.hypot(boss.x - p.x, boss.y - p.y)) continue;
            assert.ok(Math.hypot(r.x - p.x, r.y - p.y) >= Math.hypot(target.x - p.x, target.y - p.y) - 1e-6);
          }
        }
        if (e.type === 'handoff') {
          assert.ok(warned && warned.relay === e.relay, 'salta sin avisar');
          assert.ok((i - warned.at) * DT >= HOP.warn - DT * 1.5, `salta a los ${((i - warned.at) * DT).toFixed(2)} s del aviso`);
          // Swapped: it is where the repeater was, and the repeater where it was.
          const relay = w.enemies.find((r) => r.id === e.relay)!;
          assert.ok(Math.hypot(boss.x - warned.tx, boss.y - warned.ty) < 24, 'no ha ido al sitio del repetidor');
          assert.ok(Math.hypot(relay.x - e.x, relay.y - e.y) < 24, 'el repetidor no ha ido a su sitio');
          assert.ok(Math.hypot(e.tx - e.x, e.ty - e.y) >= 60);
          hops++;
          warned = null;
          // And it comes out attacking: its next attack is a moment away.
          assert.ok(boss.until - boss.t * 1.6 < 0.3);
        }
      }
      w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
    }
    assert.ok(hops >= 2, `salta ${hops} veces en 30 s`);
  }
});

test('sin repetidores no salta, y un cambio de fase anula el salto', () => {
  const { w, boss } = fight('router-wifi', 'sin-repetidores');
  // (It plants them on its first tick.)
  step(w, NO_INPUT);
  assert.equal(relaysOf(w, boss).length, 2);
  for (const r of relaysOf(w, boss)) r.damageTaken = r.def.hp;
  let hops = 0;
  for (let i = 0; i < ticks(20); i++) {
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    hops += w.events.filter((e) => e.type === 'handoff' || e.type === 'handoffWarn').length;
  }
  assert.equal(hops, 0);
  const t = fight('router-wifi', 'anulado');
  step(t.w, NO_INPUT);
  // The toaster a little way from a repeater, the Router far: a hop is worth it.
  const r0 = relaysOf(t.w, t.boss)[0]!;
  t.w.player.x = r0.x + (r0.x < t.w.room.w / 2 ? 110 : -110);
  t.w.player.y = r0.y;
  t.boss.x = t.w.room.w - r0.x;
  t.boss.y = t.w.room.h / 2;
  t.boss.handoffIn = 0;
  for (let i = 0; i < ticks(3) && !t.boss.handoff; i++) step(t.w, NO_INPUT);
  assert.ok(t.boss.handoff, 'no ha empezado a saltar');
  t.boss.damageTaken = Math.ceil(ROUTER.hp / 2) + 1;
  const seen: SimEvent[] = [];
  for (let i = 0; i < ticks(1); i++) {
    step(t.w, NO_INPUT);
    seen.push(...t.w.events);
  }
  assert.equal(t.boss.handoff, undefined);
  assert.ok(!seen.some((e) => e.type === 'handoff'), 'ha saltado durante el reinicio');
});

test('la Nube se queda encima de la tostadora: al norte, meciéndose y siguiéndola', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight('nube-almacenamiento', `encima-${s}`);
    let above = 0;
    let near = 0;
    let n = 0;
    for (let i = 0; i < ticks(40); i++) {
      // The toaster strolls round the middle of the room.
      step(w, { ...NO_INPUT, moveX: Math.sin(i / 120) * 0.5, moveY: Math.cos(i / 170) * 0.35, aimX: boss.x, aimY: boss.y });
      if (i < ticks(4)) continue;
      const p = w.player;
      n++;
      if (boss.y < p.y - 30) above++;
      if (Math.abs(boss.x - p.x) < CLOUD.sway + 40) near++;
    }
    assert.ok(above / n > 0.7, `al norte de la tostadora el ${((100 * above) / n).toFixed(0)} % del tiempo`);
    assert.ok(near / n > 0.7, `a su altura el ${((100 * near) / n).toFixed(0)} % del tiempo`);
  }
});

test('con la tostadora pegada a la pared del fondo, se pone al sur', () => {
  const { w, boss } = fight('nube-almacenamiento', 'al-sur');
  w.player.y = (BACK_WALL_ROWS + 1.2) * TILE;
  let south = 0;
  for (let i = 0; i < ticks(12); i++) {
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    w.player.y = (BACK_WALL_ROWS + 1.2) * TILE;
    if (i > ticks(6) && boss.y > w.player.y + 30) south++;
  }
  assert.ok(south > ticks(5), `al sur ${(south * DT).toFixed(1)} s de 6`);
});

test('va a la deriva (acelera poco a poco) y flota por encima de los muebles', () => {
  const { w, boss } = fight('nube-almacenamiento', 'deriva');
  // A long row of tall shelving right across its way to the toaster.
  const def = PROPS.estanteria!;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h - TILE * 3;
  boss.x = w.room.w / 2;
  boss.y = (BACK_WALL_ROWS + 1) * TILE + boss.def.footRadius;
  const wallY = Math.round((boss.y + w.player.y - CLOUD.above) / 2);
  for (let x = TILE * 2; x < w.room.w - TILE * 2; x += TILE) {
    w.room.props.push({ def, x: x + TILE / 2, y: wallY, box: { x, y: wallY - 6, w: TILE, h: 12 }, hp: 99 } as never);
  }
  let over = false;
  let jerk = 0;
  for (let i = 0; i < ticks(8); i++) {
    const vx = boss.vx;
    const vy = boss.vy;
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    w.bullets = [];
    w.emitters = [];
    if (boss.state === 'idle' || boss.state === 'fire') jerk = Math.max(jerk, Math.hypot(boss.vx - vx, boss.vy - vy) / DT);
    if (w.room.props.some((pr) => overlaps(pr.box, playerFeetBox(boss, boss.def.footRadius)))) over = true;
  }
  assert.ok(over, 'no pasa por encima de la estantería');
  assert.ok(boss.y > wallY, `se ha quedado detrás de la estantería (y ${boss.y.toFixed(0)}, estantería ${wallY})`);
  assert.ok(jerk <= CLOUD.accel * 1.01, `acelera a ${jerk.toFixed(0)} px/s²`);
});

test('los dos son deterministas', () => {
  for (const id of ['router-wifi', 'nube-almacenamiento'] as const) {
    const play = (): string => {
      const { w, boss } = fight(id, `det-${id}`);
      for (let i = 0; i < ticks(20); i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
      return worldHash(w);
    };
    assert.equal(play(), play(), id);
  }
});
