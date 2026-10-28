// Enemies are data: stats plus a «brain» (behaviour and its numbers). Behaviours live in
// src/sim/enemies.ts.
import type { EnemyDef } from './types.ts';

export const ENEMIES: Record<string, EnemyDef> = {
  aspirador: {
    id: 'aspirador',
    name: 'Aspirador Desahuciado',
    description: 'Lo devolvieron con la bolsa llena y la etiqueta del -70 % puesta. Desde entonces solo sabe ir en línea recta.',
    hp: 14,
    sprite: 'aspirador',
    anchor: { x: 14, y: 32 },
    hurt: { x: -10, y: -28, w: 20, h: 26 },
    footRadius: 6,
    contactPush: 230,
    knockbackScale: 0.5,
    brain: {
      kind: 'charger',
      walkSpeed: 28,
      range: 190,
      walkTime: [0.8, 1.6],
      telegraph: 0.55,
      chargeSpeed: 230,
      chargeTime: 0.7,
      brake: 650,
      recover: 0.5,
      stun: 1.1,
    },
  },
  microondas: {
    id: 'microondas',
    name: 'Microondas Sin Seguro',
    description: 'Su reloj marca las 12:00 desde hace diez años. Lo que calienta por fuera sigue frío por dentro.',
    hp: 18,
    sprite: 'microondas',
    anchor: { x: 15, y: 35 },
    hurt: { x: -12, y: -28, w: 25, h: 27 },
    footRadius: 7,
    contactPush: 120,
    knockbackScale: 0,
    brain: {
      kind: 'turret',
      range: 260,
      interval: [1.6, 2.6],
      // «Calienta» un segundo entero, como dice el diseño: es lento pero llena la sala.
      telegraph: 1,
      pattern: 'microondas-anillos',
      muzzleY: 17,
    },
  },
};
