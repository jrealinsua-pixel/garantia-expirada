// Atención al Cliente, measured (M11 (7)): its waiting rooms hold more enemies than the Oficinas'
// (a bigger budget on templates with slots to spare), the floors below fill as they did.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budgetCapOf, slotEnemiesOf, templatesOf } from '../src/data/rooms.ts';
import { BUDGET_CAP, enemyBudget, fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { LEVEL_DEPTH } from '../src/sim/world.ts';

/** Enemies and budget spent, on average, in the combat rooms of `level` as deep as they come there. */
function fill(level: number): { enemies: number; most: number } {
  const pool = slotEnemiesOf(level);
  const cost = new Map(pool.map((e) => [e.ch, e.cost]));
  let enemies = 0;
  let most = 0;
  let n = 0;
  for (const t of templatesOf('combat', level)) {
    for (let i = 0; i < 25; i++) {
      const f = fillTemplate(t, new Rng(`p5:${t.id}:${i}`), { depth: 1 + i % 4 + (level - 1) * LEVEL_DEPTH, pool, cap: budgetCapOf(level) });
      const letters = f.rows.join('').split('').filter((c, k) => cost.has(c) && t.rows.join('')[k] === 'e');
      enemies += letters.length;
      most = Math.max(most, letters.reduce((s, c) => s + cost.get(c)!, 0));
      n++;
    }
  }
  return { enemies: enemies / n, most };
}

test('las plantas 1 a 4 siguen con el tope de siempre; la 5, con uno más alto', () => {
  for (const l of [1, 2, 3, 4]) assert.equal(budgetCapOf(l), undefined);
  assert.ok((budgetCapOf(5) ?? 0) > BUDGET_CAP);
  assert.equal(enemyBudget(40), BUDGET_CAP);
  assert.equal(enemyBudget(40, budgetCapOf(5)), budgetCapOf(5));
});

test('las salas de la planta 5 traen más enemigos que las de las Oficinas, sin pasarse de su tope', () => {
  const four = fill(4);
  const five = fill(5);
  assert.ok(five.enemies > four.enemies + 0.4, `planta 4: ${four.enemies.toFixed(2)}; planta 5: ${five.enemies.toFixed(2)}`);
  assert.ok(four.most <= BUDGET_CAP);
  assert.ok(five.most <= budgetCapOf(5)!);
});
