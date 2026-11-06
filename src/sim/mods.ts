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
  // Faster over the same time: a longer roll.
  rollSpeed: { min: 120, max: 560 },
};

const WEAPON_STATS = ['damage', 'fireRate', 'magazine', 'reloadTime', 'spreadDeg', 'bulletSpeed', 'bulletLife', 'bulletRadius', 'knockback', 'recoil', 'pellets'] as const;
const CHARACTER_STATS = ['speed', 'maxHp', 'rollCooldown', 'rollSpeed'] as const;

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
  // The weapon's own bullet behaviour (the megaphone goes through everything) adds up with the items'.
  const b = bulletBehaviour(base.bullets ? [{ id: base.id, bullets: base.bullets }, ...mods] : mods);
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
    if (b.slow && (!out.slow || b.slow.mul < out.slow.mul)) out.slow = { ...b.slow };
    if (b.last) {
      const mul = Math.max(out.last?.mul ?? 1, b.last.mul ?? 1);
      const pierce = (out.last?.pierce ?? 0) + (b.last.pierce ?? 0);
      out.last = { ...(mul > 1 ? { mul } : {}), ...(pierce > 0 ? { pierce } : {}) };
    }
    if (b.stick) {
      const slow = !b.stick.slow || (out.stick?.slow && out.stick.slow.mul <= b.stick.slow.mul) ? out.stick?.slow : b.stick.slow;
      out.stick = { time: Math.max(out.stick?.time ?? 0, b.stick.time), ...(slow ? { slow: { ...slow } } : {}) };
    }
    if (b.wave && (!out.wave || b.wave.amp > out.wave.amp)) out.wave = { ...b.wave };
  }
  return Object.keys(out).length ? out : null;
}

/** All the modifiers' perks added up (chances to 1 at most). */
export function perksOf(mods: readonly Modifier[]): Required<Perks> {
  const out: Required<Perks> = {
    charge: 0, coupons: 0, rollClear: false, revive: 0, rush: { mul: 1, time: 0 }, shrug: 0, freeChests: 0, hurtRing: 0,
    pet: { step: 0, max: 0 }, fullHpDamage: 1, grip: 1, hurtIframes: 1, punchIn: 0, trial: false, discount: 0,
    urgent: 1, replyAll: { chance: 0, count: 0, mul: 0 }, chain: false, fullHpCharge: 0,
    chargeMul: 1, expiredChests: 0,
    queue: { start: 1, step: 0, every: 1, max: 1 }, echo: { every: 0, delay: 0, mul: 0 }, recorded: { time: 0, mul: 1 },
    complaint: { shots: 0, turnDeg: 0 }, escalate: false, echoPierce: 0, stars: { need: 0, hp: 0 },
  };
  for (const m of mods) {
    out.charge += m.perks?.charge ?? 0;
    out.coupons += m.perks?.coupons ?? 0;
    out.rollClear ||= !!m.perks?.rollClear;
    out.revive = Math.max(out.revive, m.perks?.revive ?? 0);
    const r = m.perks?.rush;
    if (r && r.mul > out.rush.mul) out.rush = { ...r };
    out.shrug += m.perks?.shrug ?? 0;
    out.freeChests += m.perks?.freeChests ?? 0;
    out.hurtRing = Math.max(out.hurtRing, m.perks?.hurtRing ?? 0);
    const pet = m.perks?.pet;
    if (pet && pet.step * pet.max > out.pet.step * out.pet.max) out.pet = { ...pet };
    out.fullHpDamage = Math.max(out.fullHpDamage, m.perks?.fullHpDamage ?? 1);
    out.grip = Math.min(out.grip, m.perks?.grip ?? 1);
    out.hurtIframes = Math.max(out.hurtIframes, m.perks?.hurtIframes ?? 1);
    out.punchIn = Math.max(out.punchIn, m.perks?.punchIn ?? 0);
    out.trial ||= !!m.perks?.trial;
    out.discount = Math.max(out.discount, m.perks?.discount ?? 0);
    out.urgent = Math.max(out.urgent, m.perks?.urgent ?? 1);
    const ra = m.perks?.replyAll;
    if (ra && ra.chance > out.replyAll.chance) out.replyAll = { ...ra };
    out.chain ||= !!m.perks?.chain;
    out.fullHpCharge += m.perks?.fullHpCharge ?? 0;
    out.chargeMul = Math.max(out.chargeMul, m.perks?.chargeMul ?? 1);
    out.expiredChests = Math.max(out.expiredChests, m.perks?.expiredChests ?? 0);
    const q = m.perks?.queue;
    if (q && q.max > out.queue.max) out.queue = { ...q };
    const ec = m.perks?.echo;
    if (ec && (out.echo.every === 0 || ec.every < out.echo.every)) out.echo = { ...ec };
    const rc = m.perks?.recorded;
    if (rc && rc.mul > out.recorded.mul) out.recorded = { ...rc };
    const cp = m.perks?.complaint;
    if (cp && cp.shots > out.complaint.shots) out.complaint = { ...cp };
    if (m.perks?.escalate) out.escalate = true;
    out.echoPierce += m.perks?.echoPierce ?? 0;
    const st = m.perks?.stars;
    if (st && (out.stars.need === 0 || st.need < out.stars.need)) out.stars = { ...st };
  }
  out.coupons = Math.min(1, out.coupons);
  out.shrug = Math.min(SHRUG_MAX, out.shrug);
  return out;
}

/** «Era solo la caja» never covers more than half the hits. */
export const SHRUG_MAX = 0.5;

/** The synergies that `mods` (by id: an item's modifier has the item's id) and `weapons` (ids) switch on, in table order. */
export function activeSynergies(mods: readonly Modifier[], weapons: readonly string[]): SynergyDef[] {
  const have = new Set(mods.map((m) => m.id));
  return Object.values(SYNERGIES).filter((s) => s.items.every((i) => have.has(i)) && (!s.weapon || weapons.includes(s.weapon)));
}
