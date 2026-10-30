import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONT_CHARS, fontText } from '../src/art/font.ts';
import { HUB, ROOMS, templatesOf } from '../src/data/rooms.ts';
import { PROPS } from '../src/data/props.ts';
import { steer } from '../src/sim/nav.ts';
import type { StationKind } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, leaveHub, NO_INPUT, nearStation, onBelt, step, worldHash } from '../src/sim/world.ts';
import type { Input, SimEvent, World } from '../src/sim/world.ts';

const ALL: StationKind[] = ['caja', 'telefono', 'turnos', 'tablon', 'archivador', 'chatarrero'];

const hub = (chatarrero = true): World => createWorld({ seed: 'mostrador', hub: { chatarrero } });

/** One tick walking towards (x, y) round whatever is in the way, aiming and firing at it. */
function walkTowards(w: World, x: number, y: number, fire = false): Input {
  const r = w.player.def.footRadius;
  const g = steer(w, { x, y }, r);
  const dx = g.x - w.player.x;
  const dy = g.y - w.player.y;
  const d = Math.hypot(dx, dy) || 1;
  return { ...NO_INPUT, moveX: dx / d, moveY: dy / d, aimX: x, aimY: y, fire };
}

/** Walks until `done` (or `seconds` run out); returns the events and whether it got there. */
function walkUntil(w: World, x: number, y: number, done: () => boolean, seconds = 15, fire = false): { ok: boolean; events: SimEvent[] } {
  const events: SimEvent[] = [];
  for (let i = 0; i < seconds / DT; i++) {
    if (done()) return { ok: true, events };
    step(w, walkTowards(w, x, y, fire));
    events.push(...w.events);
    assert.deepEqual(checkInvariants(w), []);
  }
  return { ok: done(), events };
}

test('el Mostrador: sin enemigos, sin puertas, sin nada en el suelo y con todo lo que tiene que tener', () => {
  const w = hub();
  assert.equal(w.room.kind, 'hub');
  assert.equal(w.room.id, 'mostrador');
  assert.equal(w.floor, null);
  assert.deepEqual(w.room.doors, []);
  assert.equal(w.room.enemySpawns.length, 0);
  assert.equal(w.enemies.length, 0);
  assert.equal(w.pickups.length, 0);
  assert.equal(w.doorsShut, false);
  assert.equal(w.intro, null);
  assert.deepEqual(w.room.stations.map((s) => s.kind).sort(), [...ALL].sort());
  assert.ok(w.room.belt, 'no hay cinta');
  // Unas 18 × 12 casillas, como dice el diseño.
  assert.equal(w.room.cols, 18);
  assert.equal(w.room.rows, 12);
  // La cola: postes que no paran balas (y el mostrador sí).
  const posts = w.room.props.filter((p) => p.def.id === 'poste');
  assert.ok(posts.length >= 4, 'la cola necesita postes');
  assert.ok(posts.every((p) => !p.def.blocksBullets));
  assert.ok(w.room.props.some((p) => p.def.id === 'mostrador'));
});

test('el Chatarrero solo está cuando toca: sin él, su sitio es suelo libre', () => {
  const w = createWorld({ seed: 'mostrador', hub: {} });
  assert.ok(!w.room.stations.some((s) => s.kind === 'chatarrero'));
  assert.ok(!w.room.props.some((p) => p.def.id === 'chatarrero'));
  assert.ok(hub(true).room.props.some((p) => p.def.id === 'chatarrero'));
});

test('se recorre entero: se llega a cada cosa del Mostrador y a la cinta', () => {
  const w = hub();
  assert.equal(nearStation(w), null, 'se empieza delante de algo');
  for (const st of w.room.stations) {
    // Las que están de pie se usan desde delante (debajo); las de la pared, desde su casilla.
    const prop = w.room.props.some((p) => p.x === st.x && p.y === st.y);
    const { ok } = walkUntil(w, st.x, prop ? st.y + 10 : st.y, () => nearStation(w)?.kind === st.kind);
    assert.ok(ok, `no se llega a ${st.kind} (se queda en ${w.player.x.toFixed(0)},${w.player.y.toFixed(0)})`);
    assert.equal(w.leftHub, false, `de camino a ${st.kind} pisó la cinta`);
  }
  const b = w.room.belt!;
  const { ok, events } = walkUntil(w, b.x + b.w / 2, b.y + b.h / 2, () => w.leftHub);
  assert.ok(ok, 'no se llega a la cinta');
  assert.equal(events.filter((e) => e.type === 'leaveHub').length, 1);
});

test('nada dispara ni hace daño en el Mostrador', () => {
  const w = hub();
  const hp = w.player.hp;
  const events: SimEvent[] = [];
  // Diez segundos con el gatillo apretado, corriendo de un lado a otro (sin pisar la cinta).
  const spots = [{ x: 60, y: 230 }, { x: 380, y: 230 }, { x: 60, y: 120 }, { x: 300, y: 160 }];
  for (let i = 0; i < 10 / DT; i++) {
    const s = spots[Math.floor(i / 150) % spots.length]!;
    const inp = walkTowards(w, s.x, s.y, true);
    step(w, { ...inp, roll: i % 90 === 0, reload: i % 120 === 0, useItem: true });
    events.push(...w.events);
    assert.deepEqual(checkInvariants(w), []);
  }
  assert.equal(w.leftHub, false);
  assert.equal(w.bullets.length, 0);
  assert.ok(!events.some((e) => e.type === 'shot' || e.type === 'hurt' || e.type === 'reloadStart' || e.type === 'down'));
  assert.ok(events.some((e) => e.type === 'roll'), 'rodar sí se puede');
  assert.equal(w.player.hp, hp);
  assert.equal(w.player.weapon.ammo, w.player.weapon.def.magazine);
});

