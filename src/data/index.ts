// Content registry. Empty tables are filled as the milestones add content.
export { CHARACTERS } from './characters.ts';
export { WEAPONS } from './weapons.ts';
export { ROOMS } from './rooms.ts';
export { PROPS, DUMMIES } from './props.ts';

import { ENEMIES } from './enemies.ts';
import type { EnemyDef } from './types.ts';
export { ENEMIES };
export { DEATH_STAMPS, RESTOCK_LINE } from './texts.ts';
/** Bosses: the enemies with an entrance card (EnemyDef.boss). */
export const BOSSES: Record<string, EnemyDef> = Object.fromEntries(Object.entries(ENEMIES).filter(([, d]) => d.boss));
export { ITEMS, FINDABLE_ITEMS } from './items.ts';
