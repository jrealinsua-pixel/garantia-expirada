// Short texts the game shows. All visible text follows the humour guide in docs/DISENO.md.

/** Stamped over an enemy as it comes apart, like the label on a returned product. */
export const DEATH_STAMPS: readonly string[] = [
  'Fuera de garantía',
  'Dado de baja',
  'Sin reparación',
  'No reembolsable',
  'Obsoleto',
  'Piezas sueltas',
  'Mal uso acreditado',
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

/** Shown when the last enemy of a combat room falls and the shutters roll up. */
export const DOORS_OPEN_LINES: readonly string[] = [
  'Trámite completado · Valore nuestra atención',
  'Puertas desbloqueadas · Gracias por su paciencia',
  'Su reclamación ha sido archivada',
  'Sala despejada · Encuesta de satisfacción enviada',
];

/** Over the mixer when its slider jams on the red notch. */
export const TURBO_LINE = 'Turbo';
/** Over a critical hit (the gaming mouse). */
export const CRIT_LINE = 'Doble clic';
/** When the backup brings the toaster back. */
export const REVIVE_LINE = 'Restaurando copia del martes';
/** Over a printer when it jams. */
export const JAM_LINE = 'Atasco de papel';
/** Over a fake charger when it jumps up. */
export const REVEAL_LINE = 'No homologado';

/** Over a webcam when it starts recording, when it loses you, and when it tells the others. */
export const REC_LINE = 'Grabando';
export const REC_LOST_LINE = 'Conexión perdida';
export const ALERT_LINE = 'Compartiendo pantalla';

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
  impresora: { bullet: 'Factura impagada', contact: 'Atasco de papel con daños personales' },
  cargador: { bullet: 'Calambre de un cargador no homologado', contact: 'Cargador no homologado' },
  'raton-inalambrico': { bullet: 'Doble clic accidental', contact: 'Ratón que apareció de repente' },
  webcam: { bullet: 'Foto subida sin consentimiento', contact: 'Videollamada sorpresa' },
  'router-wifi': { bullet: 'Exceso de cobertura', contact: 'Reinicio forzoso' },
  repetidor: { bullet: 'Señal repetida', contact: 'Tropiezo con un repetidor' },
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
/** The hint when there is another floor upstairs. */
export const WIN_HINT_NEXT = 'R o clic: siguiente planta';

/** «Siguiente: …» when there is a next floor, by its number. */
export const FLOOR_NAMES: Record<number, string> = {
  2: 'Planta 2: Informática. Cobertura limitada.',
};
export const WIN_RESULT = 'Jefa de planta dada de baja';

/** «Siguiente: …» on the last floor there is (nothing upstairs yet). */
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
  /** The floor that comes next, if there is one (its number). */
  next?: number;
}

/** The lines of the floor-done report, top to bottom (same layout as the sick-leave report). */
export function winReport(info: WinReportInfo, pick: (n: number) => number): { label: string; text: string }[] {
  return [
    { label: 'Unidad', text: DOWN_UNIT },
    { label: 'Resultado', text: WIN_RESULT },
    { label: 'Sala', text: info.room },
    { label: 'Jornada', text: `${clock(info.seconds)} · Bajas: ${info.kills} · Cupones: ${info.coupons}` },
    { label: 'Siguiente', text: (info.next !== undefined ? FLOOR_NAMES[info.next] : undefined) ?? WIN_NEXT[pick(WIN_NEXT.length)]! },
    { label: 'Nota de la empresa', text: WIN_NOTES[pick(WIN_NOTES.length)]! },
  ];
}

/**
 * How the texts name the keys (Opciones › Teclas can change them): each action's own key, and
 * all of its keys («WASD o flechas»). src/render/keymap.ts writes these from the options.
 */
