import type { ActiveItemDef, PassiveItemDef } from './types.ts';

/**
 * Passive items (floor 1, then floor 2's, which carry `level: 2`). Each one is just a modifier (src/sim/mods.ts): stat changes and
 * bullet behaviours. Damage changes by percentages (M9b (7): items raise stats less than they did,
 * and nothing adds whole points of damage any more: +1 was +50 % on the Secador and +100 % on a staple).
 * Almost every item gives something and takes something, so a build is a set of trade-offs.
 */
export const ITEMS: Record<string, PassiveItemDef> = {
  pila: {
    id: 'pila',
    name: 'Pila Casi Agotada',
    description: 'Dura lo que un contrato temporal. Después, nada.',
    sprite: 'objeto-pila',
    // Fires faster, but the magazine runs out sooner.
    mod: { id: 'pila', stats: [{ stat: 'fireRate', mul: 1.2 }, { stat: 'magazine', mul: 0.7 }] },
  },
  manual: {
    id: 'manual',
    name: 'Manual en Chino',
    description: 'Nadie sabe por qué funciona. Tampoco el fabricante.',
    sprite: 'objeto-manual',
    // Bullets bounce off walls twice.
    mod: { id: 'manual', stats: [{ stat: 'bulletLife', mul: 1.3 }], bullets: { bounce: 2 } },
  },
  garantia: {
    id: 'garantia',
    quality: 'buena',
    name: 'Garantía Extendida',
    description: 'Cubre todo excepto lo que te pase. La letra pequeña no se puede leer: forma parte del servicio.',
    sprite: 'objeto-garantia',
    // One more heart (it comes full).
    mod: { id: 'garantia', stats: [{ stat: 'maxHp', add: 2 }] },
  },
  regleta: {
    id: 'regleta',
    name: 'Regleta Sin Tierra',
    description: 'Seis enchufes y un solo contrato de luz. Lo que salte después no está cubierto.',
    sprite: 'objeto-regleta',
    // One more bullet per shot, more spread, a little slower.
    mod: { id: 'regleta', stats: [{ stat: 'pellets', add: 1 }, { stat: 'spreadDeg', add: 6 }, { stat: 'fireRate', mul: 0.6 }] },
  },
  tarjeta: {
    id: 'tarjeta',
    name: 'Tarjeta de Socio',
    description: 'Te sigue a todas partes. Como los correos de la tienda.',
    sprite: 'objeto-tarjeta',
    // Bullets turn towards the nearest enemy for a moment; slightly slower bullets.
    mod: { id: 'tarjeta', stats: [{ stat: 'bulletSpeed', mul: 0.9 }], bullets: { homing: { turnDeg: 220, time: 0.7, range: 110 } } },
  },
  etiqueta: {
    id: 'etiqueta',
    name: 'Etiqueta A+++',
    description: 'Eficiencia energética certificada por el propio fabricante.',
    sprite: 'objeto-etiqueta',
    // Walks faster and rolls again sooner.
    mod: { id: 'etiqueta', stats: [{ stat: 'speed', mul: 1.1 }, { stat: 'rollCooldown', mul: 0.85 }] },
  },
  alargador: {
    id: 'alargador',
    name: 'Alargador de Tres Metros',
    description: 'Llega a todas partes. Sobre todo a los tobillos.',
    sprite: 'objeto-alargador',
    // Bullets fly faster and further.
    mod: { id: 'alargador', stats: [{ stat: 'bulletLife', mul: 1.25 }, { stat: 'bulletSpeed', mul: 1.1 }] },
  },
  broca: {
    id: 'broca',
    quality: 'buena',
    name: 'Broca del Ocho',
    description: 'Para colgar un cuadro. Ya puestos, para todo lo demás.',
    sprite: 'objeto-broca',
    // Bullets go through one enemy; less knockback (they do not stop to push).
    mod: { id: 'broca', stats: [{ stat: 'knockback', mul: 0.6 }], bullets: { pierce: 1 } },
  },
  cinta: {
    id: 'cinta',
    name: 'Cinta Americana',
    description: 'Lo arregla todo durante una semana.',
    sprite: 'objeto-cinta',
    // Reloads faster.
    mod: { id: 'cinta', stats: [{ stat: 'reloadTime', mul: 0.75 }] },
  },
  resistencia: {
    id: 'resistencia',
    quality: 'buena',
    name: 'Resistencia de Recambio',
    description: 'Pieza no original. Calienta más de lo que pone en la caja.',
    sprite: 'objeto-resistencia',
    // A quarter more damage and bigger bullets, but fires slower and kicks harder (about +10 % per second).
    mod: { id: 'resistencia', stats: [{ stat: 'damage', mul: 1.3 }, { stat: 'bulletRadius', add: 1 }, { stat: 'fireRate', mul: 0.85 }, { stat: 'recoil', mul: 1.4 }] },
  },
  // ---- Floor 2 (Informática): only found from floor 2 on ----
  hinchada: {
    id: 'hinchada',
    name: 'Batería Hinchada',
    description: 'Rinde un 20 % más. Hasta que revienta. Eso no viene en la ficha técnica.',
    sprite: 'objeto-hinchada',
    // More punch, one heart less (M9b: items that take hearts away, not only give them).
    mod: { id: 'hinchada', stats: [{ stat: 'damage', mul: 1.25 }, { stat: 'maxHp', add: -2 }] },
  },
  usb: {
    id: 'usb',
    name: 'Pendrive de 2 GB',
    description: 'Cabe todo lo que no necesitas. Copiarlo tarda una tarde.',
    sprite: 'objeto-usb',
    level: 2,
    // A much longer magazine, but a slower reload.
    mod: { id: 'usb', stats: [{ stat: 'magazine', mul: 1.4 }, { stat: 'reloadTime', mul: 1.3 }] },
  },
  antivirus: {
    id: 'antivirus',
    name: 'Antivirus Gratuito',
    description: 'Te protege de todo menos de sí mismo. Gasta la mitad del procesador.',
    sprite: 'objeto-antivirus',
    level: 2,
    // One more heart, but everything else runs slower: walking and rolling again.
    mod: { id: 'antivirus', stats: [{ stat: 'maxHp', add: 2 }, { stat: 'speed', mul: 0.9 }, { stat: 'rollCooldown', mul: 1.3 }] },
  },
  permanencia: {
    id: 'permanencia',
    name: 'Contrato de Permanencia',
    description: 'Dieciocho meses de compromiso. El primero, gratis. Los otros diecisiete se cobran en salud.',
    sprite: 'objeto-permanencia',
    level: 2,
    // Much quicker on your feet and rolls, one heart less.
    mod: { id: 'permanencia', stats: [{ stat: 'speed', mul: 1.12 }, { stat: 'rollCooldown', mul: 0.7 }, { stat: 'maxHp', add: -2 }] },
  },
  hdmi: {
    id: 'hdmi',
    quality: 'buena',
    name: 'Cable HDMI Dorado',
    description: 'Mejora la imagen un 0 %. Lo pone en la caja, en letras doradas.',
    sprite: 'objeto-hdmi',
    level: 2,
    // Only good: faster bullets and half the spread.
    mod: { id: 'hdmi', stats: [{ stat: 'bulletSpeed', mul: 1.15 }, { stat: 'spreadDeg', mul: 0.6 }] },
  },
  ventilador: {
    id: 'ventilador',
    name: 'Ventilador de Portátil',
    description: 'Suena como un avión y enfría como una vela.',
    sprite: 'objeto-ventilador',
    level: 2,
    // Fires faster, but sprays wider and the bullets die sooner.
    mod: { id: 'ventilador', stats: [{ stat: 'fireRate', mul: 1.15 }, { stat: 'spreadDeg', add: 5 }, { stat: 'bulletLife', mul: 0.85 }] },
  },
  actualizacion: {
    id: 'actualizacion',
    quality: 'buena',
    name: 'Actualización Obligatoria',
    description: 'Reinicie para aplicar los cambios. Sí, ahora.',
    sprite: 'objeto-actualizacion',
    level: 2,
    // A quarter more damage, but every reload is a restart and the magazine shrinks.
    mod: { id: 'actualizacion', stats: [{ stat: 'damage', mul: 1.25 }, { stat: 'reloadTime', mul: 1.6 }, { stat: 'magazine', mul: 0.8 }] },
  },
  raton: {
    id: 'raton',
    quality: 'buena',
    name: 'Ratón Gaming RGB',
    description: 'Dieciséis millones de colores y un clic que a veces cuenta doble.',
    sprite: 'objeto-raton',
    level: 2,
    // One bullet in seven deals double damage. Only good.
    mod: { id: 'raton', bullets: { crit: { chance: 0.15, mul: 2 } } },
  },
  bateria: {
    id: 'bateria',
    name: 'Batería Externa',
    description: 'Carga cualquier cosa menos el móvil. Pesa como un ladrillo.',
    sprite: 'objeto-bateria',
    level: 2,
    // One more battery for the active item per room cleared, but it slows the toaster down.
    mod: { id: 'bateria', stats: [{ stat: 'speed', mul: 0.92 }], perks: { charge: 1 } },
  },
  cookies: {
    id: 'cookies',
    name: 'Cookies de Terceros',
    description: 'Aceptaste todas. Ahora cada enemigo te deja un regalito, y a ellos tus datos.',
    sprite: 'objeto-cookies',
    level: 2,
    // Half the enemies killed drop one more coupon. Only good (for you).
    mod: { id: 'cookies', perks: { coupons: 0.5 } },
  },
  avion: {
    id: 'avion',
    name: 'Modo Avión',
    description: 'Corta todas las conexiones. También las que vienen hacia ti.',
    sprite: 'objeto-avion',
    level: 2,
    // Rolling cuts the enemy bullets it touches, but the roll takes longer to come back.
    mod: { id: 'avion', stats: [{ stat: 'rollCooldown', mul: 1.25 }], perks: { rollClear: true } },
  },
  copia: {
    id: 'copia',
    quality: 'buena',
    name: 'Copia de Seguridad',
    description: 'Restaura el sistema tal y como estaba el martes. Funciona una vez, como todo.',
    sprite: 'objeto-copia',
    level: 2,
    // Once, instead of going down, the toaster gets a heart back; then the backup is gone.
    mod: { id: 'copia', perks: { revive: 2 } },
  },
  // Floor 3, la Juguetería (M10 6a): rarer, and most of them change how you play, not just the numbers.
  'pilas-no-incluidas': {
    id: 'pilas-no-incluidas',
    name: 'Pilas No Incluidas',
    description: 'Funciona de maravilla. Con otras pilas.',
    sprite: 'objeto-pilas-no',
    level: 3,
    // A fresh magazine goes much faster for a moment; the rest of the time, a bit slower.
    mod: { id: 'pilas-no-incluidas', stats: [{ stat: 'fireRate', mul: 0.9 }], perks: { rush: { mul: 1.4, time: 3 } } },
  },
  muelle: {
    id: 'muelle',
    name: 'Muelle de Juguete',
    description: 'Salta. No se sabe hacia dónde.',
    sprite: 'objeto-muelle',
    level: 3,
    // A longer roll and bullets that bounce once, but they go wherever they like.
    mod: { id: 'muelle', stats: [{ stat: 'rollSpeed', mul: 1.3 }, { stat: 'spreadDeg', add: 4 }], bullets: { bounce: 1 } },
  },
  purpurina: {
    id: 'purpurina',
    name: 'Bote de Purpurina',
    description: 'Se queda para siempre. En todo.',
    sprite: 'objeto-purpurina',
    level: 3,
    // Whatever it hits goes slower for two seconds; the bullets come out a little smaller.
    mod: { id: 'purpurina', stats: [{ stat: 'bulletRadius', mul: 0.85 }], bullets: { slow: { mul: 0.8, time: 2 } } },
  },
  'menu-infantil': {
    id: 'menu-infantil',
    name: 'Juguete del Menú Infantil',
    description: 'Venía con la comida. Duró menos que la comida.',
    sprite: 'objeto-menu-infantil',
    level: 3,
    // Quicker on your feet and on the trigger, one heart less.
    mod: { id: 'menu-infantil', stats: [{ stat: 'speed', mul: 1.15 }, { stat: 'fireRate', mul: 1.12 }, { stat: 'maxHp', add: -2 }] },
  },
  'caja-vacia': {
    id: 'caja-vacia',
    quality: 'buena',
    name: 'Caja de Cartón Vacía',
    description: 'El niño jugó con la caja. El juguete sigue sin abrir.',
    sprite: 'objeto-caja-vacia',
    level: 3,
    // Only good: one hit in five does nothing at all («Era solo la caja»).
    mod: { id: 'caja-vacia', perks: { shrug: 0.2 } },
  },
  pegatina: {
    id: 'pegatina',
    name: 'Pegatina de Edición Limitada',
    description: 'Solo se han fabricado diez millones.',
    sprite: 'objeto-pegatina',
    level: 3,
    // The last bullet of every magazine hits three times as hard (M10 6b1).
    mod: { id: 'pegatina', bullets: { last: { mul: 3 } } },
  },
  'llave-allen': {
    id: 'llave-allen',
    name: 'Llave Allen Sobrante',
    description: 'Siempre sobra una pieza. Esta es la tuya.',
    sprite: 'objeto-llave-allen',
    level: 3,
    // Once per floor, a chest opens without a ticket.
    mod: { id: 'llave-allen', perks: { freeChests: 1 } },
  },
  'mando-vibracion': {
    id: 'mando-vibracion',
    name: 'Mando con Vibración',
    description: 'Para notar cada golpe en la muñeca.',
    sprite: 'objeto-mando-vibracion',
    level: 3,
    // Every hit taken shakes out a ring of ten of its own bullets.
    mod: { id: 'mando-vibracion', perks: { hurtRing: 10 } },
  },
  plastilina: {
    id: 'plastilina',
    name: 'Plastilina Mezclada',
    description: 'Era de cuatro colores. Ahora es de uno, y no tiene nombre.',
    sprite: 'objeto-plastilina',
    level: 3,
    // Bullets that hit a wall or a prop stay stuck there 1.5 s and hurt whoever walks into them;
    // they fly ×0.85 slower (M10 6b2).
    mod: { id: 'plastilina', stats: [{ stat: 'bulletSpeed', mul: 0.85 }], bullets: { stick: { time: 1.5 } } },
  },
  'mascota-virtual': {
    id: 'mascota-virtual',
    quality: 'buena',
    name: 'Mascota Virtual',
    description: 'Había que darle de comer cada cinco minutos.',
    sprite: 'objeto-mascota-virtual',
    level: 3,
    // Only good, but fragile: each combat room cleared unhurt is ×1.1 damage more, up to ×1.3; a
    // hit and it starts again (M10 6b2).
    mod: { id: 'mascota-virtual', perks: { pet: { step: 0.1, max: 3 } } },
  },
  // Floor 4, las Oficinas (M10 planta 4 6a): work, streaks, deadlines and rewards that do not make up for it.
  'taza-empleado': {
    id: 'taza-empleado',
    name: 'Taza de Mejor Empleado',
    description: 'Te la dieron el año que no hubo subida.',
    sprite: 'objeto-taza-empleado',
    level: 4,
    // ×1.2 damage, but only while the life is full: the first hit and it is just a mug again.
    mod: { id: 'taza-empleado', perks: { fullHpDamage: 1.2 } },
  },
  'corbata-lunes': {
    id: 'corbata-lunes',
    name: 'Corbata de Lunes',
    description: 'Aprieta lo justo para recordar quién manda.',
    sprite: 'objeto-corbata-lunes',
    level: 4,
    // More damage, a little slower on your feet.
    mod: { id: 'corbata-lunes', stats: [{ stat: 'damage', mul: 1.2 }, { stat: 'speed', mul: 0.92 }] },
  },
  'cafe-maquina': {
    id: 'cafe-maquina',
    name: 'Café de Máquina',
    description: 'Sabe a vaso. Pero despierta.',
    sprite: 'objeto-cafe-maquina',
    level: 4,
    // Faster trigger and reload, but the hand shakes (+5° of spread).
    mod: { id: 'cafe-maquina', stats: [{ stat: 'fireRate', mul: 1.15 }, { stat: 'reloadTime', mul: 0.85 }, { stat: 'spreadDeg', add: 5 }] },
  },
  'silla-ruedas': {
    id: 'silla-ruedas',
    name: 'Silla con Ruedas',
    description: 'Ergonómica para otra espalda.',
    sprite: 'objeto-silla-ruedas',
    level: 4,
    // Faster, but it slides: it takes a long time to stop and to turn (rolling still stops dead).
    mod: { id: 'silla-ruedas', stats: [{ stat: 'speed', mul: 1.15 }], perks: { grip: 0.3 } },
  },
  'bola-antiestres': {
    id: 'bola-antiestres',
    name: 'Bola Antiestrés',
    description: 'Llevas tres. Ninguna ha funcionado.',
    sprite: 'objeto-bola-antiestres',
    level: 4,
    // After a hit, twice the breather; the trigger finger is a bit slower.
    mod: { id: 'bola-antiestres', stats: [{ stat: 'fireRate', mul: 0.9 }], perks: { hurtIframes: 2 } },
  },
};

