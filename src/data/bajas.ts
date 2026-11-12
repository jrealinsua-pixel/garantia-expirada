// M13 (7c): each playable character's own way of going down. What flies off it (its debris sheet,
// tools/sprites/despiece.ts), what is left smoking or sparking on the floor, and how the
// sick-leave report (parte de baja) words it: the unit, the coverage excuse and the advice.
import { CHARACTERS } from './characters.ts';
import { DOWN_ADVICE, DOWN_COVERAGE } from './texts.ts';

/** Where something comes out of the fallen body, from its feet, `x` towards where it faced. */
export interface DownSpot {
  x: number;
  y: number;
}

export interface CharacterDown {
  /** «Unidad» in the reports. */
  unit: string;
  /** The label of the line with the time, kills and coupons («Vida útil»). */
  lifeLabel: string;
  /** Why nobody is going to pay for it (the line under the cause). */
  coverage: readonly string[];
  /** «Recomendación del fabricante». */
  advice: readonly string[];
  /** Its pieces: an 8 x 8 sheet of four, the first two flung from high up, the others from low. */
  debris: string;
  /** What bursts out as it comes apart. */
  burst: 'crumbs' | 'smoothie' | 'steam' | 'coffee' | 'glass';
  /** Whether it scatters metal scrap (chatarra) too: the appliances do; the intern does not. */
  scrap: boolean;
  /** Left on the floor afterwards: smoke (or steam, white) and sparks from its cord. */
  smoke?: DownSpot & { steam?: boolean };
  sparks?: DownSpot;
}

const TOSTADORA: CharacterDown = {
  unit: CHARACTERS.tostadora!.name,
  lifeLabel: 'Vida útil',
  coverage: DOWN_COVERAGE,
  advice: DOWN_ADVICE,
  debris: 'despiece',
  burst: 'crumbs',
  scrap: true,
  // Smoke from the empty slots (now on its side) and sparks from the frayed cord.
  smoke: { x: 26, y: -6 },
  sparks: { x: -12, y: -2 },
};

/** Each character's death; any other id goes down like the toaster. */
export const CHARACTER_DOWNS: Record<string, CharacterDown> = {
  tostadora: TOSTADORA,
  'batidora-vaso': {
    unit: CHARACTERS['batidora-vaso']!.name,
    lifeLabel: 'Vida útil',
    coverage: [
      'Uso real: una semana. Garantía: dos años. No cuadra.',
      'El vaso es un consumible. El motor, también.',
      'Restos verdes sin identificar en el interior.',
      'No cubierto por la garantía.',
    ],
    advice: [
      'Vuelva a la dieta. Con una batidora nueva.',
      'Los batidos se toman. No se dejan secar dentro.',
      'Regálela por Navidad. Nadie lo notará.',
      'Compre el modelo nuevo. Es igual, pero cuesta más.',
    ],
    debris: 'despiece-batidora',
    burst: 'smoothie',
    scrap: true,
    smoke: { x: 24, y: -6 },
    sparks: { x: -14, y: -2 },
  },
  plancha: {
    unit: CHARACTERS.plancha!.name,
    lifeLabel: 'Vida útil',
    coverage: [
      'La camisa no figuraba en la póliza.',
      'Cal acumulada: falta de mantenimiento.',
      'Daños a terceros (un cuello): a cargo del usuario.',
      'Excluido en la cláusula 14.b.',
    ],
    advice: [
      'Use agua destilada. Y otra plancha.',
      'A la próxima entrevista, vaya sin planchar.',
      'Planche a la temperatura de la etiqueta. Si la encuentra.',
      'Las piezas de recambio llegan en 6 a 8 semanas. Si llegan.',
    ],
    debris: 'despiece-plancha',
    burst: 'steam',
    scrap: true,
    // The tank still lets off steam.
    smoke: { x: 18, y: -8, steam: true },
    sparks: { x: -14, y: -2 },
  },
  becario: {
    unit: 'Becario Eterno (sin número de serie)',
    lifeLabel: 'Prácticas',
    coverage: [
      'No figura en el inventario. No consta la baja.',
      'Sin contrato no hay nada que cubrir.',
      'El convenio de prácticas no contempla esto.',
    ],
    advice: [
      'Se buscará otro becario. Hay cola.',
      'Gracias por su esfuerzo. Constará en su certificado.',
      'Su puesto lo cubrirá otro becario a media jornada.',
      'Devuelva la acreditación antes de irse.',
    ],
    debris: 'despiece-becario',
    burst: 'coffee',
    // Not an appliance: no scrap, no smoke, no sparks. He just lies there.
    scrap: false,
  },
  movil: {
    unit: CHARACTERS.movil!.name,
    lifeLabel: 'Vida útil',
    coverage: [
      'Pantalla rota: excluida por defecto.',
      'La batería es una pieza de desgaste. Se desgastó.',
      'Caídas, golpes y uso: no cubiertos.',
      'Daño estético: no afecta al funcionamiento.',
    ],
    advice: [
      'Pásese al modelo nuevo. Es igual, en otro color.',
      'Haga una copia de seguridad. Ah, ya es tarde.',
      'La batería no se cambia. Se cambia el móvil.',
      'Contrate el seguro antes de que se rompa. Ya no.',
    ],
    debris: 'despiece-movil',
    burst: 'glass',
    scrap: true,
    // No smoke from a phone: the cable sparks where the tape is.
    sparks: { x: -14, y: -2 },
  },
};

/** How the character `id` goes down (the toaster's way if it has none of its own). */
export function characterDown(id: string): CharacterDown {
  return CHARACTER_DOWNS[id] ?? TOSTADORA;
}
