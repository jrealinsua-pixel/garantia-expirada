// What an item or a weapon does, as short lines for the description window (and, later, the
// inventory). Each line says whether it is good or bad for the player, so the window can colour
// it: almost every item gives something and takes something.
import { activeHint, DEFAULT_KEY_WORDS, singleUseHint, type KeyWords } from './texts.ts';
import type { ActiveItemDef, CharacterDef, Modifier, StatKey, WeaponDef } from './types.ts';

export interface EffectLine {
  text: string;
  good: boolean;
}

/** Name of each stat, and whether more of it is better. */
const STATS: Record<StatKey, { name: string; more: boolean }> = {
  damage: { name: 'Daño', more: true },
  fireRate: { name: 'Cadencia', more: true },
  magazine: { name: 'Cargador', more: true },
  reloadTime: { name: 'Tiempo de recarga', more: false },
  spreadDeg: { name: 'Dispersión', more: false },
  bulletSpeed: { name: 'Velocidad de bala', more: true },
  bulletLife: { name: 'Alcance', more: true },
  bulletRadius: { name: 'Tamaño de bala', more: true },
  knockback: { name: 'Empuje', more: true },
  recoil: { name: 'Retroceso', more: false },
  pellets: { name: 'Balas por disparo', more: true },
  speed: { name: 'Velocidad', more: true },
  maxHp: { name: 'Vida máxima', more: true },
  rollCooldown: { name: 'Espera entre volteretas', more: false },
  rollSpeed: { name: 'Largo de voltereta', more: true },
};

const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);

