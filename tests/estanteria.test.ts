// M14b (h11a2): the Estantería Inestable. A tall rack that stops bullets until it has had enough;
// then it wobbles with its landing shadowed and goes over away from the shots, crushing what is on
// the next tile (enemies and the toaster alike; rolling, she is clear), and lies there as low
// cover. Never onto a wall, another prop or a door's apron, and never cutting the room in two.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS, SHELF_CHANCE, SHELF_MAX } from '../src/data/props.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { slotEnemiesOf, templatesOf } from '../src/data/rooms.ts';
import { doorApron, fillTemplate, TILE, type PropInstance } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import {
  checkInvariants,
  createWorld,
  crushRect,
  DT,
  FALLEN_BOX,
  fallSide,
  NO_INPUT,
  spawnEnemy,
  startFall,
  step,
  worldHash,
  type World,
} from '../src/sim/world.ts';
import { overlaps } from '../src/sim/vec.ts';

const SHELF = PROPS.estanteria!;
const TOPPLE = SHELF.topple!;
const ticks = (s: number): number => Math.ceil(s / DT);

function bare(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 330;
  w.player.y = 330;
  w.noDamage = false;
  return w;
}

/** A shelf on tile (c, r): its feet at the bottom-centre, as buildRoom puts props. */
function shelf(w: World, c: number, r: number): PropInstance {
  const x = c * TILE + TILE / 2;
  const y = (r + 1) * TILE - 2;
  const pr: PropInstance = { def: SHELF, x, y, box: { x: x + SHELF.box.x, y: y + SHELF.box.y, w: SHELF.box.w, h: SHELF.box.h } };
  w.room.props.push(pr);
  return pr;
}

