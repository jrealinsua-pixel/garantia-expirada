// What the people of the hub (el Mostrador de Devoluciones, docs/DISENO.md) say. Texts and the
// conditions that pick them are data; src/sim/dialogue.ts chooses from a Profile. Every page fits
// one speech bubble (DIALOGUE_PAGE_MAX characters). Humour: docs/DISENO.md.

/**
 * When a line can be said. Every field given must hold (an empty `when` always holds).
 * «Beaten» means the boss (enemy id) was taken down at least once, in any run.
 */
export interface DialogueWhen {
  minRuns?: number;
  maxRuns?: number;
  beaten?: readonly string[];
  notBeaten?: readonly string[];
  /** How many different bosses have been beaten, at least. */
  minBosses?: number;
  /** How the last run ended: 'none' before the first one. */
  last?: 'down' | 'floor' | 'none';
  /** The last run ended on this floor or higher. */
  lastMinLevel?: number;
  /** The last run was taken down by a boss. */
  lastByBoss?: boolean;
  /** The last run lasted less than this (s). */
  lastUnder?: number;
  /** At least this many different passive items ever found. */
  minFound?: number;
  /** Fewer than this many different passive items ever found. */
  maxFound?: number;
}

/** One thing to say: one or more pages, shown one after another in the bubble. */
export interface DialogueLine {
  id: string;
  pages: readonly string[];
  when?: DialogueWhen;
  /** Among the lines that can be said, only those with the highest priority are candidates. Default 0. */
  priority?: number;
}

/** Longest page, in characters (the speech bubble wraps in three lines of about 30). */
export const DIALOGUE_PAGE_MAX = 90;

// ---- La Caja de Devoluciones (behind the counter) ----
// Her first page about a run that ended badly is built from the cause of the breakdown
// (DOWN_CAUSES in texts.ts): «Motivo de la devolución: <cause>.» Then one of these comments.

export const CAJA = {
  name: 'Caja de Devoluciones',
  /** «Motivo de la devolución: <cause, starting in lower case>.» */
  reason: (cause: string): string => `Motivo de la devolución: ${cause.charAt(0).toLowerCase()}${cause.slice(1)}.`,
  /** «No cubierto», stamped at the end of every comment about a breakdown. */
  stamps: ['No cubierto.', 'Reclamación denegada.', 'Archivado sin leer.', 'Sellado. Siguiente.'],
  lines: [
    {
      id: 'caja-primera',
      when: { last: 'none' },
      pages: ['Mostrador de Devoluciones. Coja número.', 'No hay nadie más. Coja número igualmente.'],
    },
    {
      id: 'caja-primera-2',
      when: { last: 'none' },
      pages: ['Esta caja cierra en cinco minutos.', 'Lleva cerrando en cinco minutos desde 2009.'],
    },
    {
      id: 'caja-jefe',
      when: { last: 'down', lastByBoss: true },
      priority: 2,
      pages: ['La Dirección tramitó su baja en persona.', 'Es un honor que no le corresponde.'],
    },
    {
      id: 'caja-jefe-2',
      when: { last: 'down', lastByBoss: true },
      priority: 2,
      pages: ['Le tumbó un jefe de planta. Consta como «reestructuración».', 'No da derecho a indemnización.'],
    },
    {
      id: 'caja-rapida',
      when: { last: 'down', lastUnder: 60 },
      priority: 1,
      pages: ['Duración del producto: menos de un minuto.', 'Dentro de lo previsto por el fabricante.'],
    },
    {
      id: 'caja-rapida-2',
      when: { last: 'down', lastUnder: 60 },
      priority: 1,
      pages: ['Ha batido el récord de la casa.', 'El anterior era un móvil que se cayó al sacarlo de la caja.'],
    },
    {
      id: 'caja-arriba',
      when: { last: 'down', lastMinLevel: 2 },
      priority: 1,
      pages: ['Llegó a la segunda planta. Más lejos que el producto medio.', 'Eso no se reembolsa.'],
    },
    {
      id: 'caja-baja-1',
      when: { last: 'down' },
      pages: ['Rellene el formulario 27-B en tres copias. El bolígrafo no escribe.'],
    },
    {
      id: 'caja-baja-2',
      when: { last: 'down' },
      pages: ['Se ha detectado un uso del aparato. El uso anula la garantía.'],
    },
    {
      id: 'caja-baja-3',
      when: { last: 'down' },
      pages: ['Su caso se ha registrado con el número 0. Ya lo hemos resuelto: no.'],
    },
    {
      id: 'caja-baja-4',
      when: { last: 'down' },
      pages: ['¿Conserva el embalaje original? Entonces no conserva nada útil.'],
    },
    {
      id: 'caja-gana',
      when: { last: 'floor' },
      pages: ['Devolución rechazada: el producto funciona.', 'Se le devuelve al almacén de todos modos.'],
    },
    {
      id: 'caja-gana-2',
      when: { last: 'floor' },
      pages: ['Ha superado todas las plantas. Enhorabuena: eso no figura en ningún formulario.'],
    },
  ] satisfies readonly DialogueLine[],
} as const;

