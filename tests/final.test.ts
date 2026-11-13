// M12 (5): the true ending. Beating the Trituradora on the Servicio Técnico's floor ends the run
// there (no lift: the workshop takes the toaster); the ending's shots, its texts and its credits
// (src/data/final.ts); and the record that counts it (Profile.endings).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_DEATH, createWorld, DT, enterRoom, FINALE_DELAY, isLastFloor, NO_INPUT, nextFloor, SERVICE_LEVEL, step, type SimEvent } from '../src/sim/world.ts';
import {
  ENDING_LAST_LINE, ENDING_PRICE, ENDING_PRICE_NOTE, ENDING_SECONDS, ENDING_SHELF_CARD, ENDING_SHOTS, ENDING_STICKER, ENDING_THANKS,
  ENDINGS, endingCredits, endingFor, endingShotAt, endingWarranty, shotCaption,
} from '../src/data/final.ts';
import { ROSTER } from '../src/data/unlocks.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { emptyProfile, parseProfile, recordEnding } from '../src/sim/profile.ts';
import { fontText, textWidth, wrapLines } from '../src/art/font.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { BOX_FRAMES, BOX_H, BOX_SLOT, BOX_W, SHELF_H, SHELF_SLOT, SHELF_W } from '../tools/sprites/final.ts';

test('vencer a la Trituradora acaba la partida en el taller: sin montacargas, la tostadora se queda', () => {
  const w = createWorld({ seed: 'final-verdadero', floor: true, level: SERVICE_LEVEL, service: true });
  assert.ok(isLastFloor(w));
  const bossRoom = w.floor!.rooms.findIndex((st) => st.template.kind === 'boss');
  enterRoom(w, bossRoom, 'W');
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.boss)!;
  assert.equal(boss.def.id, 'trituradora');
  boss.damageTaken = boss.def.hp;
  const seen: SimEvent[] = [];
  for (let i = 0; i < Math.ceil((BOSS_DEATH + FINALE_DELAY + 1) / DT) && !w.won; i++) {
    step(w, NO_INPUT);
    seen.push(...w.events);
  }
  assert.equal(w.lift, null, 'no hay puerta ni montacargas');
  assert.ok(!seen.some((e) => e.type === 'lift'));
  assert.equal(w.won, true);
  const done = seen.find((e) => e.type === 'floorDone');
  assert.ok(done && done.type === 'floorDone' && done.final === true, 'la escena lo toma por el final (planta 6, final)');
  assert.equal(w.level, SERVICE_LEVEL);
  assert.equal(nextFloor(w), null);
});

test('los planos del final van en orden, duran lo que dicen y se encuentran por tiempo', () => {
  assert.deepEqual(ENDING_SHOTS.map((s) => s.id), ['cinta', 'limpieza', 'resistencia', 'caja', 'estanteria']);
  assert.ok(ENDING_SECONDS > 20 && ENDING_SECONDS < 40, `${ENDING_SECONDS} s: ni un suspiro ni una película`);
  assert.equal(endingShotAt(0)!.shot.id, 'cinta');
  let start = 0;
  for (const [i, s] of ENDING_SHOTS.entries()) {
    assert.equal(endingShotAt(start + 0.01)!.index, i);
    assert.equal(endingShotAt(start + s.seconds - 0.01)!.index, i);
    assert.ok(Math.abs(endingShotAt(start + 0.5)!.t - 0.5) < 1e-9);
    start += s.seconds;
  }
  assert.equal(endingShotAt(ENDING_SECONDS + 0.01), null, 'después, los créditos');
});

test('la garantía de la caja es cada vez más corta, hasta durar lo que la primera', () => {
  assert.equal(endingWarranty(0), 'Garantía: 6 meses');
  assert.equal(endingWarranty(1), 'Garantía: 3 meses');
  const all = Array.from({ length: 12 }, (_, i) => endingWarranty(i));
  assert.equal(new Set(all.slice(0, 8)).size, 8, 'cada vuelta, una distinta');
  assert.equal(all[11], 'Garantía: hasta el martes', 'el chiste de la portada');
  assert.equal(endingWarranty(-3), endingWarranty(0));
});

