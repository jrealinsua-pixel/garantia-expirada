// Enemies are data: stats plus a «brain» (behaviour and its numbers). Behaviours live in
// src/sim/enemies.ts.
import type { EnemyDef } from './types.ts';

/** Kinds of building piece a bucket throws (frames of the `pieza` sheet). */
export const BRICK_KINDS = 4;

export const ENEMIES: Record<string, EnemyDef> = {
  aspirador: {
    id: 'aspirador',
    name: 'Aspirador Desahuciado',
    description: 'Lo devolvieron con la bolsa llena y la etiqueta del -70 % puesta. Desde entonces solo sabe ir en línea recta.',
    hp: 6,
    sprite: 'aspirador',
    anchor: { x: 14, y: 32 },
    hurt: { x: -14, y: -30, w: 28, h: 30 },
    footRadius: 6,
    contactPush: 230,
    contactDamage: 1,
    knockbackScale: 0.5,
    loot: { coupons: [0, 1] },
    // 0-1 breathing, 2-5 rolling along on its wheeled shoes.
    anim: { idle: [0, 1], idleMs: 420, walk: [2, 3, 4, 5], stepPx: 5 },
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
      // M14b (h9a): it does not stop at the wall, it bounces off it (twice) and keeps going.
      rebound: 2,
      reboundTime: 0.35,
    },
  },
  microondas: {
    id: 'microondas',
    name: 'Microondas Sin Seguro',
    description: 'Su reloj marca las 12:00 desde hace diez años. Lo que calienta por fuera sigue frío por dentro.',
    hp: 8,
    sprite: 'microondas',
    anchor: { x: 15, y: 35 },
    hurt: { x: -13, y: -31, w: 26, h: 30 },
    footRadius: 7,
    contactPush: 120,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [0, 1] },
    anim: { idle: [0, 1], idleMs: 480 },
    brain: {
      kind: 'turret',
      range: 260,
      interval: [1.3, 2.1],
      // «Calienta» un segundo entero, como dice el diseño: es lento pero llena la sala.
      telegraph: 1,
      pattern: 'microondas-anillos',
      muzzleY: 17,
      // M14b (h9c): it goes where your reflection in its glass door would be, and stops to heat up.
      mirror: { speed: 40 },
    },
  },
  bombilla: {
    id: 'bombilla',
    name: 'Bombilla de Bajo Consumo',
    description: 'Mando intermedio. Tarda en encenderse y, cuando se enciende, gasta poco y rinde menos.',
    hp: 12,
    sprite: 'bombilla',
    anchor: { x: 16, y: 35 },
    hurt: { x: -13, y: -31, w: 26, h: 30 },
    footRadius: 6,
    contactPush: 140,
    contactDamage: 1,
    knockbackScale: 0.25,
    loot: { coupons: [0, 2] },
    escort: 'polilla',
    // 0 lit, 1 off (switching on), 2 lit breathing out, 3-6 walking.
    anim: { idle: [0, 2], idleMs: 440, walk: [3, 4, 5, 6], stepPx: 5, off: 1 },
    brain: {
      kind: 'turret',
      range: 280,
      interval: [2.2, 3.2],
      // Like the real thing, it takes its time to light up: a long, flickering warning.
      telegraph: 1.2,
      pattern: 'bombilla-espiral',
      muzzleY: 23,
      startup: 1.8,
      // M14b (h9a): it drifts across the room bouncing off the walls like a screensaver, its
      // moths round it, and never stops: not even to light up.
      drift: { speed: 26 },
    },
  },
  polilla: {
    id: 'polilla',
    name: 'Polilla Fiel',
    description: 'Lleva toda la vida dando vueltas alrededor de la misma bombilla. Lo llama lealtad; la bombilla lo llama «compromiso con la empresa».',
    hp: 2,
    sprite: 'polilla',
    anchor: { x: 5, y: 8 },
    // It flies `altitude` px above its shadow: the hit box is up there.
    hurt: { x: -5, y: -21, w: 10, h: 9 },
    footRadius: 3,
    contactPush: 150,
    contactDamage: 1,
    knockbackScale: 1.2,
    loot: { coupons: [0, 1] },
    anim: { idle: [0, 1], idleMs: 70, busyMs: 35 },
    brain: {
      kind: 'moth',
      orbitRadius: 26,
      orbitSpeed: 2.6,
      flySpeed: 130,
      range: 150,
      interval: [2.5, 4.5],
      telegraph: 0.4,
      dartSpeed: 190,
      dartTime: 0.45,
      altitude: 14,
    },
  },
  batidora: {
    id: 'batidora',
    name: 'Batidora de Mano',
    description: 'Cinco velocidades: la uno y el turbo. Las varillas no se lavan desde la última tarta de cumpleaños.',
    hp: 5,
    sprite: 'batidora',
    anchor: { x: 15, y: 35 },
    hurt: { x: -12, y: -31, w: 24, h: 29 },
    footRadius: 6,
    contactPush: 200,
    contactDamage: 1,
    knockbackScale: 0.8,
    loot: { coupons: [0, 1] },
    // 0-3 standing with the beaters turning (flat out while it winds up), 4-7 running.
    anim: { idle: [0, 1, 2, 3], idleMs: 90, busyMs: 30, walk: [4, 5, 6, 7], stepPx: 5 },
    brain: {
      kind: 'chaser',
      walkSpeed: 52,
      range: 64,
      cooldown: [0.9, 1.5],
      telegraph: 0.4,
      lungeSpeed: 240,
      lungeTime: 0.22,
      recover: 0.45,
      brake: 700,
      // At a third of its life left, the slider finally moves: TURBO.
      turbo: { below: 0.34, scale: 1.45 },
      // M14b (h9a): three lunges in a row, each re-aimed (speeds one, two and three).
      chain: 3,
      chainTelegraph: 0.2,
    },
  },
  mando: {
    id: 'mando',
    name: 'Mando a Distancia',
    description: 'Vive entre los cojines del sofá y nunca está donde lo buscas. Le faltan la tapa de las pilas y el botón del uno.',
    hp: 2,
    sprite: 'mando',
    anchor: { x: 11, y: 32 },
    hurt: { x: -8, y: -28, w: 16, h: 26 },
    footRadius: 5,
    contactPush: 110,
    contactDamage: 1,
    knockbackScale: 1,
    loot: { coupons: [0, 1] },
    pack: 3,
    // 0-1 breathing, 2-5 shuffling round you in its slippers.
    anim: { idle: [0, 1], idleMs: 380, walk: [2, 3, 4, 5], stepPx: 4 },
    brain: {
      kind: 'blinker',
      walkSpeed: 34,
      keep: 110,
      range: 240,
      interval: [1.6, 2.8],
      telegraph: 0.6,
      pattern: 'mando-zapeo',
      muzzleY: 24,
      vanish: 0.25,
      gone: 0.45,
      hop: [70, 140],
      hitBlinkCooldown: 2.5,
    },
  },
  // ---- Floor 2 (Informática) ----
  impresora: {
    id: 'impresora',
    name: 'Impresora que se Atasca',
    description: 'Imprime facturas a quien pasa por delante. Cada pocas hojas se atasca, y nadie sabe abrir la tapa de atrás.',
    hp: 9,
    sprite: 'impresora',
    anchor: { x: 17, y: 32 },
    hurt: { x: -14, y: -28, w: 28, h: 26 },
    footRadius: 7,
    contactPush: 140,
    contactDamage: 1,
    knockbackScale: 0.2,
    loot: { coupons: [0, 1] },
    // 0-1 humming, 2-5 a heavy shuffle, 6-7 shaking with the paper jammed.
    anim: { idle: [0, 1], idleMs: 300, walk: [2, 3, 4, 5], stepPx: 5, jam: [6, 7], jamMs: 60 },
    brain: {
      kind: 'turret',
      range: 250,
      interval: [1.1, 1.8],
      telegraph: 0.6,
      pattern: 'impresora-facturas',
      muzzleY: 14,
      // M14b (h9b): side to side like a print head on its rail, and it stops to print.
      carriage: { speed: 30 },
      // Two or three volleys, then a jam: 2 s standing still (go for it), and it clears with a burst.
      jam: { after: [2, 3], time: 2, pattern: 'impresora-atasco', telegraph: 0.7 },
    },
  },
  cargador: {
    id: 'cargador',
    name: 'Cargador Falso',
    description: 'Compatible con todos los modelos según la caja, que también era falsa. Lleva una etiqueta de GRATIS para que lo cojas.',
    hp: 4,
    sprite: 'cargador',
    anchor: { x: 11, y: 26 },
    hurt: { x: -9, y: -21, w: 18, h: 19 },
    footRadius: 5,
    contactPush: 160,
    contactDamage: 1,
    knockbackScale: 0.9,
    loot: { coupons: [0, 1] },
    pack: 2,
    // 0-1 humming, 2-5 scuttling, 6 lying on the floor as bait, 7 jumping up when found out.
    anim: { idle: [0, 1], idleMs: 160, walk: [2, 3, 4, 5], stepPx: 3, lurk: 6, reveal: 7 },
    brain: {
      kind: 'mimic',
      wake: 64,
      patience: [7, 11],
      alone: 1.2,
      reveal: 0.5,
      walkSpeed: 72,
      range: 50,
      telegraph: 0.45,
      pattern: 'cargador-calambre',
      muzzleY: 10,
      cooldown: [1.0, 1.6],
    },
  },
  'raton-inalambrico': {
    id: 'raton-inalambrico',
    name: 'Ratón Inalámbrico sin Pilas',
    description: 'Se queda congelado, se lo piensa y aparece donde no estaba. Lleva tres años pidiendo pilas por Bluetooth.',
    hp: 4,
    sprite: 'raton-inalambrico',
    anchor: { x: 13, y: 26 },
    hurt: { x: -11, y: -21, w: 22, h: 19 },
    footRadius: 6,
    contactPush: 150,
    contactDamage: 1,
    knockbackScale: 0.7,
    loot: { coupons: [0, 1] },
    // 0-1 breathing, 2-5 gliding on its pads, 6 frozen without signal.
    anim: { idle: [0, 1], idleMs: 360, walk: [2, 3, 4, 5], stepPx: 4, warn: 6 },
    brain: {
      kind: 'lagger',
      walkSpeed: 58,
      walkTime: [0.9, 1.5],
      freeze: 0.85,
      jump: 110,
      keep: 56,
      pattern: 'raton-clic',
      muzzleY: 10,
      recover: 0.55,
    },
  },
  webcam: {
    id: 'webcam',
    name: 'Webcam Siempre Encendida',
    description: 'La lucecita dice que no está grabando; la lucecita lleva años sin funcionar. Comparte pantalla con quien no debe.',
    hp: 5,
    sprite: 'webcam',
    anchor: { x: 13, y: 30 },
    hurt: { x: -11, y: -25, w: 22, h: 23 },
    footRadius: 6,
    contactPush: 120,
    contactDamage: 1,
    knockbackScale: 0.8,
    loot: { coupons: [0, 1] },
    // 0-1 looking about (the lens refocuses), 2-5 tiptoeing on its clip, 6 recording (REC on).
    anim: { idle: [0, 1], idleMs: 520, walk: [2, 3, 4, 5], stepPx: 4, warn: 6 },
    brain: {
      kind: 'watcher',
      walkSpeed: 40,
      keep: 150,
      range: 260,
      cooldown: [1.6, 2.6],
      // Long enough to break the line of sight behind something, or to shoot it first.
      focus: 1.2,
      pattern: 'webcam-flash',
      muzzleY: 17,
      recover: 0.7,
      // Everyone it told attacks sooner for a while: being watched live, nobody slacks off.
      rush: { time: 4, scale: 1.6 },
      // M14b (h9b): it only moves when you are not looking, round behind your back.
      shy: { cone: 35, speed: 75 },
    },
  },
  // Floor 3 (Juguetería). Toys that punish standing still and not watching the floor.
  'robot-cuerda': {
    id: 'robot-cuerda',
    name: 'Robot de Cuerda',
    description: 'En la caja ponía «3+» hasta que alguien le añadió otro 3 con un clavo. Corre a toda prisa a ninguna parte hasta que se le acaba la cuerda, como todos.',
    hp: 6,
    sprite: 'robot-cuerda',
    anchor: { x: 14, y: 30 },
    hurt: { x: -12, y: -28, w: 24, h: 27 },
    footRadius: 6,
    contactPush: 200,
    contactDamage: 1,
    knockbackScale: 0.4,
    loot: { coupons: [0, 1] },
    // 0-1 standing, 2-5 the quick stiff march with the key turning, 6 run down, 7-8 winding up.
    anim: { idle: [0, 1], idleMs: 300, walk: [2, 3, 4, 5], stepPx: 4, stun: 6, jam: [7, 8], jamMs: 70 },
    brain: {
      kind: 'windup',
      speed: 92,
      run: [4, 5],
      rundown: 2,
      windup: 0.6,
      // Run down it takes double: the moment to go for it.
      exposed: 2,
      pattern: 'robot-tuercas',
      bounceGap: 0.35,
      minSlant: 0.35,
      aimJitterDeg: 35,
      muzzleY: 14,
    },
  },
  'coche-teledirigido': {
    id: 'coche-teledirigido',
    name: 'Coche Teledirigido',
    description: 'Edición deportiva, pilas no incluidas. El mando se perdió en una mudanza y desde entonces conduce como quiere.',
    hp: 4,
    sprite: 'coche-teledirigido',
    anchor: { x: 16, y: 21 },
    hurt: { x: -14, y: -20, w: 28, h: 19 },
    footRadius: 7,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0.3,
    loot: { coupons: [0, 1] },
    // 0-1 idling, 2-3 driving, 4 revving to ram, 5 overturned, 6 batteries out (flickers while stalled).
    anim: { idle: [0, 1], idleMs: 90, walk: [2, 3], stepPx: 5, warn: 4, stun: 5, off: 6 },
    brain: {
      kind: 'rccar',
      speed: 125,
      orbit: 90,
      leadDeg: 40,
      turnDeg: 200,
      ramAfter: [1.2, 2.2],
      sideDeg: 35,
      range: 170,
      telegraph: 0.38,
      ramSpeed: 265,
      ramTime: 0.75,
      // Into a wall it overturns: the moment to hit it.
      flip: 1.5,
      recover: 0.45,
      brake: 700,
      stall: { every: [3.5, 6], time: 0.8 },
    },
  },
  // M12 (3c): the workshop's own. A charger, heavy: it warns with its beacon and rams forks first.
  carretilla: {
    id: 'carretilla',
    name: 'Carretilla Elevadora',
    description: 'Lleva colgada la tarjeta roja de «Fuera de servicio» desde hace tres inspecciones. Nadie se atreve a quitársela, y ella no sabe leer.',
    hp: 9,
    workshop: true,
    sprite: 'carretilla',
    anchor: { x: 17, y: 36 },
    hurt: { x: -15, y: -34, w: 30, h: 33 },
    footRadius: 8,
    contactPush: 280,
    contactDamage: 1,
    knockbackScale: 0.2,
    loot: { coupons: [0, 1] },
    // 0-1 idling, 2-5 rolling, 6 beacon lit and forks up before ramming, 7 bonked (forks bent).
    anim: { idle: [0, 1], idleMs: 110, walk: [2, 3, 4, 5], stepPx: 5, warn: 6, stun: 7 },
    brain: {
      kind: 'charger',
      walkSpeed: 34,
      range: 210,
      walkTime: [1.0, 1.8],
      telegraph: 0.6,
      chargeSpeed: 255,
      chargeTime: 0.8,
      brake: 600,
      recover: 0.55,
      stun: 1.5,
      // M14b (h9e2): a forklift, not a vacuum. It turns slowly, drives only where its forks point
      // and, after each charge, backs up beeping.
      steer: { turnRate: 100, aimCone: 20 },
      reverse: { speed: 62, time: 1.1, beep: 0.3 },
    },
  },
  'cubo-piezas': {
    id: 'cubo-piezas',
    name: 'Cubo de Piezas',
    description: 'Más de mil piezas, compatibles con casi nada. Las instrucciones están en el fondo del cubo, debajo de todas las piezas.',
    hp: 7,
    sprite: 'cubo-piezas',
    anchor: { x: 14, y: 31 },
    hurt: { x: -11, y: -27, w: 22, h: 25 },
    footRadius: 6,
    contactPush: 180,
    contactDamage: 1,
    knockbackScale: 0.35,
    loot: { coupons: [0, 1] },
    // 0-1 standing, 2-5 walking, 6 lid up (about to throw).
    anim: { idle: [0, 1], idleMs: 520, walk: [2, 3, 4, 5], stepPx: 5, warn: 6 },
    brain: {
      kind: 'lobber',
      speed: 38,
      keep: 140,
      range: 260,
      interval: [2.6, 3.6],
      telegraph: 0.55,
      count: 3,
      spread: 32,
      flight: 0.85,
      life: 6,
      damage: 1,
      muzzleY: 26,
      // M14b (h9c): it follows in your footsteps, a second or so behind, and throws its pieces at you.
      follow: { delay: 1.2, speed: 78 },
    },
  },
  'sobre-sorpresa': {
    id: 'sobre-sorpresa',
    name: 'Sobre Sorpresa',
    description: 'Contenido aleatorio. En el reverso, en letra pequeña: repetidos 75 %, cupones 20 %, ultrarraro 5 % (o menos).',
    hp: 4,
    sprite: 'sobre-sorpresa',
    anchor: { x: 12, y: 27 },
    hurt: { x: -10, y: -24, w: 20, h: 23 },
    footRadius: 5,
    contactPush: 160,
    contactDamage: 1,
    knockbackScale: 0.6,
    loot: { coupons: [0, 1] },
    // 0-1 standing (it trembles), 2 crouching to hop, 3 in the air, 4 about to spit confetti.
    anim: { idle: [0, 1], idleMs: 160, warn: 4, jump: 3, crouch: 2 },
    brain: {
      kind: 'hopper',
      hopTime: 0.42,
      hopHeight: 14,
      hopDist: [30, 55],
      keep: 110,
      rest: [0.35, 0.6],
      volleyEvery: 3,
      range: 240,
      telegraph: 0.45,
      pattern: 'sobre-confeti',
      muzzleY: 12,
    },
    surprise: [
      { weight: 75, spawn: { id: 'munequito-repetido', count: 2 }, line: 'Repetidos' },
      { weight: 20, coupons: 4, line: 'Premio: cupones' },
      { weight: 5, spawn: { id: 'munequito-dorado', count: 1 }, line: 'Ultrarraro' },
    ],
  },
  'munequito-repetido': {
    id: 'munequito-repetido',
    name: 'Muñequito Repetido',
    description: 'Ya lo tienes, tres veces. Y nadie te lo cambia.',
    hp: 2,
    sprite: 'munequito-repetido',
    anchor: { x: 9, y: 19 },
    hurt: { x: -7, y: -18, w: 14, h: 17 },
    footRadius: 4,
    contactPush: 140,
    contactDamage: 1,
    knockbackScale: 1,
    loot: { coupons: [0, 0] },
    // 0-1 standing, 2-5 running, 6 mouth open (about to bite).
    anim: { idle: [0, 1], idleMs: 260, busyMs: 90, walk: [2, 3, 4, 5], stepPx: 4, warn: 6 },
    brain: {
      kind: 'chaser',
      walkSpeed: 66,
      range: 46,
      cooldown: [0.7, 1.2],
      telegraph: 0.3,
      lungeSpeed: 200,
      lungeTime: 0.18,
      recover: 0.4,
      brake: 700,
    },
  },
  'munequito-dorado': {
    id: 'munequito-dorado',
    name: 'Muñequito Dorado Ultrarraro',
    description: 'Uno de cada mil sobres, según el fabricante. Según los coleccionistas, ninguno.',
    hp: 5,
    sprite: 'munequito-dorado',
    anchor: { x: 9, y: 19 },
    hurt: { x: -7, y: -18, w: 14, h: 17 },
    footRadius: 4,
    contactPush: 140,
    contactDamage: 1,
    knockbackScale: 0.6,
    loot: { coupons: [5, 5] },
    anim: { idle: [0, 1], idleMs: 200, walk: [2, 3, 4, 5], stepPx: 4 },
    brain: {
      kind: 'turret',
      range: 240,
      interval: [1.5, 2.2],
      telegraph: 0.5,
      pattern: 'dorado-anillos',
      muzzleY: 10,
      walk: { speed: 34, keep: 110 },
    },
  },
  // Floor 4 (Oficinas). Office machines that punish the easy way of doing things.
  destructora: {
    id: 'destructora',
    name: 'Destructora de Documentos',
    description: 'Tritura todo lo que le dan por delante, sin leerlo, que es como se toman las decisiones en esta planta. Por detrás lleva la papelera a rebosar.',
    hp: 8,
    sprite: 'destructora',
    anchor: { x: 17, y: 32 },
    hurt: { x: -14, y: -26, w: 28, h: 24 },
    footRadius: 7,
    contactPush: 180,
    contactDamage: 1,
    knockbackScale: 0.25,
    loot: { coupons: [0, 1] },
    // Seven frames a side (side, front, back): 0-1 humming, 2-5 shuffling, 6 blades red (warning or chewing).
    anim: { idle: [0, 1], idleMs: 260, walk: [2, 3, 4, 5], stepPx: 5, warn: 6, views: { front: 7, back: 14 } },
    brain: {
      kind: 'shredder',
      speed: 34,
      turnDeg: 90,
      frontDeg: 100,
      // Its full bin is behind it: go round.
      backMul: 2,
      spitEvery: 4,
      pattern: 'destructora-tiras',
      muzzleY: 12,
      lungeEvery: [3, 4],
      range: 110,
      telegraph: 0.4,
      lungeSpeed: 220,
      lungeTime: 0.5,
      recover: 0.5,
      brake: 600,
    },
  },
  fotocopiadora: {
    id: 'fotocopiadora',
    name: 'Fotocopiadora de Planta',
    description: 'Lleva el cartel de «Averiada, no tocar» desde que se inauguró la planta. Aun así saca copias de cualquiera: peores, más lentas y sin cobrar, como en toda empresa.',
    hp: 6,
    sprite: 'fotocopiadora',
    anchor: { x: 19, y: 36 },
    hurt: { x: -16, y: -29, w: 32, h: 29 },
    footRadius: 8,
    contactPush: 160,
    contactDamage: 1,
    knockbackScale: 0.2,
    loot: { coupons: [0, 1] },
    // 0-1 humming, 2-5 shuffling, 6-8 lid up and the light crossing the glass (warn), 9 a copy coming out.
    anim: { idle: [0, 1], idleMs: 300, walk: [2, 3, 4, 5], stepPx: 6, warn: 6, scan: [6, 7, 8, 7, 6, 7, 8], out: 9 },
    brain: {
      kind: 'copier',
      speed: 22,
      keep: 170,
      interval: [4, 5],
      telegraph: 1,
      maxCopies: 3,
      copyLife: 0.5,
      copyPace: 0.8,
      fade: 1,
      pattern: 'fotocopiadora-folios',
      muzzleY: 10,
      recover: 0.45,
      // M14b (h9d): behind whoever is nearest, so they take the shots meant for it.
      hide: { speed: 44, gap: 30 },
    },
  },
  sello: {
    id: 'sello',
    name: 'Sello de Denegado',
    description: 'Ha denegado más solicitudes de las que nadie ha leído. Donde estampa no se puede hacer nada rápido: tampoco escapar.',
    hp: 4,
    sprite: 'sello',
    anchor: { x: 13, y: 32 },
    hurt: { x: -11, y: -27, w: 22, h: 26 },
    footRadius: 6,
    contactPush: 160,
    contactDamage: 1,
    knockbackScale: 0.5,
    loot: { coupons: [0, 1] },
    // 0-1 standing (it shakes), 2 crouching to hop, 3 in the air, 4 coming down to stamp, 5 just stamped.
    anim: { idle: [0, 1], idleMs: 170, warn: 4, jump: 3, crouch: 2, out: 5 },
    brain: {
      kind: 'stamper',
      hopTime: 0.5,
      hopHeight: 14,
      hopDist: [40, 60],
      rest: [0.3, 0.5],
      stampEvery: 3,
      reach: 110,
      telegraph: 0.5,
      slamHeight: 30,
      drop: 0.12,
      ink: { w: 40, h: 26, life: 5, max: 3 },
      damage: 1,
      pattern: 'sello-gotas',
      recover: 0.5,
    },
  },
  climatizador: {
    id: 'climatizador',
    name: 'Climatizador Portátil',
    description: 'Marca 17 grados desde que lo enchufaron. Nadie sabe quién lo puso ni cómo se apaga, y el cartel de «No tocar» lo firma Dirección.',
    hp: 9,
    sprite: 'climatizador',
    anchor: { x: 14, y: 38 },
    hurt: { x: -12, y: -34, w: 24, h: 33 },
    footRadius: 7,
    contactPush: 160,
    contactDamage: 1,
    knockbackScale: 0.15,
    loot: { coupons: [0, 1] },
    // 0-1 humming, 2-5 dragging itself along, 6 rime on the vent (about to blow).
    anim: { idle: [0, 1], idleMs: 260, walk: [2, 3, 4, 5], stepPx: 5, warn: 6 },
    brain: {
      kind: 'blower',
      speed: 12,
      keep: 80,
      turnDeg: 35,
      sweepDeg: 90,
      sweepTime: 3,
      coneDeg: 45,
      range: 200,
      push: 60,
      bendDeg: 110,
      interval: [2.5, 3.5],
      telegraph: 0.45,
      pattern: 'climatizador-copos',
      muzzleY: 12,
      // M14b (h9d): its hose is plugged into the nearest wall and reaches 110 px: it slides round
      // that circle to stay between the plug and you (from 80 px), and further out it cannot follow.
      hose: { reach: 110, speed: 38 },
    },
  },
  'dispensador-turnos': {
    id: 'dispensador-turnos',
    name: 'Dispensador de Turnos',
    description: 'Su pantalla marca el 087 desde la inauguración. Llama a otros números, nunca al suyo, y si no acude a tiempo pierde el turno y la paciencia.',
    hp: 6,
    sprite: 'dispensador-turnos',
    anchor: { x: 15, y: 34 },
    hurt: { x: -13, y: -31, w: 26, h: 30 },
    footRadius: 7,
    contactPush: 160,
    contactDamage: 1,
    knockbackScale: 0.3,
    loot: { coupons: [0, 1] },
    // 0-1 standing, 2-5 walking, 6 calling a turn, 7 spitting tickets (turn missed).
    anim: { idle: [0, 1], idleMs: 480, walk: [2, 3, 4, 5], stepPx: 5, warn: 6, spit: 7 },
    brain: {
      kind: 'turner',
      speed: 26,
      keep: 150,
      range: 280,
      interval: [4, 5],
      call: 0.5,
      radius: 40,
      near: 95,
      far: 165,
      countdown: 2.5,
      served: 1.6,
      lost: 0.8,
      telegraph: 0.35,
      punish: 'dispensador-abanico',
      between: [1.4, 2],
      pattern: 'dispensador-tiques',
      muzzleY: 18,
      // M14b (h9e1): along the walls, like the real ones; about `keep` from you and in sight.
      wall: { speed: 44, every: 0.8 },
    },
  },
  'poste-cola': {
    id: 'poste-cola',
    name: 'Postes de Cola',
    description: 'Dos postes y una cinta que dice «Haga cola aquí» del revés. No vigilan la cola: la hacen, y usted está en ella.',
    hp: 4,
    sprite: 'poste-cola',
    anchor: { x: 11, y: 33 },
    hurt: { x: -8, y: -31, w: 16, h: 30 },
    footRadius: 5,
    contactPush: 150,
    contactDamage: 1,
    knockbackScale: 0.35,
    loot: { coupons: [0, 1] },
    pack: 2,
    // 0-1 standing, 2-5 walking, 6 firing (brows down), 7 the tape let go; 8-15 the same with the
    // chipped base (the other one of the pair).
    anim: { idle: [0, 1], idleMs: 520, walk: [2, 3, 4, 5], stepPx: 4, warn: 6, reveal: 7, altShift: 8 },
    brain: {
      kind: 'queuer',
      speed: 34,
      gap: 46,
      spread: [52, 92],
      squeeze: 56,
      push: 30,
      tether: 170,
      interval: 3,
      alone: 1.6,
      keep: 110,
      snap: 0.6,
      telegraph: 0.45,
      pattern: 'poste-bolas',
      muzzleY: 27,
    },
  },
  'telefono-recepcion': {
    id: 'telefono-recepcion',
    name: 'Teléfono de Recepción',
    description: 'Su llamada no es su problema: es la de otro departamento. Le pasa con un compañero, que le pasa con otro, que está de baja.',
    hp: 9,
    sprite: 'telefono-recepcion',
    anchor: { x: 17, y: 28 },
    hurt: { x: -14, y: -21, w: 28, h: 20 },
    footRadius: 6,
    contactPush: 160,
    contactDamage: 1,
    knockbackScale: 0.5,
    loot: { coupons: [0, 1] },
    // 0-1 standing, 2 crouching to hop, 3 in the air, 4-5 ringing, 6 «Le paso con un compañero».
    anim: { idle: [0, 1], idleMs: 420, crouch: 2, jump: 3, ring: [4, 5], ringMs: 70, pass: 6 },
    brain: {
      kind: 'phone',
      hopTime: 0.36,
      hopHeight: 9,
      hopDist: [26, 44],
      keep: 120,
      rest: [0.3, 0.55],
      volleyEvery: 3,
      range: 250,
      telegraph: 0.45,
      rings: 'telefono-timbres',
      call: 'telefono-llamada',
      transferAt: 0.5,
      transferWarn: 0.5,
      transferEvery: 4,
      hold: 'telefono-espera',
      muzzleY: 13,
    },
  },
  'asistente-virtual': {
    id: 'asistente-virtual',
    name: 'Asistente Virtual',
    description: 'Tiene respuesta para todo, siempre la misma y siempre sonriendo. Si no le entiende, hable más despacio.',
    hp: 9,
    sprite: 'asistente-virtual',
    anchor: { x: 13, y: 35 },
    hurt: { x: -12, y: -33, w: 24, h: 32 },
    footRadius: 6,
    contactPush: 150,
    contactDamage: 1,
    knockbackScale: 0.35,
    loot: { coupons: [0, 1] },
    // 0-1 standing, 2-5 walking, 6-7 typing (the three dots under the smile).
    anim: { idle: [0, 1], idleMs: 600, walk: [2, 3, 4, 5], stepPx: 5, scan: [6, 7, 6, 7, 6, 7] },
    brain: {
      kind: 'chatbot',
      speed: 30,
      keep: 140,
      interval: [1.9, 2.6],
      telegraph: 0.55,
      pattern: 'asistente-bocadillos',
      learn: 3,
      sameDeg: 60,
      shield: 3,
      shieldArc: 140,
      farewell: 'asistente-botones',
      muzzleY: 22,
      // M14b (h9e2): it evades the question. Hold your aim on it and it slides out of the way.
      dodge: { cone: 9, range: 260, react: 0.3, speed: 150, time: 0.3, every: 1.7 },
    },
  },
  'router-wifi': {
    id: 'router-wifi',
    name: 'El Router del Wifi',
    description:
      'Todas sus luces en verde menos la de internet, que lleva en rojo desde que lo instalaron. ' +
      'La clave está en la pegatina; la pegatina, arrancada.',
    // M9b (15): 200 → 170, to make up for the weapons' lower damage (M9b 7).
    hp: 110,
    sprite: 'router-wifi',
    anchor: { x: 36, y: 74 },
    hurt: { x: -28, y: -58, w: 56, h: 46 },
    footRadius: 16,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [3, 5], hearts: 1 },
    // 0-1 breathing (the wifi light blinks), 2-5 a heavy walk, 6-11 rebooting with its lights coming on one by one.
    anim: { idle: [0, 1], idleMs: 600, walk: [2, 3, 4, 5], stepPx: 9, reboot: [6, 7, 8, 9, 10, 11] },
    brain: {
      kind: 'boss',
      roam: { leg: [0.5, 1.3], burst: [0.6, 1.4], spread: 50 },
      drift: 0.35,
      rage: 0.6,
      // M14b (h10a2) «Cambio de punto de acceso»: now and then it hops over to the repeater nearest
      // the toaster, swapping places with it (the dashed line between the two warns of it).
      handoff: { every: [4, 7], warn: 0.7, clear: 90 },
      // The middle of its front, between the lights: the waves come out of there.
      muzzle: { x: 6, y: 40 },
      phases: [
        {
          name: 'Cobertura total',
          from: 1,
          walkSpeed: 34,
          keep: 140,
          rest: [1.1, 1.6],
          relays: { id: 'repetidor', count: 2 },
          attacks: [
            // Waves of wifi two by two, each with its «zona sin cobertura» a little further round: go through it.
            { kind: 'pattern', pattern: 'router-cobertura', telegraph: 0.8, weight: 3, relay: 'repetidor-onda' },
            { kind: 'pattern', pattern: 'router-paquetes', telegraph: 0.6, weight: 2 },
          ],
        },
        {
          // Half its life gone: it reboots (5 s off, its repeaters fall) and comes back updated.
          name: 'Actualización de firmware',
          from: 0.5,
          walkSpeed: 42,
          keep: 130,
          rest: [0.8, 1.2],
          reboot: { time: 5, line: 'Reiniciando. No desenchufe el dispositivo' },
          relays: { id: 'repetidor', count: 0, every: 12 },
          attacks: [
            // Three faster rings with two holes that move apart, each one its own way.
            { kind: 'pattern', pattern: 'router-firmware', telegraph: 0.7, weight: 3, relay: 'repetidor-onda' },
            { kind: 'pattern', pattern: 'router-paquetes-2', telegraph: 0.55, weight: 2 },
            // «Caídas de conexión»: marked spots on the floor that burst a second later.
            { kind: 'drop', count: 3, spread: 80, pattern: 'router-caida', telegraph: 1, weight: 2 },
          ],
        },
      ],
    },
    boss: { title: 'El Router del Wifi', motto: 'Cobertura total. En la otra habitación.', subtitle: 'Jefe de planta · Informática' },
  },
  'muneco-moda': {
    id: 'muneco-moda',
    name: 'El Muñeco de Moda',
    description:
      'El juguete del año pasado, todavía en su caja de escaparate. Sonríe como en el anuncio; ' +
      'los ojos no se han enterado de que el anuncio terminó.',
    // M10 (5b). The toughest yet (docs/DISENO.md said 300 before the weapons lost damage in M9b;
    // 220 measured with the bot: see the log of 2026-11-05).
    hp: 140,
    sprite: 'muneco-moda',
    anchor: { x: 36, y: 74 },
    hurt: { x: -26, y: -68, w: 52, h: 58 },
    footRadius: 16,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [3, 5], hearts: 1 },
    // 0-1 breathing in its box, 2-5 the walk, 6 posing (it warns before the catwalk). Out of the
    // box (phase 3, frameShift 7) the same layout seven frames on, and it spins: front, side,
    // back, other side.
    anim: {
      idle: [0, 1],
      idleMs: 520,
      walk: [2, 3, 4, 5],
      stepPx: 8,
      warn: 6,
      spin: [15, 7, 14, 7],
      spinMs: 70,
      badge: { sprite: 'etiqueta-rebaja', x: 16, y: 48, w: 22, upTo: 7, frameDy: { 6: -1 } },
    },
    brain: {
      kind: 'boss',
      roam: { leg: [0.5, 1.2], burst: [0.6, 1.4], spread: 50 },
      drift: 0.35,
      rage: 0.5,
      // The hands, out in front of the box: the accessories come out of there.
      muzzle: { x: 22, y: 38 },
      phases: [
        {
          name: 'Lanzamiento',
          from: 1,
          walkSpeed: 42,
          keep: 135,
          rest: [0.85, 1.2],
          badge: 0,
          attacks: [
            { kind: 'pattern', pattern: 'muneco-accesorios', telegraph: 0.7, weight: 3 },
            // The catwalk: from side to side posing, leaving camera flashes that go off behind it.
            { kind: 'runway', speed: 150, gap: 38, fuse: 0.6, pattern: 'muneco-flash', telegraph: 0.7, weight: 1.2 },
          ],
        },
        {
          // «Rebajas»: the tag on its box comes down three times; with each discount it hurries,
          // its rings get denser and it brings two Muñequitos Repetidos.
          name: 'Rebajas: -30 %',
          from: 0.6,
          stage: 2,
          walkSpeed: 46,
          keep: 130,
          rest: [0.75, 1.05],
          badge: 1,
          line: '¡Ahora con más accesorios!',
          summon: { id: 'munequito-repetido', count: 2, max: 4 },
          attacks: [
            { kind: 'pattern', pattern: 'muneco-rebaja-30', telegraph: 0.7, weight: 3 },
            { kind: 'pattern', pattern: 'muneco-accesorios-2', telegraph: 0.6, weight: 2 },
            { kind: 'runway', speed: 165, gap: 36, fuse: 0.6, pattern: 'muneco-flash', telegraph: 0.6, weight: 1.5 },
          ],
        },
        {
          name: 'Rebajas: -50 %',
          from: 0.47,
          stage: 2,
          walkSpeed: 50,
          keep: 125,
          rest: [0.65, 0.95],
          badge: 2,
          line: '¡Ahora con más accesorios!',
          summon: { id: 'munequito-repetido', count: 2, max: 4 },
          attacks: [
            { kind: 'pattern', pattern: 'muneco-rebaja-50', telegraph: 0.65, weight: 3 },
            { kind: 'pattern', pattern: 'muneco-accesorios-2', telegraph: 0.55, weight: 2 },
            { kind: 'runway', speed: 180, gap: 34, fuse: 0.55, pattern: 'muneco-flash', telegraph: 0.55, weight: 1.5 },
          ],
        },
        {
          name: 'Rebajas: -70 %',
          from: 0.34,
          stage: 2,
          walkSpeed: 54,
          keep: 120,
          rest: [0.55, 0.8],
          badge: 3,
          line: '¡Ahora con más accesorios!',
          summon: { id: 'munequito-repetido', count: 2, max: 4 },
          attacks: [
            { kind: 'pattern', pattern: 'muneco-rebaja-70', telegraph: 0.6, weight: 3 },
            { kind: 'pattern', pattern: 'muneco-accesorios-2', telegraph: 0.5, weight: 2 },
            { kind: 'runway', speed: 195, gap: 32, fuse: 0.5, pattern: 'muneco-flash', telegraph: 0.5, weight: 1.5 },
          ],
        },
        {
          // Phase 3 (M10 5c). The design called it «Liquidación total», but that is already the
          // stamp of a fallen boss (BOSS_DOWN_STAMP). It breaks out of its box, which stays as an
          // obstacle; out of it, it spins on the spot peeling off spirals of sale stickers, is the
          // quickest it has been and takes a quarter more damage (no box).
          name: 'Fin de existencias',
          from: 0.25,
          stage: 3,
          walkSpeed: 60,
          keep: 115,
          rest: [0.5, 0.75],
          line: '¡Todo debe desaparecer! Yo también.',
          shed: { prop: 'caja-muneco' },
          taken: 1.25,
          frameShift: 7,
          attacks: [
            { kind: 'pattern', pattern: 'muneco-pegatinas', telegraph: 0.55, weight: 3, spin: true },
            { kind: 'pattern', pattern: 'muneco-pegatinas-2', telegraph: 0.5, weight: 2, spin: true },
            { kind: 'pattern', pattern: 'muneco-accesorios-3', telegraph: 0.45, weight: 1.5 },
          ],
        },
      ],
    },
    boss: { title: 'El Muñeco de Moda', motto: 'Pasado de moda. Como tú.', subtitle: 'Jefe de planta · Juguetería' },
  },
  'director-rrhh': {
    id: 'director-rrhh',
    name: 'El Director de Recursos Inhumanos',
    description:
      'Firma las bajas de todo el edificio sin levantarse de la silla. Sonríe como en su foto de ' +
      'perfil; las gafas reflejan una hoja de cálculo en la que usted es una celda.',
    // M10 planta 4 (5b). docs/DISENO.md said about 240; 220 like the Muñeco, because his long table
    // stops the toaster's bullets too (measured with the bot: see the log of 2026-11-05).
    hp: 140,
    sprite: 'director-rrhh',
    anchor: { x: 34, y: 73 },
    hurt: { x: -24, y: -66, w: 48, h: 60 },
    footRadius: 16,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [4, 6], hearts: 1 },
    // tools/sprites/director.ts DIRECTOR_FRAMES: 0-1 in his chair breathing, 2-5 pushing off with
    // his feet and rolling (his walk), 6 throwing, 7 the clap, 8 up with his own stamp. On his feet
    // (phase 3, frameShift 9) the same layout: 9-10 breathing, 11-14 walking, 15 throwing; he
    // spins the line of cuts front, side, back, other side.
    anim: { idle: [0, 1], idleMs: 560, walk: [2, 3, 4, 5], stepPx: 9, warn: 6, clap: 7, spin: [17, 15, 16, 15], spinMs: 90 },
    brain: {
      kind: 'boss',
      // On wheels: pushes of the feet in short legs, now a glide, now a lurch.
      roam: { leg: [0.5, 1.3], burst: [0.6, 1.5], spread: 50 },
      drift: 0.35,
      rage: 0.6,
      // His right hand, out in front of the chair: the cards come out of there.
      muzzle: { x: 24, y: 30 },
      phases: [
        {
          // «Somos una familia»: fans of business cards, and dismissal letters that land where a
          // red ring says and burst into sheets.
          name: 'Somos una familia',
          from: 1,
          walkSpeed: 44,
          keep: 140,
          rest: [0.85, 1.2],
          attacks: [
            { kind: 'pattern', pattern: 'director-tarjetas', telegraph: 0.7, weight: 3, pose: 6 },
            {
              kind: 'spit', count: 3, spread: 70, flight: 1.1, from: { x: 30, y: 62 }, burst: 'director-folios',
              telegraph: 0.7, weight: 2, look: 'carta-despido', pose: 6,
            },
          ],
        },
        {
          // «Reestructuración» (from 60 %): a clap, and the four partitions of the room move (and
          // again every 12 s); rings of slides with two holes going round, and his own stamp.
          name: 'Reestructuración',
          from: 0.6,
          walkSpeed: 50,
          keep: 130,
          rest: [0.9, 1.25],
          line: 'Hemos decidido redistribuir los espacios.',
          restructure: { prop: 'mampara-movil', every: 12, warn: 1, time: 0.7 },
          attacks: [
            { kind: 'pattern', pattern: 'director-diapositivas', telegraph: 0.7, weight: 3 },
            { kind: 'pattern', pattern: 'director-tarjetas-2', telegraph: 0.6, weight: 2, pose: 6 },
            {
              kind: 'stamp', count: 2, spread: 64, ink: { w: 40, h: 26, life: 5, max: 4 }, pattern: 'sello-gotas',
              telegraph: 0.8, weight: 1.5, pose: 8,
            },
            {
              kind: 'spit', count: 4, spread: 80, flight: 1.05, from: { x: 30, y: 62 }, burst: 'director-folios',
              telegraph: 0.6, weight: 1.5, look: 'carta-despido', pose: 6,
            },
          ],
        },
        {
          // «Despido procedente» (from 25 %, M10 planta 4 5c): he gets up. His chair goes off
          // rolling round the room on its own and rams the toaster when it has it in front; he,
          // on his feet and slower, turns on the spot streaming the line of cuts (a spiral with a
          // hole to follow round him), and throws cards. The partitions stay where they were left.
          name: 'Despido procedente',
          from: 0.25,
          stage: 3,
          walkSpeed: 34,
          keep: 120,
          rest: [0.8, 1.1],
          line: 'No es nada personal. Es todo.',
          summon: { id: 'silla-director', count: 1, max: 1 },
          frameShift: 9,
          attacks: [
            { kind: 'pattern', pattern: 'director-recortes', telegraph: 0.7, weight: 2, spin: true },
            { kind: 'pattern', pattern: 'director-recortes-2', telegraph: 0.7, weight: 2, spin: true },
            { kind: 'pattern', pattern: 'director-tarjetas-3', telegraph: 0.55, weight: 2.5, pose: 15 },
          ],
        },
      ],
    },
    boss: { title: 'El Director de Recursos Inhumanos', motto: 'Aquí nadie es imprescindible. Usted tampoco.', subtitle: 'Jefe de planta · Oficinas' },
  },
  centralita: {
    id: 'centralita',
    name: 'La Centralita',
    description:
      'El menú de voz que contesta todas las llamadas del edificio y no resuelve ninguna. Un cuadro ' +
      'de clavijas del tamaño de un armario, con una voz grabada demasiado amable y los cables de brazos.',
    // M11 (5b). docs/DISENO.md says about 240, like the Director measured; her low counters stop the
    // toaster's bullets too.
    hp: 155,
    sprite: 'centralita',
    anchor: { x: 32, y: 73 },
    hurt: { x: -26, y: -66, w: 52, h: 62 },
    footRadius: 18,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [4, 6], hearts: 1 },
    // tools/sprites/centralita.ts CENTRALITA_FRAMES: 0-1 resting, 2-5 dragging herself with the
    // cords, 6-7 talking, 8 throwing a plug; 9-13 phase 3 (M11 5c).
    anim: { idle: [0, 1], idleMs: 620, walk: [2, 3, 4, 5], stepPx: 6, warn: 6, talk: [6, 7], talkMs: 170, stun: 13 },
    brain: {
      kind: 'boss',
      // She drags herself: short legs, now slow, now a heave.
      roam: { leg: [0.6, 1.4], burst: [0.7, 1.4], spread: 40 },
      drift: 0.4,
      rage: 0.5,
      // The tip of the front cord, raised: the plugs come out of there.
      muzzle: { x: 30, y: 44 },
      phases: [
        {
          // «Su llamada es importante»: the voice menu (three zones on the floor, bullets on the two
          // wrong ones), fans of plugs and rings of hold music in between.
          name: 'Su llamada es importante',
          from: 1,
          walkSpeed: 34,
          keep: 150,
          rest: [1, 1.4],
          attacks: [
            { kind: 'menu', zones: 3, wait: 1.5, drops: 8, pattern: 'centralita-lluvia', far: 0.35, telegraph: 0.7, weight: 2.5 },
            { kind: 'pattern', pattern: 'centralita-clavijas', telegraph: 0.6, weight: 2.5, pose: 8 },
            { kind: 'pattern', pattern: 'centralita-espera', telegraph: 0.6, weight: 2 },
          ],
        },
        {
          // «Le paso con el departamento» (from 60 %): every 10 s a bell, a circle on the toaster and
          // off it goes to another department, where a pattern of its own waits; and she calls a
          // reception phone (again every third transfer, if it is down).
          name: 'Le paso con el departamento',
          from: 0.6,
          walkSpeed: 40,
          keep: 140,
          rest: [0.95, 1.3],
          line: 'Le paso con el departamento correspondiente.',
          summon: { id: 'telefono-recepcion', count: 1, max: 1 },
          transfer: {
            first: 3,
            every: 10,
            mark: 0.8,
            grace: 0.5,
            warn: 0.7,
            welcome: ['depto-reclamaciones', 'depto-facturacion', 'depto-averias', 'depto-bajas'],
            recall: 3,
          },
          attacks: [
            { kind: 'menu', zones: 3, wait: 1.4, drops: 8, pattern: 'centralita-lluvia', far: 0.45, telegraph: 0.6, weight: 2 },
            { kind: 'pattern', pattern: 'centralita-clavijas-2', telegraph: 0.55, weight: 2.5, pose: 8 },
            { kind: 'pattern', pattern: 'centralita-espera', telegraph: 0.55, weight: 1.5 },
          ],
        },
        {
          // «Se ha cortado la llamada» (from 25 %, M11 (5c)): she tears her plugs out (they fly off
          // all round), swings her cords round as four arms of bullets that turn slowly (shown
          // beforehand), drags herself about faster than ever and, every so often, goes quiet for a
          // second (her lights blank): standing still and taking half as much again, the moment
          // to hit her. No more menus or transfers: there is no one left on the line.
          name: 'Se ha cortado la llamada',
          from: 0.25,
          walkSpeed: 62,
          keep: 120,
          rest: [0.5, 0.8],
          line: 'Le atenderemos lo antes posible. No.',
          opening: 'centralita-arranque',
          mute: { every: [4.5, 6.5], time: 1, taken: 1.5 },
          look: { idle: [9, 10], walk: [11, 12], warn: 10 },
          attacks: [
            { kind: 'pattern', pattern: 'centralita-cables', telegraph: 0.8, weight: 2.5 },
            { kind: 'pattern', pattern: 'centralita-cables-2', telegraph: 0.8, weight: 2.5 },
            { kind: 'pattern', pattern: 'centralita-espera', telegraph: 0.5, weight: 1 },
          ],
        },
      ],
    },
    boss: { title: 'La Centralita', motto: 'Todos nuestros operadores están ocupados. Siempre.', subtitle: 'Jefa de planta · Atención al Cliente' },
  },
  trituradora: {
    id: 'trituradora',
    name: 'La Trituradora',
    description:
      'El Servicio Técnico Oficial en persona: una trituradora industrial del tamaño de una pared, con ' +
      'la tolva por boca y dos pilotos de «En servicio» por ojos. Todo lo que entra sale reacondicionado.',
    // M12 (4a). The final boss: more life than the Centralita (240), spread over three phases
    // (phase 2 at 60 %, M12 (4b); phase 3 at 35 %, M12 (4c) and (6)).
    hp: 195,
    sprite: 'trituradora',
    anchor: { x: 47, y: 85 },
    hurt: { x: -35, y: -80, w: 72, h: 76 },
    footRadius: 24,
    contactPush: 280,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [0, 0] },
    // tools/sprites/trituradora.ts TRITURADORA_FRAMES: 0-1 resting, 2-5 rolling on its tracks, 6
    // diagnosing (the scanner raised, the lamps amber), 7 taking apart (lamps red), 8 quality
    // control (the label gun up, the lamps green).
    // Her «EN SERVICIO» plate (TR.PLATE) goes on again unflipped, so it reads when she faces left.
    anim: { idle: [0, 1], idleMs: 600, walk: [2, 3, 4, 5], stepPx: 6, warn: 6, badge: { sprite: 'placa-servicio', x: 30, y: 34, w: 47, upTo: 9, frameDy: { 1: 1, 3: 1, 5: 1, 7: 1 } } },
    brain: {
      kind: 'boss',
      // On tracks: slow, steady legs, now and then a lurch forward.
      roam: { leg: [0.8, 1.6], burst: [0.6, 1.3], spread: 40 },
      drift: 0.4,
      rage: 0.5,
      // The output slot, under the lamps: everything comes out of there.
      muzzle: { x: 12, y: 23 },
      phases: [
        {
          // «Diagnóstico»: it scans the toaster and answers with each fallen boss in turn,
          // refurbished: the Nevera, the Router, the Muñeco, the Director, the Centralita, and round again.
          name: 'Diagnóstico',
          from: 1,
          walkSpeed: 40,
          keep: 150,
          rest: [0.9, 1.3],
          cycle: true,
          attacks: [
            { kind: 'pattern', pattern: 'triturado-cubitos', telegraph: 0.9, weight: 1, pose: 6, scan: 'Diagnóstico: le falta frío.' },
            { kind: 'pattern', pattern: 'triturado-cobertura', telegraph: 0.9, weight: 1, pose: 6, scan: 'Diagnóstico: sin cobertura.' },
            { kind: 'pattern', pattern: 'triturado-accesorios', telegraph: 0.9, weight: 1, pose: 6, scan: 'Diagnóstico: pasado de moda.' },
            { kind: 'pattern', pattern: 'triturado-tarjetas', telegraph: 0.9, weight: 1, pose: 6, scan: 'Diagnóstico: plantilla excesiva.' },
            { kind: 'pattern', pattern: 'triturado-espera', telegraph: 0.9, weight: 1, pose: 6, scan: 'Diagnóstico: no contesta.' },
          ],
        },
        {
          // «Despiece» (M12 (4b)): the floor becomes a belt that carries everything to its hopper,
          // and it rides up and down the end of it spitting out what it has taken apart: screws,
          // springs and keys, in fans. You walk against the belt or you get fed in.
          name: 'Despiece',
          from: 0.6,
          walkSpeed: 44,
          keep: 150,
          rest: [0.5, 0.8],
          line: 'Procedemos al despiece. No se mueva.',
          belt: { speed: 44, bite: 16, move: 3 },
          attacks: [
            { kind: 'pattern', pattern: 'despiece-tornillos', telegraph: 0.7, weight: 1.2, pose: 7 },
            { kind: 'pattern', pattern: 'despiece-muelles', telegraph: 0.8, weight: 1, pose: 7 },
            { kind: 'pattern', pattern: 'despiece-teclas', telegraph: 0.9, weight: 1, pose: 7 },
          ],
        },
        {
          // «Control de calidad» (M12 (4c)): everything passes. It sticks «APTO» labels on the floor
          // (they slow you down like frost) between its fans of parts, and stacks of crates come down
          // from the far wall in, half a column at a time, closing the room towards the rollers.
          // M12 (6): from 35 % (was 25 %), with less rest, fewer labels and a fan of springs: measured
          // with what the bot brings from below, phase 3 hurt 0.9 times per fight and whoever reached
          // it won almost always; the stacks of crates never got near the toaster.
          name: 'Control de calidad',
          from: 0.35,
          walkSpeed: 48,
          keep: 150,
          rest: [0.4, 0.7],
          line: 'Control de calidad. Todo APTO, sin mirar.',
          crates: { prop: 'pila-cajas', first: 2.5, every: 3.2, warn: 1.2, hurt: 1, cols: 8 },
          attacks: [
            { kind: 'frost', count: 4, spread: 64, flight: 0.8, radius: 18, life: 6, slow: 0.55, sticker: 'etiqueta-apto', telegraph: 0.7, weight: 0.8, pose: 8 },
            { kind: 'pattern', pattern: 'despiece-tornillos', telegraph: 0.7, weight: 1, pose: 7 },
            { kind: 'pattern', pattern: 'despiece-muelles', telegraph: 0.8, weight: 1, pose: 7 },
            { kind: 'pattern', pattern: 'despiece-teclas', telegraph: 0.9, weight: 0.8, pose: 7 },
          ],
        },
      ],
    },
    boss: { title: 'La Trituradora', motto: 'Su producto será reacondicionado. Usted también.', subtitle: 'Servicio Técnico Oficial' },
  },
  'silla-director': {
    id: 'silla-director',
    name: 'Silla Ergonómica de Dirección',
    glossary: false,
    description:
      'Polipiel granate, respaldo lumbar y cinco ruedas: cuesta lo que un sueldo y nadie más se ' +
      'sienta en ella. Ahora rueda sola, todavía caliente.',
    // M10 planta 4 (5c): the Director's chair, let loose in phase 3 (BossPhase.summon). It rolls
    // after the toaster and rams it in a straight line; against a wall or the table it stops dead.
    // It can be broken (it is in the way, not the point), and it falls with him.
    hp: 14,
    sprite: 'silla-director',
    anchor: { x: 22, y: 50 },
    hurt: { x: -19, y: -46, w: 38, h: 44 },
    footRadius: 12,
    contactPush: 240,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [0, 0] },
    // tools/sprites/director.ts makeChairFrames: 0 and 4 still (the tag on the seat stirs), 1-2
    // and 5-6 rolling (the wheels turn, the tag blown back), 3 about to ram (dust).
    anim: { idle: [0, 4], idleMs: 700, walk: [1, 2, 5, 6], stepPx: 6, warn: 3 },
    brain: {
      kind: 'charger',
      walkSpeed: 30,
      range: 220,
      walkTime: [1.4, 2.2],
      telegraph: 0.6,
      chargeSpeed: 240,
      chargeTime: 0.8,
      brake: 500,
      recover: 0.6,
      stun: 1.2,
    },
  },
  repetidor: {
    id: 'repetidor',
    name: 'Repetidor de Señal',
    glossary: false,
    description: 'Amplía la cobertura del router a toda la casa, menos a la habitación donde estás.',
    hp: 4,
    sprite: 'repetidor',
    anchor: { x: 10, y: 23 },
    hurt: { x: -8, y: -21, w: 16, h: 20 },
    footRadius: 5,
    contactPush: 100,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [0, 1] },
    // 0-1 plugged in with its light blinking.
    anim: { idle: [0, 1], idleMs: 350 },
    brain: { kind: 'relay', muzzleY: 13 },
  },
  // M14 (j2): floor 1's second boss, drawn instead of the Nevera by some seeds (FLOOR_BOSS_POOLS).
  'lavadora-eco': {
    id: 'lavadora-eco',
    name: 'La Lavadora Programa Eco',
    description:
      'Gasta la mitad de agua y tarda el triple: en la pantalla pone 2:59 desde que la enchufaron. ' +
      'La hoja verde y la etiqueta A+++ se las puso ella.',
    // Like the Nevera (135): the same floor, the same toaster with one weapon. Measured with the bot (j2).
    hp: 85,
    sprite: 'lavadora-eco',
    anchor: { x: 34, y: 73 },
    hurt: { x: -25, y: -66, w: 50, h: 58 },
    footRadius: 16,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [3, 4], hearts: 1 },
    // Seven frames per program (tools/sprites/lavadora.ts): 0-1 breathing (the drum sloshing), 2-5 a
    // heavy walk, 6 weighing the load. Lavado is the same seven on, Centrifugado fourteen on, and in
    // Centrifugado the whole machine rattles.
    anim: { idle: [0, 1], idleMs: 520, walk: [2, 3, 4, 5], stepPx: 9, stun: 6, rattle: { phase: 2, px: 1, ms: 45 } },
    brain: {
      kind: 'boss',
      roam: { leg: [0.5, 1.3], burst: [0.6, 1.5], spread: 50 },
      drift: 0.35,
      rage: 0.45,
      // M14b (h10a1) «Anda a pivotes»: an unbalanced washing machine walks by itself, one corner and
      // then the other, the way you shift one across a kitchen. In Centrifugado, wilder and quicker.
      waddle: { angle: 42, step: 0.42 },
      // The porthole, in the middle of its front: everything comes out of the drum.
      muzzle: { x: 7, y: 26 },
      phases: [
        {
          name: 'Prelavado',
          from: 1,
          walkSpeed: 40,
          keep: 130,
          rest: [0.9, 1.4],
          // «Pesando la carga»: now and then it stops dead to weigh the load, and takes more meanwhile.
          mute: { every: [8, 11], time: 2.2, taken: 1.5, line: 'Pesando la carga…' },
          attacks: [
            // Rings of foam that slow to a drift and fill the room (shoot them to pop a way through).
            { kind: 'pattern', pattern: 'lavadora-espuma', telegraph: 0.8, weight: 3 },
            { kind: 'pattern', pattern: 'lavadora-llenado', telegraph: 0.6, weight: 2 },
          ],
        },
        {
          // A third of its life gone: the water goes in and the odd socks start coming out.
          name: 'Lavado',
          from: 0.66,
          walkSpeed: 42,
          keep: 125,
          rest: [0.8, 1.2],
          mute: { every: [9, 12], time: 2, taken: 1.5, line: 'Pesando la carga…' },
          frameShift: 7,
          attacks: [
            { kind: 'pattern', pattern: 'lavadora-calcetines', telegraph: 0.7, weight: 3 },
            { kind: 'pattern', pattern: 'lavadora-calcetines-par', telegraph: 0.6, weight: 2 },
            { kind: 'pattern', pattern: 'lavadora-espuma', telegraph: 0.7, weight: 1 },
          ],
        },
        {
          // The last third: it spins, rattling across the room in lurches.
          name: 'Centrifugado',
          from: 0.33,
          walkSpeed: 62,
          keep: 115,
          rest: [0.6, 1],
          line: '1400 revoluciones. Las que pone en la caja.',
          waddle: { angle: 58, step: 0.26 },
          mute: { every: [10, 13], time: 1.8, taken: 1.5, line: 'Pesando la carga…' },
          frameShift: 14,
          attacks: [
            { kind: 'pattern', pattern: 'lavadora-centrifugado', telegraph: 0.7, weight: 3 },
            { kind: 'pattern', pattern: 'lavadora-desague', telegraph: 0.7, weight: 2 },
            { kind: 'pattern', pattern: 'lavadora-calcetines', telegraph: 0.6, weight: 1 },
          ],
        },
      ],
    },
    boss: { title: 'La Lavadora Programa Eco', motto: 'Tres horas para lavar lo mismo. Pero ahorra.', subtitle: 'Jefa de planta · Electrodomésticos' },
  },
  // M14 (j3): floor 2's second boss, drawn instead of the Router by some seeds (FLOOR_BOSS_POOLS).
  'nube-almacenamiento': {
    id: 'nube-almacenamiento',
    name: 'La Nube de Almacenamiento',
    description:
      'Guarda todo lo que le das y te lo devuelve en cuotas mensuales. Lleva veinte años al 99 % y ' +
      'nunca ha borrado nada: lo llama «sincronizar».',
    // Like the Router (170): the same floor. Measured with the bot (j3).
    hp: 115,
    sprite: 'nube-almacenamiento',
    anchor: { x: 36, y: 74 },
    // It floats: the body is up in the air, its shadow on the floor.
    hurt: { x: -30, y: -66, w: 60, h: 40 },
    footRadius: 16,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [3, 5], hearts: 1 },
    // Six frames per phase (tools/sprites/nube.ts): 0-3 floating (it bobs and its wisps drift), 4
    // holding its breath (warning, syncing), 5 the connection error. «Almacenamiento lleno» is the
    // same six on, swollen and grey.
    anim: { idle: [0, 1, 2, 3], idleMs: 280, walk: [0, 1, 2, 3], stepPx: 14, warn: 4, stun: 5 },
    brain: {
      kind: 'boss',
      roam: { leg: [0.4, 1.1], burst: [0.6, 1.4], spread: 60 },
      drift: 0.45,
      rage: 0.5,
      // M14b (h10a2) «Nubarrón»: it hangs over the toaster, a little north of it, swaying and
      // drifting after it over the furniture (its walkSpeed is how fast it drifts).
      hover: { above: 100, sway: 70, accel: 90 },
      // Out of the bottom of the cloud, in front: where it rains from.
      muzzle: { x: 6, y: 42 },
      phases: [
        {
          name: 'Subiendo archivos',
          from: 1,
          walkSpeed: 64,
          keep: 140,
          rest: [0.9, 1.4],
          attacks: [
            // «Lluvia en columnas»: lanes marked from the back wall down, one over you.
            { kind: 'rain', cols: 5, gap: 50, pattern: 'nube-lluvia', telegraph: 0.9, weight: 3 },
            { kind: 'pattern', pattern: 'nube-archivos', telegraph: 0.6, weight: 2 },
            // «Sincronizando…»: a bar fills; shoot it hard enough and it breaks.
            { kind: 'sync', time: 3.2, cancel: 8, pattern: 'nube-sincronizada', stun: 1.8, weight: 2 },
          ],
        },
        {
          // Half its life gone: full. Folders everywhere, and an offer to upgrade.
          name: 'Almacenamiento lleno',
          from: 0.5,
          walkSpeed: 72,
          keep: 130,
          rest: [0.8, 1.2],
          line: 'Su almacenamiento está lleno. Mejore su plan.',
          frameShift: 6,
          attacks: [
            { kind: 'folders', count: 5, prop: 'carpeta-nube', life: 7, dist: 0.45, telegraph: 0.7, weight: 3 },
            { kind: 'rain', cols: 6, gap: 44, pattern: 'nube-lluvia-2', telegraph: 0.85, weight: 3 },
            { kind: 'pattern', pattern: 'nube-archivos-2', telegraph: 0.55, weight: 2 },
            { kind: 'sync', time: 2.8, cancel: 9, pattern: 'nube-sincronizada', stun: 1.6, weight: 2 },
          ],
        },
      ],
    },
    boss: { title: 'La Nube de Almacenamiento', motto: 'Sus archivos, a salvo en la nube. Ya no son suyos.', subtitle: 'Jefa de planta · Informática' },
  },
  // M14 (j4): floor 3's second boss, drawn instead of the Muñeco by some seeds (FLOOR_BOSS_POOLS).
  'consola-coleccionista': {
    id: 'consola-coleccionista',
    name: 'La Consola Edición Coleccionista',
    description:
      'Numerada a mano: la 000.001 de una tirada limitada de cuatro millones. Trae un 3 % más de ' +
      'contenido, que ya viene en el disco y se desbloquea pagando.',
    // A little less than the Muñeco (220): its loot boxes take shots too. Measured with the bot (j4).
    hp: 105,
    sprite: 'consola-coleccionista',
    anchor: { x: 36, y: 74 },
    hurt: { x: -24, y: -64, w: 48, h: 60 },
    footRadius: 16,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [3, 5], hearts: 1 },
    // Eight frames per phase (tools/sprites/consola.ts): 0-1 breathing, 2-5 walking, 6 the disc
    // tray out (warning), 7 updating (BossPhase.mute: the progress bar on its front). «Pase de
    // temporada» is the same eight on, with the season pass hung round it and its lights in colours.
    anim: { idle: [0, 1], idleMs: 380, walk: [2, 3, 4, 5], stepPx: 6, warn: 6, stun: 7 },
    brain: {
      kind: 'boss',
      roam: { leg: [0.5, 1.2], burst: [0.6, 1.5], spread: 70 },
      drift: 0.4,
      rage: 0.55,
      // Out of the disc tray, on its front.
      muzzle: { x: 14, y: 40 },
      phases: [
        {
          name: 'Edición Coleccionista',
          from: 1,
          walkSpeed: 42,
          keep: 135,
          rest: [0.85, 1.25],
          attacks: [
            { kind: 'pattern', pattern: 'consola-cartuchos', telegraph: 0.65, weight: 3 },
            { kind: 'pattern', pattern: 'consola-mando', telegraph: 0.6, weight: 2 },
            // «Cajas de botín»: out they go; shoot them open or they open by themselves (worse).
            { kind: 'summon', id: 'caja-botin', count: 2, max: 3, toss: 260, telegraph: 0.6, weight: 1.5 },
          ],
          // «Actualización obligatoria»: it stops dead to update, and takes more meanwhile.
          mute: { every: [8, 11], time: 2.2, taken: 1.6, line: 'Actualización obligatoria (1 de 37)' },
        },
        {
          // Half its life gone: the season pass. Its attacks change every few seconds.
          name: 'Pase de temporada',
          from: 0.5,
          walkSpeed: 48,
          keep: 125,
          rest: [0.7, 1.05],
          line: 'Temporada nueva disponible. Su progreso no se conserva.',
          frameShift: 8,
          seasons: { every: 8, names: ['Temporada de botín', 'Temporada competitiva', 'Temporada remasterizada'] },
          attacks: [
            { kind: 'summon', id: 'caja-botin', count: 2, max: 3, toss: 270, telegraph: 0.55, weight: 2, season: 0 },
            { kind: 'pattern', pattern: 'consola-cartuchos-2', telegraph: 0.55, weight: 2, season: 0 },
            { kind: 'pattern', pattern: 'consola-mando-2', telegraph: 0.55, weight: 3, season: 1 },
            { kind: 'pattern', pattern: 'consola-rafaga', telegraph: 0.45, weight: 2, season: 1 },
            { kind: 'pattern', pattern: 'consola-remaster', telegraph: 0.6, weight: 3, season: 2 },
            { kind: 'pattern', pattern: 'consola-cartuchos', telegraph: 0.5, weight: 2, season: 2 },
          ],
          mute: { every: [8, 11], time: 2, taken: 1.6, line: 'Descargando contenido de temporada (2 de 37)' },
        },
      ],
    },
    boss: { title: 'La Consola Edición Coleccionista', motto: 'Ahora con un 3 % más de contenido. Desbloqueable.', subtitle: 'Jefa de planta · Juguetería' },
  },
  // The Consola's loot boxes (M14 (j4)): shoot them open for a chance at something; left alone, they
  // open by themselves, and what comes out then is never good.
  'caja-botin': {
    id: 'caja-botin',
    name: 'Caja de Botín',
    description: 'Contenido aleatorio garantizado. La probabilidad de cada premio está publicada en un sitio web que ya no existe.',
    hp: 3,
    sprite: 'caja-botin',
    anchor: { x: 12, y: 22 },
    hurt: { x: -9, y: -17, w: 18, h: 16 },
    footRadius: 6,
    contactPush: 0,
    contactDamage: 0,
    knockbackScale: 0.3,
    loot: { coupons: [0, 0] },
    // 0-1 glowing, 2-3 rattling (about to open by itself).
    anim: { idle: [0, 1], idleMs: 260, jam: [2, 3], jamMs: 55 },
    brain: { kind: 'lootbox', open: 6.5, shake: 1.5 },
    surprise: [
      { weight: 40, spawn: { id: 'munequito-repetido', count: 1 }, line: 'Común' },
      { weight: 15, spawn: { id: 'robot-cuerda', count: 1 }, line: 'Poco común' },
      { weight: 40, pattern: 'cupones-falsos', line: 'Cupones (no canjeables)' },
      { weight: 5, coupons: 3, line: 'Legendario' },
    ],
    selfSurprise: [
      { weight: 75, spawn: { id: 'munequito-repetido', count: 2 }, line: 'Repetido' },
      { weight: 25, spawn: { id: 'robot-cuerda', count: 1 }, line: 'Común (otra vez)' },
    ],
    glossary: false,
  },
  'nevera-suprema': {
    id: 'nevera-suprema',
    name: 'La Nevera Suprema',
    description:
      'Jefa de planta, clase A+++ y «Empleada del mes» con una pegatina que se puso ella misma. ' +
      'Lleva veinte años sin descongelarse y sin dar una sola explicación.',
    // M9b (15): 200 → 135, to make up for the weapons' lower damage (M9b 7) and keep floor 1 winnable.
    hp: 90,
    sprite: 'nevera-suprema',
    anchor: { x: 34, y: 73 },
    hurt: { x: -25, y: -70, w: 48, h: 62 },
    footRadius: 16,
    contactPush: 260,
    contactDamage: 1,
    knockbackScale: 0,
    loot: { coupons: [3, 4], hearts: 1 },
    // 0-1 breathing, 2-5 a heavy walk; 6-11 the same with the door open (second phase).
    anim: { idle: [0, 1], idleMs: 560, walk: [2, 3, 4, 5], stepPx: 9, phaseShift: 6 },
    brain: {
      kind: 'boss',
      roam: { leg: [0.5, 1.3], burst: [0.6, 1.4], spread: 50 },
      drift: 0.35,
      rage: 0.45,
      // M14b (h10a1) «Patina sobre su escarcha»: twenty years without defrosting, its feet are ice. It
      // pushes off and glides (on its own frost, further), leaving a trail that slows you a little.
      glide: { push: 2.2, friction: 130, ice: 0.35, trail: { gap: 30, r: 22, slow: 0.85, life: 2.6 } },
      // The ice dispenser on its door, facing right.
      muzzle: { x: 5, y: 34 },
      phases: [
        {
          name: 'Congelación de precios',
          from: 1,
          walkSpeed: 38,
          keep: 130,
          rest: [0.9, 1.5],
          attacks: [
            { kind: 'pattern', pattern: 'nevera-cubitos', telegraph: 0.7, weight: 3 },
            { kind: 'pattern', pattern: 'nevera-granizo', telegraph: 0.9, weight: 2 },
            // «Escarcha»: frost on the floor that slows you down where you were going to dodge.
            { kind: 'frost', count: 3, spread: 56, flight: 0.9, radius: 22, life: 7, slow: 0.5, shatter: 'escarcha-esquirlas', telegraph: 0.6, weight: 2 },
          ],
        },
        {
          // Half its life gone: the door swings open and the offers start.
          name: 'Oferta irrechazable',
          from: 0.5,
          walkSpeed: 48,
          keep: 120,
          rest: [0.8, 1.3],
          attacks: [
            { kind: 'pattern', pattern: 'nevera-tarjetas', telegraph: 0.7, weight: 3 },
            // «Productos caducados»: a spray of expired food from the open fridge, each bursting where it lands.
            { kind: 'spit', count: 5, spread: 72, flight: 0.85, from: { x: 3, y: 30 }, burst: 'caducado-reventon', telegraph: 0.8, weight: 3 },
            { kind: 'pattern', pattern: 'nevera-cubitos', telegraph: 0.6, weight: 2 },
          ],
        },
      ],
    },
    boss: { title: 'La Nevera Suprema', motto: 'Congelamos los precios. Y las reclamaciones.' },
  },
};
