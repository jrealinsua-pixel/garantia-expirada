// Which characters the player has unlocked: the conditions of src/data/unlocks.ts read from the
// Profile. Pure. An unlock is for good: it is saved in the profile and never taken back, even if a
// condition gets harder in a later version.

import { ROSTER, type UnlockCondition } from '../data/unlocks.ts';
import { CHARACTERS } from '../data/characters.ts';
import { EXPEDIENTE } from '../data/lore.ts';
import { SERVICE_REQUIREMENTS } from '../data/servicio.ts';
import type { Profile } from './profile.ts';

/** Characters that can be played in this version. */
const PLAYABLE = Object.keys(CHARACTERS).length;

/** How many different winners a condition really asks for: never more than can be played. */
export const winnersNeeded = (n: number): number => Math.max(1, Math.min(n, PLAYABLE));

/** Different characters that have won the game. */
export const winners = (p: Profile): number => Object.values(p.victories).filter((v) => v > 0).length;

/** Story documents found that this version has. */
const docsFound = (p: Profile): number => EXPEDIENTE.filter((l) => p.docs.includes(l.id)).length;

/** Whether a condition holds for this profile (null: always). */
export function meets(c: UnlockCondition | null, p: Profile): boolean {
  if (!c) return true;
  if (c.beaten && !c.beaten.every((b) => (p.bosses[b] ?? 0) > 0)) return false;
  if (c.minDowns !== undefined && p.downs < c.minDowns) return false;
  if (c.minFound !== undefined && p.found.items.length < c.minFound) return false;
  if (c.minFloors !== undefined && p.floorsCleared < c.minFloors) return false;
  if (c.minWinners !== undefined && winners(p) < winnersNeeded(c.minWinners)) return false;
  if (c.allDocs && docsFound(p) < EXPEDIENTE.length) return false;
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
  if (c.minWinners !== undefined) {
    const n = winnersNeeded(c.minWinners);
    out.push({ done: Math.min(winners(p), n), needed: n });
  }
  if (c.allDocs) out.push({ done: docsFound(p), needed: EXPEDIENTE.length });
  return out;
}

/** The tablón: every character, unlocked or not, with its condition. */
export function rosterBoard(p: Profile): { id: string; name: string; text: string; unlocked: boolean; progress: { done: number; needed: number }[] }[] {
  return ROSTER.map((r) => {
    const unlocked = p.unlocked.includes(r.id);
    return { id: r.id, name: r.name, text: unlocked ? r.blurb : r.conditionText, unlocked, progress: unlocked ? [] : unlockProgress(r.condition, p) };
  });
}

/** Whether the Servicio Técnico's requirements are all met now (the appointment, once given, is kept in Profile.service). */
export const serviceMet = (p: Profile): boolean => SERVICE_REQUIREMENTS.every((r) => meets(r.condition, p));

/** One line of the «Cita previa» notice. */
export interface ServiceRow {
  id: string;
  /** The requirement, with its count in it. */
  text: string;
  done: number;
  needed: number;
  met: boolean;
}

/** The «Cita previa» notice: each requirement, how far along it is, and whether the appointment is granted. */
export function serviceBoard(p: Profile): { rows: ServiceRow[]; granted: boolean; fewProducts: boolean } {
  const rows = SERVICE_REQUIREMENTS.map((r) => {
    const pr = unlockProgress(r.condition, p)[0] ?? { done: 0, needed: 1 };
    const text = pr.needed === 1 && r.one ? r.one : r.text.replace('{n}', String(pr.needed));
    return { id: r.id, text, done: pr.done, needed: pr.needed, met: meets(r.condition, p) };
  });
  const few = SERVICE_REQUIREMENTS.some((r) => r.condition.minWinners !== undefined && winnersNeeded(r.condition.minWinners) < r.condition.minWinners);
  return { rows, granted: p.service, fewProducts: few };
}
