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

/** Over a boss's name in its entrance card. */
export const BOSS_CARD_SUBTITLE = 'Jefa de planta · Almacén de devoluciones';
/** Bottom corner of the entrance card, once it can be skipped. */
export const BOSS_CARD_SKIP = 'Disparar: saltar';

/** Over the phase name when a boss changes phase (n is the phase, from 1). */
export const bossPhaseLabel = (n: number): string => `Fase ${n} · Hemos actualizado nuestras condiciones`;

/** Stamped over a boss when it finally comes apart, and the line under it. */
export const BOSS_DOWN_STAMP = 'Liquidación total';
export const BOSS_DOWN_LINE = 'La Dirección ha cesado su actividad. Nadie responderá a su reclamación.';

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
  'nevera-suprema': { bullet: 'Congelación por orden de la Dirección', contact: 'Portazo de la Dirección' },
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

/** Seconds as a clock: 44 → «0:44», 125 → «2:05». */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Label of the row of icons (weapons and items) at the foot of the reports. */
export const REPORT_GEAR = 'Equipaje';
/** Under the reports, next to the main hint. */
export const REPORT_MENU_HINT = 'Esc: menú principal';

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
    { label: 'Vida útil', text: `${clock(info.seconds)} · Bajas: ${info.kills} · Cupones: ${info.coupons}` },
    { label: 'Recomendación del fabricante', text: DOWN_ADVICE[pick(DOWN_ADVICE.length)]! },
  ];
}

/** Over the goods lift when it is ready to go down after the boss. */
export const LIFT_LINE = 'Montacargas a la planta 2 · Carga máxima: una tostadora';
/** Floats up when the toaster picks up a spare heart. */
export const HEART_LINE = 'Recambio original';

/** The report shown when the floor is done (the toaster went down the lift). */
export const WIN_TITLE = 'Incidencia resuelta';
export const WIN_STAMP = 'Planta superada';
export const WIN_HINT = 'R o clic: empezar otra jornada';
export const WIN_RESULT = 'Jefa de planta dada de baja';

/** «Siguiente planta: …» (there is no second floor yet). */
export const WIN_NEXT: readonly string[] = [
  'En obras. Disculpe las molestias.',
  'Pendiente de licitación.',
  'Cerrada por inventario.',
  'Disponible próximamente. Sin fecha.',
];

/** «Nota de la empresa»: a different joke each time. */
export const WIN_NOTES: readonly string[] = [
  'Su esfuerzo ha sido registrado y no será recompensado.',
  'Enhorabuena: ha ascendido a becario sin sueldo.',
  'Esta victoria no incluye garantía.',
  'Recuerde valorar a su jefa de planta con cinco estrellas.',
  'Recoja su premio en la planta 7, ventanilla 3, de 9:00 a 9:05.',
  'La Dirección ha sido sustituida por otra idéntica. Gracias.',
];

export interface WinReportInfo {
  room: string;
  seconds: number;
  kills: number;
  coupons: number;
}

/** The lines of the floor-done report, top to bottom (same layout as the sick-leave report). */
export function winReport(info: WinReportInfo, pick: (n: number) => number): { label: string; text: string }[] {
  return [
    { label: 'Unidad', text: DOWN_UNIT },
    { label: 'Resultado', text: WIN_RESULT },
    { label: 'Sala', text: info.room },
    { label: 'Jornada', text: `${clock(info.seconds)} · Bajas: ${info.kills} · Cupones: ${info.coupons}` },
    { label: 'Siguiente', text: WIN_NEXT[pick(WIN_NEXT.length)]! },
    { label: 'Nota de la empresa', text: WIN_NOTES[pick(WIN_NOTES.length)]! },
  ];
}

/** How to change weapon, shown the first time the toaster carries more than one. */
export const SWAP_HINT = 'E o rueda del ratón: cambiar de arma';
/** Over a weapon just found (one at random). */
export const WEAPON_FOUND_LINES: readonly string[] = [
  'Sin ticket, sin garantía, sin preguntas',
  'Encontrado en Objetos Perdidos',
  'Producto de exposición',
  'Devuelto sin usar (casi)',
];

/** Active items: a line under its description when one is picked up (`n` batteries it needs). */
export const activeHint = (n: number): string => `Q: usar · necesita ${n} pila${n === 1 ? '' : 's'} (una por sala limpia)`;
/** Over the toaster when an active item is used, by effect. */
export const ACTIVE_LINES: Record<string, string> = {
  clearFire: 'Encuesta enviada. Gracias por su tiempo.',
  hold: 'Su ataque es muy importante para nosotros.',
  heal: 'Reparado. Sin garantía.',
};
/** Q without enough batteries. */
export const NO_CHARGE_LINE = 'Sin batería';

/** Over the toaster, and as the heading of the synergy box, when a synergy switches on. */
export const SYNERGY_LINE = '¡Sinergia!';

