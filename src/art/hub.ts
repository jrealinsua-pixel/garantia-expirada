// Geometry the Mostrador's sprites (tools/sprites/mostrador.ts) and the game agree on.

/** How high (px above a queue post's feet) its tape runs. */
export const TAPE_Y = 18;

/**
 * Where the things hung on the back wall start (px from the room's top). The camera never shows
 * the wall's top rows (the room is taller than the screen), so they hang low: the sign even
 * covers the top of the curtain under it.
 */
export const WALL_SIGN_Y = 12;
export const WALL_BOARD_Y = 12;
export const WALL_PHONE_Y = 14;

/** Where the board's five cards are (their inner 6 × 7 window), from the board's top-left (tools/sprites/mostrador.ts draws them). */
export const BOARD_CARDS: ReadonlyArray<{ x: number; y: number }> = [0, 1, 2, 3, 4].map((i) => ({ x: 4 + i * 9, y: (i % 2 ? 11 : 10) + 1 }));