test('los textos del final caben en pantalla', () => {
  for (const s of ENDING_SHOTS) {
    assert.ok(wrapLines(fontText(s.caption), 480 - 24, 1).length <= 1, `«${s.caption}» en una línea`);
    assert.ok(wrapLines(fontText(s.caption), 480 - 24, 2).length <= 2, `«${s.caption}» en dos líneas con texto grande`);
    assert.ok(textWidth(s.step) < 300, s.step);
  }
  assert.ok(textWidth(ENDING_LAST_LINE) * 2 < 460, 'la última frase, a tamaño doble');
  assert.ok(textWidth(ENDING_THANKS) * 2 < 300);
  assert.ok(textWidth(ENDING_SHELF_CARD) <= 84, 'el cartel de la estantería');
  for (let i = 0; i < 9; i++) assert.ok(textWidth(endingWarranty(i)) * 2 < 220, endingWarranty(i));
  assert.ok(Math.max(textWidth(ENDING_PRICE), textWidth(ENDING_PRICE_NOTE)) < 60);
  assert.ok(ENDING_STICKER.every((s) => s.length > 0));
  // The euro has its own glyph (not the 3 px blank of a missing one).
  assert.ok(textWidth('€') >= 4);
});

test('los créditos nombran al producto, a todos los jefes en orden y al resto del reparto', () => {
  const credits = endingCredits('Motor de prueba');
  const names = credits.flatMap((l) => (l.kind === 'gap' ? [] : [l.text]));
  assert.ok(names.includes('Motor de prueba'), 'el motor lo pone la escena');
  for (const c of Object.values(CHARACTERS)) assert.ok(names.includes(c.name), c.name);
  const bosses = ['nevera-suprema', 'lavadora-eco', 'router-wifi', 'nube-almacenamiento', 'muneco-moda', 'consola-coleccionista', 'director-rrhh', 'centralita', 'trituradora']
    .map((id) => ENEMIES[id]!.boss!.title);
  const at = bosses.map((t) => names.indexOf(t));
  assert.ok(at.every((i) => i >= 0), 'están todos');
  assert.deepEqual([...at].sort((a, b) => a - b), at, 'en el orden en que se encuentran');
  const allBosses = Object.values(ENEMIES).filter((d) => d.boss);
  assert.equal(allBosses.length, bosses.length, 'si hay un jefe nuevo, que salga en los créditos');
  for (const d of Object.values(ENEMIES)) if (!d.boss) assert.ok(names.includes(d.name), d.name);
  assert.equal(credits[0]!.kind, 'title');
  for (const n of names) assert.ok(textWidth(n) < 440, `«${n}» cabe`);
});

test('el perfil cuenta los finales, con la Trituradora, su documento y la planta del taller', () => {
  const p0 = emptyProfile();
  assert.equal(p0.endings, 0);
  const p1 = recordEnding(p0, { character: 'tostadora', seconds: 321, items: ['pila'], weapons: ['secador'] });
  assert.equal(p0.endings, 0, 'no toca el viejo');
  assert.equal(p1.endings, 1);
  assert.equal(p1.bosses['trituradora'], 1);
  assert.ok(p1.docs.includes('parte-1'), 'el parte de reacondicionado');
  assert.equal(p1.floorsCleared, 1);
  assert.ok(p1.found.items.includes('pila'));
  const p2 = recordEnding(p1);
  assert.equal(p2.endings, 2);
  assert.equal(p2.docs.filter((d) => d === 'parte-1').length, 1, 'el documento, una vez');
  assert.equal(parseProfile(JSON.stringify(p2)).endings, 2, 'se guarda');
  assert.equal(parseProfile(JSON.stringify({ ...p2, endings: 'mucho' })).endings, 0);
  assert.equal(parseProfile(null).endings, 0);
});

