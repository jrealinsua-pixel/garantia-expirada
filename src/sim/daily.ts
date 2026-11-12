// The daily challenge (M14 (r1)): one run a day with a fixed seed, the same for everyone who plays
// it that day: same floors, same loot, same toaster and the same «regalo del día» to start with.
// Pure (the date comes in from outside), so tests and bots can play any day.
import { ITEMS, itemsUpTo } from '../data/items.ts';
import { Rng } from './rng.ts';
import { createWorld, giveItem, type World } from './world.ts';

/** Who plays the challenge: always the Tostadora, so the run is the same whatever the profile has unlocked. */
export const DAILY_CHARACTER = 'tostadora';
const KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days since 1970-01-01 of a calendar date (proleptic Gregorian; no clocks, no time zones). */
export function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** The calendar date of a day count (the inverse of daysFromCivil). */
export function civilFromDays(z: number): [number, number, number] {
  const zz = z + 719468;
  const era = Math.floor(zz / 146097);
  const doe = zz - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return [yoe + era * 400 + (m <= 2 ? 1 : 0), m, d];
}

const two = (n: number): string => String(n).padStart(2, '0');
const keyOf = ([y, m, d]: [number, number, number]): string => `${y}-${two(m)}-${two(d)}`;
/** Day count of a key, or null if it is not one. */
function dayOf(key: string): number | null {
  const m = KEY.exec(key);
  return m ? daysFromCivil(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}
/** The first «boletín» (2026-01-01 is nº 1). */
const FIRST_DAY = daysFromCivil(2026, 1, 1);

/** The challenge of a date, by the player's local calendar: «AAAA-MM-DD». */
export function dailyKey(d: Date): string {
  return keyOf([d.getFullYear(), d.getMonth() + 1, d.getDate()]);
}

/** A well-formed key of a real date (for links like ?reto=2026-11-12). */
export function isDailyKey(key: string): boolean {
  const z = dayOf(key);
  return z !== null && keyOf(civilFromDays(z)) === key;
}

/** The number of the «boletín de ofertas» (days since 2026-01-01, counting from 1). */
export function dailyNumber(key: string): number {
  const z = dayOf(key);
  return z === null ? 0 : z - FIRST_DAY + 1;
}

/** Day of the week of a key: 0 Sunday … 6 Saturday (1970-01-01 was a Thursday). */
export function dayOfWeek(key: string): number {
  const z = dayOf(key) ?? 0;
  return (((z + 4) % 7) + 7) % 7;
}

/** The run's seed: the floors upstairs derive theirs from it (nextFloor). */
export const dailySeed = (key: string): string => `reto-${key}`;

/** The day's gift: a passive item of floor 1, picked by the date. */
export function dailyGift(key: string): string {
  return new Rng(`regalo:${key}`).pick(itemsUpTo(1));
}

/**
 * Floor 1 of the day's challenge: the fixed seed, the Tostadora, no Servicio Técnico and none of
 * the other characters' weapons, with the gift already carried (and taken out of the floor's decks,
 * so it does not turn up again).
 */
export function startDaily(key: string): World {
  const w = createWorld({ seed: dailySeed(key), floor: true, level: 1, character: DAILY_CHARACTER, service: false, unlocked: [] });
  const gift = dailyGift(key);
  giveItem(w, gift);
  if (w.floor) w.floor.items = w.floor.items.filter((id) => id !== gift);
  return w;
}

/** How a challenge went (the best attempt of the day is kept). */
export interface DailyResult {
  /** Floor reached (1 = the first). */
  level: number;
  /** The run was won (the last floor beaten). */
  won: boolean;
  seconds: number;
  kills: number;
}

/** The record of one day's challenge. */
export interface DailyRecord extends DailyResult {
  tries: number;
}

/** True when `a` beats `b`: won before lost, then higher floor, then (won) faster or (lost) more kills, then faster. */
export function betterDaily(a: DailyResult, b: DailyResult): boolean {
  if (a.won !== b.won) return a.won;
  if (a.level !== b.level) return a.level > b.level;
  if (!a.won && a.kills !== b.kills) return a.kills > b.kills;
  return a.seconds < b.seconds;
}

/** Days kept in the profile (the oldest go first). */
export const DAILY_KEEP = 60;

/** The challenges after one more attempt on `key` (a new object; the old one is left as it was). */
export function recordDaily(old: Readonly<Record<string, DailyRecord>>, key: string, r: DailyResult): Record<string, DailyRecord> {
  const out: Record<string, DailyRecord> = { ...old };
  const res: DailyResult = { level: Math.max(1, Math.floor(r.level)), won: r.won, seconds: Math.max(0, Math.round(r.seconds)), kills: Math.max(0, Math.round(r.kills)) };
  const prev = out[key];
  out[key] = prev ? { ...(betterDaily(res, prev) ? res : prev), tries: prev.tries + 1 } : { ...res, tries: 1 };
  const keys = Object.keys(out).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - DAILY_KEEP))) delete out[k];
  return out;
}

/** Reads the saved challenges, keeping only well-formed ones. */
export function parseDailies(v: unknown): Record<string, DailyRecord> {
  const out: Record<string, DailyRecord> = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  const n = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (!isDailyKey(k) || !raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const tries = n(o.tries);
    if (tries < 1) continue;
    out[k] = { level: Math.max(1, n(o.level)), won: o.won === true, seconds: n(o.seconds), kills: n(o.kills), tries };
  }
  const keys = Object.keys(out).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - DAILY_KEEP))) delete out[k];
  return out;
}

/** Days in a row with at least one attempt, ending on `key` (or the day before it, if today has none yet). */
export function dailyStreak(rec: Readonly<Record<string, DailyRecord>>, key: string): number {
  let t = dayOf(key);
  if (t === null) return 0;
  const at = (z: number): string => keyOf(civilFromDays(z));
  if (!rec[at(t)]) t--;
  let n = 0;
  while (rec[at(t)]) {
    n++;
    t--;
  }
  return n;
}

/** The gift's name (for the screens). */
export const giftName = (key: string): string => ITEMS[dailyGift(key)]?.name ?? dailyGift(key);
