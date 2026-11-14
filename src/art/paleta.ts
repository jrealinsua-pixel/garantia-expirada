// M14c (a1): the new art style's palette. Each material is a ramp of 5–7 tones, from the
// highlight (index 0) to the deepest shadow (last). Shadows are coloured, never grey or black:
// going down a ramp the hue slides towards blue-violet and the lights warm up towards yellow,
// the way a pixel artist hue-shifts by hand. The values are hand-picked; the tests check the
// rules (tone count, falling luminance, hue shift, no black shadows). See docs/ESTILO_ARTE.md.

import { hx, type RGBA } from './canvas.ts';

export type Ramp6 = readonly RGBA[];
const r = (...h: string[]): Ramp6 => h.map((c) => hx(c));

/** Ink: the darkest colour of the new style (outer outline on the shadow side, eye sockets). */
export const INK = hx('#140f20');
/** Off-white highlight, a touch warm. */
export const SHINE = hx('#fffaf0');

export const MATERIALS = {
  /** Chrome and brushed steel of the casings: warm-white lights, violet shadows. */
  acero: r('#fbf5e6', '#dfe1e6', '#b4bccb', '#8790a9', '#5e6485', '#3e3f62', '#2a2847'),
  /** Toast: golden crust, the shadows go to a reddish brown. */
  tostada: r('#ffe7a8', '#f4bd62', '#d6903e', '#a8622c', '#733c26', '#47231f'),
  /** Burnt toast: almost black but still brown-violet. */
  quemada: r('#9a6a44', '#6c4430', '#4a2c26', '#33202a', '#22172a'),
  /** Red plastic and rubber (sneakers, knobs, the vacuum's eye): shadows to crimson-violet. */
  rojo: r('#ffc1a3', '#ff7d5c', '#e44a3f', '#b42f45', '#7c2042', '#4b1636'),
  /** Blue plastic of the vacuum: the lights go cyan, the shadows indigo. */
  azul: r('#d4f1ff', '#9ed0f7', '#6aa3e3', '#4a77c7', '#38539e', '#2b3874', '#211f52'),
  /** Dark rubber of gloves, legs and cables. */
  goma: r('#9da0bf', '#73769a', '#53557a', '#3b3c5f', '#2a2a48', '#1d1b35'),
  /** Pink plastic of the hair dryer (the starting weapon). */
  rosa: r('#ffe0e4', '#f7b2c0', '#e8869f', '#c3637f', '#8f4767', '#5c2f4f'),
  /** M14c (a4d2): the Móvil's «oro rosa» aluminium case: peach-pink lights, shadows to plum. */
  ororosa: r('#fde6e0', '#f9c6bb', '#eea89d', '#d8888a', '#b46c76', '#82496a', '#4f2f4f'),
  /** M14c (a4d2): a phone's black glass: a cold blue glint on top, the rest almost ink. */
  pantalla: r('#8fa6d6', '#5a6fa8', '#3a4a80', '#28325e', '#1d2244', '#161731'),
  /** Price stickers and warnings. */
  amarillo: r('#fff6c2', '#ffd95a', '#f2b233', '#cb7f2a', '#8e4e2a', '#5a2e2a'),
  /** Rust and dirt: never alone, always a few specks. */
  oxido: r('#f0aa6a', '#c8723e', '#94492f', '#62302a'),
  /** Brass of the plug's pins. */
  laton: r('#fff0a0', '#e0b84a', '#a87a2e', '#6c4a26'),
  /** Green of the A+++ labels and the screens: shadows to teal. */
  verde: r('#e4f7a8', '#a6e070', '#64b85a', '#3f8a52', '#2b5e4c', '#1f3a40'),
  /** M14c (a4c): berry-violet plastic of the Batidora de Vaso's motor: pink-warm lights, indigo shadows. */
  violeta: r('#f4e2ff', '#d3b2f5', '#ab86e3', '#8462c7', '#6146a1', '#45317c', '#2d2053'),
  /** M14c (a4c2): the Plancha de Vapor's teal plastic shell: mint-white lights, shadows to deep blue. */
  turquesa: r('#d2fff1', '#86e3cc', '#4dbaa8', '#33918d', '#256b74', '#1c4b5c', '#172f48'),
  /** M14c (a4c): glass (the blender's jar): almost white with a cold tint, the shadows to slate blue. */
  vidrio: r('#f6feff', '#d6eef2', '#aed2db', '#84abbe', '#5e7f9c', '#41587a', '#2c3657'),
  /** Ice and electric sparks: the lights go white, the shadows to deep blue. */
  cian: r('#f0ffff', '#b6f1f0', '#69dbd8', '#3aa3b0', '#2e6f8a', '#244a68'),
  /** Magenta foil of the sticker packets (M14c (a6b)): the glints go pink-white, the shadows plum. */
  fucsia: r('#ffe6f7', '#ffa8de', '#e86cc6', '#b8469f', '#86307f', '#5a215e', '#3a1842'),
  /** Painted tin of old wind-up toys (M14c (a6a)), a faded teal: shadows to slate blue. */
  hojalata: r('#eef8e6', '#b9dcc9', '#8dbcae', '#64968f', '#4a6e74', '#384a62', '#28304a'),
  /** M14c (a4d1): skin of the Becario Eterno (the only person): peach lights, shadows to rose and plum. */
  piel: r('#ffe9d2', '#f8c9a2', '#e2a07e', '#bf7768', '#8e5260', '#5c3651'),
  /** Cardboard boxes and briefcases: shadows to plum. */
  carton: r('#f1d9a8', '#d2ad78', '#a98258', '#7a5a40', '#523a34', '#35202e'),
  /** Cream enamel of old white goods (the microwave, M14c (a5)): warm lights, plum shadows. */
  crema: r('#fffbea', '#f3ead0', '#dccfab', '#b7a582', '#8a7563', '#5e4a55', '#3b2a45'),
  /** Seventies kitchen mint of the hand mixer (M14c (a5c)): shadows to teal and slate blue. */
  menta: r('#f1fbdc', '#cdebb4', '#a2d494', '#73b17c', '#4f8869', '#375e58', '#283c4a'),
  /** Computer beige of office printers (M14c (a5d)), yellowed by the window: greyer than `crema`. */
  beige: r('#f6f2e2', '#dfd9bf', '#c0b797', '#978d74', '#6d6560', '#48435a', '#2e2b42'),
  /**
   * M14c (a6e): the Dispensador de Turnos' red enamel: browner and darker than `rojo` (the enemy
   * bullets' red), so a ticket never hides on it; shadows to wine and plum.
   */
  granate: r('#f6b9a0', '#d9705c', '#b54a43', '#8e3540', '#66263e', '#431a35', '#2c1430'),
  /** M14c (a6d): varnished beech of office rubber stamps: honey lights, shadows to brown and plum. */
  haya: r('#ffe6b4', '#f2bf7c', '#d4914f', '#a8653a', '#76432f', '#4b2a2d', '#2f1b29'),
  /**
   * M14c (a6f2): the workshop's mustard paint (the Carretilla Elevadora): older and browner than
   * `amarillo` (the coupons' yellow), so a coupon never hides on it; shadows to brown and plum.
   */
  mostaza: r('#fbe9a8', '#e8c45e', '#c99c38', '#9c702b', '#6f4b2b', '#48302d', '#361a30'),
  /**
   * M14c (a7a): the Nevera Suprema's cold white enamel: a warm white only where the light hits,
   * then frosty blue-greys down to slate violet (colder than `crema`, the microwave's yellowed one).
   */
  esmalte: r('#fdfbf1', '#e3ebf2', '#bfcde0', '#93a3c4', '#6c76a2', '#4b4f7e', '#312c58'),
  /** Warehouse floor (plant 1): as dark as the old one so the bullets still read on it. */
  suelo: r('#5d6890', '#4b547d', '#40486e', '#373e60', '#2e3352', '#242843', '#1c1e35'),
} as const;

