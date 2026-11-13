// The achievements (M14 (l1)): which of src/data/logros.ts the profile has earned and how far along
// the rest are. Pure. Earned ones are kept in Profile.achievements for good (recordRun and friends
// call `newAchievements` after adding the run), even if a later version makes one harder.
import { ACHIEVEMENTS, type AchievementDef, type AchievementReward, type AchievementStat } from '../data/logros.ts';
import { ACTIVE_ITEMS, ITEMS } from '../data/items.ts';
import { WEAPONS } from '../data/weapons.ts';
import { ENEMIES } from '../data/enemies.ts';
import { dailyStreak } from './daily.ts';
import type { Profile } from './profile.ts';
import type { World } from './world.ts';
import { winners } from './unlocks.ts';

/** The floor bosses («Hoja de reclamaciones completa»): every boss but the Servicio Técnico's. */
export const FLOOR_BOSSES: readonly string[] = Object.values(ENEMIES)
  .filter((e) => e.boss && e.id !== 'trituradora')
  .map((e) => e.id);

/** The longest run of daily challenges played on consecutive days that the profile still remembers. */
export function bestDailyStreak(p: Profile): number {
  let best = 0;
  for (const key of Object.keys(p.dailies)) best = Math.max(best, dailyStreak(p.dailies, key));
  return best;
}

/** The number an achievement looks at, as the profile has it now. */
export function statValue(p: Profile, stat: AchievementStat): number {
  switch (stat) {
    case 'runs':
      return p.runs;
    case 'downs':
      return p.downs;
    case 'floors':
      return p.floorsCleared;
    case 'victories':
      return Object.values(p.victories).reduce((a, b) => a + b, 0);
    case 'endings':
      return p.endings;
    case 'kills':
      return p.kills;
    case 'coupons':
      return p.coupons;
    case 'killsOfOne':
      return Math.max(0, ...Object.values(p.killed));
    case 'winners':
      return winners(p);
    case 'flawless':
      return p.flawless.length;
    case 'synergies':
      return p.synergies.length;
    case 'found':
      return p.found.items.length;
    case 'weapons':
      return p.found.weapons.length;
    case 'bosses':
      return FLOOR_BOSSES.filter((b) => (p.bosses[b] ?? 0) > 0).length;
    case 'dailyStreak':
      return bestDailyStreak(p);
    case 'fastFloor':
      return p.bestFloorSeconds ?? Infinity;
  }
}

/** Whether the profile meets an achievement now (earned or not before). */
export function achieved(a: AchievementDef, p: Profile): boolean {
  const v = statValue(p, a.stat);
  return a.stat === 'fastFloor' ? v <= a.n : v >= a.n;
}

/** How far along it is, as «hecho/necesario» (a fast floor is all or nothing). */
export function achievementProgress(a: AchievementDef, p: Profile): { done: number; needed: number } {
  if (a.stat === 'fastFloor') return { done: achieved(a, p) ? 1 : 0, needed: 1 };
  return { done: Math.min(statValue(p, a.stat), a.n), needed: a.n };
}

/** Achievements met now and not earned yet, in the list's order. */
export function newAchievements(p: Profile): string[] {
  return ACHIEVEMENTS.filter((a) => !p.achievements.includes(a.id) && achieved(a, p)).map((a) => a.id);
}

/** Puts the newly met ones into the profile (earned and still to announce); returns them. Mutates `p`. */
export function grantAchievements(p: Profile): string[] {
  const fresh = newAchievements(p);
  if (fresh.length) {
    p.achievements = [...p.achievements, ...fresh];
    p.unseen = [...p.unseen, ...fresh.filter((id) => !p.unseen.includes(id))];
  }
  return fresh;
}

/** One line of the achievements screen. */
export interface AchievementRow {
  id: string;
  name: string;
  /** What to do; once earned, the joke. */
  text: string;
  earned: boolean;
  done: number;
  needed: number;
  /** Earned and not announced yet. */
  fresh: boolean;
  /** The name of what it unlocks (M14 (l3)), if anything. */
  reward?: string;
}

/** The name of an achievement's reward, as the loot shows it. */
export function rewardName(r: AchievementReward): string {
  const def = r.kind === 'arma' ? WEAPONS[r.id] : r.kind === 'activo' ? ACTIVE_ITEMS[r.id] : ITEMS[r.id];
  return def?.name ?? r.id;
}

/** Every achievement, earned or not, for the screen. */
export function achievementBoard(p: Profile): AchievementRow[] {
  return ACHIEVEMENTS.map((a) => {
    const earned = p.achievements.includes(a.id);
    const pr = achievementProgress(a, p);
    const reward = a.reward ? { reward: rewardName(a.reward) } : {};
    return { id: a.id, name: a.name, text: earned ? a.quip : a.text, earned, done: earned ? pr.needed : pr.done, needed: pr.needed, fresh: p.unseen.includes(a.id), ...reward };
  });
}

/** What a floor did for the achievements, as the profile's records take it (FloorResult, RunResult). */
export function deedsOf(w: Pick<World, 'synergiesSeen' | 'flawless' | 'player'>): { synergies: string[]; flawless: string[] } {
  const synergies = [...w.synergiesSeen, ...w.player.synergies.filter((id) => !w.synergiesSeen.includes(id))];
  return { synergies, flawless: [...w.flawless] };
}
