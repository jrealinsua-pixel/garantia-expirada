// Story documents (docs/DISENO.md): what the archivador «Reclamaciones sin Resolver» of the hub
// keeps. One for each boss beaten for the first time, and some in secret rooms. Read in order
// they tell, little by little, that the Servicio Técnico repairs nothing (never the whole truth:
// that is for the secret floor, M12). Each page fits the archivador's panel (LORE_PAGE_MAX).

export type LoreSource = { boss: string } | { secret: number };

export interface LoreDoc {
  id: string;
  /** Kind of paper, over the title: «Albarán», «Correo interno»… */
  kind: string;
  title: string;
  pages: readonly string[];
  /** How it is found: beating a boss (enemy id) or in the secret room of a floor (1 = the first). */
  source: LoreSource;
}

/** Longest page, in characters. */
export const LORE_PAGE_MAX = 160;

/** Shown in the archivador for a document not found yet. */
export const LORE_MISSING = 'Expediente extraviado. Se ruega no reclamar.';

/** In archivador order (the order the story is meant to be read). */
export const LORE: readonly LoreDoc[] = [
  {
    id: 'albaran-1',
    kind: 'Albarán de entrada',
    title: 'N.0000001 · Dirección del almacén',
    source: { boss: 'nevera-suprema' },
    pages: [
      'Remitente: Dirección del almacén de devoluciones. Destinatario: Servicio Técnico Oficial, última planta.',
      'Contenido: un aparato «averiado». Diagnóstico: no se ha abierto la caja. Observaciones: súbase como todos. No hace falta mirar.',
      'Firmado: La Nevera Suprema. Sello: «Congelado hasta nueva orden».',
    ],
  },
  {
    id: 'manual-1',
    kind: 'Manual de procedimiento',
    title: 'Página 1 de 400',
    source: { secret: 1 },
    pages: [
      'Paso 1: reciba el aparato con una sonrisa. Paso 2: retire la sonrisa. Paso 3: consulte la sección «Reparación».',
      'La sección «Reparación» ha sido arrancada. En el margen, a lápiz: «nunca la hubo».',
    ],
  },
  {
    id: 'correo-1',
    kind: 'Correo interno',
    title: 'Asunto: RE: RE: RE: el banco de pruebas',
    source: { boss: 'router-wifi' },
    pages: [
      '¿Alguien sabe dónde está el banco de pruebas del Servicio Técnico? Lo busco desde el lunes.',
      'Lo quitamos en 2011 para hacer sitio a la máquina nueva. La de arriba, la grande.',
      '¿Y qué repara la máquina nueva? / Los resultados del trimestre. Enviado desde mi router.',
    ],
  },
  {
    id: 'ticket-1',
    kind: 'Ticket de caja',
    title: 'Máquina de café de la última planta',
    source: { secret: 2 },
    pages: [
      'Café solo: 1,20. Café con leche: 1,40.',
      'Resistencia de tostadora, reacondicionada: 0,40. Puerta de microondas, reacondicionada: 0,15. Gracias por su visita.',
    ],
  },
];
