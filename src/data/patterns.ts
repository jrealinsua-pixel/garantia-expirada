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
  // La Nevera Suprema, phase 1. The ice dispenser: three fans of cubes, the middle one aimed and
  // the others turned a little, so there is always a gap to step into.
  'nevera-cubitos': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 5, spreadDeg: 44, speed: 105, color: 'ice' }, turnDeg: -9 },
      { at: 0.3, pattern: { kind: 'fan', count: 5, spreadDeg: 44, speed: 105, color: 'ice' } },
      { at: 0.6, pattern: { kind: 'fan', count: 5, spreadDeg: 44, speed: 105, color: 'ice' }, turnDeg: 9 },
    ],
  },
  // «Granizo»: two slow rings of cubes that speed up, the second offset to close the gaps.
  'nevera-granizo': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 16, speed: 38, accel: 55, maxSpeed: 95, color: 'ice' } },
      { at: 0.45, pattern: { kind: 'ring', count: 16, speed: 38, accel: 55, maxSpeed: 95, offsetDeg: 11.25, color: 'ice' } },
    ],
  },
  // Phase 2, «Oferta irrechazable»: loyalty cards that follow you for a while (slower than you, and
  // they turn wide, so a sidestep or a roll shakes them off) and can be shot down.
  'nevera-tarjetas': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 3, spreadDeg: 110, speed: 72, homing: { turnDeg: 75, time: 2.2 }, shootable: true, life: 4.5, color: 'card' } },
      { at: 0.55, pattern: { kind: 'fan', count: 2, spreadDeg: 150, speed: 72, homing: { turnDeg: 75, time: 2.2 }, shootable: true, life: 4.5, color: 'card' } },
    ],
  },
  // Impresora que se Atasca: a stream of invoices, fluttering from side to side as they fly.
  'impresora-facturas': { kind: 'burst', count: 6, interval: 0.13, jitterDeg: 5, speed: 112, wave: { amp: 6, freq: 1.6 }, color: 'invoice' },
  // Clearing the jam: two rings of crumpled paper, the second offset so the gaps close.
  'impresora-atasco': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 12, speed: 95, color: 'red' } },
      { at: 0.25, pattern: { kind: 'ring', count: 12, speed: 75, offsetDeg: 15, color: 'invoice' } },
    ],
  },
  // Cargador Falso: a shock all round it, short-lived sparks (you get out of reach or roll).
  'cargador-calambre': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 10, speed: 140, life: 0.45, color: 'cyan' } },
      { at: 0.12, pattern: { kind: 'ring', count: 10, speed: 110, life: 0.45, offsetDeg: 18, color: 'cyan' } },
    ],
  },
  // Ratón Inalámbrico sin Pilas: where it turns up, a click all round (a ring with a gap-free twin).
  'raton-clic': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 8, speed: 82, color: 'red' } },
      { at: 0.2, pattern: { kind: 'ring', count: 8, speed: 64, offsetDeg: 22.5, color: 'red' } },
    ],
  },
  // Webcam Siempre Encendida: the photo it takes once it has shared its screen, a tight aimed fan.
  'webcam-flash': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 5, spreadDeg: 40, speed: 130, color: 'red' } },
      { at: 0.15, pattern: { kind: 'fan', count: 4, spreadDeg: 30, speed: 105, color: 'red' } },
    ],
  },
  // An expired product bursts where it lands.
  'caducado-reventon': { kind: 'ring', count: 6, speed: 50, color: 'red' },
  // A frost ball shatters where it lands: a few slow splinters.
  'escarcha-esquirlas': { kind: 'ring', count: 6, speed: 52, offsetDeg: 30, color: 'ice' },
  // Generic aimed fan, for the weaker enemies.
  'abanico-3': { kind: 'fan', count: 3, spreadDeg: 30, speed: 90, color: 'red' },
  // Aimed burst with a little spread.
  'rafaga-5': { kind: 'burst', count: 5, interval: 0.12, jitterDeg: 6, speed: 120, color: 'red' },
  // Wavy ring: bullets snake as they travel.
  'onda-anillo': { kind: 'ring', count: 10, speed: 60, aimed: true, wave: { amp: 8, freq: 2 }, color: 'cyan' },
};
