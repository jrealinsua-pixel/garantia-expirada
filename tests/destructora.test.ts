// La Destructora de Documentos (M10 planta 4 (4a), Oficinas): plods towards the toaster always
// facing it, swallows what is shot at its front (and spits it back as strips of paper), takes
// double from behind, where its bin is, and now and then lunges with its blades red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_3, SLOT_ENEMIES_4, slotEnemiesOf } from '../src/data/rooms.ts';
import { DOWN_CAUSES, SHRED_JAM_LINE } from '../src/data/texts.ts';
import type { ShredderBrain } from '../src/data/types.ts';
import { enemyFrame, viewShift } from '../src/render/enemyAnim.ts';
import { shredSide } from '../src/sim/enemies.ts';
import { createWorld, DT, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type Input, type World } from '../src/sim/world.ts';

const def = ENEMIES.destructora!;
const brain = def.brain as ShredderBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function office(seed = 'destructora', dx = 90, dy = 0): { w: World; en: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const en = spawnEnemy(w.nextId++, def, w.player.x + dx, w.player.y + dy);
  w.enemies = [en];
  return { w, en };
}

/** Fires at the shredder's body for one tick (the toaster's aim, at its middle). */
const shootAt = (en: Enemy): Input => ({ ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 14 });

test('la destructora es contenido: datos, sprites de tres lados, causa de baja y solo desde la planta 4', () => {
  assert.equal(def.name, 'Destructora de Documentos');
  assert.equal(def.hp, 8);
  assert.ok(!/[!¡]/.test(def.name + def.description + SHRED_JAM_LINE));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number; frameW: number }>;
  assert.ok(sheets.destructora, 'falta el sprite');
  assert.ok(sheets['bala-tira'], 'faltan las tiras de papel');
  assert.ok(DOWN_CAUSES.destructora?.bullet && DOWN_CAUSES.destructora.contact);
  assert.ok(!SLOT_ENEMIES_3.some((s) => s.ch === 'S'));
  assert.ok(SLOT_ENEMIES_4.some((s) => s.ch === 'S'));
  assert.equal(slotEnemiesOf(4), SLOT_ENEMIES_4);
});

test('anda hacia la tostadora despacio y gira despacio, siempre de cara', () => {
  const { w, en } = office('anda', 160, 0);
  en.swallowed = 0;
  en.until = 99; // no lunging
  en.dirX = 1; // facing away to start with
  en.dirY = 0;
  en.state = 'walk';
  step(w, NO_INPUT);
  for (let i = 0; i < ticks(0.5); i++) step(w, NO_INPUT);
  // Half a second after facing away, it has turned about half of its 90 °/s.
  const turned = (Math.abs(Math.atan2(en.dirY, en.dirX)) * 180) / Math.PI;
  assert.ok(turned > brain.turnDeg * 0.5 - 4 && turned < brain.turnDeg * 0.5 + 4, `gira a ${brain.turnDeg}°/s: ${turned.toFixed(0)}° en medio segundo`);
  for (let i = 0; i < ticks(2); i++) step(w, NO_INPUT);
  const to = Math.atan2(w.player.y - en.y, w.player.x - en.x);
  assert.ok(Math.abs(Math.atan2(Math.sin(to - Math.atan2(en.dirY, en.dirX)), Math.cos(to - Math.atan2(en.dirY, en.dirX)))) < 0.05, 'acaba de cara a la tostadora');
  const d0 = Math.hypot(en.x - w.player.x, en.y - w.player.y);
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  const went = d0 - Math.hypot(en.x - w.player.x, en.y - w.player.y);
  assert.ok(went > brain.speed * 0.8 && went < brain.speed * 1.1, `a ${brain.speed} px/s: ${went.toFixed(0)} px`);
});

