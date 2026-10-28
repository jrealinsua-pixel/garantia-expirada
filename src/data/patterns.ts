// Named bullet patterns used by enemies and bosses. Geometry: src/sim/patterns.ts.
import type { PatternDef } from '../sim/patterns.ts';

export const PATTERNS: Record<string, PatternDef> = {
  // Microondas Sin Seguro: two rings, the second offset so the gaps do not line up.
  'microondas-anillos': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 12, speed: 70, color: 'red' } },
      { at: 0.35, pattern: { kind: 'ring', count: 18, speed: 55, offsetDeg: 10, color: 'red' } },
    ],
  },
  // Bombilla de Bajo Consumo: slow three-armed spiral of sparks.
  'bombilla-espiral': { kind: 'spiral', arms: 3, steps: 14, stepDeg: 13, interval: 0.09, speed: 65, color: 'cyan' },
  // Mando a Distancia: a short aimed burst of «infrared» (it is red, so you can see it).
  'mando-zapeo': { kind: 'burst', count: 3, interval: 0.1, jitterDeg: 3, speed: 115, color: 'red' },
  // Generic aimed fan, for the weaker enemies.
  'abanico-3': { kind: 'fan', count: 3, spreadDeg: 30, speed: 90, color: 'red' },
  // Aimed burst with a little spread.
  'rafaga-5': { kind: 'burst', count: 5, interval: 0.12, jitterDeg: 6, speed: 120, color: 'red' },
  // Wavy ring: bullets snake as they travel.
  'onda-anillo': { kind: 'ring', count: 10, speed: 60, aimed: true, wave: { amp: 8, freq: 2 }, color: 'cyan' },
};
