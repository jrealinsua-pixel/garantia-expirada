import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, firePattern, NO_INPUT, PLAYER_HURT_Y, spawnEnemy, step, type SimEvent, type World } from '../src/sim/world.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import * as T from '../src/data/texts.ts';
import { FONT_CHARS, textWidth } from '../src/art/font.ts';

const ROW3 = 3 * 24 + 12;

function arena(): World {
  const w = createWorld({ seed: 'baja', noEnemies: true });
  w.player.x = 200;
  w.player.y = ROW3;
  w.player.hp = 1;
  return w;
}

function runUntilDown(w: World, ticks: number): Extract<SimEvent, { type: 'down' }> | undefined {
  for (let i = 0; i < ticks; i++) {
    step(w, NO_INPUT);
    const d = w.events.find((e) => e.type === 'down');
    if (d && d.type === 'down') return d;
  }
  return undefined;
}

test('la baja apunta quién disparó la bala: el microondas', () => {
  const w = arena();
  const p = w.player;
  firePattern(w, PATTERNS['microondas-anillos']!, p.x - 30, p.y - PLAYER_HURT_Y, 0, { by: 'microondas' });
  const d = runUntilDown(w, 120);
  assert.ok(d, 'cae');
  assert.deepEqual(d.cause, { by: 'microondas', how: 'bullet' });
  assert.deepEqual(w.cause, d.cause);
  assert.equal(T.downCause(d.cause.by, d.cause.how), 'Exposición prolongada a microondas');
});

test('la baja por embestida apunta al aspirador como golpe, no como bala', () => {
  const w = arena();
  const en = spawnEnemy(w.nextId++, ENEMIES['aspirador']!, w.player.x - 6, w.player.y);
  w.enemies.push(en);
  const d = runUntilDown(w, 120);
  assert.ok(d, 'cae');
  assert.deepEqual(d.cause, { by: 'aspirador', how: 'contact' });
});

test('las balas de los maniquíes de la sala de pruebas firman como maniquí', () => {
  const w = createWorld({ seed: 'baja-maniqui', noEnemies: true });
  w.player.hp = 1;
  const dm = w.dummies[0]!;
  w.player.x = dm.x + 40;
  w.player.y = dm.y;
  const d = (() => {
    for (let i = 0; i < 240; i++) {
      step(w, { ...NO_INPUT, debugPattern: i === 0 ? 'abanico-3' : undefined } as typeof NO_INPUT);
      const e = w.events.find((x) => x.type === 'down');
      if (e && e.type === 'down') return e;
    }
    return undefined;
  })();
  assert.ok(d, 'cae');
  assert.equal(d.cause.by, 'maniqui');
});

test('cada enemigo tiene una causa de baja para cómo puede herir', () => {
  for (const def of Object.values(ENEMIES)) {
    const shoots = def.brain.kind === 'turret';
    const causes = T.DOWN_CAUSES[def.id];
    assert.ok(causes?.contact, `${def.id} sin causa por golpe`);
    if (shoots) assert.ok(causes?.bullet, `${def.id} sin causa por bala`);
  }
  assert.equal(T.downCause('nadie', 'bullet'), T.DOWN_CAUSE_DEFAULT);
});

test('el parte de baja trae unidad, causa, sala, vida útil y recomendación, y cabe en el impreso', () => {
  const lines = T.downReport({ by: 'polilla', how: 'contact', room: 'Sala de Pruebas', seconds: 42, kills: 3, coupons: 9 }, () => 0);
  const flat = lines.map((l) => (l.label ? `${l.label}: ${l.text}` : l.text));
  assert.deepEqual(flat.slice(0, 2), ['Unidad: Tostadora Reacondicionada', 'Causa: Ataque de polilla leal a la empresa']);
  assert.ok(flat.includes('Sala: Sala de Pruebas'));
  assert.ok(flat.some((l) => l.startsWith('Vida útil: 42 s') && l.includes('Bajas: 3') && l.includes('Cupones: 9')));
  assert.equal(lines.at(-1)!.text, T.DOWN_ADVICE[0]);
  // The form is 296 px wide; values start 76 px in, the advice 10 px in.
  for (const t of [...T.DOWN_COVERAGE, ...Object.values(T.DOWN_CAUSES).flatMap((c) => [c.bullet, c.contact]).filter((x): x is string => !!x)]) {
    assert.ok(textWidth(t) <= 296 - 76 - 10, `«${t}» no cabe (${textWidth(t)} px)`);
  }
  for (const t of T.DOWN_ADVICE) assert.ok(textWidth(t) <= 296 - 20, `«${t}» no cabe (${textWidth(t)} px)`);
});

test('todos los textos del juego se pueden escribir con la Letra Pequeña', () => {
  const chars = new Set([...FONT_CHARS, ' ']);
  const all: string[] = [];
  for (const v of Object.values(T)) {
    if (typeof v === 'string') all.push(v);
    else if (Array.isArray(v)) all.push(...v.filter((x): x is string => typeof x === 'string'));
    else if (v && typeof v === 'object') for (const c of Object.values(v as Record<string, Record<string, string>>)) all.push(...Object.values(c));
  }
  all.push('Exp. 1234', 'Vida útil: 12 s · Bajas: 3 · Cupones: 4');
  for (const s of all) for (const ch of s.toLocaleUpperCase('es-ES')) assert.ok(chars.has(ch), `falta «${ch}» en la fuente («${s}»)`);
});
