// El Climatizador Portátil (M10 planta 4 (4d), Oficinas): a heavy turret that swings a cone of cold
// air from side to side. In the cone the toaster is pushed (it can still walk against it, slowly)
// and its bullets bend out of the cone; with the toaster in it, it blows six frost flakes along
// the air. Behind it, nothing: its back is the safe place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_3, SLOT_ENEMIES_4, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { AC_LINE, DOWN_CAUSES } from '../src/data/texts.ts';
import type { BlowerBrain } from '../src/data/types.ts';
import { copiable } from '../src/sim/enemies.ts';
import { activeWarnings, createWorld, DT, inWind, NO_INPUT, spawnEnemy, step, windOn, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES.climatizador!;
const brain = def.brain as BlowerBrain;
const ticks = (s: number): number => Math.ceil(s / DT);
const DEG = Math.PI / 180;

/** An empty room with the toaster in the middle (untouchable) and the air conditioner `dx` px to its left. */
function office(seed: string, dx = 120): { w: World; ac: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const ac = spawnEnemy(w.nextId++, def, w.player.x - dx, w.player.y);
  w.enemies = [ac];
  return { w, ac };
}

/** Holds the vent still, blowing along `angle` (no sweep, no turning, no frost), so the cone can be measured. */
function freeze(ac: Enemy, angle: number): void {
  ac.dirX = Math.cos(angle);
  ac.dirY = Math.sin(angle);
}

test('el climatizador es contenido: datos, sprite, copos, textos, causa de baja y solo desde la planta 4', () => {
  assert.equal(def.name, 'Climatizador Portátil');
  assert.equal(def.hp, 9);
  assert.ok(!/[!¡]/.test(def.name + def.description + AC_LINE));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number; frameW: number }>;
  assert.ok(sheets.climatizador, 'falta el sprite');
  assert.ok(DOWN_CAUSES.climatizador?.bullet && DOWN_CAUSES.climatizador.contact);
  assert.ok(!SLOT_ENEMIES_3.some((s) => s.ch === 'H'));
  assert.equal(SLOT_ENEMIES_4.find((s) => s.ch === 'H')?.max, 1);
  const tpl = templatesOf('combat', 4)[0]!;
  const filled = fillTemplate(tpl, new Rng('letra-h'), { depth: 3, pool: [{ ch: 'H', cost: 1, weight: 1, max: 1 }] });
  assert.ok(createWorld({ seed: 'letra-h', template: filled }).enemies.some((e) => e.def.id === 'climatizador'));
});

test('el cono: 45° y 200 px por delante; ni por detrás ni por los lados', () => {
  const { ac } = office('cono');
  freeze(ac, 0);
  const at = (deg: number, d: number): boolean => inWind(ac, brain, ac.x + Math.cos(deg * DEG) * d, ac.y + Math.sin(deg * DEG) * d);
  assert.ok(at(0, 100) && at(20, 190) && at(-20, 50));
  assert.ok(!at(25, 100), 'fuera por el lado');
  assert.ok(!at(0, 205), 'fuera de su alcance');
  assert.ok(!at(180, 30), 'por detrás, a salvo');
});

test('oscila de lado a lado: 90° en 3 s, siguiendo poco a poco a la tostadora', () => {
  const { w, ac } = office('vaiven', 150);
  w.player.rollCooldown = 99;
  const angles: number[] = [];
  for (let i = 0; i < ticks(6); i++) {
    step(w, NO_INPUT);
    angles.push(Math.atan2(ac.dirY, ac.dirX));
    // The toaster is held in place, so only the sweep moves the vent.
    w.player.x = ac.x + 150;
    w.player.y = ac.y;
  }
  const span = (Math.max(...angles) - Math.min(...angles)) / DEG;
  assert.ok(span > 85 && span < 92, `barre ${span.toFixed(1)}°`);
  // From one end to the other, about 3 s.
  const iMax = angles.indexOf(Math.max(...angles));
  const iMin = angles.indexOf(Math.min(...angles));
  assert.ok(Math.abs(Math.abs(iMax - iMin) * DT - brain.sweepTime) < 0.1);
});

