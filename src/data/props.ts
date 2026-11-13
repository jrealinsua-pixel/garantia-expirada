import type { DummyDef, PropDef } from './types.ts';

// Positions are the bottom-centre of the sprite; boxes cover the footprint plus a bit of height
// so bullets hit what they visually hit.
export const PROPS: Record<string, PropDef> = {
  caja: { id: 'caja', name: 'Caja de devolución', box: { x: -11, y: -17, w: 22, h: 16 }, blocksBullets: true },
  // M9b (13a): it takes a few shots and goes up, taking whatever is near with it (the toaster too).
  barril: {
    id: 'barril',
    name: 'Bidón de aceite usado',
    box: { x: -6, y: -14, w: 12, h: 13 },
    blocksBullets: true,
    hp: 10,
    blast: { radius: 36, damage: 12, hurt: 2 },
  },
  // M9b (13b): a bargain table. Bullets fly over it standing; tipped over with the interact
  // button, it covers from one side until it is shot to bits.
  mesa: { id: 'mesa', name: 'Mesa de Saldos', box: { x: -11, y: -13, w: 22, h: 12 }, blocksBullets: false, tip: { hp: 14 } },
  carrito: { id: 'carrito', name: 'Carro sin moneda', box: { x: -12, y: -12, w: 24, h: 10 }, blocksBullets: false },
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
export const EXPIRED_PRODUCTS = ['Yogur', 'Brick de leche', 'Lata abollada'] as const;
