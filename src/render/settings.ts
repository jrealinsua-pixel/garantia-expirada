// The player's options, kept in the browser between games (localStorage; if it is not there or
// it fails, the defaults). The pause menu changes them; the game scene reads them.

export interface Settings {
  /** Effects volume, 0 to 10. */
  volume: number;
  /** Music volume, 0 to 10. */
  music: number;
  /** Camera shake on shots, hits and blasts. */
  shake: boolean;
  /** Full white flashes (hits, boss phases). Off: a light tint and a faint screen flash, no strobing. */
  flashes: boolean;
  /**
   * «Texto grande»: what is read calmly (the description window, the banners, the shop's bubbles,
   * the room's name) at double size. The HUD's numbers stay as they are.
   */
  bigText: boolean;
}

export const DEFAULT_SETTINGS: Settings = { volume: 7, music: 6, shake: true, flashes: true, bigText: false };

/** How many times its own size the reading text is drawn (1, or 2 with «Texto grande»). */
export function readScale(s: Pick<Settings, 'bigText'>): number {
  return s.bigText ? 2 : 1;
}

/** Tint for a hit with soft flashes: warm, light, and never solid white. */
export const SOFT_FLASH_TINT = 0xffd2c4;
/** Strongest whole-screen flash with soft flashes on. */
export const SOFT_SCREEN_FLASH = 0.12;

/** How white the whole screen goes for a flash of `alpha`, with or without full flashes. */
export function screenFlashAlpha(alpha: number, flashes: boolean): number {
  return flashes ? alpha : Math.min(alpha * 0.25, SOFT_SCREEN_FLASH);
}
const KEY = 'garantia-expirada/opciones';

/** Reads saved options, keeping only what makes sense (anything else stays at its default). */
export function parseSettings(raw: string | null): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw) return s;
  try {
    const o = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>;
    if (typeof o.volume === 'number' && Number.isFinite(o.volume)) s.volume = Math.max(0, Math.min(10, Math.round(o.volume)));
    if (typeof o.music === 'number' && Number.isFinite(o.music)) s.music = Math.max(0, Math.min(10, Math.round(o.music)));
    if (typeof o.shake === 'boolean') s.shake = o.shake;
    if (typeof o.flashes === 'boolean') s.flashes = o.flashes;
    if (typeof o.bigText === 'boolean') s.bigText = o.bigText;
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
