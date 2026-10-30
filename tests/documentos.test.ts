// M9 (7c): el documento de historia de la sala secreta de cada planta: está en el suelo, se coge
// al pasar por encima, sube de planta con la partida y llega al perfil al acabar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, enterRoom, NO_INPUT, nextFloor, step, type World } from '../src/sim/world.ts';
import { isWallAt } from '../src/sim/room.ts';
import { emptyProfile, recordRun } from '../src/sim/profile.ts';
import { archive } from '../src/sim/archive.ts';
import { LORE } from '../src/data/lore.ts';

/** Walks into the floor's secret room (through one of its secret doors). */
function intoSecret(w: World): void {
  const f = w.floor!;
  const r = f.layout.rooms.find((x) => x.kind === 'secret')!;
  enterRoom(w, r.id, r.doors[0]!.dir);
}

const docOf = (level: number): string => LORE.find((l) => 'secret' in l.source && l.source.secret === level)!.id;

test('la sala secreta de cada planta guarda su documento en el suelo, en un sitio pisable', () => {
  for (const level of [1, 2]) {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const w = createWorld({ seed: `doc-${seed}`, floor: true, level });
      w.noDamage = true;
      intoSecret(w);
      const docs = w.pickups.filter((k) => k.kind === 'documento');
      assert.equal(docs.length, 1, `planta ${level}: un documento`);
      assert.equal(docs[0]!.doc, docOf(level));
      assert.ok(!isWallAt(w.room, docs[0]!.x, docs[0]!.y), 'no está en una pared');
      assert.ok(w.pickups.some((k) => k.kind !== 'documento'), 'el pedestal sigue teniendo lo suyo');
    }
  }
});

test('se coge al pasar por encima (también rodando), y no se archiva dos veces', () => {
  const w = createWorld({ seed: 'doc-coger', floor: true, level: 1 });
  w.noDamage = true;
  intoSecret(w);
  const k = w.pickups.find((x) => x.kind === 'documento')!;
  w.player.x = k.x;
  w.player.y = k.y;
  w.player.rollT = 0.1;
  let ev = false;
  for (let i = 0; i < 5 && !ev; i++) {
    step(w, NO_INPUT);
    ev = w.events.some((e) => e.type === 'pickup' && e.kind === 'documento' && e.item === 'manual-1');
  }
  assert.ok(ev, 'avisa al cogerlo');
  assert.deepEqual(w.docs, ['manual-1']);
  assert.ok(!w.pickups.some((x) => x.kind === 'documento'), 'ya no está en el suelo');
});

test('el documento sube de planta con la partida y llega al archivador al acabar', () => {
  const w = createWorld({ seed: 'doc-subir', floor: true, level: 1 });
  w.docs.push('manual-1');
  w.won = true;
  const up = nextFloor(w)!;
  assert.deepEqual(up.docs, ['manual-1'], 'sube con la tostadora');
  up.docs.push(docOf(2));
  // The run ends: the scene hands w.docs to recordRun.
  const p = recordRun(emptyProfile(), { character: 'tostadora', outcome: 'down', seconds: 300, kills: 3, coupons: 0, bosses: [], items: [], weapons: ['secador'], docs: up.docs });
  assert.deepEqual(p.docs, ['manual-1', 'ticket-1']);
  const a = archive(p);
  assert.deepEqual(a.filter((e) => e.fresh).map((e) => e.id), ['manual-1', 'ticket-1'], 'los dos salen como nuevos');
  assert.equal(createWorld({ seed: 'x', floor: true, level: 1 }).docs.length, 0, 'cada partida empieza sin papeles');
});
