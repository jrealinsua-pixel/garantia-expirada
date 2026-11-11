// Short texts the game shows. All visible text follows the humour guide in docs/DISENO.md.

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
/** Mascota Virtual (M10 6b2): fed after a clean room (with its level), and dead of a hit. */
export const petFedLine = (level: number, max: number): string => (level >= max ? 'Mascota feliz (de momento)' : `Mascota alimentada ${level}/${max}`);
export const PET_DEAD_LINE = 'Tu mascota ha muerto. Otra vez';
/** Caja de Cartón Vacía (M10 6a): over the toaster when a hit does nothing. */
export const SHRUG_LINE = 'Era solo la caja';
/** Taza de Mejor Empleado (M10 planta 4 6a): over the toaster when the first hit takes its bonus away. */
export const MUG_LOST_LINE = 'Empleado del mes: otro';
/** Contrato en Prácticas (M10 planta 4 6b1): on the next floor, when the contract ends. */
export const TRIAL_END_LINE = 'Contrato no renovado';
/** Tarjeta de Fichar (M10 planta 4 6b1): the time stamped when a room is cleared fast enough. */
/** Código Promocional Caducado (M11 6a): where the prize chest should have turned up. */
export const EXPIRED_LINE = 'Promoción caducada';
/** Llamada Grabada (M11 6b1): over the enemy that hurt the toaster, now marked. */
export const RECORDED_LINE = 'Llamada grabada';
/** Etiquetadora: the third label on the same enemy goes off (one of these, at random). */
export const MARKDOWN_LINES: readonly string[] = ['Rebajado', 'Rebajado -30 %', 'Rebajado -50 %', 'Rebajado -70 %', 'Rebajado: sin devolución'];
/** Hoja de Reclamaciones (M11 6b2): over the enemy that hurt the toaster, the complaint filed. */
export const COMPLAINT_LINE = 'Reclamación presentada';
/** Valoración de Cinco Estrellas (M11 6b2): a star earned, the heart they pay, or the stars wiped by a hit. */
export const starsLine = (stars: number, need: number): string => `Valoración: ${stars} de ${need}`;
export const STARS_PAID_LINE = 'Cinco estrellas: +1 corazón';
export const STARS_LOST_LINE = 'Valoración retirada';
/** Número de Turno (M11 6b1): over the toaster each time the queue moves on (it never gets to the 87). */
export const queueLine = (level: number, top: boolean): string => (top ? 'Siguiente, por favor' : `Van por el ${12 + level}`);
export const punchLine = (secs: number): string => `Fichado: 0:${String(Math.floor(secs)).padStart(2, '0')}`;
/** Over a printer when it jams. */
export const JAM_LINE = 'Atasco de papel';
/** Over a fake charger when it jumps up. */
export const REVEAL_LINE = 'No homologado';

