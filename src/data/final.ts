// The true ending (M12 (5)): what happens after the Trituradora falls. The toaster does not leave by
// any door: the belt takes it, it is washed, its heating element is swapped, it is boxed as
// «Reacondicionado. Como nuevo.» and it ends up on a shelf of floor 1, at the price of a new one.
// The player was the product. Then the credits. The scene that plays it is src/render/FinalScene.ts.
import { CHARACTERS } from './characters.ts';
import { ENEMIES } from './enemies.ts';

export type EndingShotId = 'cinta' | 'limpieza' | 'resistencia' | 'caja' | 'estanteria';

export interface EndingShot {
  id: EndingShotId;
  /** The workshop's process sheet: the step, as it is written on the work order. */
  step: string;
  /** What it says under the picture. */
  caption: string;
  /** How long it lasts (s). */
  seconds: number;
}

/** The shots, in order. */
export const ENDING_SHOTS: readonly EndingShot[] = [
  { id: 'cinta', step: 'Paso 1 · Recepción', caption: 'Producto recibido. Diagnóstico: reacondicionable.', seconds: 5.5 },
  { id: 'limpieza', step: 'Paso 2 · Limpieza', caption: 'Limpieza exterior. Lo de dentro no sale en las fotos.', seconds: 4.8 },
  { id: 'resistencia', step: 'Paso 3 · Reparación', caption: 'Se sustituye la resistencia por otra de igual o menor calidad.', seconds: 5.6 },
  { id: 'caja', step: 'Paso 4 · Embalaje', caption: 'Embalaje original. Bueno: una caja.', seconds: 5.6 },
  { id: 'estanteria', step: 'Planta 1 · Pequeño electrodoméstico', caption: 'Reacondicionado. Como nuevo. A precio de nuevo.', seconds: 8 },
];

/** Total length of the shots (s), before the credits. */
export const ENDING_SECONDS = ENDING_SHOTS.reduce((s, x) => s + x.seconds, 0);

/** The last line, alone on the screen over the box on the shelf. */
export const ENDING_LAST_LINE = 'El producto era usted.';

/** The sticker on the box. */
export const ENDING_STICKER = ['REACONDICIONADO', 'Como nuevo'] as const;

/** The price tag on the shelf: the price of a new one, in Liquidación yellow. */
export const ENDING_PRICE = '49,99 €';
export const ENDING_PRICE_NOTE = 'PVP de nuevo';
/** The shelf's header card. */
export const ENDING_SHELF_CARD = 'REACONDICIONADOS';

/**
 * The warranty printed on the box. Every time the same product comes back, it gets a shorter one,
 * until it lasts exactly what the first one did (the title screen's «Duró hasta el martes»).
 * `times`: how many times the true ending had been seen before this one (0 the first).
 */
const WARRANTIES = ['6 meses', '3 meses', '6 semanas', '3 semanas', '10 días', '5 días', '2 días', 'hasta el martes'] as const;
export function endingWarranty(times: number): string {
  const i = Math.max(0, Math.min(WARRANTIES.length - 1, Math.floor(times)));
  return `Garantía: ${WARRANTIES[i]}`;
}

/**
 * Each character's own ending (M13 (7b), «Los cinco, en detalle» in docs/DISENO.md): what the
 * workshop repairs (the caption of step 3), the extra label slapped on the box next to the
 * sticker, what the shelf says, its header card and the price tag. The last line is the same for
 * everyone: they were all the product.
 */
export interface CharacterEnding {
  repair: string;
  /** A yellow label on the box, beside the «Reacondicionado» sticker. Empty: none. */
  label: string;
  shelf: string;
  shelfCard: string;
  price: string;
  priceNote: string;
}

export const ENDINGS: Record<string, CharacterEnding> = {
  tostadora: {
    repair: 'Se sustituye la resistencia por otra de igual o menor calidad.',
    label: '',
    shelf: 'Reacondicionado. Como nuevo. A precio de nuevo.',
    shelfCard: ENDING_SHELF_CARD,
    price: ENDING_PRICE,
    priceNote: ENDING_PRICE_NOTE,
  },
  'batidora-vaso': {
    repair: 'Se afilan las cuchillas. El batido verde del fondo se queda: es de serie.',
    label: 'Recetario de regalo',
    shelf: 'Con recetario de regalo. Para que esta vez sí.',
    shelfCard: 'VIDA SANA',
    price: '79,99 €',
    priceNote: 'PVP de nuevo',
  },
  plancha: {
    repair: 'Se rasca el cuello de camisa de la suela. Casi todo.',
    label: 'Pack Vuelta al Cole',
    shelf: 'Pack «Vuelta al Cole»: con una tabla de planchar que cojea.',
    shelfCard: 'VUELTA AL COLE',
    price: '34,99 €',
    priceNote: 'Pack ahorro',
  },
  becario: {
    repair: 'Se le renueva el contrato en prácticas. Seis meses. Otra vez.',
    label: 'Prácticas: 6 meses',
    shelf: 'Becario reacondicionado. Con experiencia. No cobra.',
    shelfCard: 'MATERIAL OFICINA',
    price: '0,00 €',
    priceNote: 'Sin remunerar',
  },
  movil: {
    repair: 'Se cambia la batería por otra al 1 %. Las fotos no vuelven.',
    label: 'Funda con purpurina',
    shelf: 'Como nuevo. Batería al 1 %. Funda con purpurina de regalo.',
    shelfCard: ENDING_SHELF_CARD,
    price: '599,99 €',
    priceNote: 'PVP de nuevo',
  },
};

