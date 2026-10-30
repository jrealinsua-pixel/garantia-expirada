// Which characters the player has unlocked: the conditions of src/data/unlocks.ts read from the
// Profile. Pure. An unlock is for good: it is saved in the profile and never taken back, even if a
// condition gets harder in a later version.

import { ROSTER, type UnlockCondition } from '../data/unlocks.ts';
import type { Profile } from './profile.ts';

/** Whether a condition holds for this profile (null: always). */
export function meets(c: UnlockCondition | null, p: Profile): boolean {
  if (!c) return true;
  if (c.beaten && !c.beaten.every((b) => (p.bosses[b] ?? 0) > 0)) return false;
  if (c.minDowns !== undefined && p.downs < c.minDowns) return false;
  if (c.minFound !== undefined && p.found.items.length < c.minFound) return false;
  if (c.minFloors !== undefined && p.floorsCleared < c.minFloors) return false;
  return true;
}

/** Characters whose condition now holds and were not unlocked yet, in tablón order. */
export function newUnlocks(p: Profile): string[] {
  return ROSTER.filter((r) => !p.unlocked.includes(r.id) && meets(r.condition, p)).map((r) => r.id);
}

/** How far along a locked character's condition is, as «hecho/necesario» pairs (for the tablón). */
export function unlockProgress(c: UnlockCondition | null, p: Profile): { done: number; needed: number }[] {
  if (!c) return [];
  const out: { done: number; needed: number }[] = [];
  if (c.beaten) out.push({ done: c.beaten.filter((b) => (p.bosses[b] ?? 0) > 0).length, needed: c.beaten.length });
  if (c.minDowns !== undefined) out.push({ done: Math.min(p.downs, c.minDowns), needed: c.minDowns });
  if (c.minFound !== undefined) out.push({ done: Math.min(p.found.items.length, c.minFound), needed: c.minFound });
  if (c.minFloors !== undefined) out.push({ done: Math.min(p.floorsCleared, c.minFloors), needed: c.minFloors });
  return out;
}

/** The tablón: every character, unlocked or not, with its condition. */
export function rosterBoard(p: Profile): { id: string; name: string; text: string; unlocked: boolean; progress: { done: number; needed: number }[] }[] {
  return ROSTER.map((r) => {
    const unlocked = p.unlocked.includes(r.id);
    return { id: r.id, name: r.name, text: unlocked ? r.blurb : r.conditionText, unlocked, progress: unlocked ? [] : unlockProgress(r.condition, p) };
  });
}