/** One line per stat change and per bullet behaviour, in the order the modifier lists them. */
export function modifierLines(m: Modifier): EffectLine[] {
  const out: EffectLine[] = [];
  for (const c of m.stats ?? []) {
    const s = STATS[c.stat];
    if (c.add !== undefined && c.add !== 0) {
      // Life goes in halves of a heart.
      const text = c.stat === 'maxHp' ? `${signed(c.add / 2)} ${Math.abs(c.add) === 2 ? 'corazón' : 'corazones'}` : `${s.name} ${signed(c.add)}`;
      out.push({ text, good: c.add > 0 === s.more });
    }
    if (c.mul !== undefined && c.mul !== 1) {
      const pct = Math.round((c.mul - 1) * 100);
      out.push({ text: `${s.name} ${signed(pct)} %`, good: c.mul > 1 === s.more });
    }
  }
  const b = m.bullets;
  if (b?.pierce) out.push({ text: `Atraviesa ${b.pierce} ${b.pierce === 1 ? 'enemigo' : 'enemigos'}`, good: true });
  if (b?.bounce) out.push({ text: `Rebota ${b.bounce} ${b.bounce === 1 ? 'vez' : 'veces'}`, good: true });
  if (b?.homing) out.push({ text: 'Balas que persiguen', good: true });
  if (b?.slow) out.push({ text: `Frena a quien toca un ${Math.round((1 - b.slow.mul) * 100)} % durante ${String(b.slow.time).replace('.', ',')} s`, good: true });
  if (b?.last?.mul) out.push({ text: `La última bala del cargador: daño ×${b.last.mul}`, good: true });
  if (b?.last?.pierce) out.push({ text: b.last.pierce >= 10 ? 'La última bala atraviesa a todos' : `La última bala atraviesa ${b.last.pierce} más`, good: true });
  if (b?.stick) out.push({ text: `Las balas se quedan pegadas ${String(b.stick.time).replace('.', ',')} s donde chocan`, good: true });
  if (b?.stick?.slow) out.push({ text: `Los pegotes frenan un ${Math.round((1 - b.stick.slow.mul) * 100)} % a quien los pisa`, good: true });
  if (b?.crit) out.push({ text: `${Math.round(b.crit.chance * 100)} % de balas con daño ×${String(b.crit.mul).replace('.', ',')}`, good: true });
  if (b?.wave) out.push({ text: 'Las balas van en tirabuzón', good: true });
  const k = m.perks;
  if (k?.charge) out.push({ text: `+${k.charge} ${k.charge === 1 ? 'pila' : 'pilas'} por sala limpia`, good: true });
  if (k?.coupons) out.push({ text: `${Math.round(k.coupons * 100)} % de bajas con un cupón más`, good: true });
  if (k?.rollClear) out.push({ text: 'La voltereta corta balas', good: true });
  if (k?.rush) out.push({ text: `Tras recargar: cadencia +${Math.round((k.rush.mul - 1) * 100)} % durante ${String(k.rush.time).replace('.', ',')} s`, good: true });
  if (k?.shrug) out.push({ text: `${Math.round(k.shrug * 100)} % de golpes que no hacen daño`, good: true });
  if (k?.freeChests) out.push({ text: `${k.freeChests === 1 ? 'Un cofre' : `${k.freeChests} cofres`} por planta sin ticket`, good: true });
  if (k?.hurtRing) out.push({ text: `Al recibir un golpe suelta ${k.hurtRing} balas en corro`, good: true });
  if (k?.pet) {
    out.push({ text: `Sala limpia sin golpes: daño +${Math.round(k.pet.step * 100)} % (hasta +${Math.round(k.pet.step * k.pet.max * 100)} %)`, good: true });
    out.push({ text: 'Un golpe y vuelve a tener hambre', good: false });
  }
  if (k?.fullHpDamage) out.push({ text: `Con la vida llena: daño +${Math.round((k.fullHpDamage - 1) * 100)} %`, good: true });
  if (k?.grip) out.push({ text: 'Resbala: tarda en frenar y en girar', good: false });
  if (k?.hurtIframes) out.push({ text: `Tras un golpe, invulnerable ×${String(k.hurtIframes).replace('.', ',')} de tiempo`, good: true });
  if (k?.punchIn) out.push({ text: `Sala limpia en menos de ${k.punchIn} s: un cupón más`, good: true });
  if (k?.trial) out.push({ text: 'Se acaba al subir de planta', good: false });
  if (k?.discount) out.push({ text: `La tienda cobra un ${Math.round(k.discount * 100)} % menos`, good: true });
  if (k?.urgent) out.push({ text: `Tras cada voltereta, la siguiente bala: daño ×${String(k.urgent).replace('.', ',')}`, good: true });
  if (k?.replyAll) {
    out.push({ text: `${Math.round(k.replyAll.chance * 100)} % de aciertos se parten en ${k.replyAll.count} balas hacia otros`, good: true });
  }
  if (k?.chain) out.push({ text: 'La bala urgente siempre se parte, y sus trozos hacen el doble', good: true });
  if (k?.fullHpCharge) out.push({ text: `Sala limpia con la vida llena: +${k.fullHpCharge} ${k.fullHpCharge === 1 ? 'pila' : 'pilas'}`, good: true });
  if (k?.chargeMul) out.push({ text: `El objeto activo se carga un ${Math.round((k.chargeMul - 1) * 100)} % más deprisa`, good: true });
  if (k?.expiredChests) out.push({ text: `${Math.round(k.expiredChests * 10)} de cada 10 cofres de premio han caducado`, good: false });
  if (k?.queue) {
    out.push({ text: `Al entrar en una sala: daño ${Math.round((k.queue.start - 1) * 100)} %`, good: false });
    out.push({ text: `Cada ${k.queue.every} s en ella: daño +${Math.round(k.queue.step * 100)} % (hasta +${Math.round((k.queue.max - 1) * 100)} %)`, good: true });
  }
  if (k?.echo) out.push({ text: `Cada ${k.echo.every} s, un disparo se repite solo (daño ×${String(k.echo.mul).replace('.', ',')})`, good: true });
  if (k?.recorded) out.push({ text: `Quien te hiere queda grabado ${k.recorded.time} s: daño ×${String(k.recorded.mul).replace('.', ',')}`, good: true });
  if (k?.complaint) out.push({ text: `Tras un golpe: ${k.complaint.shots} disparos persiguen al culpable`, good: true });
  if (k?.escalate) out.push({ text: 'Las que persiguen al grabado: marca doble', good: true });
  if (k?.echoPierce) out.push({ text: `La repetición atraviesa ${k.echoPierce === 1 ? 'a un enemigo' : `a ${k.echoPierce} enemigos`}`, good: true });
  if (k?.stars) {
    out.push({ text: 'Sala limpia sin daño: una estrella', good: true });
    out.push({ text: `Con ${k.stars.need} estrellas: +${k.stars.hp / 2} ${k.stars.hp === 2 ? 'corazón' : 'corazones'}`, good: true });
    out.push({ text: 'Un golpe borra las estrellas', good: false });
  }
  if (k?.revive) out.push({ text: `Una vez: vuelve de la baja con ${k.revive / 2} ${k.revive === 2 ? 'corazón' : 'corazones'}`, good: true });
  return out;
}

