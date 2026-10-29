// The player's record (src/sim/profile.ts), kept in the browser between games. If storage is
// missing or fails, the game goes on with an empty record that lasts until the page is closed.
import { emptyProfile, parseProfile, recordRun, type Profile, type RunResult } from '../sim/profile.ts';

const KEY = 'garantia-expirada/perfil';
let current: Profile | null = null;

export function profile(): Profile {
  if (!current) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch {
      raw = null;
    }
    current = raw ? parseProfile(raw) : emptyProfile();
  }
  return current;
}

/** Adds a finished run to the record and saves it. */
export function saveRun(r: RunResult): Profile {
  current = recordRun(profile(), r);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Private mode or blocked storage: kept in memory only.
  }
  return current;
}
