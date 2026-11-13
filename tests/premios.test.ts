// M14 (l3): the limited content. Some achievements unlock a weapon or an item; until then their
// reward never turns up in the loot (chests, pedestals, shops, rare rooms), on any floor of the run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, ACHIEVEMENT_IDS, lockedContent } from '../src/data/logros.ts';
import { ACTIVE_ITEMS, FINDABLE_ACTIVES, FINDABLE_ITEMS, ITEMS, itemsUpTo } from '../src/data/items.ts';
import { FINDABLE_WEAPONS, WEAPONS } from '../src/data/weapons.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { meritReward, meritToastReward } from '../src/data/texts.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';
import { achievementBoard, rewardName } from '../src/sim/achievements.ts';
import { emptyProfile } from '../src/sim/profile.ts';
import { DAILY_LOCKED, dailyGift, startDaily } from '../src/sim/daily.ts';
import { createWorld, leaveHub, nextFloor, weaponPool, type World } from '../src/sim/world.ts';

const rewarded = ACHIEVEMENTS.filter((a) => a.reward);
const LOCKED = lockedContent([]);

/** Everything a floor can still hand out: its decks and what already lies in its rooms. */
function loot(w: World): string[] {
  const f = w.floor!;
  const out = [...f.weapons, ...f.items, ...f.actives];
  for (const r of f.rooms) for (const k of r.pickups ?? []) out.push(...[k.weapon, k.item].filter((id): id is string => !!id));
  for (const k of w.pickups) out.push(...[k.weapon, k.item].filter((id): id is string => !!id));
  return out;
}

test('cada premio es un arma u objeto que se encuentra, de su clase, y ninguno se repite', () => {
  assert.ok(rewarded.length >= 10, `solo ${rewarded.length} logros con premio`);
  const ids = rewarded.map((a) => a.reward!.id);
  assert.equal(new Set(ids).size, ids.length, 'premios repetidos');
  const starters = new Set(Object.values(CHARACTERS).map((c) => c.startWeapon));
  for (const a of rewarded) {
    const r = a.reward!;
    if (r.kind === 'arma') {
      assert.ok(FINDABLE_WEAPONS.includes(r.id) && WEAPONS[r.id], a.id);
      assert.ok(!starters.has(r.id), `${a.id}: es el arma de salida de alguien`);
    } else if (r.kind === 'activo') assert.ok(FINDABLE_ACTIVES.includes(r.id) && ACTIVE_ITEMS[r.id], a.id);
    else assert.ok(FINDABLE_ITEMS.includes(r.id) && ITEMS[r.id], a.id);
  }
});

test('lo bloqueado es el premio de cada logro sin ganar, y nada más', () => {
  assert.deepEqual([...LOCKED].sort(), rewarded.map((a) => a.reward!.id).sort());
  assert.deepEqual(lockedContent(ACHIEVEMENT_IDS), []);
  const one = rewarded[0]!;
  assert.ok(!lockedContent([one.id]).includes(one.reward!.id));
  assert.equal(lockedContent([one.id]).length, LOCKED.length - 1);
});

test('los logros que cuentan cosas se pueden ganar aunque todos los premios sigan bloqueados', () => {
  const lockedItems = rewarded.filter((a) => a.reward!.kind === 'objeto').length;
  const lockedWeapons = rewarded.filter((a) => a.reward!.kind === 'arma').length;
  for (const a of ACHIEVEMENTS) {
    if (a.stat === 'found') assert.ok(a.n <= FINDABLE_ITEMS.length - lockedItems, a.id);
    if (a.stat === 'weapons') assert.ok(a.n <= Object.keys(WEAPONS).length - lockedWeapons, a.id);
  }
  // No synergy needs two locked things at once, and plenty need none.
  const set = new Set(LOCKED);
  const free = Object.values(SYNERGIES).filter((s) => !(s.items ?? []).some((id: string) => set.has(id)));
  assert.ok(free.length >= 8, `${free.length} sinergias sin nada bloqueado`);
  for (const s of Object.values(SYNERGIES)) assert.ok((s.items ?? []).filter((id: string) => set.has(id)).length <= 1, s.name);
});

test('sin bloqueos, la planta es exactamente la de antes', () => {
  for (const seed of ['a', 'b', 'premios']) {
    const plain = createWorld({ seed, floor: true, level: 2 });
    const none = createWorld({ seed, floor: true, level: 2, locked: [] });
    assert.deepEqual(none.floor!.items, plain.floor!.items);
    assert.deepEqual(none.floor!.weapons, plain.floor!.weapons);
    assert.deepEqual(none.floor!.actives, plain.floor!.actives);
  }
});