/** Over a wind-up robot when it runs down. */
export const WIND_DOWN_LINE = 'Cuerda agotada';
/** Over a shredder about to lunge. */
export const SHRED_JAM_LINE = 'Atasco';
/** Over a photocopier's copy as it comes out, and over the photocopier when it breaks (its copies fade). */
export const COPY_LINE = 'Copia no compulsada';
export const TONER_OUT_LINE = 'Sin tóner';
/** Over the toaster when it tries to roll on a stamp's ink (and over the stamp when it stamps). */
export const ROLL_DENIED_LINE = 'Solicitud denegada';
export const STAMP_LINE = 'Denegado';
/** Over an air conditioner when it starts blowing its frost (the display never changes). */
export const AC_LINE = 'A 17 grados';
/** A ticket dispenser's turn (M11 (4a)): the number, always three digits, as on its screen. */
export const turnNumber = (n: number): string => String(n).padStart(3, '0');
/** Over the circle when it is called, and when the toaster gets there in time or does not. */
export const turnCallLine = (n: number, desk: number): string => `Turno ${turnNumber(n)}, ventanilla ${desk}`;
export const TURN_SERVED_LINE = 'Atendido';
export const TURN_LOST_LINE = 'Turno perdido';
/** Bumping into the queue posts' tape (M11 (4b)), and the tape snapping back when one breaks. */
export const TAPE_BUMP_LINE = 'No se cuele';
export const TAPE_SNAP_LINE = 'Cola disuelta';
/** The virtual assistant (M11 (4c)): typing, its shield going up, and when it breaks. */
export const TYPING_LINE = 'Escribiendo...';
export const FAQ_LINE = 'Pregunta frecuente';
export const HELP_ASK_LINE = '¿Le he ayudado?';
/** The reception phone (M11 (4d)): passing you on to a colleague, or, with nobody left, putting you on hold. */
export const TRANSFER_LINE = 'Le paso con un compañero';
export const HOLD_LINE = 'No cuelgue, por favor';
/** La Centralita (M11 5b): the departments of her room (BossPhase.transfer), 1-4, as painted on the floor. */
export const DEPARTMENT_NAMES: readonly string[] = ['Reclamaciones', 'Facturación', 'Averías', 'Bajas'];
/** Her voice menu reading itself out while the zones light up. */
export const MENU_INTRO_LINES: readonly string[] = [
  'Escuche atentamente las siguientes opciones',
  'Nuestro menú ha cambiado',
  'Para continuar en español, no haga nada',
  'Por su seguridad, esta llamada podrá ser grabada',
];
/** And the option she picks (`n` is the zone to press). */
export const menuOptionLine = (n: number, k: number): string =>
  [
    `Para reclamaciones, pulse ${n}`,
    `Para hablar con un operador, pulse ${n}`,
    `Si su producto no funciona, pulse ${n}`,
    `Para darse de baja, pulse ${n}`,
    `Para escuchar de nuevo este menú, pulse ${n}`,
    `Para todo lo demás, pulse ${n}`,
  ][k % 6]!;
/** The bell before she puts you through, and where you end up (`dept` 1-4). */
export const DEPT_MARK_LINE = 'Un momento, le transfiero';

/** Over the Centralita while she is quiet (BossPhase.mute, M11 (5c)): the busy tone, written down. */
export const MUTE_LINE = 'Pi. Pi. Pi.';
export const deptTransferLine = (dept: number): string => `Departamento de ${DEPARTMENT_NAMES[dept - 1] ?? 'Otros'}. Espere.`;

/** Over a remote-control car when its batteries give out. */
export const STALL_LINE = 'Pilas no incluidas';

