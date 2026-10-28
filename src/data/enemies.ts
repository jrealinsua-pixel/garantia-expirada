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
};
