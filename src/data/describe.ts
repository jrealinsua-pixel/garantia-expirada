// What an item or a weapon does, as short lines for the description window (and, later, the
// inventory). Each line says whether it is good or bad for the player, so the window can colour
// it: almost every item gives something and takes something.
import { activeHint } from './texts.ts';
import type { ActiveItemDef, Modifier, StatKey, WeaponDef } from './types.ts';

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
  return out;
}

/** What an active item does, and what it costs to use. */
export function activeLines(a: ActiveItemDef): EffectLine[] {
  const e = a.effect;
  let what: string;
  if (e.type === 'clearFire') what = 'Borra las balas enemigas';
  else if (e.type === 'hold') what = `Congela la sala ${String(e.seconds).replace('.', ',')} s`;
  else what = `Cura ${e.amount / 2} ${e.amount === 2 ? 'corazón' : 'corazones'}`;
  return [
    { text: what, good: true },
    { text: activeHint(a.charges), good: true },
  ];
}

const round1 = (n: number): string => String(Math.round(n * 10) / 10).replace('.', ',');

/** A weapon's numbers, so the differences between weapons can be read. */
export function weaponLines(w: WeaponDef): EffectLine[] {
  const shots = w.pellets > 1 ? ` × ${w.pellets}` : '';
  const range = Math.round((w.bulletSpeed * w.bulletLife) / 10) * 10;
  return [
    { text: `Daño ${w.damage}${shots} · ${round1(w.fireRate)} disparos/s`, good: true },
    { text: `Cargador ${w.magazine} · recarga ${round1(w.reloadTime)} s · alcance ${range}`, good: true },
  ];
}
