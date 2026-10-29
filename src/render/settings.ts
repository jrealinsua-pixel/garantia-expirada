// The player's options, kept in the browser between games (localStorage; if it is not there or
// it fails, the defaults). The pause menu changes them; the game scene reads them.

export interface Settings {
  /** Effects volume, 0 to 10. */
  volume: number;
  /** Camera shake on shots, hits and blasts. */
  shake: boolean;
}

export const DEFAULT_SETTINGS: Settings = { volume: 7, shake: true };
const KEY = 'garantia-expirada/opciones';

/** Reads saved options, keeping only what makes sense (anything else stays at its default). */
export function parseSettings(raw: string | null): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw) return s;
  try {
    const o = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>;
    if (typeof o.volume === 'number' && Number.isFinite(o.volume)) s.volume = Math.max(0, Math.min(10, Math.round(o.volume)));
    if (typeof o.shake === 'boolean') s.shake = o.shake;
  } catch {
    // A broken save is the same as none.
  }
  return s;
}

let current: Settings | null = null;

export function settings(): Settings {
  if (!current) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch {
      raw = null;
    }
    current = parseSettings(raw);
  }
  return current;
}

export function saveSettings(change: Partial<Settings>): Settings {
  const s = Object.assign(settings(), change);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or blocked storage: the change lasts until the page is closed.
  }
  return s;
}
