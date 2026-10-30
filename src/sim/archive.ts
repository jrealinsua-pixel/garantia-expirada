// The archivador «Reclamaciones sin Resolver» of the hub: every story document in reading order,
// found or not. Pure. Texts: src/data/lore.ts.

import { LORE, LORE_MISSING } from '../data/lore.ts';
import type { Profile } from './profile.ts';

export interface ArchiveEntry {
  id: string;
  found: boolean;
  /** Found: «kind · title»; not found: the missing-file notice. */
  heading: string;
  pages: readonly string[];
  /** Found in the last run (the hub marks it as new). */
  fresh: boolean;
}

export function archive(p: Profile): ArchiveEntry[] {
  return LORE.map((l) => {
    const found = p.docs.includes(l.id);
    return { id: l.id, found, heading: found ? `${l.kind} · ${l.title}` : LORE_MISSING, pages: found ? l.pages : [], fresh: !!p.last?.docs?.includes(l.id) };
  });
}

/** «found/total» for the archivador's label. */
export const archiveCount = (p: Profile): { found: number; total: number } => ({ found: LORE.filter((l) => p.docs.includes(l.id)).length, total: LORE.length });
