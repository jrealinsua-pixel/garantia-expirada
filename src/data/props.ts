import type { DummyDef, PropDef } from './types.ts';

// Positions are the bottom-centre of the sprite; boxes cover the footprint plus a bit of height
// so bullets hit what they visually hit.
export const PROPS: Record<string, PropDef> = {
  // M14b (h7): the low things of a room (this box, the drum, the bargain table and the trolley)
  // are jumped over rolling (PropDef.low), as in the Gungeon; walking, they are in the way.
  caja: { id: 'caja', name: 'Caja de devolución', box: { x: -11, y: -17, w: 22, h: 16 }, blocksBullets: true, low: true },
  // M9b (13a): it takes a few shots and goes up, taking whatever is near with it (the toaster too).
  // M14b (h5): three shots of the Secador and it is lit; the blast covers two and a half tiles (it was one and a half)
  // and takes most of a normal enemy with it (the human found it slow, small and weak).
  barril: {
    id: 'barril',
    name: 'Bidón de aceite usado',
    box: { x: -6, y: -14, w: 12, h: 13 },
    blocksBullets: true,
    hp: 4,
    blast: { radius: 64, damage: 18, hurt: 2 },
    low: true,
  },
  // M9b (13b): a bargain table. Bullets fly over it standing; tipped over with the interact
  // button, it covers from one side until it is shot to bits. M14b (h6): eight bullets, not
  // fourteen: cover for a burst or two, not for the whole room.
  mesa: { id: 'mesa', name: 'Mesa de Saldos', box: { x: -11, y: -13, w: 22, h: 12 }, blocksBullets: false, tip: { hp: 8 }, low: true },
  carrito: { id: 'carrito', name: 'Carro sin moneda', box: { x: -12, y: -12, w: 24, h: 10 }, blocksBullets: false, low: true },
  // Not placed by templates: it appears in some combat rooms when they are cleared (world.ts).
  // Placed on the shopkeeper's spot ($) of the shop: the till that sells (it does not move).
  autocobro: { id: 'autocobro', name: 'Caja de Autocobro', box: { x: -11, y: -16, w: 22, h: 14 }, blocksBullets: true },
  // The Mostrador de Devoluciones (the hub between runs): one stretch of counter per tile, so a row
  // of them joins up; the Caja sits on its own stretch.
  mostrador: { id: 'mostrador', name: 'Mostrador de Devoluciones', box: { x: -12, y: -16, w: 24, h: 15 }, blocksBullets: true },
  'caja-devoluciones': { id: 'caja-devoluciones', name: 'Caja de Devoluciones', box: { x: -12, y: -16, w: 24, h: 15 }, blocksBullets: true },
  turnos: { id: 'turnos', name: 'Máquina de Turnos', box: { x: -6, y: -8, w: 12, h: 7 }, blocksBullets: true },
  archivador: { id: 'archivador', name: 'Reclamaciones sin Resolver', box: { x: -10, y: -16, w: 20, h: 15 }, blocksBullets: true },
  chatarrero: { id: 'chatarrero', name: 'El Chatarrero', box: { x: -12, y: -12, w: 24, h: 10 }, blocksBullets: true },
  // The queue's posts: the tape between them is only drawn (the toaster ducks under it).
  poste: { id: 'poste', name: 'Poste de la Cola', box: { x: -3, y: -5, w: 6, h: 4 }, blocksBullets: false },
  // Not placed by templates: El Muñeco de Moda leaves it behind when it breaks out (BossPhase.shed, M10 5c).
  // Two tiles wide, it stops bullets from both sides: cover for the toaster, and for the Muñeco.
  'caja-muneco': { id: 'caja-muneco', name: 'Caja de la Temporada Pasada', box: { x: -24, y: -22, w: 48, h: 20 }, blocksBullets: true },
  // Not placed by templates: La Nube de Almacenamiento drops them in a wall when «Almacenamiento
  // lleno» (BossFolderAttack, M14 (j3)). They stop bullets both ways until shot to bits (only the
  // toaster's bullets wear them) and are gone after a few seconds anyway.
  'carpeta-nube': { id: 'carpeta-nube', name: 'Carpeta Sin Título (37)', box: { x: -8, y: -11, w: 16, h: 10 }, blocksBullets: true, hp: 8, crumble: true },
  // The long table of the Sala de Juntas (M10 planta 4 5a): seven tiles of walnut in the middle of
  // the Director's room. It stops bullets from every side and does not tip over: you go round it.
  // The box matches tools/sprites/director.ts TABLE_BOX (the sprite is 168x52).
  'mesa-juntas': { id: 'mesa-juntas', name: 'Mesa de Juntas (Aforo: Uno)', box: { x: -82, y: -40, w: 164, h: 36 }, blocksBullets: true },
  // The frosted glass partitions of the Sala de Juntas (M10 planta 4 5b): three wall tiles long and
  // one deep (the `_` is the middle one), stopping bullets like a wall. The Director moves them
  // round the room in his «Reestructuración» (BossPhase.restructure).
  'mampara-movil': { id: 'mampara-movil', name: 'Mampara de Cristal Esmerilado', box: { x: -36, y: -22, w: 72, h: 24 }, blocksBullets: true },
  // The low counters of the Centralita's room (M11 (2c2)): waist high and without a screen, three
  // tiles long. They stop bullets from both sides and block walking, but the toaster rolls over them
  // (PropDef.low). Boxes from tools/sprites/centralita.ts LOW_COUNTER_BOX and LOW_COUNTER_V_BOX.
  'mostrador-bajo': { id: 'mostrador-bajo', name: 'Mostrador Bajo de Departamento', box: { x: -36, y: -24, w: 72, h: 20 }, blocksBullets: true, low: true },
  // M12 (4c): the stacks of crates the Trituradora drops in «Control de calidad» (BossPhase.crates):
  // a whole tile each, so a column of them is a wall.
  'pila-cajas': { id: 'pila-cajas', name: 'Pila de Cajas «APTO»', box: { x: -12, y: -24, w: 24, h: 24 }, blocksBullets: true },
  'mostrador-bajo-v': { id: 'mostrador-bajo-v', name: 'Separador de Departamentos', box: { x: -12, y: -76, w: 24, h: 72 }, blocksBullets: true, low: true },
  // M14b (h11a1): a power strip with far too much plugged in. Low (rolled over), it still stops
  // bullets so it can be shot. While there is a fight it zaps whatever is near every few seconds,
  // enemies included; three hits and it shorts out with a last, bigger zap.
  regleta: {
    id: 'regleta',
    name: 'Regleta Sobrecargada',
    box: { x: -9, y: -9, w: 18, h: 8 },
    blocksBullets: true,
    hp: 3,
    blast: { radius: 46, damage: 10, hurt: 1 },
    zap: { every: 4.5, warn: 1.1, radius: 40, damage: 3, hurt: 1 },
    low: true,
  },
  // M14b (h11a2): a tall display rack loaded with returns, standing in the room on its own. It
  // stops bullets (cover) until it has had enough: then it wobbles, its landing shadowed, and goes
  // over away from whoever pushed it, flattening what is on the next tile. Lying down it is low
  // cover for good (rolled over, still stopping bullets).
  estanteria: {
    id: 'estanteria',
    name: 'Estantería Inestable',
    box: { x: -10, y: -14, w: 20, h: 12 },
    blocksBullets: true,
    topple: { hp: 6, warn: 0.6, damage: 10, hurt: 2, fallen: 'estanteria-caida' },
  },
  // What it becomes lying down. Its box is the one of the way it fell (world.ts FALLEN_BOX); this
  // one is lying to the right.
  'estanteria-caida': { id: 'estanteria-caida', name: 'Estantería Inestable (ya estable)', box: { x: -10, y: -14, w: 44, h: 12 }, blocksBullets: true, low: true },
  // M14b (h11a3): a big water jug of the kind nobody returns the deposit on. Low (rolled over), it
  // stops bullets; two hits and it bursts, leaving a puddle that carries a Regleta's zap.
  garrafa: {
    id: 'garrafa',
    name: 'Garrafa de Agua «de Manantial»',
    box: { x: -7, y: -11, w: 14, h: 10 },
    blocksBullets: true,
    hp: 2,
    spill: { rx: 34, ry: 22 },
    low: true,
  },
  cofre: { id: 'cofre', name: 'Caja Fuerte de Devoluciones', box: { x: -11, y: -14, w: 22, h: 13 }, blocksBullets: true },
};

