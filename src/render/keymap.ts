// Which keyboard keys do what. Pure (no Phaser): the options keep a map, the controls read it and
// the texts that name keys («Q: usar», the controls screen) are written from it.
// Keys are KeyboardEvent.code values ('KeyW', 'ArrowUp', 'Space'...), the same whatever the layout.
import type { KeyWords } from '../data/texts.ts';
import { fontText, GLYPHS, textWidth } from '../art/font.ts';

export type Action = 'up' | 'down' | 'left' | 'right' | 'roll' | 'reload' | 'swap' | 'use';

export const ACTIONS: readonly Action[] = ['up', 'down', 'left', 'right', 'roll', 'reload', 'swap', 'use'];

/** Each action's keys; the first is its own, the rest come with it (the arrows, the other Shift). */
export type KeyMap = Record<Action, string[]>;

export const DEFAULT_KEYMAP: KeyMap = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  roll: ['Space', 'ShiftLeft', 'ShiftRight'],
  reload: ['KeyR'],
  swap: ['KeyE'],
  use: ['KeyQ'],
};

/** Keys that cannot be given to an action: they open the pause menu. */
export const RESERVED_KEYS: readonly string[] = ['Escape', 'KeyP'];

export function copyKeymap(m: KeyMap): KeyMap {
  return Object.fromEntries(ACTIONS.map((a) => [a, [...m[a]]])) as KeyMap;
}

/**
 * `action` now goes with `code`, which becomes its own key (its old one is dropped; the arrows
 * and the like stay). If another action had `code`, it loses it, and is left without a key if
 * that was its only one. Reserved keys change nothing.
 */
export function rebind(m: KeyMap, action: Action, code: string): KeyMap {
  if (RESERVED_KEYS.includes(code)) return copyKeymap(m);
  const out = copyKeymap(m);
  for (const a of ACTIONS) out[a] = out[a].filter((c) => c !== code);
  const rest = m[action].slice(1).filter((c) => c !== code);
  out[action] = [code, ...rest];
  return out;
}

/** The action a key does, if any. */
export function actionOf(m: KeyMap, code: string): Action | null {
  return ACTIONS.find((a) => m[a].includes(code)) ?? null;
}

/** Reads a saved map: anything missing or wrong stays at its default; a key is never in two actions. */
export function parseKeymap(v: unknown): KeyMap {
  let out = copyKeymap(DEFAULT_KEYMAP);
  if (!v || typeof v !== 'object') return out;
  const o = v as Partial<Record<Action, unknown>>;
  for (const a of ACTIONS) {
    const keys = o[a];
    if (!Array.isArray(keys) || !keys.every((k) => typeof k === 'string' && /^[A-Za-z0-9]{1,24}$/.test(k))) continue;
    const clean = [...new Set(keys as string[])].filter((k) => !RESERVED_KEYS.includes(k));
    out[a] = clean;
  }
  // Two actions on one key: the first in ACTIONS order keeps it.
  const seen = new Set<string>();
  for (const a of ACTIONS) {
    out[a] = out[a].filter((k) => !seen.has(k));
    for (const k of out[a]) seen.add(k);
  }
  out = Object.fromEntries(ACTIONS.map((a) => [a, out[a]])) as KeyMap;
  return out;
}

const NAMES: Record<string, string> = {
  Space: 'Espacio',
  ShiftLeft: 'Mayúsculas',
  ShiftRight: 'Mayúsculas dcha.',
  ControlLeft: 'Control',
  ControlRight: 'Control dcho.',
  AltLeft: 'Alt',
  AltRight: 'Alt Gr',
  Enter: 'Intro',
  NumpadEnter: 'Intro',
  Tab: 'Tabulador',
  Backspace: 'Borrar',
  CapsLock: 'Bloq Mayús',
  ArrowUp: 'Flecha arriba',
  ArrowDown: 'Flecha abajo',
  ArrowLeft: 'Flecha izquierda',
  ArrowRight: 'Flecha derecha',
};

/**
 * What a key is called on screen («W», «Espacio», «Flecha arriba», «Numérico 4»). Keys that
 * depend on the keyboard's layout (punctuation, «Ñ») use what the keyboard said when they were
 * chosen, from `seen` (code → the character it typed).
 */
export function keyLabel(code: string, seen: Readonly<Record<string, string>> = {}): string {
  const typed = seen[code];
  // (only if «Letra Pequeña» can write it).
  if (typed && typed.length === 1 && GLYPHS.has(fontText(typed))) return fontText(typed);
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^Numpad\d$/.test(code)) return `Numérico ${code.slice(6)}`;
  if (/^F\d{1,2}$/.test(code)) return code;
  return NAMES[code] ?? code;
}


const NO_KEY = 'sin tecla';
const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

/** How the texts name the keys of `m`: each action's own key, and all of them («WASD o flechas»). */
export function keyNames(m: KeyMap, seen: Readonly<Record<string, string>> = {}): KeyWords {
  const one = (a: Action): { own: string; all: string } => {
    const keys = m[a];
    if (!keys.length) return { own: NO_KEY, all: NO_KEY };
    // Two Shifts read as one.
    const labels = [...new Set(keys.map((k) => keyLabel(k, seen).replace(' dcha.', '')))];
    return { own: labels[0]!, all: labels.join(' o ') };
  };
  const dirs: Action[] = ['up', 'left', 'down', 'right'];
  const own = dirs.map((a) => m[a][0]);
  const ownLabels = own.map((c) => (c ? keyLabel(c, seen) : '?'));
  const allLetters = ownLabels.every((l) => l.length === 1);
  const ownText = own.every((c, i) => c === ARROWS[[0, 2, 1, 3][i]!]) ? 'Flechas' : allLetters ? ownLabels.join('') : ownLabels.join(' ');
  const arrowsToo = dirs.every((a, i) => m[a].slice(1).includes(ARROWS[[0, 2, 1, 3][i]!]!));
  // The controls screen has 112 px for a key's name and the hint under the first room not much
  // more: names that would not fit there say less.
  const fit = (n: { own: string; all: string }): { own: string; all: string } => {
    const own = textWidth(n.own) <= KEY_TEXT_W ? n.own : 'Tus teclas';
    return { own, all: textWidth(n.all) <= KEY_TEXT_W ? n.all : own };
  };
  return {
    move: fit({ own: ownText, all: arrowsToo ? `${ownText} o flechas` : ownText }),
    roll: fit(one('roll')),
    reload: fit(one('reload')),
    swap: fit(one('swap')),
    use: fit(one('use')),
  };
}

/** The widest a key's name may be in the texts. */
export const KEY_TEXT_W = 100;
