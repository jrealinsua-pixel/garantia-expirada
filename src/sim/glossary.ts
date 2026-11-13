// The glossary (M14): which enemies and weapons the player has met, read from the profile. Pure,
// so tests can check it; the pause menu draws it (src/render/glosario.ts).
import { ENEMIES } from '../data/enemies.ts';
import { WEAPONS } from '../data/weapons.ts';
import type { Profile } from './profile.ts';
import { achievementBoard } from './achievements.ts';

export type GlossaryTab = 'enemies' | 'weapons' | 'merits';
export const GLOSSARY_TAB_ORDER: readonly GlossaryTab[] = ['enemies', 'weapons', 'merits'];

/** The seal every achievement shows (tools/sprites/meritos.ts). */
export const MERIT_SPRITE = 'sello-merito';

export interface GlossaryEntry {
  id: string;
  /** Met: taken apart (or beaten, or it took the player down) / carried at the end of a floor or a run. */
  known: boolean;
  /** Times taken apart (bosses: beaten); 0 for weapons; achievements: how far along. */
  count: number;
  /** Achievements: the number they ask for. */
  needed?: number;
  /** Achievements: earned and not seen on this screen yet. */
  fresh?: boolean;
  boss: boolean;
  /** Texture key and the frame to show. */
  sprite: string;
  frame: number;
}

/** The bosses in the order the floors bring them (the rest of the enemies keep the data's order). */
const BOSS_ORDER = ['nevera-suprema', 'lavadora-eco', 'router-wifi', 'nube-almacenamiento', 'muneco-moda', 'director-rrhh', 'centralita', 'trituradora'];

/** Every enemy of the glossary: the ordinary ones as the data lists them, then the bosses floor by floor. */
export const GLOSSARY_ENEMIES: readonly string[] = (() => {
  const all = Object.values(ENEMIES).filter((e) => e.glossary !== false);
  const bosses = all.filter((e) => e.boss).sort((a, b) => rank(a.id) - rank(b.id));
  return [...all.filter((e) => !e.boss), ...bosses].map((e) => e.id);
})();
function rank(id: string): number {
  const i = BOSS_ORDER.indexOf(id);
  return i < 0 ? BOSS_ORDER.length : i;
}

/** Every weapon there is, in the data's order (the starting ones first). */
export const GLOSSARY_WEAPONS: readonly string[] = Object.keys(WEAPONS);

/** The entries of one tab, with what the profile says about each. */
export function glossary(p: Profile, tab: GlossaryTab): GlossaryEntry[] {
  if (tab === 'merits') {
    return achievementBoard(p).map((r) => ({ id: r.id, known: r.earned, count: r.done, needed: r.needed, fresh: r.fresh, boss: false, sprite: MERIT_SPRITE, frame: 0 }));
  }
  if (tab === 'weapons') {
    return GLOSSARY_WEAPONS.map((id) => ({ id, known: p.found.weapons.includes(id), count: 0, boss: false, sprite: WEAPONS[id]!.look.sprite, frame: 0 }));
  }
  const downedBy = new Set(Object.keys(p.causes).map((c) => c.split(':')[0]));
  return GLOSSARY_ENEMIES.map((id) => {
    const def = ENEMIES[id]!;
    const boss = !!def.boss;
    // A save from before the tally knows its bosses from `bosses`.
    const count = Math.max(p.killed[id] ?? 0, boss ? (p.bosses[id] ?? 0) : 0);
    return { id, known: count > 0 || downedBy.has(id), count, boss, sprite: def.sprite, frame: def.anim?.idle[0] ?? 0 };
  });
}

/** How many of a tab are known, and how many there are. */
export function glossaryProgress(p: Profile, tab: GlossaryTab): { known: number; total: number } {
  const list = glossary(p, tab);
  return { known: list.filter((e) => e.known).length, total: list.length };
}
