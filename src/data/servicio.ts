// El Servicio Técnico (M12, docs/DISENO.md): the secret floor over the fifth, open only to whoever
// meets its requirements. They are data (src/sim/unlocks.ts checks them at the end of every run)
// and the Mostrador shows them on the «Cita previa» notice by the phone (src/render/cita.ts).
// Once met, the appointment is for good (Profile.service), even if a later version asks for more.

import type { UnlockCondition } from './unlocks.ts';

export interface ServiceRequirement {
  id: string;
  /** What is asked, in small print. `{n}` is how many (the bosses, the products, the documents). */
  text: string;
  /** The same when only one is asked for (the products, before M13). */
  one?: string;
  condition: UnlockCondition;
}

/** The five floor bosses each floor had first, in floor order (each floor may bring another: M14 (j1)). */
export const FLOOR_BOSSES = ['nevera-suprema', 'router-wifi', 'muneco-moda', 'director-rrhh', 'centralita'] as const;

export const SERVICE_REQUIREMENTS: readonly ServiceRequirement[] = [
  {
    id: 'jefes',
    text: 'Haber reclamado en persona ante el jefe de las {n} plantas, cada uno.',
    condition: { floorBosses: [1, 2, 3, 4, 5] },
  },
  {
    id: 'victorias',
    text: 'Acreditar la incidencia cerrada con {n} productos distintos.',
    one: 'Acreditar la incidencia cerrada (vencer a la Centralita) con un producto.',
    condition: { minWinners: 3 },
  },
  {
    id: 'expediente',
    text: 'Aportar el expediente completo: {n} documentos del archivador.',
    condition: { allDocs: true },
  },
];

export const SERVICE = {
  /** On the notice's red header. */
  title: 'Cita previa · Servicio Técnico Oficial',
  /** Under the requirements while they are not met. */
  pending: 'Plazo de resolución: indefinido. No se admiten fotocopias.',
  /** With the appointment granted (the stamp). */
  granted: 'CITA CONCEDIDA. Preséntese tras cerrar la incidencia de la planta 5.',
  /** While fewer than three can be played (before M13), what the second requirement says. */
  fewProducts: 'Mientras no haya más productos en exposición, se acepta uno solo.',
} as const;