/** The ending of `id` (the toaster's for anyone without one). */
export function endingFor(id: string): CharacterEnding {
  return ENDINGS[id] ?? ENDINGS['tostadora']!;
}

/** The caption of a shot for `id`: the repair and the shelf are each one's own. */
export function shotCaption(shot: EndingShot, id: string): string {
  const e = endingFor(id);
  if (shot.id === 'resistencia') return e.repair;
  if (shot.id === 'estanteria') return e.shelf;
  return shot.caption;
}

/** Hint at the bottom while it plays. */
export const ENDING_SKIP = 'Disparar: saltar';
/** After the credits. */
export const ENDING_THANKS = 'Gracias por su compra.';
export const ENDING_BACK = 'Disparar: volver al menú';

/** A line of the credits roll: a heading, a name under it, a joke on its own, or a gap. */
export type CreditLine = { kind: 'title' | 'heading' | 'name' | 'note'; text: string } | { kind: 'gap' };

/** The bosses, in the order they are met (floor 1 to the Servicio Técnico). */
const BOSS_ORDER = ['nevera-suprema', 'lavadora-eco', 'router-wifi', 'muneco-moda', 'director-rrhh', 'centralita', 'trituradora'] as const;

/**
 * The credits roll, after the ending. `engine` is the engine's line (the scene adds it: data files
 * may not name it). Everyone who played a part gets their line: the products the player can be,
 * the bosses in order and the rest of the cast as they appear in the store's catalogue.
 */
export function endingCredits(engine: string): CreditLine[] {
  const gap: CreditLine = { kind: 'gap' };
  const out: CreditLine[] = [
    { kind: 'title', text: 'Garantía Expirada' },
    { kind: 'note', text: 'Un producto de Megamarket Outlet. Sin garantía.' },
    gap,
    { kind: 'heading', text: 'Programación, arte, sonido y textos' },
    { kind: 'name', text: 'Claude (Anthropic)' },
    gap,
    { kind: 'heading', text: 'Idea, partidas de prueba y notas al margen' },
    { kind: 'name', text: 'j' },
    gap,
    { kind: 'heading', text: 'Motor' },
    { kind: 'name', text: engine },
    gap,
    { kind: 'heading', text: 'En el papel del producto' },
    ...Object.values(CHARACTERS).map((c): CreditLine => ({ kind: 'name', text: c.name })),
    gap,
    { kind: 'heading', text: 'Jefes de planta' },
  ];
  for (const id of BOSS_ORDER) {
    const d = ENEMIES[id];
    if (d?.boss) out.push({ kind: 'name', text: d.boss.title });
  }
  out.push(gap, { kind: 'heading', text: 'Con la participación de' });
  for (const d of Object.values(ENEMIES)) if (!d.boss) out.push({ kind: 'name', text: d.name });
  out.push(
    gap,
    { kind: 'heading', text: 'Atención al cliente' },
    { kind: 'name', text: 'Todos nuestros operadores están ocupados' },
    gap,
    { kind: 'heading', text: 'Departamento de garantías' },
    { kind: 'name', text: 'Cerrado por inventario' },
    gap,
    { kind: 'heading', text: 'Control de calidad' },
    { kind: 'name', text: 'APTO (sin mirar)' },
    gap,
    { kind: 'note', text: 'Todo lo demás se ha hecho a mano, en código, dentro del proyecto.' },
    { kind: 'note', text: 'Ningún electrodoméstico fue reparado durante el desarrollo.' },
    { kind: 'note', text: 'Varios fueron reacondicionados.' },
  );
  return out;
}

/** Which shot is on at `t` seconds from the start, and how far into it; null once they are over. */
export function endingShotAt(t: number): { shot: EndingShot; index: number; t: number } | null {
  let start = 0;
  for (let i = 0; i < ENDING_SHOTS.length; i++) {
    const shot = ENDING_SHOTS[i]!;
    if (t < start + shot.seconds) return { shot, index: i, t: Math.max(0, t - start) };
    start += shot.seconds;
  }
  return null;
}