/** Passive items a floor can hand out (seeded shuffle, see planFloor in src/sim/world.ts). */
export const FINDABLE_ITEMS: readonly string[] = Object.keys(ITEMS);

/** The passive items floor `level` can hand out: its own and those of the floors below. */
export function itemsUpTo(level: number): string[] {
  return FINDABLE_ITEMS.filter((id) => (ITEMS[id]!.level ?? 1) <= level);
}

/**
 * Active items (Q). Each one needs a number of batteries (one per combat room cleared); the
 * more it does, the more it needs.
 */
export const ACTIVE_ITEMS: Record<string, ActiveItemDef> = {
  encuesta: {
    id: 'encuesta',
    name: 'Encuesta de Satisfacción',
    description: 'Su opinión es muy importante para nosotros. Por eso nadie la lee.',
    sprite: 'objeto-encuesta',
    charges: 2,
    effect: { type: 'clearFire' },
  },
  espera: {
    id: 'espera',
    name: 'Música de Espera',
    description: 'Todos nuestros enemigos están ocupados. Su ataque será atendido en breve.',
    sprite: 'objeto-espera',
    charges: 3,
    effect: { type: 'hold', seconds: 3.5 },
  },
  pegamento: {
    id: 'pegamento',
    name: 'Pegamento Exprés',
    description: 'Pega cualquier cosa a cualquier cosa. Sobre todo los dedos. Un solo tubo: después se seca.',
    sprite: 'objeto-pegamento',
    // M9b (7): one use and it is gone (it used to refill in two rooms: a heart every two rooms).
    charges: 1,
    singleUse: true,
    effect: { type: 'heal', amount: 2 },
  },
};

/** Active items a floor can hand out (seeded shuffle). */
export const FINDABLE_ACTIVES: readonly string[] = Object.keys(ACTIVE_ITEMS);
