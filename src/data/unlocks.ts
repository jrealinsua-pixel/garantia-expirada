// The tablón «Productos en Exposición» of the hub: the five playable characters and what unlocks
// each one (docs/DISENO.md). Conditions are data, checked by src/sim/unlocks.ts at the end of every
// run. Only the Tostadora is playable until M13 brings the others; the conditions are provisional
// until the floors 3–5 and their bosses exist (M10–M11), and then they will ask for more.

/** What has to have happened, in any number of runs. Every field given must hold. */
export interface UnlockCondition {
  /** Bosses (enemy ids) taken down at least once. */
  beaten?: readonly string[];
  /** Runs ended by a breakdown. */
  minDowns?: number;
  /** Different passive items ever found. */
  minFound?: number;
  /** Floors cleared, adding up every run. */
  minFloors?: number;
}

export interface RosterEntry {
  /** Character id (the playable ones are in characters.ts). */
  id: string;
  name: string;
  /** Under the picture, once unlocked. */
  blurb: string;
  /** Null: available from the start. */
  condition: UnlockCondition | null;
  /** In small print under the silhouette while locked. */
  conditionText: string;
}

export const ROSTER: readonly RosterEntry[] = [
  {
    id: 'tostadora',
    name: 'Tostadora Reacondicionada',
    blurb: 'Garantía hasta el lunes. Duró hasta el martes.',
    condition: null,
    conditionText: 'De serie.',
  },
  {
    id: 'batidora-vaso',
    name: 'Batidora de Vaso',
    blurb: 'Rápida y frágil. Tritura primero y pregunta después.',
    condition: { beaten: ['nevera-suprema'] },
    conditionText: 'Disponible al vencer a la Nevera Suprema.',
  },
  {
    id: 'plancha',
    name: 'Plancha de Vapor',
    blurb: 'Lenta y dura. No deja una arruga ni un enemigo.',
    condition: { beaten: ['router-wifi'] },
    conditionText: 'Disponible al vencer al Router del Wifi.',
  },
  {
    id: 'becario',
    name: 'El Becario Eterno',
    blurb: 'Seis años en prácticas. Sigue sin contrato.',
    condition: { minDowns: 10 },
    conditionText: 'Disponible tras diez bajas. Se valorará experiencia demostrable.',
  },
  {
    id: 'movil',
    name: 'Móvil Reacondicionado',
    blurb: 'Como nuevo. Salvo la pantalla, la batería y el sistema.',
    condition: { minFound: 20 },
    conditionText: 'Disponible al encontrar veinte objetos distintos.',
  },
];
