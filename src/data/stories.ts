// M13: each character's story (docs/DISENO.md, «Los cinco, en detalle»). The run starts with
// its return slip: the form the conveyor of the Mostrador reads out aloud as the product rides
// into the warehouse (src/render/ficha.ts lays it out, GameScene draws it). Keyed by character
// id: every one in the roster (src/data/unlocks.ts) has one, playable or not yet.
import type { KeyWords } from './texts.ts';

export interface CharacterStory {
  /** «Motivo de la devolución», as the customer filled it in (quoted on the slip). */
  reason: string;
  /** What the customer added in the comments box. */
  customer: string;
  /** What the shop found when it looked (it always finds the customer at fault). */
  diagnosis: string;
  /** The warranty, as it stands. */
  warranty: string;
  /** Where it goes now. */
  destination: string;
  /** Stamped across the slip at the end. Short: it is drawn at double size. */
  stamp: string;
}

export const SLIP_TITLE = 'Ficha de devolución';
/** The voice of the conveyor, over the slip while it reads. */
export const SLIP_READER = 'Lectura automática';
export const SLIP_LABELS = {
  product: 'Producto',
  reason: 'Motivo',
  customer: 'Comentarios',
  diagnosis: 'Diagnóstico',
  warranty: 'Garantía',
  destination: 'Destino',
} as const;

const TO_THE_WAREHOUSE = 'Almacén de devoluciones. Reacondicionar o triturar: lo que salga más barato.';

export const STORIES: Record<string, CharacterStory> = {
  tostadora: {
    reason: 'Quema las tostadas.',
    customer: '«Una de cada dos. Y la otra, regular.»',
    diagnosis: 'Funciona según lo previsto. El manual dice «tostado intenso».',
    warranty: 'Vencida el lunes. Se rompió el martes.',
    destination: TO_THE_WAREHOUSE,
    stamp: 'FUERA DE PLAZO',
  },
  'batidora-vaso': {
    reason: 'No se usa.',
    customer: '«Era para la dieta de los batidos. La dieta duró una semana.»',
    diagnosis: 'Sin un rasguño. El recetario de regalo, aún precintado.',
    warranty: 'En vigor. El cliente, no.',
    destination: TO_THE_WAREHOUSE,
    stamp: 'SIN USO',
  },
  plancha: {
    reason: 'Quemó una camisa.',
    customer: '«En mi entrevista de trabajo. No me cogieron por culpa de la plancha.»',
    diagnosis: 'Selector en LINO. La camisa era de poliéster.',
    warranty: 'Anulada por uso indebido. Del usuario.',
    destination: TO_THE_WAREHOUSE,
    stamp: 'USO INDEBIDO',
  },
  becario: {
    reason: 'Cierre de la delegación.',
    customer: '«Venía en la caja del material de oficina. Nadie sabe quién lo pidió.»',
    diagnosis: 'No es un electrodoméstico. Nadie firmó su baja. Sigue en prácticas.',
    warranty: 'Prácticas: seis meses. Lleva seis años.',
    destination: 'Almacén de devoluciones, con el material de oficina. Sin alta en la Seguridad Social.',
    stamp: 'SIN TRAMITAR',
  },
  movil: {
    reason: 'Ha salido el nuevo.',
    customer: '«Es igual, pero en otro color. Las fotos de diez años no las copié.»',
    diagnosis: 'Batería al 1 %. Datos no recuperables. Funda con purpurina, no incluida.',
    warranty: 'Caducada por una actualización del sistema.',
    destination: TO_THE_WAREHOUSE,
    stamp: 'OBSOLETO',
  },
};

/** The slip's rows, in the order the conveyor reads them out. */
export function returnSlip(id: string, name: string): { label: string; text: string }[] {
  const s = STORIES[id] ?? STORIES['tostadora']!;
  return [
    { label: SLIP_LABELS.product, text: name },
    { label: SLIP_LABELS.reason, text: `«${s.reason}»` },
    { label: SLIP_LABELS.customer, text: s.customer },
    { label: SLIP_LABELS.diagnosis, text: s.diagnosis },
    { label: SLIP_LABELS.warranty, text: s.warranty },
    { label: SLIP_LABELS.destination, text: s.destination },
  ];
}

/** The slip's number: from the run's seed, so the same run always has the same one. */
export function slipNumber(seed: string): string {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return `RMA-${String(h % 100000).padStart(5, '0')}`;
}

/** Under the slip: how to get on with it. */
export const slipHint = (k: KeyWords): string => `${k.interact.own} o disparar: seguir`;
