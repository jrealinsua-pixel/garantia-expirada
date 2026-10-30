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

/** Which document of `archive()` is open in the archivador, and which of its pages (doc -1: none found). */
export interface ArchiveCursor {
  doc: number;
  page: number;
}

/** Where the archivador opens: the first document found in the last run, or else the first found. */
export function firstCursor(a: readonly ArchiveEntry[]): ArchiveCursor {
  const fresh = a.findIndex((e) => e.found && e.fresh);
  return { doc: fresh >= 0 ? fresh : a.findIndex((e) => e.found), page: 0 };
}

/** The next page: the rest of this document, then the next one found (round to the first). */
export function nextCursor(a: readonly ArchiveEntry[], c: ArchiveCursor): ArchiveCursor {
  const cur = a[c.doc];
  if (!cur) return c;
  if (c.page + 1 < cur.pages.length) return { doc: c.doc, page: c.page + 1 };
  for (let k = 1; k <= a.length; k++) {
    const i = (c.doc + k) % a.length;
    if (a[i]!.found) return { doc: i, page: 0 };
  }
  return c;
}