export const DUMMIES: Record<string, DummyDef> = {
  maniqui: {
    id: 'maniqui',
    name: 'Maniquí de Rebajas',
    description: 'Lleva tres temporadas en el escaparate. Ya no siente nada, como el resto de la plantilla.',
    hurt: { x: -9, y: -32, w: 18, h: 30 },
    box: { x: -5, y: -4, w: 10, h: 4 },
  },
};

/** What La Nevera Suprema spits in its second phase: one frame each in the `producto-caducado` sheet. */
/**
 * M14b (h11a1): chance that an obstacle slot left empty gets a Regleta Sobrecargada instead, by
 * floor (Informática, the floor of chargers and cables, the most). Drawn with its own generator
 * (fillTemplate's `hazard`), so the rest of every room stays as it was.
 */
export const REGLETA_CHANCE: Record<number, number> = { 1: 0.15, 2: 0.4, 3: 0.25, 4: 0.35, 5: 0.3, 6: 0.4 };
/** Most Regletas in one room. */
export const REGLETA_MAX = 2;
/**
 * M14b (h11a2): chance that a combat room gets an Estantería Inestable in one of the obstacle slots
 * still empty, by floor (drawn with a generator of its own, like the Regleta's). The Juguetería
 * and the Oficinas, all shelving and filing, the most.
 */
export const SHELF_CHANCE: Record<number, number> = { 1: 0.3, 2: 0.25, 3: 0.4, 4: 0.4, 5: 0.3, 6: 0.35 };
/** Most of them in one room. */
export const SHELF_MAX = 1;
/**
 * M14b (h11a3): chance that a combat room gets a Garrafa de agua in an obstacle slot still empty,
 * by floor (twice that in a room with a Regleta: see room.ts SPILL_WITH_STRIP). Most in the Oficinas
 * (the water cooler) and in Atención al Cliente (the waiting room).
 */
export const SPILL_CHANCE: Record<number, number> = { 1: 0.2, 2: 0.25, 3: 0.2, 4: 0.35, 5: 0.3, 6: 0.25 };
export const SPILL_MAX = 1;

export const EXPIRED_PRODUCTS = ['Yogur', 'Brick de leche', 'Lata abollada'] as const;
