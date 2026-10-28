// Content registry. Empty tables are filled as the milestones add content.
export { CHARACTERS } from './characters.ts';
export { WEAPONS } from './weapons.ts';
export { ROOMS } from './rooms.ts';
export { PROPS, DUMMIES } from './props.ts';

/** Enemies (M2). */
export const ENEMIES: Record<string, unknown> = {};
/** Bosses (M4). */
export const BOSSES: Record<string, unknown> = {};
/** Passive and active items (M5). */
export const ITEMS: Record<string, unknown> = {};
