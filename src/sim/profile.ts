// The player's record between runs: what has been played, found and beaten. Pure (the browser
// storage is in src/render/save.ts), so tests can play runs into it. Later milestones read it to
// unlock things (M9's hub, M12's secret floor: beat every boss, win with three characters).

export interface Profile {
  version: 1;
  /** Runs that ended (taken down or floor cleared). */
  runs: number;
  downs: number;
  floorsCleared: number;
  /** Times each boss (enemy id) has been taken down. */
  bosses: Record<string, number>;
  /** Floors cleared with each character (character id). */
  wins: Record<string, number>;
  kills: number;
  /** Coupons carried at the end of each run, added up. */
  coupons: number;
  /** Fastest floor cleared (s), null until one is. */
  bestFloorSeconds: number | null;
  /** Longest run (s). */
  longestRun: number;
  /** What took the player down, «enemy:how» → times. */
  causes: Record<string, number>;
  /** Everything ever picked up, by id (for the compendium and the unlocks). */
  found: { items: string[]; actives: string[]; weapons: string[] };
}

/** How a run ended and what it carried. */
export interface RunResult {
  character: string;
  outcome: 'down' | 'floor';
  seconds: number;
  kills: number;
  coupons: number;
  /** Bosses taken down in this run (enemy ids). */
  bosses: readonly string[];
  /** Seconds on the last floor (for the fastest floor), when the run had several; default `seconds`. */
  floorSeconds?: number;
  cause?: { by: string; how: 'bullet' | 'contact' };
  items: readonly string[];
  active?: string;
  weapons: readonly string[];
}

export function emptyProfile(): Profile {
  return {
    version: 1,
    runs: 0,
    downs: 0,
    floorsCleared: 0,
    bosses: {},
    wins: {},
    kills: 0,
    coupons: 0,
    bestFloorSeconds: null,
    longestRun: 0,
    causes: {},
    found: { items: [], actives: [], weapons: [] },
  };
}

const bump = (o: Record<string, number>, k: string): void => {
  o[k] = (o[k] ?? 0) + 1;
};
const union = (a: readonly string[], b: readonly string[]): string[] => [...a, ...b.filter((x, i) => !a.includes(x) && b.indexOf(x) === i)];

/** One floor cleared in the middle of a run (the run goes on upstairs): it counts as a floor, not as a run. */
export interface FloorResult {
  character: string;
  seconds: number;
  items: readonly string[];
  active?: string;
  weapons: readonly string[];
}

function addFloor(p: Profile, f: FloorResult): void {
  p.floorsCleared++;
  bump(p.wins, f.character);
  const s = Math.round(f.seconds);
  p.bestFloorSeconds = p.bestFloorSeconds === null ? s : Math.min(p.bestFloorSeconds, s);
  p.found.items = union(p.found.items, f.items);
  p.found.actives = union(p.found.actives, f.active ? [f.active] : []);
  p.found.weapons = union(p.found.weapons, f.weapons);
}

/** The profile after a floor cleared mid-run (a new object). */
export function recordFloor(old: Profile, f: FloorResult): Profile {
  const p: Profile = structuredClone(old);
  addFloor(p, f);
  return p;
}

/** The profile after one more run (a new object; the old one is left as it was). */
export function recordRun(old: Profile, r: RunResult): Profile {
  const p: Profile = structuredClone(old);
  p.runs++;
  p.kills += Math.max(0, Math.round(r.kills));
  p.coupons += Math.max(0, Math.round(r.coupons));
  p.longestRun = Math.max(p.longestRun, Math.round(r.seconds));
  for (const b of r.bosses) bump(p.bosses, b);
  if (r.outcome === 'down') {
    p.downs++;
    if (r.cause) bump(p.causes, `${r.cause.by}:${r.cause.how}`);
  } else {
    addFloor(p, { ...r, seconds: r.floorSeconds ?? r.seconds });
  }
  p.found.items = union(p.found.items, r.items);
  p.found.actives = union(p.found.actives, r.active ? [r.active] : []);
  p.found.weapons = union(p.found.weapons, r.weapons);
  return p;
}

const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const counts = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, n] of Object.entries(v)) if (count(n) > 0) out[k] = count(n);
  return out;
};
const ids = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : []);

/** Reads a saved profile, keeping what makes sense: a broken or strange save never breaks the game. */
export function parseProfile(raw: string | null): Profile {
  const p = emptyProfile();
  if (!raw) return p;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return p;
  }
  if (!o || typeof o !== 'object') return p;
  p.runs = count(o.runs);
  p.downs = count(o.downs);
  p.floorsCleared = count(o.floorsCleared);
  p.bosses = counts(o.bosses);
  p.wins = counts(o.wins);
  p.kills = count(o.kills);
  p.coupons = count(o.coupons);
  p.bestFloorSeconds = typeof o.bestFloorSeconds === 'number' && o.bestFloorSeconds > 0 ? Math.round(o.bestFloorSeconds) : null;
  p.longestRun = count(o.longestRun);
  p.causes = counts(o.causes);
  const f = (o.found ?? {}) as Record<string, unknown>;
  p.found = { items: ids(f.items), actives: ids(f.actives), weapons: ids(f.weapons) };
  return p;
}

/** The cause that has taken the player down most often («enemy:how»), or null. */
export function topCause(p: Profile): { by: string; how: 'bullet' | 'contact'; times: number } | null {
  let best: [string, number] | null = null;
  for (const e of Object.entries(p.causes)) if (!best || e[1] > best[1] || (e[1] === best[1] && e[0] < best[0])) best = e;
  if (!best) return null;
  const [by, how] = best[0].split(':');
  return { by: by!, how: how === 'bullet' ? 'bullet' : 'contact', times: best[1] };
}