test('de frente se traga las balas sin daño y cada cuatro escupe un abanico de tiras', () => {
  const { w, en } = office('frente', 70, 0);
  for (let i = 0; i < ticks(0.3); i++) step(w, NO_INPUT); // switched on, facing the toaster
  en.until = 99;
  const swallowed: number[] = [];
  let spat = 0;
  let strips = 0;
  for (let i = 0; i < ticks(4) && spat === 0; i++) {
    step(w, shootAt(en));
    for (const e of w.events) {
      if (e.type === 'shred') swallowed.push(i);
      if (e.type === 'shredSpit') spat++;
    }
    strips = Math.max(strips, w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'strip').length);
  }
  assert.equal(en.damageTaken, 0, 'ni un rasguño de frente');
  assert.equal(swallowed.length, brain.spitEvery, `escupe a la ${brain.spitEvery}.ª`);
  assert.equal(spat, 1);
  for (let i = 0; i < ticks(0.1); i++) step(w, NO_INPUT);
  strips = Math.max(strips, w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'strip').length);
  assert.equal(strips, 5, 'cinco tiras de papel');
  // The blades show red while it chews.
  en.chompT = 0.1;
  assert.equal(enemyFrame(en, 0) - viewShift(en), def.anim!.warn);
});

test('por el lado recibe daño normal y por detrás, donde va la papelera, el doble', () => {
  // The angle a bullet flies at, against a shredder facing right.
  const en = spawnEnemy(1, def, 0, 0);
  en.dirX = 1;
  en.dirY = 0;
  assert.equal(shredSide(en, Math.PI), 'front');
  assert.equal(shredSide(en, Math.PI - 0.8), 'front', 'dentro de los 100° de delante');
  assert.equal(shredSide(en, Math.PI / 2), 'side');
  assert.equal(shredSide(en, 0), 'back');
  assert.equal(shredSide(spawnEnemy(2, ENEMIES.impresora!, 0, 0), Math.PI), 'side', 'las demás no tienen frente');
  // In the room: one bullet in its back, one in its side.
  const hitOnce = (dirX: number, dirY: number, seed: string): number => {
    const { w, en: s } = office(seed, 60, 0);
    s.swallowed = 0;
    s.state = 'walk';
    s.until = 99;
    s.dirX = dirX;
    s.dirY = dirY;
    for (let i = 0; i < ticks(0.4) && s.damageTaken === 0; i++) step(w, i === 0 ? shootAt(s) : NO_INPUT);
    return s.damageTaken;
  };
  const back = hitOnce(1, 0, 'espalda');
  const side = hitOnce(0, 1, 'lado');
  assert.ok(side > 0, 'de lado le hace daño');
  assert.equal(back, side * brain.backMul, `por detrás, ×${brain.backMul}`);
});

test('cerca y de frente avisa con las cuchillas en rojo y se lanza a tragarse a la tostadora', () => {
  const { w, en } = office('atasco', 80, 0);
  w.noDamage = false;
  let warned = -1;
  for (let i = 0; i < ticks(6) && warned < 0; i++) {
    step(w, NO_INPUT);
    if (en.state === 'warn') warned = i;
  }
  assert.ok(warned >= ticks(brain.lungeEvery[0]) - 2, 'no antes de 3 s');
  assert.ok(w.events.some((e) => e.type === 'shredJam'), 'avisa: «Atasco»');
  assert.equal(enemyFrame(en, 0) - viewShift(en), def.anim!.warn);
  const hp = w.player.hp;
  for (let i = 0; i < ticks(brain.telegraph + brain.lungeTime); i++) step(w, NO_INPUT);
  assert.ok(w.player.hp < hp, 'se la traga: medio corazón');
  // Far away, it does not lunge.
  const far = office('lejos', 200, 0);
  for (let i = 0; i < ticks(5); i++) {
    far.en.x = far.w.player.x + 200;
    step(far.w, NO_INPUT);
    assert.notEqual(far.en.state, 'warn');
  }
});

test('se dibuja de lado, de frente o de espaldas según adónde mire', () => {
  const en = spawnEnemy(1, def, 0, 0);
  const v = def.anim!.views!;
  en.dirX = -1;
  en.dirY = 0.2;
  assert.equal(viewShift(en), 0);
  en.dirX = 0.1;
  en.dirY = 1;
  assert.equal(viewShift(en), v.front);
  en.dirY = -1;
  assert.equal(viewShift(en), v.back);
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { w?: number; frameW: number; width?: number }>;
  assert.ok(sheets.destructora);
});

test('la destructora es determinista', () => {
  const run = (): string => {
    const { w, en } = office('det', 90, 30);
    for (let i = 0; i < ticks(6); i++) step(w, i % 30 < 10 ? shootAt(en) : { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
