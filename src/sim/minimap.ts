// What the minimap shows: the rooms of the floor the player knows about. Pure: reads the world.
import type { Dir, RoomKind } from './floor.ts';
import type { Pickup, World } from './world.ts';
import type { PropInstance } from './room.ts';

export type MapState = 'here' | 'visited' | 'seen';

/**
 * Something still to be picked up (or opened) in a room, for its mark on the map (nota del humano
 * del 2026-11-05): one mark per kind, however many there are. In order of importance.
 */
export const MAP_LOOT = ['cofre', 'ticket', 'corazon', 'objeto', 'cupon'] as const;
export type MapLoot = (typeof MAP_LOOT)[number];

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
  /** What is left in it to pick up or open, one of each kind, most important first (rooms visited only). */
  loot: MapLoot[];
}

/** The map mark of a pickup lying on the floor, or null (goods for sale are the shop's, not loot). */
function lootOf(k: Pickup): MapLoot | null {
  if (k.price !== undefined) return null;
  switch (k.kind) {
    case 'cupon':
      return 'cupon';
    case 'ticket':
      return 'ticket';
    case 'corazon':
    case 'garantia':
    case 'turbo':
    case 'sobretension':
      return 'corazon';
    case 'arma':
    case 'objeto':
    case 'activo':
    case 'documento':
      return 'objeto';
    case 'rasca':
      return null;
  }
}

/** What is left in a room: its pickups and its shut chests, one mark per kind, in MAP_LOOT order. */
export function roomLoot(pickups: readonly Pickup[], props: readonly PropInstance[]): MapLoot[] {
  const have = new Set<MapLoot>();
  for (const k of pickups) {
    const l = lootOf(k);
    if (l) have.add(l);
  }
  if (props.some((p) => p.chest && !p.chest.open)) have.add('cofre');
  return MAP_LOOT.filter((l) => have.has(l));
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
    // The room the toaster is in lives in the world; the others keep what was left in them.
    const here = id === f.current;
    const loot = state === 'seen' ? [] : roomLoot(here ? w.pickups : st.pickups, (here ? w.room : st.room)?.props ?? []);
    out.push({
      id,
      gx: fr.gx,
      gy: fr.gy,
      kind: fr.kind,
      state,
      danger: state !== 'seen' && !st.cleared,
      loot,
      links: fr.doors.filter((d) => known.has(d.to) && (!d.secret || (known.get(d.to) !== 'seen' && state !== 'seen'))).map((d) => d.dir),
    });
  }
  return out.sort((a, b) => a.id - b.id);
}
