// M14 (l1): the achievements («Méritos del cliente»). Each one reads one number from the profile;
// once earned it is kept for good and waits to be announced; the world notes the synergies seen
// and the bosses beaten without losing life, which the profile adds up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, ACHIEVEMENT_IDS } from '../src/data/logros.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { FINDABLE_ITEMS } from '../src/data/items.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';
import { achievementBoard, achievementProgress, bestDailyStreak, deedsOf, FLOOR_BOSSES, newAchievements, statValue } from '../src/sim/achievements.ts';
import { emptyProfile, parseProfile, recordDailyRun, recordEnding, recordFloor, recordRun, seenAchievements, type RunResult } from '../src/sim/profile.ts';
import { createWorld, giveItem, giveWeapon, hurtPlayer, NO_INPUT, removeModifier, step, worldHash, type World } from '../src/sim/world.ts';

const down: RunResult = { character: 'tostadora', outcome: 'down', seconds: 120, kills: 4, coupons: 2, bosses: [], items: [], weapons: ['secador'] };

test('cada logro tiene su id, un número alcanzable y textos que se escriben con la fuente', () => {
  assert.equal(new Set(ACHIEVEMENT_IDS).size, ACHIEVEMENTS.length, 'ids repetidos');
  assert.ok(ACHIEVEMENTS.length >= 15);
  const glyphs = new Set([...FONT_CHARS, ' ']);
  const bosses = Object.values(ENEMIES).filter((e) => e.boss).length;
  const most: Record<string, number> = {
    synergies: Object.keys(SYNERGIES).length,
    found: FINDABLE_ITEMS.length,
    weapons: Object.keys(WEAPONS).length,
    winners: Object.keys(CHARACTERS).length,
    bosses: FLOOR_BOSSES.length,
    flawless: bosses,
  };
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.n > 0 && Number.isInteger(a.n), a.id);
    if (most[a.stat] !== undefined) assert.ok(a.n <= most[a.stat]!, `${a.id}: pide ${a.n} y hay ${most[a.stat]}`);
    for (const t of [a.name, a.text, a.quip]) {
      for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
      assert.ok(textWidth(t) <= 236, `«${t}» (${textWidth(t)})`);
    }
    assert.ok(a.text.endsWith('.') && a.quip.length > 5, a.id);
  }
  assert.equal(FLOOR_BOSSES.length, 5, 'los cinco jefes de planta, sin la Trituradora');
});

test('un perfil nuevo no tiene logros; la primera baja da el primero y espera a anunciarse', () => {
  const p0 = emptyProfile();
  assert.deepEqual(newAchievements(p0), []);
  assert.deepEqual(p0.achievements, []);
  const p1 = recordRun(p0, down);
  assert.deepEqual(p1.achievements, ['primera-reclamacion']);
  assert.deepEqual(p1.unseen, ['primera-reclamacion']);
  assert.deepEqual(p0.achievements, [], 'el perfil viejo no cambia');
  const p2 = seenAchievements(p1);
  assert.deepEqual(p2.unseen, []);
  assert.deepEqual(p2.achievements, ['primera-reclamacion'], 'anunciado, pero se queda');
  // Another down: nothing new to announce.
  assert.deepEqual(recordRun(p2, down).unseen, []);
});

test('los logros se ganan para siempre, aunque el número baje', () => {
  let p = emptyProfile();
  for (let i = 0; i < 25; i++) p = recordRun(p, down);
  assert.ok(p.achievements.includes('cliente-habitual'));
  // A save edited by hand (or a future rule) with fewer runs keeps it.
  const q = parseProfile(JSON.stringify({ ...p, runs: 3 }));
  assert.ok(q.achievements.includes('cliente-habitual'));
});

test('las sinergias y los jefes sin un rasguño se suman entre plantas y partidas', () => {
  const syn = Object.keys(SYNERGIES);
  let p = recordFloor(emptyProfile(), { character: 'tostadora', seconds: 300, items: [], weapons: [], synergies: [syn[0]!, 'inventada'], flawless: ['nevera-suprema', 'microondas'] });
  assert.deepEqual(p.synergies, [syn[0]]);
  assert.deepEqual(p.flawless, ['nevera-suprema'], 'solo jefes de verdad');
  assert.ok(p.achievements.includes('venta-cruzada'));
  assert.ok(p.achievements.includes('ni-un-aranazo'));
  p = recordRun(p, { ...down, synergies: syn.slice(0, 8), flawless: ['router-wifi', 'nevera-suprema'] });
  assert.equal(p.synergies.length, 8);
  assert.deepEqual(p.flawless, ['nevera-suprema', 'router-wifi']);
  assert.ok(p.achievements.includes('pack-ahorro'));
  assert.ok(!p.achievements.includes('como-nuevo'));
  p = recordEnding(p, { character: 'tostadora', seconds: 90, items: [], weapons: [], flawless: ['trituradora', 'centralita'] });
  assert.equal(statValue(p, 'flawless'), 4);
  assert.ok(p.achievements.includes('como-nuevo'));
  assert.ok(p.achievements.includes('fin-garantia'));
  // Saved and read back.
  const q = parseProfile(JSON.stringify(p));
  assert.deepEqual(q.synergies, p.synergies);
  assert.deepEqual(q.flawless, p.flawless);
  assert.deepEqual(q.achievements, p.achievements);
  assert.deepEqual(q.unseen, p.unseen);
});