test('lo bloqueado no sale en ninguna planta de la partida, y lo demás sí', () => {
  const set = new Set(LOCKED);
  for (let s = 0; s < 40; s++) {
    for (let level = 1; level <= 5; level++) {
      const w = createWorld({ seed: `premio-${s}`, floor: true, level, locked: LOCKED });
      assert.deepEqual(w.locked, LOCKED);
      for (const id of loot(w)) assert.ok(!set.has(id), `semilla ${s}, planta ${level}: ${id}`);
    }
  }
  const w = createWorld({ seed: 'premio-1', floor: true, level: 5, locked: LOCKED });
  assert.deepEqual([...w.floor!.items].sort(), itemsUpTo(5).filter((id) => !set.has(id)).sort(), 'lo demás, todo en la baraja');
  assert.deepEqual([...weaponPool(5, 'tostadora', [], LOCKED)].sort(), FINDABLE_WEAPONS.filter((id) => !set.has(id)).sort());
});

test('el premio de calidad de la planta 1 sigue existiendo: la Caja Fuerte Premium tiene qué dar', () => {
  const set = new Set(LOCKED);
  assert.ok(itemsUpTo(1).some((id) => ITEMS[id]!.quality === 'buena' && !set.has(id)));
  assert.ok(FINDABLE_WEAPONS.some((id) => WEAPONS[id]!.quality === 'buena' && (WEAPONS[id]!.level ?? 1) === 1 && !set.has(id)));
});

test('la lista de bloqueados pasa del Mostrador a la partida y de planta en planta', () => {
  const hub = createWorld({ seed: 'mostrador', hub: {}, locked: LOCKED });
  hub.leftHub = true;
  const run = leaveHub(hub, 'premios-run')!;
  assert.deepEqual(run.locked, LOCKED);
  run.won = true;
  const up = nextFloor(run)!;
  assert.deepEqual(up.locked, LOCKED);
  const set = new Set(LOCKED);
  for (const id of loot(up)) assert.ok(!set.has(id), id);
});

test('el reto del día no tiene premios: todo bloqueado, y el regalo nunca es uno', () => {
  assert.deepEqual([...DAILY_LOCKED].sort(), [...LOCKED].sort());
  for (let d = 1; d <= 28; d++) {
    const key = `2026-02-${String(d).padStart(2, '0')}`;
    assert.ok(!DAILY_LOCKED.includes(dailyGift(key)), key);
  }
  const w = startDaily('2026-11-12');
  assert.deepEqual(w.locked, DAILY_LOCKED);
  for (const id of loot(w)) assert.ok(!DAILY_LOCKED.includes(id), id);
});

test('la pestaña de méritos y el aviso dicen el premio, y se escribe con la fuente', () => {
  const p = emptyProfile();
  const board = achievementBoard(p);
  for (const a of ACHIEVEMENTS) {
    const row = board.find((r) => r.id === a.id)!;
    assert.equal(row.reward, a.reward ? rewardName(a.reward) : undefined);
  }
  const glyphs = new Set([...FONT_CHARS, ' ']);
  for (const a of rewarded) {
    const name = rewardName(a.reward!);
    assert.notEqual(name, a.reward!.id, 'tiene nombre');
    for (const t of [meritReward(name, true), meritReward(name, false), meritToastReward(name)]) {
      for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
    }
    // The notice is a plate at the top right: it must fit on the screen with the seal beside it.
    assert.ok(textWidth(fontText(meritToastReward(name))) + 46 <= 480 - 12, meritToastReward(name));
  }
});

// M14 (l4): the hard achievements bring things that did not exist before, not old loot locked away.
test('los logros difíciles traen objetos nuevos que solo existen como premio', async () => {
  const { modifierLines } = await import('../src/data/describe.ts');
  const fresh: Record<string, string> = {
    'cliente-habitual': 'bolsa-tela',
    'siniestro-total': 'poliza-riesgo',
    'punto-limpio': 'contenedor-amarillo',
    'pack-ahorro': 'oferta-tres-dos',
    'como-nuevo': 'plastico-protector',
  };
  for (const [ach, item] of Object.entries(fresh)) {
    const a = ACHIEVEMENTS.find((x) => x.id === ach)!;
    assert.deepEqual(a.reward, { kind: 'objeto', id: item }, ach);
    const d = ITEMS[item]!;
    assert.equal(d.level ?? 1, 1, `${item}: una vez ganado, sale desde la planta 1`);
    assert.ok(!d.quality, `${item}: no solo de la Caja Fuerte Premium`);
    assert.ok(LOCKED.includes(item), `${item}: sin ganar, agotado`);
    // Not part of any synergy yet: a reward should work on its own.
    for (const s of Object.values(SYNERGIES)) assert.ok(!(s.items ?? []).includes(item), `${item} en ${s.name}`);
    const lines = modifierLines(d.mod);
    assert.ok(lines.some((l) => l.good) && lines.some((l) => !l.good), `${item}: da algo y quita algo`);
    for (const t of [d.name.toUpperCase(), meritReward(d.name, false), meritToastReward(d.name)]) {
      for (const ch of t.toUpperCase()) assert.ok(ch === ' ' || FONT_CHARS.includes(ch), `${item}: «${ch}» no está en la fuente`);
    }
  }
  // Every achievement brings something now (the last two, the prize weapons of (l4b)).
  assert.deepEqual(ACHIEVEMENTS.filter((x) => !x.reward).map((x) => x.id), []);
});
