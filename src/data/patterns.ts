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
  // Sobre Sorpresa: short fans of gift-wrap confetti (they flutter and die out in a couple of metres).
  'sobre-confeti': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 5, spreadDeg: 70, speed: 120, accel: -90, life: 1.1, color: 'confetti' } },
      { at: 0.18, pattern: { kind: 'fan', count: 4, spreadDeg: 50, speed: 110, accel: -90, life: 1.1, color: 'confetti' } },
    ],
  },
  // Muñequito Dorado Ultrarraro: rings of golden confetti, the second one turned to fill the gaps.
  'dorado-anillos': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 10, speed: 85, color: 'confetti' } },
      { at: 0.3, pattern: { kind: 'ring', count: 10, speed: 85, offsetDeg: 18, color: 'confetti' } },
    ],
  },
  // Robot de Cuerda: on every bounce, a fan of three nuts at you.
  // The shredder gives back what it was fed from the front: five strips of paper.
  // The photocopier with nobody to copy prints three sheets at you.
  // The DENEGADO stamp coming down: a short ring of eight drops of ink splashing out.
  'sello-gotas': { kind: 'ring', count: 8, speed: 95, life: 0.75, color: 'ink' },
  'fotocopiadora-folios': { kind: 'fan', count: 3, spreadDeg: 34, speed: 100, color: 'sheet' },
  'destructora-tiras': { kind: 'fan', count: 5, spreadDeg: 50, speed: 115, color: 'strip' },
  'robot-tuercas': { kind: 'fan', count: 3, spreadDeg: 30, speed: 105, color: 'nut' },
  // El Router del Wifi. «Cobertura total»: two rings of waves, each with a hole that has moved on a little.
  'router-cobertura': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 24, speed: 72, color: 'cyan', gaps: { widthDeg: 60, atDeg: [35] } } },
      { at: 0.45, pattern: { kind: 'ring', count: 24, speed: 72, color: 'cyan', gaps: { widthDeg: 60, atDeg: [65] } } },
    ],
  },
  // Packets from the antennas: three quick fans.
  'router-paquetes': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 5, spreadDeg: 50, speed: 125, color: 'red' } },
      { at: 0.2, pattern: { kind: 'fan', count: 5, spreadDeg: 50, speed: 125, color: 'red' }, turnDeg: 8 },
      { at: 0.4, pattern: { kind: 'fan', count: 5, spreadDeg: 50, speed: 125, color: 'red' }, turnDeg: -8 },
    ],
  },
  // «Actualización de firmware»: three faster rings with two holes moving apart, each its own way.
  'router-firmware': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 28, speed: 88, color: 'cyan', gaps: { widthDeg: 48, atDeg: [30, -30] } } },
      { at: 0.38, pattern: { kind: 'ring', count: 28, speed: 88, color: 'cyan', gaps: { widthDeg: 48, atDeg: [60, -60] } } },
      { at: 0.76, pattern: { kind: 'ring', count: 28, speed: 88, color: 'cyan', gaps: { widthDeg: 48, atDeg: [90, -90] } } },
    ],
  },
  'router-paquetes-2': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 7, spreadDeg: 60, speed: 140, color: 'red' } },
      { at: 0.18, pattern: { kind: 'fan', count: 7, spreadDeg: 60, speed: 140, color: 'red' }, turnDeg: 6 },
      { at: 0.36, pattern: { kind: 'fan', count: 7, spreadDeg: 60, speed: 140, color: 'red' }, turnDeg: -6 },
    ],
  },
  // A repeater passes the wave on: one thin ring, with a wide hole towards where you are not.
  'repetidor-onda': { kind: 'ring', count: 12, speed: 64, color: 'cyan', gaps: { widthDeg: 80, atDeg: [40] } },
  // A dropped connection bursts out of the floor: a short ring.
  'router-caida': { kind: 'ring', count: 8, speed: 72, life: 0.7, color: 'cyan' },
  // El Muñeco de Moda (M10 5b). «Lanzamiento»: the season's accessories, three fans of pink shoes
  // and handbags, the outer ones turned so there is a gap to step into.
  'muneco-accesorios': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 5, spreadDeg: 56, speed: 112, color: 'accessory' }, turnDeg: -10 },
      { at: 0.28, pattern: { kind: 'fan', count: 7, spreadDeg: 70, speed: 108, color: 'accessory' } },
      { at: 0.56, pattern: { kind: 'fan', count: 5, spreadDeg: 56, speed: 112, color: 'accessory' }, turnDeg: 10 },
    ],
  },
  // A camera flash left on the catwalk goes off: a short ring of sparks (the photo is never good).
  'muneco-flash': { kind: 'ring', count: 6, speed: 62, life: 0.95, color: 'red' },
  // «Rebajas»: rings of accessories with a hole, denser with every discount, the hole a bit further round each time.
  'muneco-rebaja-30': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 16, speed: 74, color: 'accessory', gaps: { widthDeg: 56, atDeg: [20] } } },
      { at: 0.42, pattern: { kind: 'ring', count: 16, speed: 74, color: 'accessory', gaps: { widthDeg: 56, atDeg: [50] } } },
    ],
  },
  'muneco-rebaja-50': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 20, speed: 80, color: 'accessory', gaps: { widthDeg: 50, atDeg: [20] } } },
      { at: 0.38, pattern: { kind: 'ring', count: 20, speed: 80, color: 'accessory', gaps: { widthDeg: 50, atDeg: [50] } } },
      { at: 0.76, pattern: { kind: 'ring', count: 20, speed: 80, color: 'accessory', gaps: { widthDeg: 50, atDeg: [80] } } },
    ],
  },
  'muneco-rebaja-70': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'ring', count: 26, speed: 86, color: 'accessory', gaps: { widthDeg: 46, atDeg: [20, -160] } } },
      { at: 0.34, pattern: { kind: 'ring', count: 26, speed: 86, color: 'accessory', gaps: { widthDeg: 46, atDeg: [50, -130] } } },
      { at: 0.68, pattern: { kind: 'ring', count: 26, speed: 86, color: 'accessory', gaps: { widthDeg: 46, atDeg: [80, -100] } } },
    ],
  },
  // In the sales the accessories come faster and wider.
  'muneco-accesorios-2': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 6, spreadDeg: 66, speed: 124, color: 'accessory' }, turnDeg: -8 },
      { at: 0.22, pattern: { kind: 'fan', count: 6, spreadDeg: 66, speed: 118, color: 'accessory' }, turnDeg: 8 },
      { at: 0.44, pattern: { kind: 'fan', count: 6, spreadDeg: 66, speed: 124, color: 'accessory' } },
    ],
  },
  // Phase 3, «Fin de existencias» (M10 5c): out of its box it spins on the spot and the sale
  // stickers peel off in spirals that bend a little towards you for their first moment (slower
  // than you, and they turn wide: a sidestep shakes them off). The second has two arms each way.
  'muneco-pegatinas': {
    kind: 'spiral', arms: 4, steps: 16, stepDeg: 13, interval: 0.085, speed: 78,
    homing: { turnDeg: 50, time: 0.9 }, color: 'sticker',
  },
  'muneco-pegatinas-2': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'spiral', arms: 2, steps: 16, stepDeg: 16, interval: 0.08, speed: 80, homing: { turnDeg: 45, time: 0.8 }, color: 'sticker' } },
      { at: 0, pattern: { kind: 'spiral', arms: 2, steps: 16, stepDeg: -16, interval: 0.08, speed: 80, offsetDeg: 90, homing: { turnDeg: 45, time: 0.8 }, color: 'sticker' } },
    ],
  },
  // Out of the box the accessories still come, fewer and quicker.
  'muneco-accesorios-3': {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 5, spreadDeg: 60, speed: 132, color: 'accessory' }, turnDeg: -7 },
      { at: 0.2, pattern: { kind: 'fan', count: 5, spreadDeg: 60, speed: 132, color: 'accessory' }, turnDeg: 7 },
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