export interface KeyWords {
  move: { own: string; all: string };
  roll: { own: string; all: string };
  reload: { own: string; all: string };
  swap: { own: string; all: string };
  use: { own: string; all: string };
}
export const DEFAULT_KEY_WORDS: KeyWords = {
  move: { own: 'WASD', all: 'WASD o flechas' },
  roll: { own: 'Espacio', all: 'Espacio o mayúsculas' },
  reload: { own: 'R', all: 'R' },
  swap: { own: 'E', all: 'E' },
  use: { own: 'Q', all: 'Q' },
};

/** The line of controls under the first room (and the test room's extra keys). */
export const controlsHint = (k: KeyWords): string => `${k.move.own} mover · ratón apuntar · clic disparar · ${k.roll.own} rodar · ${k.reload.own} recargar`;
export const CONTROLS_HINT = controlsHint(DEFAULT_KEY_WORDS);
export const TEST_ROOM_HINT = '1-5 balas enemigas';
/** Instead of the ammo count while reloading. */
export const RELOADING = 'Recargando';

/** How to change weapon, shown the first time the toaster carries more than one. */
export const swapHint = (k: KeyWords): string => `${k.swap.own} o rueda del ratón: cambiar de arma`;
export const SWAP_HINT = swapHint(DEFAULT_KEY_WORDS);
/** Over a weapon just found (one at random). */
export const WEAPON_FOUND_LINES: readonly string[] = [
  'Sin ticket, sin garantía, sin preguntas',
  'Encontrado en Objetos Perdidos',
  'Producto de exposición',
  'Devuelto sin usar (casi)',
];

/** Active items: a line under its description when one is picked up (`n` batteries it needs). */
export const activeHint = (n: number, k: KeyWords = DEFAULT_KEY_WORDS): string => `${k.use.own}: usar · necesita ${n} pila${n === 1 ? '' : 's'} (una por sala limpia)`;
/** Over the toaster when an active item is used, by effect. */
export const ACTIVE_LINES: Record<string, string> = {
  clearFire: 'Encuesta enviada. Gracias por su tiempo.',
  hold: 'Sala en espera. Por orden de llegada.',
  heal: 'Reparado. Sin garantía.',
};
/** Q without enough batteries. */
export const NO_CHARGE_LINE = 'Sin batería';

/** Before the synergy's name, over the toaster and as the heading of the synergy box, when a synergy switches on. */
export const SYNERGY_LINE = 'Sinergia corporativa:';

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
export const itemKindActive = (k: KeyWords): string => `Objeto activo · se usa con ${k.use.own}`;
export const itemKindWeapon = (k: KeyWords): string => `Arma · ${k.swap.own} o rueda para cambiar`;
export const ITEM_KIND_ACTIVE = itemKindActive(DEFAULT_KEY_WORDS);
export const ITEM_KIND_WEAPON = itemKindWeapon(DEFAULT_KEY_WORDS);

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
export const OPTION_LABELS = {
  volume: 'Volumen de efectos',
  music: 'Volumen de música',
  fullscreen: 'Pantalla completa',
  shake: 'Temblor de cámara',
  flashes: 'Destellos suaves',
  bigText: 'Texto grande',
  keys: 'Cambiar teclas',
} as const;
/** Opciones › Teclas: which key does what. */
export const KEYS_TITLE = 'Teclas';
export const KEYS_SUB = 'Cambio de titularidad de las teclas. Sin coste adicional.';
export const KEYS_WAITING = 'Pulse la tecla nueva. Esc: cancelar.';
export const KEYS_RESERVED = 'Esa tecla es de la pausa. Elija otra.';
export const KEYS_RESET = 'Restablecer de fábrica';
export const KEYS_NONE = 'Sin tecla';
export const KEYS_ACTIONS = {
  up: 'Arriba',
  down: 'Abajo',
  left: 'Izquierda',
  right: 'Derecha',
  roll: 'Rodar',
  reload: 'Recargar',
  swap: 'Cambiar de arma',
  use: 'Objeto activo',
} as const;
export const CONFIRM_TITLE = '¿Pedir otra unidad?';
export const CONFIRM_TEXT = 'La unidad actual irá al punto limpio. Lo que lleva, también.';
export const CONFIRM_MENU = { yes: 'Sí, al punto limpio', no: 'No, que aguante' } as const;
export const CONTROLS_TITLE = 'Controles';
export const CONTROLS_HEADERS = ['Teclado y ratón', 'Mando'] as const;
/** Action, keyboard and mouse, pad. */
export const controlsRows = (k: KeyWords): readonly (readonly [string, string, string])[] => [
  ['Mover', k.move.all, 'Stick izquierdo'],
  ['Apuntar', 'Ratón', 'Stick derecho'],
  ['Disparar', 'Clic izquierdo', 'RT o RB'],
  ['Rodar', k.roll.all, 'A, LB o LT'],
  ['Recargar', k.reload.all, 'X'],
  ['Cambiar de arma', `${k.swap.all} o rueda`, 'Y'],
  ['Objeto activo', k.use.all, 'B'],
  ['Pausa', 'Esc o P', 'Start'],
];
export const CONTROLS_ROWS = controlsRows(DEFAULT_KEY_WORDS);
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

