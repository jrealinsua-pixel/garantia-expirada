// The tablón «Productos en Exposición» of the hub: the five playable characters and what unlocks
// each one (docs/DISENO.md). Conditions are data, checked by src/sim/unlocks.ts at the end of every
// run. Each one is its own (M13 (8), final): the Batidora comes out of the kitchen floor's boss, the
// Móvil out of the floor where the wifi lives, the Becario out of failing enough times, and the
// Plancha, the last, out of the interview she burned a shirt in: the Director de Recursos Inhumanos.
// Once unlocked, their starting weapons can turn up in the others' runs (weaponPool in world.ts).

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
  /**
   * Different characters that have won the game (beaten floor 5). Never more than the characters
   * there are to play (src/data/characters.ts): until M13 brings the others, one is enough.
   */
  minWinners?: number;
  /** Every story document of the archivador (src/data/lore.ts) found. */
  allDocs?: boolean;
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
    condition: { beaten: ['director-rrhh'] },
    conditionText: 'Disponible al vencer al Director de Recursos Inhumanos. Traiga camisa.',
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
    condition: { beaten: ['router-wifi'] },
    conditionText: 'Disponible al vencer al Router del Wifi. Por fin, cobertura.',
  },
];
