// Short texts the game shows. All visible text follows the humour guide in docs/DISENO.md.

/** Stamped over an enemy as it comes apart, like the label on a returned product. */
export const DEATH_STAMPS: readonly string[] = [
  'Fuera de garantía',
  'Dado de baja',
  'Sin reparación',
  'No reembolsable',
  'Obsoleto',
  'Piezas sueltas',
  'Daños por mal uso',
  'Descatalogado',
  'Sin piezas de recambio',
  'Reacondicionable',
];

/** In the boss room while its boss has not been made yet. */
export const BOSS_AWAY_LINE = 'La Dirección está reunida · Vuelva usted mañana';

/** Shown when the test room brings its enemies back. */
export const RESTOCK_LINE = 'Reposición de stock';

/** Over the mixer when its slider jams on the red notch. */
/** Shown when the last enemy of a combat room falls and the shutters roll up. */
export const DOORS_OPEN_LINES: readonly string[] = [
  'Incidencia resuelta · Valore nuestra atención',
  'Puertas desbloqueadas · Gracias por su paciencia',
  'Su reclamación ha sido archivada',
  'Sala despejada · Encuesta de satisfacción enviada',
];

export const TURBO_LINE = 'Turbo';

/** Title of the sick-leave report (parte de baja) shown instead of «game over». */
export const DOWN_TITLE = 'Parte de baja';
export const DOWN_HINT = 'R o clic: pedir otra unidad';
/** Red stamp slammed onto the report. */
export const DOWN_STAMP = 'Dado de baja';
export const DOWN_UNIT = 'Tostadora Reacondicionada';

/**
 * Cause of the breakdown, by what dealt the last blow (enemy id, or 'maniqui') and how.
 * Read as «Causa: …». Missing entries fall back to DOWN_CAUSE_DEFAULT.
 */
export const DOWN_CAUSES: Record<string, { bullet?: string; contact?: string }> = {
  aspirador: { contact: 'Atropello por aspirador en oferta' },
  microondas: { bullet: 'Exposición prolongada a microondas', contact: 'Golpe con microondas sin seguro' },
  bombilla: { bullet: 'Sobretensión de un mando intermedio', contact: 'Roce con un mando intermedio' },
  polilla: { contact: 'Ataque de polilla leal a la empresa' },
  batidora: { contact: 'Batido a velocidad turbo' },
  mando: { bullet: 'Zapeo a quemarropa', contact: 'Cambio de canal no solicitado' },
  maniqui: { bullet: 'Disparo de un maniquí de exposición' },
};
export const DOWN_CAUSE_DEFAULT = 'Daños por mal uso';

/** Second line under the cause: why nobody is going to pay for it. */
export const DOWN_COVERAGE: readonly string[] = [
  'No cubierto por la garantía.',
  'Excluido en la cláusula 14.b.',
  'Uso doméstico no autorizado.',
  'El aparato se usó. Eso anula la garantía.',
  'Daño estético: no afecta al funcionamiento.',
];

/** «Recomendación del fabricante»: a different joke each time. */
export const DOWN_ADVICE: readonly string[] = [
  'Compre el modelo nuevo. Es igual, pero cuesta más.',
  'Repararla cuesta más que una nueva. Lo diseñamos así.',
  'Llame a atención al cliente. Su llamada es muy importante.',
  'Lleve el aparato al punto limpio. Está a 40 km.',
  'La garantía venció ayer. Siempre vence ayer.',
  'Las piezas de recambio llegan en 6 a 8 semanas. Si llegan.',
  'Suscríbase a Tostadora Plus y averíese sin anuncios.',
  'Desenchufe, espere diez segundos y compre otra.',
  'Valore su experiencia del 1 al 10. Solo se admite el 10.',
  'Su unidad será sustituida por otra idéntica de peor calidad.',
];

/** The cause line for a report, from what took the player down. */
export function downCause(by: string, how: 'bullet' | 'contact'): string {
  return DOWN_CAUSES[by]?.[how] ?? DOWN_CAUSE_DEFAULT;
}

export interface DownReportInfo {
  by: string;
  how: 'bullet' | 'contact';
  room: string;
  seconds: number;
  kills: number;
  coupons: number;
}

/**
 * The lines of the sick-leave report, top to bottom. `pick(n)` chooses an index in [0, n): the
 * coverage excuse and the manufacturer's advice change every time.
 */
export function downReport(info: DownReportInfo, pick: (n: number) => number): { label: string; text: string }[] {
  return [
    { label: 'Unidad', text: DOWN_UNIT },
    { label: 'Causa', text: downCause(info.by, info.how) },
    { label: '', text: DOWN_COVERAGE[pick(DOWN_COVERAGE.length)]! },
    { label: 'Sala', text: info.room },
    { label: 'Vida útil', text: `${info.seconds} s · Bajas: ${info.kills} · Cupones: ${info.coupons}` },
    { label: 'Recomendación del fabricante', text: DOWN_ADVICE[pick(DOWN_ADVICE.length)]! },
  ];
}