test('dentro del cono empuja a 60 px/s: quieta se la lleva, andando en contra cuesta pero avanza', () => {
  const { w, ac } = office('empuje');
  freeze(ac, 0);
  const wind = windOn(w, w.player.x, w.player.y);
  assert.ok(Math.abs(wind.x - brain.push) < 1e-9 && Math.abs(wind.y) < 1e-9);
  assert.deepEqual(windOn(w, ac.x - 40, ac.y), { x: 0, y: 0 }, 'por detrás no sopla');
  // Standing still for half a second (the vent held still by giving it all the time in the world).
  const still = (input = NO_INPUT): number => {
    const o = office('empuje');
    o.ac.def = { ...def, brain: { ...brain, turnDeg: 0, sweepDeg: 0, interval: [99, 99] } };
    o.ac.until = 99;
    const x0 = o.w.player.x;
    for (let i = 0; i < ticks(0.5); i++) step(o.w, input);
    return o.w.player.x - x0;
  };
  const pushed = still();
  assert.ok(pushed > brain.push * 0.5 * 0.9 && pushed < brain.push * 0.5 * 1.1, `se la lleva ${pushed.toFixed(1)} px`);
  const against = still({ ...NO_INPUT, moveX: -1 });
  assert.ok(against < 0, 'andando en contra avanza');
  const free = createWorld({ seed: 'libre', noEnemies: true });
  free.room.props = [];
  const fx = free.player.x;
  for (let i = 0; i < ticks(0.5); i++) step(free, { ...NO_INPUT, moveX: -1 });
  assert.ok(-against < (fx - free.player.x) * 0.8, 'pero cuesta');
});

test('las balas de la tostadora se tuercen hacia fuera del cono', () => {
  const { w, ac } = office('balas', 160);
  ac.def = { ...def, brain: { ...brain, turnDeg: 0, sweepDeg: 0, interval: [99, 99] } };
  ac.until = 99;
  ac.sweepT = 1;
  ac.phase = 0;
  w.player.y += 6;
  // Firing straight back at it, a little below its axis: the bullet ends up further below.
  const aimX = ac.x;
  const aimY = w.player.y - 10;
  let fired = false;
  let maxDy = 0;
  for (let i = 0; i < ticks(1); i++) {
    step(w, { ...NO_INPUT, fire: !fired, aimX, aimY });
    fired ||= w.bullets.some((b) => b.owner === 'player');
    for (const b of w.bullets) if (b.owner === 'player') maxDy = Math.max(maxDy, Math.abs(Math.sin(b.dir)));
  }
  assert.ok(fired);
  assert.ok(maxDy > Math.sin(25 * DEG), `se tuerce (${(Math.asin(maxDy) / DEG).toFixed(0)}°)`);
  assert.equal(ac.damageTaken, 0, 'y no le da');
});

test('con la tostadora en el cono avisa y sopla seis copos en el sentido del aire', () => {
  const { w, ac } = office('copos', 120);
  let warned = false;
  for (let i = 0; i < ticks(5) && ac.state !== 'fire'; i++) {
    step(w, NO_INPUT);
    w.player.x = ac.x + 120;
    w.player.y = ac.y;
    if (ac.state === 'warn') {
      warned = true;
      const wn = activeWarnings(w).find((x) => x.source === ac.id);
      assert.equal(wn?.color, 'ice');
      assert.equal(wn?.aimed, true);
    }
  }
  assert.ok(warned, 'avisa antes');
  assert.ok(w.events.some((e) => e.type === 'acBlow') || warned);
  step(w, NO_INPUT);
  const flakes = w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'ice');
  assert.equal(flakes.length, 6);
  for (const b of flakes) assert.ok(b.vx > 0, 'hacia donde sopla');
  // Out of the cone (behind it), it does not blow.
  const o = office('detras', 120);
  for (let i = 0; i < ticks(5); i++) {
    step(o.w, NO_INPUT);
    o.w.player.x = o.ac.x - 30;
    o.w.player.y = o.ac.y + 20;
    if (!inWind(o.ac, brain, o.w.player.x, o.w.player.y)) assert.notEqual(o.ac.state, 'fire');
  }
});

test('al romperlo, el aire se para', () => {
  const { w, ac } = office('roto');
  freeze(ac, 0);
  assert.ok(windOn(w, w.player.x, w.player.y).x > 0);
  ac.damageTaken = def.hp;
  step(w, NO_INPUT);
  assert.deepEqual(windOn(w, w.player.x, w.player.y), { x: 0, y: 0 });
});

test('determinista: dos salas iguales acaban igual', () => {
  const run = (): string => {
    const { w } = office('det', 150);
    w.noDamage = false;
    for (let i = 0; i < ticks(10); i++) step(w, { ...NO_INPUT, moveX: Math.sin(i / 40), fire: i % 20 === 0, aimX: 0, aimY: w.player.y });
    return worldHash(w);
  };
  assert.equal(run(), run());
});

test('dos conos no suman: nunca empujan más que uno (ni la fotocopiadora lo copia)', () => {
  const { w, ac } = office('dos');
  freeze(ac, 0);
  const ac2 = spawnEnemy(w.nextId++, def, ac.x, ac.y + 20);
  freeze(ac2, -5 * DEG);
  w.enemies.push(ac2);
  const wind = windOn(w, w.player.x, w.player.y);
  assert.ok(inWind(ac2, brain, w.player.x, w.player.y));
  assert.ok(Math.hypot(wind.x, wind.y) <= brain.push + 1e-9);
  assert.ok(!copiable(ac), 'no se fotocopia');
});