/** Over the toaster when it steps on a building piece. */
export const BRICK_LINE = 'Pieza pisada';

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
  bidon: { contact: 'Bidón de aceite usado sin etiquetar' },
  microondas: { bullet: 'Exposición prolongada a microondas', contact: 'Golpe con microondas sin seguro' },
  bombilla: { bullet: 'Sobretensión de un mando intermedio', contact: 'Roce con un mando intermedio' },
  polilla: { contact: 'Ataque de polilla leal a la empresa' },
  batidora: { contact: 'Batido a velocidad turbo' },
  mando: { bullet: 'Zapeo a quemarropa', contact: 'Cambio de canal no solicitado' },
  impresora: { bullet: 'Factura impagada', contact: 'Atasco de papel con daños personales' },
  cargador: { bullet: 'Calambre de un cargador no homologado', contact: 'Cargador no homologado' },
  'raton-inalambrico': { bullet: 'Doble clic accidental', contact: 'Ratón que apareció de repente' },
  webcam: { bullet: 'Foto subida sin consentimiento', contact: 'Videollamada sorpresa' },
  'robot-cuerda': { bullet: 'Tuerca suelta de un juguete de segunda mano', contact: 'Atropello por juguete sin frenos' },
  'coche-teledirigido': { contact: 'Atropello por un coche sin carné' },
  destructora: { bullet: 'Papeleo devuelto sin leer', contact: 'Triturado por error' },
  climatizador: { bullet: 'Resfriado de oficina', contact: 'Arrollado por un climatizador' },
  'dispensador-turnos': { bullet: 'Corte con tique de turno, ya caducado', contact: 'Atendido por orden de llegada' },
  'telefono-recepcion': { bullet: 'Llamada perdida, de las que no se devuelven', contact: 'Transferido a otro departamento' },
  'asistente-virtual': { bullet: 'Respuesta automática que no respondía a nada', contact: 'Atropellado por la ayuda' },
  'poste-cola': { bullet: 'Rodamiento perdido de una cola', contact: 'Reconducido a la cola por un poste' },
  sello: { bullet: 'Mancha de tinta indeleble', contact: 'Denegado, con sello y fecha' },
  fotocopiadora: { bullet: 'Corte con folio, por duplicado', contact: 'Atropello por fotocopiadora averiada' },
  'sobre-sorpresa': { bullet: 'Confeti de papel de regalo en el ojo', contact: 'Sobre abierto con los dientes' },
  'munequito-repetido': { contact: 'Mordisco de un repetido' },
  'munequito-dorado': { bullet: 'Fiebre del coleccionista', contact: 'Edición limitada en la cara' },
  'cubo-piezas': { contact: 'Pieza pisada descalzo de madrugada' },
  'router-wifi': { bullet: 'Exceso de cobertura', contact: 'Reinicio forzoso' },
  'muneco-moda': { bullet: 'Tacón de la temporada pasada', contact: 'Atropello en plena pasarela' },
  'director-rrhh': { bullet: 'Despido por carta certificada', contact: 'Atropellado por una silla ergonómica' },
  centralita: { bullet: 'Llamada finalizada por el sistema', contact: 'Arrollado por un cuadro de clavijas' },
  'silla-director': { contact: 'Atropello por silla de dirección sin director' },
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
/** Over the toaster when it picks up a Garantía Provisional (M9b 12a). */
export const SHIELD_LINE = 'Garantía provisional · 30 días';
/** When the provisional warranty takes a hit, and when it is used up. */
export const SHIELD_HIT_LINE = 'Cubierto. Esta vez.';
export const SHIELD_GONE_LINE = 'Garantía agotada';
/** The special hearts (M9b 12b): the surge heart half gone, and broken (the shock); the turbo over. */
export const SURGE_HIT_LINE = 'Chisporrotea';
export const SURGE_LINE = 'Subida de tensión · daños no cubiertos';
export const TURBO_END_LINE = 'Fin del modo turbo';

/** The report shown when the floor is done (the toaster went down the lift). */
export const WIN_TITLE = 'Incidencia resuelta';
export const WIN_STAMP = 'Planta superada';
export const WIN_HINT = 'R o clic: empezar otra jornada';
/** The hint when there is another floor upstairs. */
export const WIN_HINT_NEXT = 'R o clic: siguiente planta';

/** «Siguiente: …» when there is a next floor, by its number. */
export const FLOOR_NAMES: Record<number, string> = {
  2: 'Planta 2: Informática. Cobertura limitada.',
  3: 'Planta 3: Juguetería. Edad recomendada: ninguna.',
  4: 'Planta 4: Oficinas. Horario flexible: siempre.',
  5: 'Planta 5: Atención al Cliente. Espere su turno.',
};
/** Neutral on purpose: the boss of a floor may be the Nevera (she), the Router (he) or whoever comes next. */
export const WIN_RESULT = 'Jefatura de planta dada de baja';

/** «Siguiente: …» on the last floor there is (nothing upstairs yet). */
export const WIN_NEXT: readonly string[] = [
  'En obras. Disculpe las molestias.',
  'Pendiente de licitación.',
  'Cerrada por inventario.',
  'Disponible próximamente. Sin fecha.',
];

/**
 * The whole run won: the last floor's boss has fallen (M11 3). The same form, closing the
 * incident that opened when the toaster was thrown away.
 */
export const RUN_WIN_TITLE = 'Su incidencia ha sido cerrada';
export const RUN_WIN_STAMP = 'Incidencia cerrada';
export const RUN_WIN_HINT = 'R o clic: volver al Mostrador';
export const RUN_WIN_RESULT = 'Garantía restablecida. Sin efectos retroactivos';
/** «Resolución»: how the company closes it (a different one each time; none of them helps). */
export const RUN_WIN_RESOLUTION: readonly string[] = [
  'Su producto será reacondicionado y vendido otra vez.',
  'Se ha resuelto su incidencia. No nos consta cuál era.',
  'Caso cerrado por satisfacción presunta del cliente.',
  'Le enviaremos una encuesta. No cambiará nada.',
  'Su reclamación se archivará en la extensión 0.',
];