test('la cinta lleva a la planta 1 de una partida nueva, con el mismo personaje', () => {
  const w = hub();
  assert.equal(leaveHub(w, 'partida-1'), null, 'sin pisar la cinta no se sale');
  const b = w.room.belt!;
  walkUntil(w, b.x + b.w / 2, b.y + b.h / 2, () => w.leftHub);
  assert.ok(w.leftHub);
  assert.ok(onBelt(w));
  // Ya no se mueve nada: el Mostrador espera a que empiece la partida.
  const before = worldHash(w);
  step(w, { ...NO_INPUT, moveX: 1 });
  assert.equal(w.player.x.toFixed(3), before.split('|')[2]);
  const run = leaveHub(w, 'partida-1')!;
  assert.ok(run, 'la cinta no lleva a ninguna parte');
  assert.ok(run.floor);
  assert.equal(run.level, 1);
  assert.equal(run.floor.current, run.floor.layout.start);
  assert.equal(run.room.kind, 'start');
  assert.equal(run.player.base.def.id, w.player.base.def.id);
  assert.equal(run.player.hp, run.player.def.maxHp);
  // La misma semilla da la misma partida; otra, otra.
  assert.equal(worldHash(leaveHub(w, 'partida-1')!), worldHash(run));
  assert.notDeepEqual(leaveHub(w, 'partida-2')!.floor!.layout, run.floor.layout);
  // Fuera del Mostrador no hay cinta que valga.
  const floor = createWorld({ seed: 'x', floor: true });
  floor.leftHub = true;
  assert.equal(leaveHub(floor, 'y'), null);
});

test('pasar rodando por la cinta no cuenta hasta que se para encima', () => {
  const w = hub();
  const b = w.room.belt!;
  // Justo debajo de la cinta, mirando hacia ella.
  w.player.x = b.x + b.w / 2;
  w.player.y = b.y + b.h + 14;
  let rolledOver = false;
  for (let i = 0; i < 3 / DT && !w.leftHub; i++) {
    step(w, { ...NO_INPUT, moveY: -1, aimX: w.player.x, aimY: 0, roll: i === 0 });
    if (onBelt(w) && w.player.rollT >= 0) rolledOver = true;
    if (w.leftHub) assert.ok(w.player.rollT < 0, 'salió rodando');
  }
  assert.ok(rolledOver, 'la prueba no llegó a rodar sobre la cinta');
  assert.ok(w.leftHub);
});

test('el Mostrador no sale nunca en una planta y sus textos se pueden escribir con la fuente', () => {
  assert.ok(!Object.values(ROOMS).some((t) => t.id === HUB.id || t.kind === 'hub'));
  for (const level of [1, 2]) {
    for (const kind of ['start', 'combat', 'treasure', 'shop', 'secret', 'boss'] as const) {
      assert.ok(!templatesOf(kind, level).some((t) => t.kind === 'hub'));
    }
  }
  const font = new Set(FONT_CHARS);
  const names = [HUB.name, ...['mostrador', 'caja-devoluciones', 'turnos', 'archivador', 'chatarrero', 'poste'].map((id) => PROPS[id]!.name)];
  for (const s of names) for (const ch of fontText(s)) assert.ok(ch === ' ' || font.has(ch), `«${ch}» de «${s}» no está en la fuente`);
});

test('el Mostrador es determinista', () => {
  const run = (): string => {
    const w = hub();
    for (let i = 0; i < 4 / DT; i++) step(w, walkTowards(w, 300, 200));
    return worldHash(w);
  };
  assert.equal(run(), run());
});

test('cada cosa del Mostrador tiene su sprite, y lo que cuelga cabe en la pared del fondo', async () => {
  const { allSheets } = await import('../tools/sprites/build.ts');
  const sheets = allSheets();
  const w = hub();
  for (const pr of w.room.props) assert.ok(sheets[pr.def.id], `${pr.def.id} sin sprite`);
  for (const k of ['tablon', 'telefono', 'cinta-almacen', 'cortinas', 'cartel-mercancia', 'cinta-cola']) assert.ok(sheets[k], `falta ${k}`);
  // El mostrador: tres tramos (dos extremos y el del medio) del ancho de una casilla.
  assert.equal(sheets.mostrador!.frameW, 24);
  assert.equal(sheets.mostrador!.canvas.w / sheets.mostrador!.frameW, 3);
  // La Caja: quieta y hablando.
  assert.equal(sheets['caja-devoluciones']!.canvas.w / sheets['caja-devoluciones']!.frameW, 2);
  // La cinta ocupa sus casillas; las cortinas, la pared de encima (como una persiana del norte).
  const b = w.room.belt!;
  assert.equal(sheets['cinta-almacen']!.frameW, b.w);
  assert.equal(sheets['cinta-almacen']!.frameH, b.h);
  assert.equal(sheets.cortinas!.frameW, b.w);
  assert.equal(sheets.cortinas!.frameH, sheets['persiana-n']!.frameH);
  // Lo que cuelga cabe en las dos filas de pared (48 px) y el cartel no se sale de la sala.
  for (const k of ['tablon', 'telefono']) assert.ok(sheets[k]!.frameH <= 40, `${k} no cabe en la pared`);
  assert.ok(sheets['cartel-mercancia']!.frameH + sheets.cortinas!.frameH <= 48, 'el cartel tapa las cortinas');
  assert.ok(b.x + b.w / 2 + sheets['cartel-mercancia']!.frameW / 2 <= w.room.w - 24, 'el cartel se sale por la derecha');
});