function idle(w: World, id: string, x: number, y: number): ReturnType<typeof spawnEnemy> {
  const en = spawnEnemy(w.nextId++, ENEMIES[id]!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

/** A bullet at (x, y) flying (vx, vy) at the floor. */
function bullet(w: World, owner: 'player' | 'enemy', x: number, y: number, vx: number, vy: number, damage = 1): void {
  const speed = Math.hypot(vx, vy);
  const b = { id: w.nextId++, owner, x, y, vx, vy, r: 3, life: 3, damage, knockback: 0, color: 'red', age: 0, dir: Math.atan2(vy, vx), speed, h: 0 };
  w.bullets.push(b as World['bullets'][number]);
}

test('la estantería está en los datos: para balas, aguanta unos disparos, avisa; tumbada es baja; con dibujo y causa de baja', () => {
  assert.ok(SHELF.blocksBullets && !SHELF.low, 'de pie es alta: cubre y no se salta');
  assert.ok(TOPPLE.hp >= 4 && TOPPLE.hp <= 10, 'unos cuantos disparos');
  assert.ok(TOPPLE.warn >= 0.5, 'el aviso da tiempo a apartarse');
  assert.ok(TOPPLE.hurt === 2, 'aplasta: un corazón');
  const fallen = PROPS[TOPPLE.fallen]!;
  assert.ok(fallen.low && fallen.blocksBullets && !fallen.topple, 'tumbada: se salta rodando y para balas');
  assert.ok(DOWN_CAUSES.estanteria?.contact);
  const sheets = readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8');
  assert.ok(sheets.includes('"estanteria"'), 'tiene sprite');
  for (const level of [1, 2, 3, 4, 5, 6]) assert.ok((SHELF_CHANCE[level] ?? 0) > 0 && SHELF_CHANCE[level]! <= 0.5);
  for (const side of ['N', 'S', 'E', 'W'] as const) {
    const b = FALLEN_BOX[side];
    assert.ok(Math.max(b.w, b.h) >= TILE + 8, `${side}: llega a la casilla de al lado`);
  }
});

test('a tiros desde la izquierda se tambalea, avisa dónde cae y cae a la derecha aplastando al enemigo', () => {
  const w = bare('estanteria-1');
  const pr = shelf(w, 8, 8);
  const under = idle(w, 'microondas', pr.x + 26, pr.y - 6);
  const clear = idle(w, 'microondas', pr.x + 26, pr.y + 40);
  let wobble: Extract<World['events'][number], { type: 'shelfWobble' }> | null = null;
  let fall: Extract<World['events'][number], { type: 'shelfFall' }> | null = null;
  let hits = 0;
  for (let i = 0; i < ticks(4) && !fall; i++) {
    for (const [en, x, y] of [[under, pr.x + 26, pr.y - 6], [clear, pr.x + 26, pr.y + 40]] as const) {
      en.x = x;
      en.y = y;
    }
    if (!pr.fall && !pr.fallen && i % 6 === 0) bullet(w, 'player', pr.x - 30, pr.y - 8, 300, 0, 1.6);
    step(w, NO_INPUT);
    for (const e of w.events) {
      if (e.type === 'shelfHit') hits++;
      if (e.type === 'shelfWobble') wobble = e;
      if (e.type === 'shelfFall') fall = e;
    }
  }
  assert.ok(wobble, 'se tambalea');
  assert.equal(wobble.side, 'E', 'lejos del que dispara');
  assert.equal(hits, Math.ceil(TOPPLE.hp / 1.6), 'cae cuando se le acaba el aguante');
  assert.ok(fall, 'cae');
  assert.equal(fall.side, 'E');
  assert.ok(under.damageTaken >= TOPPLE.damage * 0.5, 'el de debajo se lo lleva');
  assert.equal(clear.damageTaken, 0, 'el de fuera, no');
  assert.equal(pr.def.id, TOPPLE.fallen);
  assert.equal(pr.fallen, 'E');
  assert.deepEqual(pr.box, { x: pr.x + FALLEN_BOX.E.x, y: pr.y + FALLEN_BOX.E.y, w: FALLEN_BOX.E.w, h: FALLEN_BOX.E.h });
  assert.ok(overlaps(wobble.area, pr.box), 'el aviso estaba donde cayó');
  // Lying there for good: more shots do nothing to it.
  for (let i = 0; i < ticks(1); i++) {
    if (i % 4 === 0) bullet(w, 'player', pr.x - 30, pr.y - 8, 300, 0, 3);
    step(w, NO_INPUT);
  }
  assert.ok(w.room.props.includes(pr));
  assert.ok(!w.events.some((e) => e.type === 'shelfFall'));
});

test('las balas enemigas también la desgastan (de una en una)', () => {
  const w = bare('estanteria-2');
  const pr = shelf(w, 8, 8);
  for (let i = 0; i < TOPPLE.hp; i++) {
    bullet(w, 'enemy', pr.x, pr.y + 30, 0, -300);
    for (let k = 0; k < ticks(0.3); k++) step(w, NO_INPUT);
  }
  assert.ok(pr.fall || pr.fallen, 'se va abajo');
  assert.equal(pr.fall?.side ?? pr.fallen, 'N', 'hacia atrás, lejos de las balas');
});

test('a la tostadora debajo le quita un corazón y la saca fuera; rodando se libra', () => {
  for (const roll of [false, true]) {
    const w = bare(`estanteria-3-${roll}`);
    const pr = shelf(w, 8, 8);
    startFall(w, pr, 1, 0);
    assert.equal(pr.fall?.side, 'E');
    w.player.x = pr.x + 24;
    w.player.y = pr.y - 2;
    w.player.invulnerable = 0;
    const hp = w.player.hp;
    for (let i = 0; i < ticks(TOPPLE.warn) - 3; i++) step(w, NO_INPUT);
    if (roll) step(w, { ...NO_INPUT, moveX: 0, moveY: 1, roll: true });
    for (let i = 0; i < 6; i++) step(w, NO_INPUT);
    assert.ok(pr.fallen, 'cayó');
    assert.equal(w.player.hp, roll ? hp : hp - TOPPLE.hurt, roll ? 'rodando, en el aire' : 'un corazón');
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    assert.deepEqual(checkInvariants(w), [], 'y no se queda dentro');
  }
});

test('nunca cae contra una pared ni encima de otro prop: busca otro lado, y si no hay, se desploma donde está', () => {
  const w = bare('estanteria-4');
  // Find a floor tile with wall on its left.
  const room = w.room;
  let at: { c: number; r: number } | null = null;
  for (let r = 4; r < room.rows - 3 && !at; r++) {
    for (let c = 1; c < room.cols - 3 && !at; c++) {
      const i = r * room.cols + c;
      if (room.tiles[i] === 0 && room.tiles[i - 1] === 1 && room.tiles[i + 1] === 0 && room.tiles[i + room.cols] === 0) at = { c, r };
    }
  }
  assert.ok(at, 'hay una casilla junto a la pared');
  const pr = shelf(w, at.c, at.r);
  const side = fallSide(w, pr, -1, 0.2);
  assert.notEqual(side, 'W', 'no se mete en la pared');
  assert.notEqual(side, 'C');
  // Boxed in by props on every side: a heap.
  const w2 = bare('estanteria-5');
  const pr2 = shelf(w2, 8, 8);
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const def = PROPS.caja!;
    const x = (8 + dc) * TILE + TILE / 2;
    const y = (8 + dr + 1) * TILE - 2;
    w2.room.props.push({ def, x, y, box: { x: x + def.box.x, y: y + def.box.y, w: def.box.w, h: def.box.h } });
  }
  assert.equal(fallSide(w2, pr2, 1, 0), 'C');
  const heap = crushRect(pr2, 'C');
  assert.ok(heap.w > SHELF.box.w, 'el montón también aplasta alrededor');
});

test('no tapa el paso delante de una puerta ni parte la sala en dos', () => {
  let checked = 0;
  for (let s = 0; s < 6; s++) {
    const w = createWorld({ seed: `estanteria-puertas-${s}`, floor: true });
    const room = w.room;
    w.room.props = [];
    for (const d of room.doors) {
      // A shelf just beside the apron, pushed towards it.
      const apron = doorApron(room.cols, room.rows, d.dir);
      const cell = apron[apron.length - 1]!;
      const beside = d.dir === 'N' || d.dir === 'S' ? { c: cell.c + 1, r: cell.r } : { c: cell.c, r: cell.r + 1 };
      if (room.tiles[beside.r * room.cols + beside.c] !== 0) continue;
      const pr = shelf(w, beside.c, beside.r);
      const push = d.dir === 'N' || d.dir === 'S' ? { x: -1, y: 0 } : { x: 0, y: -1 };
      const side = fallSide(w, pr, push.x, push.y);
      const b = FALLEN_BOX[side];
      const lying = { x: pr.x + b.x, y: pr.y + b.y, w: b.w, h: b.h };
      for (const a of apron) assert.ok(!overlaps(lying, { x: a.c * TILE, y: a.r * TILE, w: TILE, h: TILE }), `semilla ${s}: delante de la puerta ${d.dir}`);
      w.room.props = [];
      checked++;
    }
  }
  assert.ok(checked > 3);
});

test('un bidón que explota al lado la tumba, lejos de la explosión', () => {
  const w = bare('estanteria-6');
  const pr = shelf(w, 8, 8);
  const drum = PROPS.barril!;
  const x = pr.x - TILE;
  const y = pr.y;
  w.room.props.push({ def: drum, x, y, box: { x: x + drum.box.x, y: y + drum.box.y, w: drum.box.w, h: drum.box.h }, damage: drum.hp, fuse: 0.05 } as PropInstance);
  for (let i = 0; i < ticks(0.3); i++) step(w, NO_INPUT);
  assert.equal(pr.fall?.side, 'E');
});

test('el relleno pone como mucho una estantería en un hueco vacío y no mueve nada más; en partida sale a veces y igual con la misma semilla', () => {
  const combat = [1, 2, 3, 4, 5, 6].flatMap((l) => templatesOf('combat', l)).filter((t) => t.rows.join('').includes('o'));
  let placed = 0;
  for (const t of combat) {
    for (let s = 0; s < 3; s++) {
      const opts = (): Parameters<typeof fillTemplate>[2] => ({ depth: 3, pool: slotEnemiesOf(1), vary: true, hazard: { rng: new Rng(`h${s}`), chance: 0.3 } });
      const plain = fillTemplate(t, new Rng(`r${s}${t.id}`), opts());
      const lit = fillTemplate(t, new Rng(`r${s}${t.id}`), { ...opts(), shelf: { rng: new Rng(`e${s}`), chance: 1 } });
      let n = 0;
      plain.rows.forEach((row, r) => [...row].forEach((ch, c) => {
        const other = lit.rows[r]![c];
        if (other === ch) return;
        assert.equal(ch, '.', `${t.id}: solo cambia un hueco vacío`);
        assert.equal(other, 'l');
        n++;
      }));
      assert.ok(n <= SHELF_MAX);
      placed += n;
    }
  }
  assert.ok(placed > 0);
  let rooms = 0;
  let shelves = 0;
  for (let s = 0; s < 6; s++) {
    for (const level of [1, 3]) {
      const w = createWorld({ seed: `estanterias-${s}`, floor: true, level });
      const again = createWorld({ seed: `estanterias-${s}`, floor: true, level });
      assert.equal(worldHash(w), worldHash(again));
      for (const fr of w.floor!.rooms) {
        if (fr.template.kind !== 'combat') continue;
        rooms++;
        shelves += [...fr.template.rows.join('')].filter((ch) => ch === 'l').length;
      }
    }
  }
  assert.ok(shelves > 0 && shelves < rooms * 0.6, `${shelves} en ${rooms} salas`);
});