/** Tickets and chests (M5). */
export const TICKET_LINE = 'Ticket de compra · válido 14 días';
export const CHEST_NAME = 'Caja Fuerte de Devoluciones';
export const CHEST_LOCKED_LINES: readonly string[] = [
  'Sin ticket no hay devolución',
  'Presente el ticket de compra',
  'Sin justificante no consta la compra',
  'Vuelva con el ticket. Y con paciencia',
];
export const CHEST_OPEN_LINES: readonly string[] = [
  'Devolución aceptada',
  'Reembolso en especie',
  'Abierto por el cliente: no admite cambios',
  'Ticket sellado y archivado',
];

/** Second line of the description window: what kind of thing was picked up. */
export const ITEM_KIND_PASSIVE = 'Objeto pasivo · se queda contigo';
export const ITEM_KIND_ACTIVE = 'Objeto activo · se usa con Q';
export const ITEM_KIND_WEAPON = 'Arma · E o rueda para cambiar';

/** The pause menu (Esc, P or Start). */
export const PAUSE_TITLE = 'En pausa';
/** Under the title: a different one each time. */
export const PAUSE_LINES: readonly string[] = [
  'Su partida está en espera. No cuelgue.',
  'Pausa de cinco minutos. Le quedan cuatro.',
  'Descanso no remunerado.',
  'La Dirección ha detenido la producción para revisar sus márgenes.',
];
export const PAUSE_MENU = {
  resume: 'Continuar',
  options: 'Opciones',
  controls: 'Controles',
  newUnit: 'Pedir otra unidad',
  back: 'Volver',
} as const;
export const OPTIONS_TITLE = 'Opciones';
export const OPTION_LABELS = { volume: 'Volumen de efectos', fullscreen: 'Pantalla completa', shake: 'Temblor de cámara' } as const;
export const CONFIRM_TITLE = '¿Pedir otra unidad?';
export const CONFIRM_TEXT = 'La unidad actual irá al punto limpio. Lo que lleva, también.';
export const CONFIRM_MENU = { yes: 'Sí, al punto limpio', no: 'No, que aguante' } as const;
export const CONTROLS_TITLE = 'Controles';
export const CONTROLS_HEADERS = ['Teclado y ratón', 'Mando'] as const;
/** Action, keyboard and mouse, pad. */
export const CONTROLS_ROWS: readonly (readonly [string, string, string])[] = [
  ['Mover', 'WASD o flechas', 'Stick izquierdo'],
  ['Apuntar', 'Ratón', 'Stick derecho'],
  ['Disparar', 'Clic izquierdo', 'RT o RB'],
  ['Rodar', 'Espacio o mayúsculas', 'A, LB o LT'],
  ['Recargar', 'R', 'X'],
  ['Cambiar de arma', 'E o rueda', 'Y'],
  ['Objeto activo', 'Q', 'B'],
  ['Pausa', 'Esc o P', 'Start'],
];
export const MENU_HINT = 'Flechas o WASD: elegir · Intro o espacio: aceptar · Esc: volver';
export const QUIT_TITLE = '¿Salir al menú principal?';
export const QUIT_TEXT = 'Esta partida se perderá. Como su garantía.';
export const QUIT_MENU = { yes: 'Sí, salir', no: 'No, sigo' } as const;
export const PAUSE_QUIT = 'Salir al menú principal';

/** The title screen. */
export const TITLE = 'Garantía Expirada';
export const TITLE_TAGLINE = 'Te vendieron una tostadora «para toda la vida». Duró hasta el martes.';
export const TITLE_MENU = {
  start: 'Presentar reclamación',
  practice: 'Sala de pruebas',
  options: 'Opciones',
  controls: 'Controles',
  credits: 'Créditos',
} as const;
export const TITLE_FOOTER = 'Megamarket Outlet · Almacén de devoluciones';
export const CREDITS_TITLE = 'Créditos';
/** Who made it (the engine's line is added by the title screen: data files may not name it). Every outside resource is listed in CREDITOS.md. */
export const CREDITS_LINES: readonly string[] = [
  'Programación, arte, sonido y textos: Claude (Anthropic)',
  'Idea, partidas de prueba y notas al margen: j',
  'Todo lo demás se ha hecho a mano, en código, dentro del proyecto.',
  'Ningún electrodoméstico fue reparado durante el desarrollo.',
];

/** The inventory, in the pause menu. */
export const INVENTORY_MENU = 'Inventario';
export const INVENTORY_TITLE = 'Inventario';
export const INVENTORY_SUB = 'Lo que llevas encima. Sin ticket regalo.';
export const INVENTORY_EMPTY = 'Nada. Como la garantía.';
export const INVENTORY_WEAPON = 'Arma en mano';
export const INVENTORY_ITEMS = 'Objetos';
export const INVENTORY_SYNERGIES = 'Sinergias';
export const INVENTORY_NO_SYNERGY = 'Ninguna encendida';
/** Before the value an item changed: what it was without items. */
export const INVENTORY_BEFORE = 'antes';
export const inventoryBatteries = (charge: number, needs: number): string => `Pilas: ${charge} de ${needs}`;
