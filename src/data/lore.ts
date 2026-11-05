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
  {
    id: 'catalogo-1',
    kind: 'Catálogo de Navidad',
    title: 'Edición interna · No distribuir',
    source: { secret: 3 },
    pages: [
      'Novedad de la temporada: Robot de Cuerda «Segunda Vida». Muelle de tostadora, chapa de microondas y engranajes de batidora. Todo de la última planta.',
      'Garantía: la que les quedara a las piezas. Nota del departamento: no les quedaba ninguna. Por eso sale tan barato.',
      'Edad recomendada: 3+. Edad de las piezas: no pregunte.',
    ],
  },
  {
    id: 'inventario-1',
    kind: 'Hoja de inventario',
    title: 'Juguetería · Fin de temporada',
    source: { boss: 'muneco-moda' },
    pages: [
      'Muñecos de Moda sin vender: 4.000. Destino: Servicio Técnico, última planta. Motivo: «reacondicionar».',
      'Muñecos reacondicionados devueltos a la tienda: 0. Recibido a cambio: 8.000 ojos de cristal, «para los robots de la próxima temporada».',
      'Firmado: El Muñeco de Moda, jefe de planta. Debajo, a rotulador y con otra letra: «el siguiente es usted».',
    ],
  },
  {
    id: 'evaluacion-1',
    kind: 'Evaluación de desempeño',
    title: 'Oficinas · Recursos Inhumanos',
    source: { boss: 'director-rrhh' },
    pages: [
      'Producto: tostadora. Valoración: amortizada. Puntos fuertes: no se queja. Áreas de mejora: sigue funcionando.',
      'Objetivos para el próximo trimestre: ninguno. Destino: última planta, como todos. Motivo: «redistribución de recursos».',
      'Firmado: El Director de Recursos Inhumanos. Al margen, con su letra: «el mío también lo firmó alguien».',
    ],
  },
  {
    id: 'acta-1',
    kind: 'Acta de reunión',
    title: 'Comité de Dirección · Punto 3',
    source: { secret: 4 },
    pages: [
      'Asisten: Dirección, Recursos Inhumanos y Contabilidad. Excusa su ausencia el Servicio Técnico: «está reacondicionando».',
      'Punto 3: el Servicio Técnico entrega 2.000 kilos de electrodomésticos reacondicionados. Se compran a peso y se apuntan como activos, a precio de nuevo.',
      'Ruegos y preguntas: Contabilidad pregunta qué se reacondiciona exactamente. Se acuerda no volver a convocar a Contabilidad.',
    ],
  },
  {
    id: 'registro-1',
    kind: 'Registro de llamadas',
    title: 'Centralita · Últimos 30 días',
    source: { secret: 5 },
    pages: [
      'Llamadas recibidas: 41.207. Atendidas: 0. Tiempo medio de espera: «su llamada es importante». Motivo más frecuente: «no funciona».',
      'Desvíos: Almacén, Informática, Juguetería, Oficinas, Atención al Cliente. Todas las llamadas del edificio acaban en la misma extensión: la 0.',
      'Extensión 0: Servicio Técnico, última planta. Estado: comunicando desde la inauguración. A lápiz, al margen: «si alguien contesta, no le dejéis colgar».',
    ],
  },
];
