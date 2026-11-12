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

/** The «Cita previa» notice of the Servicio Técnico (M12): its size, where it hangs, and its three tick boxes (top-left of each 5 × 5 box, from the notice's top-left). */
export const CITA_W = 50;
export const CITA_H = 44;
/** Higher than the board: it is taller, and must end on the wall. */
export const WALL_CITA_Y = 4;
export const CITA_BOXES: ReadonlyArray<{ x: number; y: number }> = [0, 1, 2].map((i) => ({ x: 5, y: 14 + i * 6 }));
/** Where the «Concedida» stamp goes on the notice, when the appointment is granted. */
export const CITA_STAMP = { x: 5, y: 31 };

/**
 * What hangs on the Mostrador's back wall, as spans of x (px): the board, the phone, the notice
 * and the curtain with its sign. The room painter keeps its shelf signs and clocks out of them.
 */
export function hubHung(stations: readonly { kind: string; x: number }[], belt: { x: number; w: number } | null): Array<readonly [number, number]> {
  const half: Record<string, number> = { tablon: 25, telefono: 9, cita: CITA_W / 2 };
  const out: Array<readonly [number, number]> = stations.filter((s) => half[s.kind] !== undefined).map((s) => [s.x - half[s.kind]!, s.x + half[s.kind]!] as const);
  if (belt) out.push([Math.min(belt.x, belt.x + belt.w / 2 - 40), Math.max(belt.x + belt.w, belt.x + belt.w / 2 + 40)]);
  return out;
}