export type Material = keyof typeof MATERIALS;

/** Relative luminance (sRGB, 0–1). */
export function luminance(c: RGBA): number {
  const lin = (v: number): number => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}

/** Hue (0–360) and saturation (0–1, HSL) of a colour. */
export function hueSat(c: RGBA): { h: number; s: number; l: number } {
  const [R, G, B] = [c[0] / 255, c[1] / 255, c[2] / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

/** WCAG contrast ratio between two colours. */
export function contrast(a: RGBA, b: RGBA): number {
  const la = luminance(a) + 0.05;
  const lb = luminance(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

/** Mix two colours (t = 0 → a, t = 1 → b), opaque. */
export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t), 255];
}

/** 4×4 ordered (Bayer) dither threshold in [0, 1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function bayer(x: number, y: number): number {
  return (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;
}

/**
 * Pick a tone of a ramp for a light intensity in [0, 1] (1 = fully lit → tone 0). `dither`
 * (0–1) is how wide the ordered-dither band between two tones is: 0 gives hard bands.
 */
export function toneAt(R: Ramp6, light: number, x: number, y: number, dither = 0.4): number {
  const t = (1 - Math.max(0, Math.min(1, light))) * (R.length - 1);
  const v = t + (bayer(x, y) - 0.5) * dither;
  return Math.max(0, Math.min(R.length - 1, Math.round(v)));
}
