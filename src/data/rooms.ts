import type { RoomTemplate } from './types.ts';

export const ROOMS: Record<string, RoomTemplate> = {
  // 26 x 16 tiles of 24 px: a bit bigger than the screen, so the camera has to move.
  'sala-pruebas': {
    id: 'sala-pruebas',
    name: 'Sala de Pruebas de Devoluciones',
    // Returns are restocked: a few seconds after the last enemy falls apart, they are all back.
    restock: 4,
    rows: [
      '##########################',
      '##########################',
      '#c......................b#',
      '#........................#',
      '#.....c..............O...#',
      '#..........b.......M.....#',
      '#........................#',
      '#...P.........cc.........#',
      '#........................#',
      '#.........L........M.....#',
      '#....k...................#',
      '#..................A.....#',
      '#...........b.......T....#',
      '#.......................c#',
      '#k.....................bc#',
      '##########################',
    ],
  },
};