test('los sprites del final: la caja (con su ventana), la pegatina, el guante, la ducha y la estantería', () => {
  const s = allSheets();
  const caja = s['final-caja']!;
  assert.equal(caja.frameW, BOX_W);
  assert.equal(caja.frameH, BOX_H);
  assert.equal(caja.canvas.w, BOX_W * BOX_FRAMES.length);
  // The window: the front frames let the product show through in the middle of their front face.
  const alpha = (f: number, x: number, y: number): number => caja.canvas.get(f * BOX_W + x, y)[3];
  const wx = BOX_SLOT.x + 20;
  const wy = BOX_SLOT.y + 18;
  for (const f of [1, 2]) assert.ok(alpha(f, wx, wy) < 160, `marco ${f}: la ventana de celofán`);
  // Closed, the top is cardboard; open, it is the opening.
  assert.equal(alpha(2, 30, 13), 255);
  assert.equal(alpha(1, 30, 13), 0);
  // The back with its flap open, without it closed.
  assert.ok(alpha(0, 30, 4) > 0);
  assert.equal(alpha(3, 30, 4), 0);
  for (const k of ['final-pegatina', 'final-guante', 'final-ducha']) assert.ok(s[k], k);
  assert.equal(s['final-guante']!.canvas.w, 2 * s['final-guante']!.frameW, 'el guante: resistencia vieja y nueva');
  const shelf = s['final-estanteria']!;
  assert.equal(shelf.canvas.w, SHELF_W);
  assert.equal(shelf.canvas.h, SHELF_H);
  // The gap for the box: nothing stands on the bottom beam right over the slot.
  assert.equal(shelf.canvas.get(SHELF_SLOT.x - 24, SHELF_SLOT.y - 20)[3], 0);
});

// M13 (7b): each character's own ending.
test('cada personaje tiene su final: la reparación, la etiqueta, la estantería y el precio, y caben', () => {
  for (const r of ROSTER) {
    const e = ENDINGS[r.id];
    assert.ok(e, `${r.id} sin final`);
    const capRepair = shotCaption(ENDING_SHOTS.find((s) => s.id === 'resistencia')!, r.id);
    const capShelf = shotCaption(ENDING_SHOTS.find((s) => s.id === 'estanteria')!, r.id);
    assert.equal(capRepair, e.repair);
    assert.equal(capShelf, e.shelf);
    for (const c of [capRepair, capShelf]) {
      assert.ok(wrapLines(fontText(c), 480 - 24, 1).length <= 1, `«${c}» en una línea`);
      assert.ok(wrapLines(fontText(c), 480 - 24, 2).length <= 2, `«${c}» en dos líneas con texto grande`);
    }
    assert.ok(textWidth(e.shelfCard) <= 84, `${r.id}: el cartel de la estantería`);
    assert.ok(Math.max(textWidth(e.price), textWidth(e.priceNote)) < 60, `${r.id}: la etiqueta del precio`);
    // The label sits on the front of the box, under the sticker: no wider than the box at ×3 (180 px).
    assert.ok(textWidth(e.label) + 8 <= 60 * 3 - 15, `${r.id}: «${e.label}» no cabe en la caja`);
    // The other shots say the same for everyone.
    assert.equal(shotCaption(ENDING_SHOTS[0]!, r.id), ENDING_SHOTS[0]!.caption);
  }
  // The toaster's is the one there was; anyone unknown gets it.
  assert.equal(endingFor('tostadora').repair, ENDING_SHOTS.find((s) => s.id === 'resistencia')!.caption);
  assert.equal(endingFor('tostadora').price, ENDING_PRICE);
  assert.equal(endingFor('nadie'), endingFor('tostadora'));
  // The others have a label and a shelf of their own.
  for (const id of ['batidora-vaso', 'plancha', 'becario', 'movil']) {
    assert.ok(ENDINGS[id]!.label, `${id}: sin etiqueta`);
    assert.notEqual(ENDINGS[id]!.shelf, ENDINGS['tostadora']!.shelf);
  }
});