/** What an active item does, and how to use it (with `keys`, the keys the player has chosen). */
export function activeLines(a: ActiveItemDef, keys: KeyWords = DEFAULT_KEY_WORDS): EffectLine[] {
  const e = a.effect;
  let what: string;
  if (e.type === 'clearFire') what = 'Borra las balas enemigas';
  else if (e.type === 'hold') what = `Congela la sala ${String(e.seconds).replace('.', ',')} s (a los jefes, los frena)`;
  else what = `Cura ${e.amount / 2} ${e.amount === 2 ? 'corazón' : 'corazones'}`;
  return [
    { text: what, good: true },
    { text: a.singleUse ? singleUseHint(keys) : activeHint(a.charges, keys), good: true },
  ];
}

const round1 = (n: number): string => String(Math.round(n * 10) / 10).replace('.', ',');

/** A weapon on paper: what it does in a second of trigger held (with its reloads), in one burst, in one pull, and how far it reaches. */
export interface WeaponProfile {
  /** Damage per second over many magazines (reloads included), if every bullet hits. */
  dps: number;
  /** Damage per second while the magazine lasts. */
  burst: number;
  /** Damage of one pull of the trigger (every pellet). */
  alpha: number;
  /** How far a bullet flies (px). */
  range: number;
  /** Seconds of fire a magazine gives. */
  magazineSeconds: number;
}

export function weaponProfile(w: WeaponDef): WeaponProfile {
  const alpha = w.damage * w.pellets;
  const magazineSeconds = w.magazine / w.fireRate;
  return {
    dps: (alpha * w.magazine) / (magazineSeconds + w.reloadTime),
    burst: alpha * w.fireRate,
    alpha,
    range: w.bulletSpeed * w.bulletLife,
    magazineSeconds,
  };
}

/** A weapon's numbers, so the differences between weapons can be read. */
export function weaponLines(w: WeaponDef): EffectLine[] {
  const shots = w.pellets > 1 ? ` × ${w.pellets}` : '';
  const range = Math.round((w.bulletSpeed * w.bulletLife) / 10) * 10;
  return [
    { text: `Daño ${round1(w.damage)}${shots} · ${round1(w.fireRate)} disparos/s`, good: true },
    { text: `Cargador ${w.magazine} · recarga ${round1(w.reloadTime)} s · alcance ${range}`, good: true },
  ];
}

/** One line of the stats table: the value without items, the value now, and whether it got better. */
export interface StatRow {
  label: string;
  base: string;
  now: string;
  /** 0 the same, 1 better than without items, -1 worse. */
  delta: -1 | 0 | 1;
}

function row(label: string, base: number, now: number, show: (n: number) => string, more: boolean): StatRow {
  const b = show(base);
  const n = show(now);
  const delta = b === n ? 0 : now > base === more ? 1 : -1;
  return { label, base: b, now: n, delta };
}

const shots = (w: WeaponDef): number => w.damage * w.pellets;
const reach = (w: WeaponDef): number => Math.round((w.bulletSpeed * w.bulletLife) / 10) * 10;

/** The weapon in hand, untouched and as the items leave it. */
export function weaponStatRows(base: WeaponDef, now: WeaponDef): StatRow[] {
  const dmg = (w: WeaponDef): string => (w.pellets > 1 ? `${round1(w.damage)} × ${w.pellets}` : round1(w.damage));
  return [
    { ...row('Daño', shots(base), shots(now), round1, true), base: dmg(base), now: dmg(now) },
    row('Cadencia', base.fireRate, now.fireRate, (n) => `${round1(n)}/s`, true),
    row('Cargador', base.magazine, now.magazine, String, true),
    row('Recarga', base.reloadTime, now.reloadTime, (n) => `${round1(n)} s`, false),
    row('Alcance', reach(base), reach(now), String, true),
    row('Dispersión', base.spreadDeg, now.spreadDeg, (n) => String(Math.round(n)), false),
  ];
}

/** The character, untouched and as the items leave it. */
export function characterStatRows(base: CharacterDef, now: CharacterDef): StatRow[] {
  return [
    row('Corazones', base.maxHp, now.maxHp, (n) => round1(n / 2), true),
    row('Velocidad', base.speed, now.speed, (n) => String(Math.round(n)), true),
    // In hundredths: the roll waits a few tenths, and an item changes it by a few hundredths.
    row('Voltereta cada', base.rollCooldown, now.rollCooldown, (n) => `${String(Math.round(n * 100) / 100).replace('.', ',')} s`, false),
  ];
}
