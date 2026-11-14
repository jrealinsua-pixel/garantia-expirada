// M14c (a7h): La Centralita redrawn in the new style (tools/sprites/centralita-nuevo.ts), checked
// against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { createWorld, DT, NO_INPUT, step } from '../src/sim/world.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeCentralitaFrames } from '../tools/sprites/centralita.ts';
import * as CN from '../tools/sprites/centralita-nuevo.ts';

// The warehouse floor of the style guide and the teal linoleum of Atención al Cliente.
const FLOORS = [MATERIALS.suelo[3]!, hx('#2d4a5e')];
const def = ENEMIES.centralita!;
const frames = CN.makeCentralitaNuevaFrames();
const F = CN.CF;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;
const count = (f: Canvas, m: Material): number => f.p.flat().filter((c) => isMat(c, m)).length;
const PHASE3 = ['sin-clavijas0', 'sin-clavijas1', 'sin-clavijas-arrastra0', 'sin-clavijas-arrastra1', 'arranque', 'barrido', 'espera-rota'] as const;

test('estilo a7h: la centralita se lee sobre el suelo, en todos sus fotogramas', () => {
  for (const floor of FLOORS) {
    for (const [i, f] of frames.entries()) {
      const l = legibility(f, floor);
      assert.ok(l.darkEdge >= 0.8, `${CN.CENTRALITA_FRAMES[i]}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${CN.CENTRALITA_FRAMES[i]}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${CN.CENTRALITA_FRAMES[i]}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a7h: la hoja del juego es la nueva, más grande, con su despiece', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [CN.CENTRALITA_W, CN.CENTRALITA_H, CN.CENTRALITA_FRAMES.length]);
  assert.deepEqual(def.anchor, CN.CENTRALITA_FEET);
  assert.deepEqual(def.hurt, { x: -26, y: -66, w: 52, h: 62 }, 'la caja de golpes de siempre');
  assert.ok(area(frames[0]!) > area(makeCentralitaFrames()[0]!) * 1.1, 'más grande que la vieja');
  const bits = allSheets()['despiece-centralita']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [CN.CENTRALITA_BIT, CN.CENTRALITA_BIT, 6]);
});

test('estilo a7h: el mueble llena la caja de golpes, la teca no se sale y se apoya en el suelo', () => {
  const h = def.hurt!;
  const A = def.anchor;
  for (const [k, f] of frames.entries()) {
    const name = CN.CENTRALITA_FRAMES[k];
    let inside = 0;
    for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
    assert.ok(inside / (h.w * h.h) > 0.85, `${name}: la caja está llena al ${((100 * inside) / (h.w * h.h)).toFixed(0)} %`);
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        if (!isMat(f.get(x, y), 'teca')) continue;
        assert.ok(x >= A.x + h.x - 6 && x < A.x + h.x + h.w + 6, `${name}: teca en x ${x}`);
        assert.ok(y >= A.y + h.y - 6 && y < A.y + h.y + h.h + 6, `${name}: teca en y ${y}`);
      }
    }
    let lowest = 0;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.get(x, y)[3] === 255) lowest = y;
    assert.ok(lowest >= A.y - 1 && lowest <= A.y, `${name}: lo más bajo en la fila ${lowest}`);
  }
});

test('estilo a7h: los fotogramas cuadran con su anim, su fase 3 y las poses de cada ataque', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, [F.reposo0, F.reposo1]);
  assert.deepEqual(a.walk, [F.arrastra0, F.arrastra1, F.arrastra2, F.arrastra3]);
  assert.deepEqual(a.talk, [F.habla0, F.habla1]);
  assert.equal(a.stun, F.muda);
  assert.equal(a.clap, F.pasando);
  const brain = def.brain;
  if (brain.kind !== 'boss') return assert.fail('no es jefe');
  assert.deepEqual(brain.phases[2]!.look, {
    idle: [F['sin-clavijas0'], F['sin-clavijas1']],
    walk: [F['sin-clavijas-arrastra0'], F['sin-clavijas-arrastra1']],
    warn: F['sin-clavijas1'],
    clap: F.arranque,
  });
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  assert.deepEqual(poses, [
    [undefined, F.lanza, F.espera],
    [undefined, F.lanza, F.espera],
    [F.barrido, F.barrido, F['espera-rota']],
  ]);
  assert.equal(new Set(frames.map((f) => f.p.flat().join())).size, frames.length, 'todos distintos');
});

test('estilo a7h: la clavija lanzada sale por su boca; pilotos ámbar, rojos sin clavijas y en blanco muda', () => {
  const brain = def.brain;
  if (brain.kind !== 'boss') return;
  assert.deepEqual(brain.muzzle, CN.CENTRALITA_MOUTH);
  const mx = def.anchor.x + CN.CENTRALITA_MOUTH.x;
  const my = def.anchor.y - CN.CENTRALITA_MOUTH.y;
  // Throwing, the plug (sleeve, ferrule or tip) is right at the muzzle.
  const lanza = frames[F.lanza]!;
  let near = false;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const c = lanza.get(mx + dx, my + dy);
    if (isMat(c, 'rojo') || isMat(c, 'acero') || isMat(c, 'laton')) near = true;
  }
  assert.ok(near, 'la clavija en la boca');
  const menu = count(frames[F.reposo0]!, 'amarillo');
  for (const n of PHASE3) {
    const f = frames[F[n]]!;
    assert.ok(count(f, 'rojo') > 20, `${n}: pilotos rojos`);
    // No red plugs left (the sleeves are black now): far less red than the plugs on the desk made.
    assert.ok(count(f, 'goma') > count(frames[F.reposo0]!, 'goma'), `${n}: clavijas negras`);
  }
  assert.ok(menu > 40, 'pilotos ámbar');
  assert.ok(count(frames[F.muda]!, 'amarillo') < menu - 40, 'muda, en blanco (solo queda el pósit)');
  assert.ok(count(frames[F.muda]!, 'crema') > 60, 'los pilotos blancos');
  assert.ok(count(frames[F.pasando]!, 'laton') > count(frames[F.reposo0]!, 'laton') + 15, 'el timbre encima');
  for (const f of frames) assert.ok(count(f, 'teca') > 1800, 'de teca');
});

test('estilo a7h: en partida, cada cambio de fase tiene su fotograma', () => {
  const w = createWorld({ seed: 'a7h-fases', room: 'jefe-atencion', level: 5 });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'centralita')!;
  const seen = new Set<number>();
  const until = (s: number, done: () => boolean): void => {
    for (let i = 0; i < Math.ceil(s / DT) && !done(); i++) {
      step(w, NO_INPUT);
      if (boss.state === 'roar') seen.add(enemyFrame(boss, i * DT * 1000));
    }
  };
  boss.damageTaken = Math.ceil(def.hp * 0.41);
  until(4, () => (boss.bossPhase ?? 0) >= 1 && boss.state !== 'roar');
  assert.ok(seen.has(F.pasando), `al pasarle con el departamento: ${[...seen].join(', ')}`);
  seen.clear();
  boss.damageTaken = Math.ceil(def.hp * 0.76);
  until(4, () => (boss.bossPhase ?? 0) >= 2 && boss.state !== 'roar');
  assert.ok(seen.has(F.arranque), `al arrancarse las clavijas: ${[...seen].join(', ')}`);
  assert.ok(!seen.has(F.pasando));
});

test('estilo a7h: la placa «1962» se pinta otra vez sin voltear, justo encima de la suya', () => {
  const bd = def.anim!.badge!;
  const P = CN.CENTRALITA_PLATE;
  assert.deepEqual([bd.sprite, bd.x, bd.y, bd.w, bd.upTo], ['placa-centralita', P.x, P.y, P.w, frames.length]);
  const plate = CN.makeCentralitaPlate();
  const s = allSheets()['placa-centralita']!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w], [P.w, P.h, P.w]);
  for (const [k, f] of frames.entries()) {
    const dx = bd.frameDx?.[k] ?? 0;
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      assert.ok(same(f.get(P.x + dx + x, P.y + y), plate.get(x, y)), `${CN.CENTRALITA_FRAMES[k]}: la placa en (${x}, ${y})`);
    }
  }
  // Only the frames that lurch forward move it.
  assert.deepEqual(Object.keys(bd.frameDx ?? {}).map(Number), frames.flatMap((_, k) => (CN.centralitaNuevaLook(CN.CENTRALITA_FRAMES[k]!).dx ? [k] : [])));
});
