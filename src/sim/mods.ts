// Modifiers: items and synergies change the player's stats and what its bullets do.
// The player keeps its base character and weapon; its `def` and `weapon.def` are recomputed
// from them and every modifier it carries, so the rest of the simulation just reads them.
import { SYNERGIES } from '../data/synergies.ts';
import type { BulletBehaviour, CharacterDef, Modifier, Perks, StatKey, SynergyDef, WeaponDef } from '../data/types.ts';

/** Each stat's floor (and whether it is a whole number), so no combination breaks the game. */
const LIMITS: Record<StatKey, { min: number; max?: number; int?: boolean }> = {
  damage: { min: 0.1 },
  fireRate: { min: 0.5, max: 30 },
  magazine: { min: 1, int: true },
  reloadTime: { min: 0.15 },
  spreadDeg: { min: 0, max: 45 },
  bulletSpeed: { min: 60, max: 900 },
  bulletLife: { min: 0.15 },
  bulletRadius: { min: 1, max: 10 },
  knockback: { min: 0 },
  recoil: { min: 0 },
  pellets: { min: 1, max: 12, int: true },
  speed: { min: 40, max: 260 },
  maxHp: { min: 2, max: 24, int: true },
  rollCooldown: { min: 0.05 },
};

const WEAPON_STATS = ['damage', 'fireRate', 'magazine', 'reloadTime', 'spreadDeg', 'bulletSpeed', 'bulletLife', 'bulletRadius', 'knockback', 'recoil', 'pellets'] as const;
const CHARACTER_STATS = ['speed', 'maxHp', 'rollCooldown'] as const;

/** `base` changed by every modifier: all the additions first, then all the multipliers, then the limits. */
export function modStat(stat: StatKey, base: number, mods: readonly Modifier[]): number {
  let add = 0;
  let mul = 1;
  for (const m of mods) {
    for (const c of m.stats ?? []) {
      if (c.stat !== stat) continue;
      add += c.add ?? 0;
      mul *= c.mul ?? 1;
    }
  }
  const lim = LIMITS[stat];
  let v = (base + add) * mul;
  if (lim.int) v = Math.round(v);
  return Math.min(lim.max ?? Infinity, Math.max(lim.min, v));
}

/** The weapon as the modifiers leave it. */
export function moddedWeapon(base: WeaponDef, mods: readonly Modifier[]): WeaponDef {
  const out: WeaponDef = { ...base };
  for (const k of WEAPON_STATS) out[k] = modStat(k, base[k], mods);
  const b = bulletBehaviour(mods);
  if (b) out.bullets = b;
  else delete out.bullets;
  return out;
}

/** The character as the modifiers leave it. */
export function moddedCharacter(base: CharacterDef, mods: readonly Modifier[]): CharacterDef {
  const out: CharacterDef = { ...base };
  for (const k of CHARACTER_STATS) out[k] = modStat(k, base[k], mods);
  return out;
}

/** All the modifiers' bullet behaviours together (counts add up, the strongest homing wins), or null. */
export function bulletBehaviour(mods: readonly Modifier[]): BulletBehaviour | null {
  const out: BulletBehaviour = {};
  for (const m of mods) {
    const b = m.bullets;
    if (!b) continue;
    if (b.pierce) out.pierce = (out.pierce ?? 0) + b.pierce;
    if (b.bounce) out.bounce = (out.bounce ?? 0) + b.bounce;
    if (b.homing && (!out.homing || b.homing.turnDeg > out.homing.turnDeg)) out.homing = { ...b.homing };
    // Critical hits: the chances add up (to 1 at most), the biggest multiplier wins.
    if (b.crit) out.crit = { chance: Math.min(1, (out.crit?.chance ?? 0) + b.crit.chance), mul: Math.max(out.crit?.mul ?? 1, b.crit.mul) };
  }
  return Object.keys(out).length ? out : null;
}

/** All the modifiers' perks added up (chances to 1 at most). */
export function perksOf(mods: readonly Modifier[]): Required<Perks> {
  const out = { charge: 0, coupons: 0, rollClear: false, revive: 0 };
  for (const m of mods) {
    out.charge += m.perks?.charge ?? 0;
    out.coupons += m.perks?.coupons ?? 0;
    out.rollClear ||= !!m.perks?.rollClear;
    out.revive = Math.max(out.revive, m.perks?.revive ?? 0);
  }
  out.coupons = Math.min(1, out.coupons);
  return out;
}

/** The synergies that `mods` (by id: an item's modifier has the item's id) and `weapons` (ids) switch on, in table order. */
export function activeSynergies(mods: readonly Modifier[], weapons: readonly string[]): SynergyDef[] {
  const have = new Set(mods.map((m) => m.id));
  return Object.values(SYNERGIES).filter((s) => s.items.every((i) => have.has(i)) && (!s.weapon || weapons.includes(s.weapon)));
}
