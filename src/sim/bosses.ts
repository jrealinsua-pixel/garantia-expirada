// Random bosses (M14 (j1), the human's note of 2026-10-30): each floor brings one boss out of a list
// (src/data/rooms.ts FLOOR_BOSS_POOLS), picked with its own generator from the run's seed, so the
// same seed always meets the same bosses and adding one to a list moves no other room, chest or
// enemy. What used to ask for a given boss (unlocking a character, the Servicio Técnico's
// appointment, the boss's story document) now asks for the boss of a floor, whichever came out.
import { floorBossPool } from '../data/rooms.ts';
import { enemyOfChar } from './room.ts';
import { Rng } from './rng.ts';

/** Floors whose boss is picked (the Servicio Técnico, floor 6, has its own: the Trituradora). */
export const BOSS_FLOORS = [1, 2, 3, 4, 5, 6] as const;

/** Template letter of the boss floor `level` brings in the run of `seed`. */
export function pickFloorBoss(seed: string, level: number): string {
  const pool = floorBossPool(level);
  if (pool.length === 1) return pool[0]!;
  return new Rng(`jefe:${level}:${seed}`).pick(pool);
}

/** Enemy ids of the bosses floor `level` can bring, the floor's own first. */
export function bossesOfFloor(level: number): string[] {
  return floorBossPool(level).map((ch) => {
    const id = enemyOfChar(ch);
    if (!id) throw new Error(`Boss letter ${ch} of floor ${level} is not an enemy`);
    return id;
  });
}

/** The floor a boss belongs to (undefined: not a floor boss). */
export function floorOfBoss(id: string): number | undefined {
  return BOSS_FLOORS.find((n) => bossesOfFloor(n).includes(id));
}

/** Whether the profile's record of bosses beaten has the boss of floor `level`, any of them. */
export const floorBossBeaten = (bosses: Readonly<Record<string, number>>, level: number): boolean =>
  bossesOfFloor(level).some((b) => (bosses[b] ?? 0) > 0);