test('la planta rápida y los retos seguidos', () => {
  const slow = recordFloor(emptyProfile(), { character: 'tostadora', seconds: 241, items: [], weapons: [] });
  assert.ok(!slow.achievements.includes('montaje-expres'));
  const fast = recordFloor(slow, { character: 'tostadora', seconds: 239.6, items: [], weapons: [] });
  assert.ok(fast.achievements.includes('montaje-expres'));
  const a = ACHIEVEMENTS.find((x) => x.id === 'montaje-expres')!;
  assert.deepEqual(achievementProgress(a, slow), { done: 0, needed: 1 });
  let p = emptyProfile();
  const r = { level: 1, won: false, seconds: 50, kills: 2 };
  for (const k of ['2026-11-01', '2026-11-03', '2026-11-04']) p = recordDailyRun(p, k, r);
  assert.equal(bestDailyStreak(p), 2);
  assert.ok(!p.achievements.includes('cliente-fiel'));
  p = recordDailyRun(p, '2026-11-05', r);
  assert.equal(bestDailyStreak(p), 3);
  assert.ok(p.achievements.includes('cliente-fiel'));
});

test('un guardado de antes de los logros recibe los que ya tenía ganados, sin anunciarlos todos', () => {
  let p = emptyProfile();
  for (let i = 0; i < 3; i++) p = recordRun(p, { ...down, outcome: 'floor', bosses: ['nevera-suprema'] });
  const old = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
  for (const k of ['achievements', 'unseen', 'synergies', 'flawless']) delete old[k];
  const q = parseProfile(JSON.stringify(old));
  assert.ok(q.achievements.includes('incidencia-cerrada'));
  assert.deepEqual(q.unseen, []);
  // Rubbish in the save breaks nothing.
  const r = parseProfile(JSON.stringify({ ...p, achievements: 'todos', unseen: [1, 'x'], synergies: { a: 1 }, flawless: null }));
  assert.deepEqual(r.synergies, []);
  assert.deepEqual(r.flawless, []);
  assert.ok(r.achievements.includes('incidencia-cerrada'));
  assert.ok(!r.unseen.includes('x'), 'no anuncia lo que no está ganado');
});

test('el tablón de logros: ganados con su chiste, el resto con lo que falta', () => {
  const p = recordRun(emptyProfile(), down);
  const board = achievementBoard(p);
  assert.equal(board.length, ACHIEVEMENTS.length);
  const first = board.find((r) => r.id === 'primera-reclamacion')!;
  assert.ok(first.earned && first.fresh);
  assert.equal(first.text, ACHIEVEMENTS.find((a) => a.id === first.id)!.quip);
  const kills = board.find((r) => r.id === 'punto-limpio')!;
  assert.deepEqual([kills.earned, kills.done, kills.needed], [false, 4, 1000]);
});

/** A boss room with its entrance over (skipped with the fire button) and nothing hurting the player yet. */
function bossFight(seed: string): World {
  const w = createWorld({ seed, room: 'jefe' });
  assert.ok(w.intro, 'el jefe hace su entrada');
  for (let i = 0; i < 600 && w.intro; i++) step(w, { ...NO_INPUT, fire: i > 2 });
  assert.equal(w.intro, null);
  return w;
}
function knockOut(w: World): string[] {
  const boss = w.enemies.find((e) => e.def.boss)!;
  boss.damageTaken = boss.def.hp;
  w.noDamage = true;
  for (let i = 0; i < 4; i++) step(w, NO_INPUT);
  return w.flawless;
}

test('la partida apunta el jefe vencido sin perder vida desde su entrada, y no el que hirió', () => {
  const clean = bossFight('logros-jefe');
  assert.deepEqual(knockOut(clean), ['nevera-suprema']);
  const hurt = bossFight('logros-jefe');
  hurt.player.invulnerable = 0;
  assert.ok(hurtPlayer(hurt, 1, -1, 1, 0));
  assert.deepEqual(knockOut(hurt), []);
  // Same seed, same story.
  assert.equal(worldHash(bossFight('logros-det')), worldHash(bossFight('logros-det')));
});

test('la partida apunta cada sinergia encendida, aunque luego se apague', () => {
  const s = Object.values(SYNERGIES).find((x) => x.items.length >= 1)!;
  const w = createWorld({ seed: 'logros-sinergia', noEnemies: true });
  if (s.weapon && w.player.weapon.base.id !== s.weapon) giveWeapon(w, s.weapon);
  for (const i of s.items) giveItem(w, i);
  assert.deepEqual(w.synergiesSeen, [s.id]);
  removeModifier(w, s.items[0]!);
  assert.ok(!w.player.synergies.includes(s.id));
  assert.deepEqual(deedsOf(w).synergies, [s.id], 'apagada, pero se consiguió');
  giveItem(w, s.items[0]!);
  assert.deepEqual(w.synergiesSeen, [s.id], 'una vez');
});
