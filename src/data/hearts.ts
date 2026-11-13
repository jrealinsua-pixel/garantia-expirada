/**
 * The special temporary hearts (M9b (12b), nota del humano del 2026-10-30): rewards for clearing a
 * combat room, rarer than the Garantía Provisional (the shield, M9b (12a)) and rarer the stronger
 * they are. None of them lasts: they are gone when the toaster goes down to another floor, or
 * sooner. Their numbers live here; what they do lives in src/sim/world.ts.
 */
export interface SpecialHeartDef {
  /** Pickup kind in the simulation. */
  id: 'turbo' | 'sobretension';
  name: string;
  /** Chance that a combat room with no ticket and no chest leaves one when cleared. */
  chance: number;
  /** Floats up when it is picked up. */
  line: string;
  /** Sprite lying on the floor (13 × 12, two frames) and in the HUD (9 × 8, two frames). */
  sprite: string;
  hud: string;
}

export const SPECIAL_HEARTS: Record<SpecialHeartDef['id'], SpecialHeartDef> = {
  turbo: {
    id: 'turbo',
    name: 'Corazón Modo Turbo',
    // Heals a heart and, until the next combat room is cleared, every shot hits harder.
    chance: 0.05,
    line: 'Modo Turbo · hasta la próxima sala',
    sprite: 'corazon-turbo',
    hud: 'turbo-hud',
  },
  sobretension: {
    id: 'sobretension',
    name: 'Corazón de Sobretensión',
    // A heart on loan, like the warranty; when a hit breaks it, it shocks every enemy in the room.
    chance: 0.03,
    line: 'Sobretensión · no tocar',
    sprite: 'corazon-sobretension',
    hud: 'sobretension-hud',
  },
};

/** The Corazón Modo Turbo: what it heals (half hearts) and how much more each shot does. */
export const TURBO_HEAL = 2;
export const TURBO_DAMAGE = 1.3;
/** The Corazón de Sobretensión: the life it lends (half hearts, also the most you can carry) and the shock. */
export const SURGE_VALUE = 2;
/** Damage to every enemy in the room when it breaks: moths, remotes and fake chargers go; an aspirador is left at half; a boss barely notices (6 %). */
export const SURGE_DAMAGE = 4;
