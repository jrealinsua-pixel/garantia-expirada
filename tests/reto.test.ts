// M14 (r1): the daily challenge. One run a day with a fixed seed: the same floors, the same loot,
// the same toaster and the same gift for everyone that day; the profile keeps the best attempt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemsUpTo } from '../src/data/items.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';
import {
  betterDaily,
  civilFromDays,
  DAILY_CHARACTER,
  DAILY_KEEP,
  dailyGift,
  dailyKey,
  dailyNumber,
  dailySeed,
  dailyStreak,
  dayOfWeek,
  daysFromCivil,
  giftName,
  isDailyKey,
  parseDailies,
  recordDaily,
  startDaily,
} from '../src/sim/daily.ts';
import { emptyProfile, parseProfile, recordDailyRun } from '../src/sim/profile.ts';
import { checkInvariants, step, worldHash } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';
import { DAILY_FOOT, DAILY_GIFT_KIND, DAILY_START, DAILY_SUB, DAILY_TITLE, dailyLines, dailyReportLine } from '../src/data/texts.ts';
import { CHARACTERS } from '../src/data/characters.ts';

test('el calendario del reto: claves, números de boletín y días de la semana sin relojes', () => {
  assert.equal(dailyKey(new Date(2026, 10, 12, 23, 59)), '2026-11-12');
  assert.equal(dailyKey(new Date(2027, 0, 3, 0, 1)), '2027-01-03');
  assert.ok(isDailyKey('2026-11-12'));
  assert.ok(isDailyKey('2028-02-29'));
  for (const bad of ['2026-02-29', '2026-13-01', '2026-11-31', '12-11-2026', 'hoy', '']) assert.ok(!isDailyKey(bad), bad);
  assert.equal(dailyNumber('2026-01-01'), 1);
  assert.equal(dailyNumber('2026-11-12'), 316);
  assert.equal(dailyNumber('2027-01-01'), 366);
  // 12 Nov 2026 is a Thursday; 1 Jan 1970 too; 29 Feb 2000 a Tuesday.
  assert.equal(dayOfWeek('2026-11-12'), 4);
  assert.equal(dayOfWeek('1970-01-01'), 4);
  assert.equal(dayOfWeek('2000-02-29'), 2);
  for (let z = -800; z < 40000; z += 37) assert.equal(daysFromCivil(...civilFromDays(z)), z);
  assert.equal(daysFromCivil(1970, 1, 1), 0);
});

test('el mismo día da la misma partida a todo el mundo; otro día, otra', () => {
  const play = (key: string): string => {
    const w = startDaily(key);
    const bot = new Bot(`reto-${key}`);
    for (let i = 0; i < 60 * 20 && !w.over; i++) step(w, bot.think(w));
    assert.deepEqual(checkInvariants(w), []);
    return worldHash(w);
  };
  assert.equal(play('2026-11-12'), play('2026-11-12'));
  const a = startDaily('2026-11-12');
  const b = startDaily('2026-11-13');
  assert.equal(a.seed, dailySeed('2026-11-12'));
  assert.notEqual(JSON.stringify(a.floor!.layout), JSON.stringify(b.floor!.layout));
});

test('siempre con la Tostadora, sin cita ni armas de otros, y con el regalo del día ya puesto', () => {
  const key = '2026-11-12';
  const w = startDaily(key);
  assert.equal(w.player.base.def.id, DAILY_CHARACTER);
  assert.ok(CHARACTERS[DAILY_CHARACTER]);
  assert.equal(w.service, false);
  assert.deepEqual([...w.unlocked], []);
  assert.equal(w.level, 1);
  const gift = dailyGift(key);
  assert.ok(itemsUpTo(1).includes(gift));
  assert.deepEqual(w.player.items, [gift]);
  assert.ok(w.player.mods.some((m) => m.id === ITEMS[gift]!.mod.id), 'el regalo trae su modificador');
  assert.ok(!w.floor!.items.includes(gift), 'el regalo no vuelve a salir en la planta');
  assert.equal(giftName(key), ITEMS[gift]!.name);
  // Over a month, the gift changes: not always the same item.
  const gifts = new Set(Array.from({ length: 30 }, (_, i) => dailyGift(`2026-12-${String(i + 1).padStart(2, '0')}`)));
  assert.ok(gifts.size >= 8, `solo ${gifts.size} regalos distintos en un mes`);
});