// ---- El teléfono del Servicio Técnico (on the wall, off the hook) ----
// The recording moves on with the bosses beaten: it plays the latest chapter unlocked. It hints at
// the Servicio Técnico and its office at the top of the building, never at the true ending (M12).

export const TELEFONO = {
  name: 'Teléfono del Servicio Técnico',
  lines: [
    {
      id: 'tel-0',
      pages: [
        'Ha llamado al Servicio Técnico. Su llamada es muy importante para nosotros.',
        'Por eso la vamos a escuchar más tarde. Mucho más tarde.',
        'Tiempo de espera estimado: un número que no cabe en esta pantalla.',
      ],
    },
    {
      id: 'tel-nevera',
      when: { beaten: ['nevera-suprema'] },
      priority: 1,
      pages: [
        'Le informamos de que la Dirección del almacén ha cesado su actividad.',
        'Sus reclamaciones pasan al Servicio Técnico, en la última planta del edificio.',
        'Para subir, siga las flechas. Las flechas no llevan a ningún sitio.',
      ],
    },
    {
      id: 'tel-router',
      when: { beaten: ['nevera-suprema', 'router-wifi'] },
      priority: 2,
      pages: [
        'Detectamos que ha desconectado nuestra red. Lo apuntamos en su expediente.',
        'El Servicio Técnico confirma que su reparación está en curso.',
        'Está en curso desde que salió de fábrica. Es un curso muy largo.',
      ],
    },
  ] satisfies readonly DialogueLine[],
} as const;

// ---- La máquina de turnos ----

export const TURNOS = {
  name: 'Máquina de turnos',
  /** The number being served: it never changes. */
  serving: 12,
  /** Added to the runs played to give the player's number. */
  offset: 4_000_000,
  screen: (serving: number, yours: number): string => `Atendiendo al ${serving} · Su turno: ${String(yours).replace(/\B(?=(\d{3})+$)/g, '.')}`,
  /** Under the screen, one at random. */
  notes: [
    'Tiempo de espera estimado: sí.',
    'Por favor, no golpee la máquina. Ya lo han hecho.',
    'Turno perdido si no está presente cuando le llamen. No le llamarán.',
  ],
} as const;

// ---- El Chatarrero (a squeaky shopping trolley, out after the first boss) ----
// In M9 he only talks: hints about what is still missing. The first hint whose condition holds
// (by priority) is the one he gives; when nothing is missing, small talk.

export const CHATARRERO = {
  name: 'El Chatarrero',
  /** He shows up once any boss has been beaten. */
  appears: { minBosses: 1 } satisfies DialogueWhen,
  lines: [
    {
      id: 'chat-hola',
      pages: ['Compro y vendo reacondicionados. Sobre todo vendo.', 'Bueno, de momento solo hablo. La tienda, más adelante.'],
    },
    {
      id: 'chat-rueda',
      pages: ['Esta rueda chirría desde que me sacaron del aparcamiento. Es mi seña de identidad.'],
    },
    {
      id: 'chat-router',
      when: { notBeaten: ['router-wifi'] },
      priority: 2,
      pages: ['Arriba, en Informática, manda un router que solo da cobertura en la otra habitación.', 'Escóndete detrás de algo cuando se reinicie.'],
    },
    {
      id: 'chat-objetos',
      when: { maxFound: 12 },
      priority: 1,
      pages: ['Hay mucha más chatarra por ahí de la que llevas encima.', 'Abre los cofres con tickets: lo bueno siempre está bajo llave.'],
    },
    {
      id: 'chat-secretas',
      when: { minBosses: 2 },
      priority: 1,
      pages: ['Dicen que en cada planta hay una sala que no sale en el plano.', 'Yo no la he visto. Pero yo no veo casi nada: soy un carrito.'],
    },
    {
      id: 'chat-expo',
      when: { minBosses: 1 },
      pages: ['¿Ves el tablón de Productos en Exposición? Esos aparatos no se quedan ahí para siempre.', 'Vence jefes, junta chatarra o cae muchas veces, y alguno se animará a salir.'],
    },
  ] satisfies readonly DialogueLine[],
} as const;