/** «Nota de la empresa»: a different joke each time. */
export const WIN_NOTES: readonly string[] = [
  'Su esfuerzo ha sido registrado y no será recompensado.',
  'Enhorabuena: ha ascendido a becario sin sueldo.',
  'Esta victoria no incluye garantía.',
  'Recuerde valorar a su jefatura de planta con cinco estrellas.',
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

/** The lines of the run-won report (the last floor's boss has fallen), same layout as the others. */
export function runWinReport(info: WinReportInfo & { floors: number; totalSeconds: number; totalKills: number }, pick: (n: number) => number): { label: string; text: string }[] {
  return [
    { label: 'Unidad', text: DOWN_UNIT },
    { label: 'Resultado', text: RUN_WIN_RESULT },
    { label: 'Sala', text: info.room },
    { label: 'Expediente', text: `${info.floors} plantas · ${clock(info.totalSeconds)} · Bajas: ${info.totalKills} · Cupones: ${info.coupons}` },
    { label: 'Resolución', text: RUN_WIN_RESOLUTION[pick(RUN_WIN_RESOLUTION.length)]! },
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
  interact: { own: string; all: string };
}
export const DEFAULT_KEY_WORDS: KeyWords = {
  move: { own: 'WASD', all: 'WASD o flechas' },
  roll: { own: 'Espacio', all: 'Espacio o mayúsculas' },
  reload: { own: 'R', all: 'R' },
  swap: { own: 'E', all: 'E' },
  use: { own: 'Q', all: 'Q' },
  interact: { own: 'F', all: 'F' },
};

/** The line of controls under the first room (and the test room's extra keys). */
export const controlsHint = (k: KeyWords): string => `${k.move.own} mover · ratón apuntar · clic disparar · ${k.roll.own} rodar · ${k.reload.own} recargar`;
export const CONTROLS_HINT = controlsHint(DEFAULT_KEY_WORDS);
/** In the Mostrador nothing is shot: how to move, and where the run starts. */
export const hubHint = (k: KeyWords): string => `${k.move.own} mover · ${k.interact.own} hablar · la cinta de «Mercancía devuelta» empieza la partida`;
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
/** The hint of an active item that is used once and gone. */
export const singleUseHint = (k: KeyWords = DEFAULT_KEY_WORDS): string => `${k.use.own}: usar · un solo uso`;
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
/** The rare one, with only good things in it (nota del humano del 2026-10-30). */
export const CHEST_NAME_PREMIUM = 'Caja Fuerte Premium · Solo Clientes Oro';
export const CHEST_LOCKED_LINES: readonly string[] = [
  'Sin ticket no hay devolución',
  'Presente el ticket de compra',
  'Sin justificante no consta la compra',
  'Vuelva con el ticket. Y con paciencia',
];
/** Llave Allen Sobrante (M10 6b1): a chest opened without a ticket. */
export const ALLEN_LINE = 'Sobraba una pieza';
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
  interact: 'Interactuar',
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
  ['Rodar', k.roll.all, 'A o LT'],
  ['Recargar', k.reload.all, 'X'],
  ['Cambiar de arma', `${k.swap.all} o rueda`, 'Y'],
  ['Objeto activo', k.use.all, 'B'],
  ['Hablar, comprar, abrir', k.interact.all, 'LB'],
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
/**
 * Under the toaster when the interact button would do something (nota del humano del
 * 2026-10-30): the key and what it does there.
 */
export const INTERACT_VERBS = {
  chest: 'Abrir',
  tip: 'Volcar',
  shop: 'Comprar',
  caja: 'Hablar',
  telefono: 'Descolgar',
  turnos: 'Coger número',
  chatarrero: 'Hablar',
  tablon: 'Mirar',
  archivador: 'Abrir cajón',
} as const;
export const interactPrompt = (k: KeyWords, verb: string): string => `${k.interact.own}: ${verb}`;
export const archiveHint = (k: KeyWords): string => `${k.interact.own}: pasar hoja`;
/** Over a story document picked up in a secret room (it goes to the archivador). */
export const docFoundLine = (kind: string): string => `${kind}: al archivador`;
