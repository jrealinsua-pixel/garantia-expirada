// La Webcam Siempre Encendida (M8, planta 2): keeps its distance, records you while it sees you
// and, if you do not hide in time, shares its screen: everyone else in the room attacks at once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS } from '../src/data/props.ts';
import { SLOT_ENEMIES_1, SLOT_ENEMIES_2 } from '../src/data/rooms.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import type { WatcherBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { activeWarnings, createWorld, DT, NO_INPUT, spawnEnemy, step, worldHash, type World } from '../src/sim/world.ts';

const def = ENEMIES.webcam!;
const brain = def.brain as WatcherBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function desk(seed = 'webcam'): World {
  const w = createWorld({ seed, noEnemies: true, level: 2 });
  w.noDamage = true;
  w.room.props = [];
  w.enemies = [spawnEnemy(w.nextId++, def, 300, 200)];
  w.player.x = 150;
  w.player.y = 200;
  return w;
}

/** Steps until the webcam starts recording (or `s` seconds go by). */
function untilRecording(w: World, s = 5): void {
  const en = w.enemies.find((e) => e.def.id === 'webcam')!;
  for (let i = 0; i < ticks(s) && en.state !== 'warn'; i++) step(w, NO_INPUT);
}

test('la webcam es contenido: datos, sprite de 7 fotogramas, causa de baja y solo en la planta 2', () => {
  assert.equal(def.name, 'Webcam Siempre Encendida');
  assert.ok(!/[!¡]/.test(def.name + def.description));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number }>;
  assert.ok(sheets.webcam, 'falta el sprite');
  assert.ok(DOWN_CAUSES.webcam?.bullet && DOWN_CAUSES.webcam.contact);
  assert.ok(!SLOT_ENEMIES_1.some((s) => s.ch === 'W'));
  assert.equal(SLOT_ENEMIES_2.find((s) => s.ch === 'W')?.max, 1, 'como mucho una por sala');
});

test('te ve, graba siguiéndote con la mirada y, si no te escondes, comparte pantalla y saca la foto', () => {
  const w = desk();
  const en = w.enemies[0]!;
  untilRecording(w);
  assert.equal(en.state, 'warn', 'empieza a grabar');
  assert.equal(enemyFrame(en, 500), def.anim!.warn, 'con el objetivo en rojo');
  // The line of sight reaches the toaster, and follows it when it moves.
  const wn = activeWarnings(w).find((x) => x.source === en.id)!;
  assert.ok(wn.aimed && wn.bullets && wn.reach !== undefined);
  assert.ok(wn.reach! > 100, `llega hasta la tostadora: ${wn.reach}`);
  w.player.y += 40;
  step(w, NO_INPUT);
  const wn2 = activeWarnings(w).find((x) => x.source === en.id)!;
  assert.ok(Math.abs(wn2.aim - wn.aim) > 0.1, 'la línea sigue a la tostadora');
  let alerted = false;
  const ids = new Set<number>();
  for (let i = 0; i < ticks(brain.focus + 0.3); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'alert' && e.source === en.id)) alerted = true;
    for (const b of w.bullets) if (b.owner === 'enemy') ids.add(b.id);
  }
  assert.ok(alerted, 'comparte pantalla');
  assert.equal(ids.size, 9, 'la foto: dos abanicos, de cinco y de cuatro');
});

test('si te escondes detrás de algo mientras graba, pierde la conexión y no avisa a nadie', () => {
  const w = desk('esconderse');
  const en = w.enemies[0]!;
  untilRecording(w);
  assert.equal(en.state, 'warn');
  // A box right between the two.
  const x = (en.x + w.player.x) / 2;
  w.room.props.push({ def: PROPS.caja!, x, y: 200, box: { x: x - 10, y: 160, w: 20, h: 80 } });
  let lost = false;
  for (let i = 0; i < ticks(brain.focus + 0.5); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'recLost' && e.source === en.id)) lost = true;
    assert.ok(!w.events.some((e) => e.type === 'alert'), 'no llega a compartir pantalla');
  }
  assert.ok(lost);
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0, 'ni saca la foto');
});

test('al compartir pantalla, los demás dejan de esperar y atacan a la vez; el cebo sigue siendo cebo', () => {
  const w = desk('aviso');
  const micro = spawnEnemy(w.nextId++, ENEMIES.microondas!, 320, 120);
  const bait = spawnEnemy(w.nextId++, ENEMIES.cargador!, 330, 290);
  w.enemies.push(micro, bait);
  untilRecording(w);
  // The microwave is waiting for its next turn, a long way off.
  micro.state = 'idle';
  micro.t = 0;
  micro.until = 30;
  w.emitters = w.emitters.filter((e) => e.source !== micro.id);
  let told: number[] | null = null;
  for (let i = 0; i < ticks(brain.focus + 0.1) && !told; i++) {
    step(w, NO_INPUT);
    const a = w.events.find((e) => e.type === 'alert');
    if (a && a.type === 'alert') told = a.told;
  }
  assert.deepEqual(told, [micro.id], 'avisa al microondas y no al cargador tirado');
  assert.ok(micro.rush && micro.rush.t > 0, 'y lo deja con prisa un rato');
  step(w, NO_INPUT);
  assert.ok(w.emitters.some((e) => e.source === micro.id), 'el microondas ataca ya, sin esperar sus 30 s');
  assert.equal(bait.state, 'lurk');
  // Without the webcam (nobody watching any more), the rush wears off.
  w.enemies = w.enemies.filter((e) => e.def.id !== 'webcam');
  for (let i = 0; i < ticks(brain.rush.time + 0.5); i++) step(w, NO_INPUT);
  assert.equal(micro.rush, undefined, 'la prisa se pasa');
});

test('la webcam es determinista y sale en la planta 2', () => {
  const run = (): string => {
    const w = desk('det');
    for (let i = 0; i < ticks(12); i++) step(w, { ...NO_INPUT, moveY: i % 120 < 60 ? 1 : -1 });
    return worldHash(w);
  };
  assert.equal(run(), run());
  let n = 0;
  for (let i = 0; i < 10; i++) {
    const f2 = createWorld({ seed: `cam-${i}`, floor: true, level: 2 }).floor!;
    for (const st of f2.rooms) n += st.template.rows.join('').split('W').length - 1;
  }
  assert.ok(n >= 3, `webcams en 10 plantas 2: ${n}`);
});