test('el perfil guarda el mejor intento de cada día, cuántos y los días seguidos', () => {
  assert.ok(betterDaily({ level: 1, won: true, seconds: 900, kills: 10 }, { level: 5, won: false, seconds: 100, kills: 99 }));
  assert.ok(betterDaily({ level: 3, won: false, seconds: 900, kills: 1 }, { level: 2, won: false, seconds: 100, kills: 99 }));
  assert.ok(betterDaily({ level: 2, won: false, seconds: 900, kills: 30 }, { level: 2, won: false, seconds: 100, kills: 20 }));
  assert.ok(betterDaily({ level: 5, won: true, seconds: 800, kills: 1 }, { level: 5, won: true, seconds: 900, kills: 99 }));
  let p = emptyProfile();
  assert.deepEqual(p.dailies, {});
  p = recordDailyRun(p, '2026-11-12', { level: 2, won: false, seconds: 300.4, kills: 31 });
  p = recordDailyRun(p, '2026-11-12', { level: 1, won: false, seconds: 90, kills: 8 });
  assert.deepEqual(p.dailies['2026-11-12'], { level: 2, won: false, seconds: 300, kills: 31, tries: 2 });
  p = recordDailyRun(p, '2026-11-12', { level: 3, won: false, seconds: 500, kills: 50 });
  assert.deepEqual(p.dailies['2026-11-12'], { level: 3, won: false, seconds: 500, kills: 50, tries: 3 });
  // Kept through a save and back, and a broken save does not break it.
  assert.deepEqual(parseProfile(JSON.stringify(p)).dailies, p.dailies);
  assert.deepEqual(parseProfile(JSON.stringify({ dailies: { 'ayer': { tries: 1 }, '2026-11-11': { tries: 0, level: 3 }, '2026-11-10': 'x' } })).dailies, {});
  assert.deepEqual(parseDailies([1, 2]), {});
  // The streak: today and the days before it, or up to yesterday if today has no attempt yet.
  p = recordDailyRun(p, '2026-11-11', { level: 1, won: false, seconds: 10, kills: 0 });
  p = recordDailyRun(p, '2026-11-09', { level: 1, won: false, seconds: 10, kills: 0 });
  assert.equal(dailyStreak(p.dailies, '2026-11-12'), 2);
  assert.equal(dailyStreak(p.dailies, '2026-11-13'), 2);
  assert.equal(dailyStreak(p.dailies, '2026-11-14'), 0);
  assert.equal(dailyStreak(p.dailies, '2026-11-09'), 1);
  // Across a month's end.
  const q = recordDaily(recordDaily({}, '2026-10-31', { level: 1, won: false, seconds: 1, kills: 0 }), '2026-11-01', { level: 1, won: false, seconds: 1, kills: 0 });
  assert.equal(dailyStreak(q, '2026-11-01'), 2);
  // Only the last DAILY_KEEP days are kept.
  let many = {};
  const pad = (n: number): string => String(n).padStart(2, '0');
  for (let i = 0; i < DAILY_KEEP + 10; i++) {
    many = recordDaily(many, `2026-${pad(Math.floor(i / 28) + 1)}-${pad((i % 28) + 1)}`, { level: 1, won: false, seconds: 1, kills: 0 });
  }
  assert.equal(Object.keys(many).length, DAILY_KEEP);
  assert.ok(!('2026-01-01' in many));
});

test('los textos del boletín caben en su panel', () => {
  const glyphs = new Set([...FONT_CHARS, ' ']);
  // The panel is 360 px wide: labels from 14, values from 110 (up to 346).
  const keys = Array.from({ length: 120 }, (_, i) => {
    const z = daysFromCivil(2026, 11, 1) + i;
    const [y, m, d] = civilFromDays(z);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });
  for (const key of keys) {
    const lines = dailyLines({
      key,
      weekday: dayOfWeek(key),
      number: dailyNumber(key),
      character: CHARACTERS[DAILY_CHARACTER]!.name,
      gift: giftName(key),
      best: { level: 5, won: false, seconds: 3599, kills: 999, tries: 12 },
      streak: 365,
    });
    assert.equal(lines.length, 6);
    for (const l of lines) {
      for (const ch of fontText(l.label + l.text)) assert.ok(glyphs.has(ch), `«${l.label} ${l.text}»: falta «${ch}»`);
      assert.ok(textWidth(l.label) <= 92, `${l.label}`);
      assert.ok(textWidth(l.text) <= 236, `${l.text} (${textWidth(l.text)})`);
    }
  }
  // Every findable item of floor 1 could be a gift: all their names fit.
  for (const id of itemsUpTo(1)) assert.ok(textWidth(`${ITEMS[id]!.name} (sin garantía)`) <= 236, ITEMS[id]!.name);
  for (const t of [DAILY_SUB, DAILY_FOOT]) assert.ok(textWidth(t) <= 340, t);
  const report = dailyReportLine({ tries: 99, level: 5, won: false });
  for (const t of [DAILY_TITLE, DAILY_SUB, DAILY_FOOT, DAILY_START, DAILY_GIFT_KIND, report.label, report.text]) {
    for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
  }
  assert.match(dailyReportLine({ tries: 2, level: 5, won: true }).text, /incidencia cerrada/);
  for (const t of [DAILY_TITLE, DAILY_START, DAILY_GIFT_KIND]) assert.ok(t.length > 0);
  const day = { key: '2026-11-12', weekday: 4, number: 316, character: 'Tostadora', gift: 'X' };
  const won = dailyLines({ ...day, best: { level: 5, won: true, seconds: 1500, kills: 200, tries: 1 }, streak: 1 });
  assert.match(won[4]!.text, /Incidencia cerrada en 25:00/);
  assert.equal(won[0]!.text, 'jueves 12 de noviembre');
  const none = dailyLines({ ...day, best: null, streak: 0 });
  assert.equal(none[4]!.text, 'Sin estrenar');
});
