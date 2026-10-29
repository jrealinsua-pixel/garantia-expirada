// What the minimap shows: the rooms of the floor the player knows about. Pure: reads the world.
import type { Dir, RoomKind } from './floor.ts';
import type { World } from './world.ts';

export type MapState = 'here' | 'visited' | 'seen';

export interface MapCell {
  id: number;
  gx: number;
  gy: number;
  kind: RoomKind;
  /** Where the player is, been, or only seen through a door of a room it has been in. */
  state: MapState;
  /** A combat room with enemies left (only known once visited). */
  danger: boolean;
  /** Normal doors towards other known rooms (each drawn once, from either side). */
  links: Dir[];
}

/**
 * Rooms visited and their neighbours through normal doors. The secret room stays off the map
 * until the player gets into it.
 */
export function minimap(w: World): MapCell[] {
  const f = w.floor;
  if (!f) return [];
  const known = new Map<number, MapState>();
  for (const fr of f.layout.rooms) {
    if (!f.rooms[fr.id]!.visited) continue;
    known.set(fr.id, fr.id === f.current ? 'here' : 'visited');
  }
  for (const id of [...known.keys()]) {
    for (const d of f.layout.rooms[id]!.doors) if (!d.secret && !known.has(d.to)) known.set(d.to, 'seen');
  }
  const out: MapCell[] = [];
  for (const [id, state] of known) {
    const fr = f.layout.rooms[id]!;
    const st = f.rooms[id]!;
    out.push({
      id,
      gx: fr.gx,
      gy: fr.gy,
      kind: fr.kind,
      state,
      danger: state !== 'seen' && !st.cleared,
      links: fr.doors.filter((d) => known.has(d.to) && (!d.secret || (known.get(d.to) !== 'seen' && state !== 'seen'))).map((d) => d.dir),
    });
  }
  return out.sort((a, b) => a.id - b.id);
}
