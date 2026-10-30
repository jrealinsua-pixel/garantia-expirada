// Who says what in the hub (el Mostrador de Devoluciones): pure choices from the player's Profile,
// so tests can check them with profiles made by hand. Texts and conditions: src/data/dialogues.ts.

import { CAJA, CHATARRERO, TELEFONO, TURNOS, type DialogueLine, type DialogueWhen } from '../data/dialogues.ts';
import { DOWN_CAUSE_DEFAULT, DOWN_CAUSES } from '../data/texts.ts';
import { ENEMIES } from '../data/enemies.ts';
import type { Profile } from './profile.ts';
import { Rng } from './rng.ts';

/** Different bosses beaten at least once. */
export const bossesBeaten = (p: Profile): string[] => Object.keys(p.bosses).filter((b) => (p.bosses[b] ?? 0) > 0);

const isBoss = (id: string): boolean => !!ENEMIES[id]?.boss;

/** Whether a line's condition holds for this profile. */
export function holds(w: DialogueWhen | undefined, p: Profile): boolean {
  if (!w) return true;
  const beaten = bossesBeaten(p);
  const last = p.last;
  const lastKind = last ? last.outcome : 'none';
  if (w.minRuns !== undefined && p.runs < w.minRuns) return false;
  if (w.maxRuns !== undefined && p.runs > w.maxRuns) return false;
  if (w.beaten && !w.beaten.every((b) => beaten.includes(b))) return false;
  if (w.notBeaten && w.notBeaten.some((b) => beaten.includes(b))) return false;
  if (w.minBosses !== undefined && beaten.length < w.minBosses) return false;
  if (w.last !== undefined && lastKind !== w.last) return false;
  if (w.lastMinLevel !== undefined && (!last || last.level < w.lastMinLevel)) return false;
  if (w.lastByBoss !== undefined && !!(last?.cause && isBoss(last.cause.by)) !== w.lastByBoss) return false;
  if (w.lastUnder !== undefined && (!last || last.seconds >= w.lastUnder)) return false;
  if (w.minFound !== undefined && p.found.items.length < w.minFound) return false;
  if (w.maxFound !== undefined && p.found.items.length >= w.maxFound) return false;
  return true;
}

/**
 * The line to say: among those whose condition holds, the ones with the highest priority; among
 * them, one chosen by the runs played and `salt` (the same visit to the hub always says the same,
 * the next run usually something else). Null when none holds.
 */
export function pickLine(lines: readonly DialogueLine[], p: Profile, salt: string): DialogueLine | null {
  const ok = lines.filter((l) => holds(l.when, p));
  if (ok.length === 0) return null;
  const top = Math.max(...ok.map((l) => l.priority ?? 0));
  const best = ok.filter((l) => (l.priority ?? 0) === top);
  // Consecutive runs walk through the candidates in a shuffled order, so a line never repeats
  // twice in a row while there are others.
  const order = new Rng(`dialogo:${salt}:${best.map((l) => l.id).join(',')}`).shuffle([...best.keys()]);
  return best[order[p.runs % best.length]!]!;
}

/** The cause of the last breakdown, as the parte de baja words it. */
export function causeText(by: string, how: 'bullet' | 'contact'): string {
  const c = DOWN_CAUSES[by];
  return c?.[how] ?? c?.bullet ?? c?.contact ?? DOWN_CAUSE_DEFAULT;
}

/** What the Caja de Devoluciones says this visit: pages for the speech bubble. */
export function cajaPages(p: Profile): string[] {
  const line = pickLine(CAJA.lines, p, 'caja');
  const pages = [...(line?.pages ?? [])];
  const last = p.last;
  if (last?.outcome === 'down') {
    const cause = last.cause ? causeText(last.cause.by, last.cause.how) : DOWN_CAUSE_DEFAULT;
    pages.unshift(CAJA.reason(cause));
    pages.push(CAJA.stamps[p.runs % CAJA.stamps.length]!);
  }
  return pages;
}

/** What the Servicio Técnico's recording plays: the latest chapter the bosses beaten unlock. */
export function telefonoPages(p: Profile): string[] {
  return [...(pickLine(TELEFONO.lines, p, 'telefono')?.pages ?? [])];
}

/** The ticket machine's screen: the number served never moves; yours is the runs played plus four million. */
export function turnosScreen(p: Profile): { screen: string; note: string } {
  return { screen: TURNOS.screen(TURNOS.serving, TURNOS.offset + p.runs), note: TURNOS.notes[p.runs % TURNOS.notes.length]! };
}

/** Whether the Chatarrero is in the hub (after the first boss beaten). */
export const chatarreroHere = (p: Profile): boolean => holds(CHATARRERO.appears, p);

/** What the Chatarrero says (a hint about what is still missing), or null while he is not here. */
export function chatarreroPages(p: Profile): string[] | null {
  if (!chatarreroHere(p)) return null;
  return [...(pickLine(CHATARRERO.lines, p, 'chatarrero')?.pages ?? [])];
}
