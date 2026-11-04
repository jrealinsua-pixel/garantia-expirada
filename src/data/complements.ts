import type { StatKey } from './types.ts';

/**
 * Indirect synergies (M9b (14), nota del humano del 2026-10-30): pairs of passive items that work
 * much better together than apart, but switch nothing on. No name on screen, no extra modifier:
 * each item keeps doing exactly what it says, and the pair is simply a good idea. Two kinds:
 *
 * - «tapa»: one item covers the other's drawback (`stat` is the number the first item makes
 *   worse and the second gives back, so the pair keeps the good part of both).
 * - «multiplica»: one item makes the other's virtue bigger. The card's homing starts again every
 *   time a bullet bounces or goes through an enemy (src/sim/world.ts), so it feeds on the manual
 *   and the drill; a short magazine
 *   reloads more often, so a faster reload is worth more with it.
 *   (The plane mode with the contract was tried: more rolls, but the heart the contract takes
 *   costs the bot more than the rolls give.)
 *
 * Measured in tests/complementos.test.ts (each pair beats the two items apart) and with the bot in
 * `npm run objetos -- --parejas`. A pair is never also a synergy (src/data/synergies.ts).
 * `why` is a design note in the game's voice, ready for the glossary (M14).
 */
export interface ComplementDef {
  items: readonly [string, string];
  kind: 'tapa' | 'multiplica';
  /** For «tapa»: the number items[0] makes worse and items[1] gives back. */
  stat?: StatKey;
  why: string;
}

export const COMPLEMENTS: readonly ComplementDef[] = [
  {
    items: ['tarjeta', 'manual'],
    kind: 'multiplica',
    why: 'Cada rebote, la tarjeta vuelve a buscar cliente. El manual no explica por qué; la tarjeta no pregunta.',
  },
  {
    items: ['tarjeta', 'broca'],
    kind: 'multiplica',
    why: 'Atraviesa a uno y la tarjeta ya está buscando al siguiente. Fidelización de verdad.',
  },
  {
    items: ['pila', 'cinta'],
    kind: 'multiplica',
    why: 'La pila se acaba antes, así que se recarga más: con cinta, recargar casi no cuesta.',
  },
  {
    items: ['pila', 'usb'],
    kind: 'tapa',
    stat: 'magazine',
    why: 'El pendrive guarda lo que la pila gasta. Copiarlo sigue tardando una tarde.',
  },
  {
    items: ['actualizacion', 'cinta'],
    kind: 'tapa',
    stat: 'reloadTime',
    why: 'La actualización reinicia en cada recarga; la cinta sujeta el botón de apagado.',
  },
  {
    items: ['resistencia', 'pila'],
    kind: 'tapa',
    stat: 'fireRate',
    why: 'La resistencia calienta y frena; la pila empuja. Mientras dure.',
  },
  {
    items: ['ventilador', 'hdmi'],
    kind: 'tapa',
    stat: 'spreadDeg',
    why: 'El ventilador lo esparce todo; el cable dorado lo pone en fila. Por fin algo que hace.',
  },
  {
    items: ['hinchada', 'garantia'],
    kind: 'tapa',
    stat: 'maxHp',
    why: 'La garantía no cubre baterías hinchadas, pero el corazón que te da no lo sabe.',
  },
  {
    items: ['bateria', 'etiqueta'],
    kind: 'tapa',
    stat: 'speed',
    why: 'El ladrillo pesa menos con la etiqueta de eficiencia. Psicológicamente.',
  },
  {
    items: ['avion', 'etiqueta'],
    kind: 'tapa',
    stat: 'rollCooldown',
    why: 'El modo avión corta todo lo que tocas rodando; la etiqueta te deja rodar casi tan a menudo como antes.',
  },
];