/** The title screen's record of past runs (src/sim/profile.ts). */
export const HISTORY_MENU = 'Historial';
export const HISTORY_TITLE = 'Historial de reclamaciones';
export const HISTORY_SUB = 'Guardado en este navegador. No en la nube: no nos fiamos.';
export const HISTORY_EMPTY = 'Sin reclamaciones. Todavía.';

export interface HistoryInfo {
  runs: number;
  downs: number;
  floorsCleared: number;
  bestFloorSeconds: number | null;
  bossesBeaten: number;
  kills: number;
  coupons: number;
  longestRun: number;
  found: number;
  findable: number;
  weapons: number;
  findableWeapons: number;
  /** The cause line of the most frequent breakdown (downCause) and how many times, if any. */
  cause: { text: string; times: number } | null;
}

/** The lines of the record, top to bottom. */
export function historyLines(h: HistoryInfo): { label: string; text: string }[] {
  return [
    { label: 'Reclamaciones presentadas', text: String(h.runs) },
    { label: 'Unidades dadas de baja', text: String(h.downs) },
    { label: 'Plantas superadas', text: h.bestFloorSeconds === null ? String(h.floorsCleared) : `${h.floorsCleared} · la más rápida en ${clock(h.bestFloorSeconds)}` },
    { label: 'Jefas de planta liquidadas', text: String(h.bossesBeaten) },
    { label: 'Electrodomésticos desmontados', text: String(h.kills) },
    { label: 'Cupones reunidos', text: String(h.coupons) },
    { label: 'Vida útil más larga', text: clock(h.longestRun) },
    { label: 'Objetos descubiertos', text: `${h.found} de ${h.findable}` },
    { label: 'Armas descubiertas', text: `${h.weapons} de ${h.findableWeapons}` },
    { label: 'Causa de baja más habitual', text: h.cause ? `${h.cause.text} (${h.cause.times})` : 'Ninguna (aún)' },
  ];
}

// The tablón «Productos en Exposición» of the Mostrador (src/render/board.ts).
export const BOARD_TITLE = 'Productos en Exposición';
/** An unlocked character that cannot be played yet (they arrive in a later version). */
export const BOARD_RESTOCK = 'Reposición pronto';
export const BOARD_FOOT = 'Unidades limitadas. Condiciones sujetas a cambios sin previo aviso.';

// The archivador «Reclamaciones sin Resolver» of the Mostrador (src/render/archivo.ts).
export const ARCHIVE_TITLE = 'Reclamaciones sin Resolver';
/** Nothing found yet: the open drawer says so. */
export const ARCHIVE_EMPTY = 'Cajón vacío. Su reclamación será atendida por riguroso orden de llegada.';
/** Next to a document found in the last run. */
export const ARCHIVE_NEW = 'Nuevo';
export const archivePage = (i: number, n: number): string => `Hoja ${i} de ${n}`;
export const archiveHint = (k: KeyWords): string => `${k.use.own}: pasar hoja`;
