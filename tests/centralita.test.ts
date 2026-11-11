// La Centralita en la simulación (M11 (5b) y (2c2), jefa de la planta 5): su sala de cuatro
// departamentos con los mostradores bajos (paran balas y se cruzan rodando), la fase 1 «Su llamada
// es importante» con el menú de voz (tres zonas en el suelo; llueven balas en las que no son) y la
// fase 2 «Le paso con el departamento» (cada 10 s pasa a la tostadora a otro departamento, donde la
// espera un patrón propio, y llama a un Teléfono de Recepción).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { PROPS } from '../src/data/props.ts';
import { floorBossOf, ROOMS } from '../src/data/rooms.ts';
import type { BossBrain, BossMenuAttack } from '../src/data/types.ts';
import { DEPARTMENT_NAMES, DOWN_CAUSES, menuOptionLine } from '../src/data/texts.ts';
import { departmentOf, departmentRect, inMenuZone, MENU_ZONE_H, MENU_ZONE_W } from '../src/sim/enemies.ts';
import { Bot } from '../src/sim/bot.ts';
import { TILE } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, isClear, isRolling, NO_INPUT, onLowProp, step, worldHash, type Enemy, type Input, type SimEvent, type World } from '../src/sim/world.ts';
import { LOW_COUNTER_BOX, LOW_COUNTER_V_BOX, ZONE_H, ZONE_W } from '../tools/sprites/centralita.ts';

const def = ENEMIES.centralita!;
const brain = def.brain as BossBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'centralita', damage = false): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-atencion', level: 5 });
  w.intro = null;
  w.noDamage = !damage;
  const boss = w.enemies.find((e) => e.def.id === 'centralita');
  assert.ok(boss, 'la Centralita está en su sala');
  return { w, boss };
}

function run(w: World, s: number, input: Input = NO_INPUT): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < ticks(s); i++) {
    step(w, input);
    out.push(...w.events);
  }
  return out;
}

/** Only the voice menu: the boss's phase 1 picks nothing else. */
function onlyMenu(boss: Enemy): void {
  const ph = (boss.def.brain as BossBrain).phases[0]!;
  boss.def = { ...boss.def, brain: { ...(boss.def.brain as BossBrain), phases: [{ ...ph, attacks: ph.attacks.filter((a) => a.kind === 'menu') }] } };
}

const lows = (w: World) => w.room.props.filter((p) => p.def.low);

test('la Centralita es la jefa de la planta 5, con su sala, su cartel y su causa de baja', () => {
  assert.equal(floorBossOf(5), 'Ú');
  assert.equal(floorBossOf(4), 'E', 'el Director sigue en la 4');
  assert.equal(def.boss?.subtitle, 'Jefa de planta · Atención al Cliente');
  assert.equal(def.boss?.motto, 'Todos nuestros operadores están ocupados. Siempre.');
  assert.ok(DOWN_CAUSES.centralita?.bullet && DOWN_CAUSES.centralita?.contact);
  assert.equal(def.hp, 240);
  assert.deepEqual(brain.phases.map((p) => p.name), ['Su llamada es importante', 'Le paso con el departamento']);
  assert.equal(brain.phases[1]!.from, 0.6);
  const f5 = createWorld({ seed: 'planta-centralita', floor: true, level: 5 }).floor!;
  const room = f5.rooms.find((r) => r.template.kind === 'boss')!;
  assert.equal(room.template.id, 'jefe-atencion');
  assert.equal(ROOMS['jefe-atencion']!.level, 5);
  for (const ph of brain.phases) {
    for (const a of ph.attacks) {
      const name = a.kind === 'pattern' || a.kind === 'menu' ? a.pattern : '';
      assert.ok(PATTERNS[name], `existe el patrón ${name}`);
    }
  }
  for (const p of brain.phases[1]!.transfer!.welcome) assert.ok(PATTERNS[p], `existe el patrón ${p}`);
  assert.equal(brain.phases[1]!.transfer!.welcome.length, 4, 'uno por departamento');
  assert.equal(DEPARTMENT_NAMES.length, 4);
  assert.match(menuOptionLine(3, 0), /pulse 3$/);
});

test('su sala: cuatro mostradores bajos con las cajas de sus sprites, que paran balas, y sitio para ella', () => {
  const { w, boss } = fight();
  const lo = lows(w);
  assert.equal(lo.length, 4);
  assert.equal(lo.filter((p) => p.def.id === 'mostrador-bajo').length, 2);
  assert.equal(lo.filter((p) => p.def.id === 'mostrador-bajo-v').length, 2);
  assert.deepEqual(PROPS['mostrador-bajo']!.box, LOW_COUNTER_BOX);
  assert.deepEqual(PROPS['mostrador-bajo-v']!.box, LOW_COUNTER_V_BOX);
  assert.deepEqual([MENU_ZONE_W, MENU_ZONE_H], [ZONE_W, ZONE_H]);
  for (const p of lo) assert.ok(p.def.blocksBullets, 'paran balas');
  // One long counter on each side, one upright one above and one below the middle.
  const midX = w.room.w / 2;
  assert.ok(lo.some((p) => p.def.id === 'mostrador-bajo' && p.x < midX) && lo.some((p) => p.def.id === 'mostrador-bajo' && p.x > midX));
  const ups = lo.filter((p) => p.def.id === 'mostrador-bajo-v');
  const midY = departmentRect(w.room, 3).y;
  assert.ok(ups.some((p) => p.box.y + p.box.h < midY) && ups.some((p) => p.box.y > midY));
  assert.ok(isClear(w, boss.x, boss.y, boss.def.footRadius), 'empieza en suelo libre');
  // She fits through the hall between the upright counters.
  const gap = ups.reduce((a, p) => (p.box.y > midY ? p.box.y : a), 0) - ups.reduce((a, p) => (p.box.y < midY ? p.box.y + p.box.h : a), 0);
  assert.ok(gap >= TILE * 2, `el paso del medio mide ${gap} px`);
});

test('los cuatro departamentos son los cuartos de la sala', () => {
  const { w } = fight();
  const r = w.room;
  assert.equal(departmentOf(r, TILE * 3, TILE * 3), 1);
  assert.equal(departmentOf(r, r.w - TILE * 3, TILE * 3), 2);
  assert.equal(departmentOf(r, TILE * 3, r.h - TILE * 2), 3);
  assert.equal(departmentOf(r, r.w - TILE * 3, r.h - TILE * 2), 4);
  for (let d = 1; d <= 4; d++) {
    const q = departmentRect(r, d);
    assert.equal(departmentOf(r, q.x + q.w / 2, q.y + q.h / 2), d);
  }
});

test('andando, el mostrador bajo no se cruza; rodando, sí, y nunca se acaba encima', () => {
  const { w, boss } = fight();
  w.enemies = [];
  void boss;
  const c = lows(w).find((p) => p.def.id === 'mostrador-bajo')!;
  const p = w.player;
  const down: Input = { ...NO_INPUT, moveY: 1 };
  p.x = c.x;
  p.y = c.box.y - 6;
  run(w, 1.5, down);
  assert.ok(p.y < c.box.y + 2, `andando se queda delante (y ${p.y.toFixed(1)})`);
  // Rolling down into it from just above: over to the other side.
  for (const startGap of [2, 6, 12]) {
    p.x = c.x;
    p.y = c.box.y - startGap;
    p.vx = 0;
    p.vy = 0;
    p.rollCooldown = 0;
    step(w, { ...down, roll: true });
    let onTop = false;
    for (let i = 0; i < ticks(1.5); i++) {
      step(w, down);
      if (onLowProp(w, p)) onTop = true;
      assert.deepEqual(checkInvariants(w), []);
      if (!isRolling(p)) assert.ok(!onLowProp(w, p), 'la voltereta no acaba encima del mostrador');
    }
    assert.ok(onTop, 'pasa por encima');
    assert.ok(p.y > c.box.y + c.box.h, `rodando lo cruza (desde ${startGap} px: y ${p.y.toFixed(1)})`);
  }
  // The upright one, sideways.
  const v = lows(w).find((q) => q.def.id === 'mostrador-bajo-v')!;
  p.x = v.box.x - 6;
  p.y = v.box.y + v.box.h / 2;
  p.rollCooldown = 0;
  step(w, { ...NO_INPUT, moveX: 1, roll: true });
  run(w, 1.2, { ...NO_INPUT, moveX: 1 });
  assert.ok(p.x > v.box.x + v.box.w, 'el vertical también se cruza rodando');
  assert.ok(!onLowProp(w, p));
});

test('el menú de voz: tres zonas en fila dentro de la sala, una debajo de la tostadora; a veces la buena es la más lejana', () => {
  const seen = { good: 0, far: 0 };
  for (let k = 0; k < 24; k++) {
    const { w, boss } = fight(`menu-${k}`);
    onlyMenu(boss);
    const ev = run(w, 4);
    const lit = ev.find((e) => e.type === 'menuZones');
    assert.ok(lit, 'enciende las zonas');
    // Re-run from scratch to see the menu as it was laid out.
    const again = fight(`menu-${k}`);
    onlyMenu(again.boss);
    let menu: Enemy['menu'] | undefined;
    let at = { x: 0, y: 0 };
    for (let i = 0; i < ticks(4) && !menu; i++) {
      step(again.w, NO_INPUT);
      if (again.boss.menu) {
        menu = structuredClone(again.boss.menu);
        at = { x: again.w.player.x, y: again.w.player.y };
      }
    }
    assert.ok(menu);
    assert.equal(menu.zones.length, 3);
    assert.ok(menu.zones.some((z) => inMenuZone(z, at.x, at.y)), 'una zona debajo de la tostadora');
    for (const z of menu.zones) {
      assert.ok(z.x - MENU_ZONE_W / 2 >= TILE && z.x + MENU_ZONE_W / 2 <= again.w.room.w - TILE, 'dentro de la sala');
      assert.ok(z.y - MENU_ZONE_H / 2 >= TILE * 2 && z.y + MENU_ZONE_H / 2 <= again.w.room.h - TILE);
    }
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(!inMenuZone(menu.zones[i]!, menu.zones[j]!.x, menu.zones[j]!.y), 'no se pisan');
    const d = (z: { x: number; y: number }): number => Math.hypot(z.x - at.x, z.y - at.y);
    if (menu.zones.every((z) => d(z) <= d(menu!.zones[menu!.good]!))) seen.far++;
    seen.good++;
  }
  assert.ok(seen.far >= 24 * 0.3, `a veces la buena es la más lejana (${seen.far} de 24)`);
});

test('la lluvia: quedarse en una zona mala hiere; en la buena, no', () => {
  const a = brain.phases[0]!.attacks.find((x): x is BossMenuAttack => x.kind === 'menu')!;
  let hurtBad = 0;
  let hurtGood = 0;
  const N = 10;
  for (let k = 0; k < N; k++) {
    for (const stay of ['good', 'bad'] as const) {
      const { w, boss } = fight(`lluvia-${k}`, true);
      onlyMenu(boss);
      // Out of her reach and untouched by her: only the rain counts.
      w.player.hp = w.player.def.maxHp;
      let rained = false;
      let hp0 = 0;
      for (let i = 0; i < ticks(5) && !rained; i++) {
        const m = boss.menu;
        if (m?.said) {
          const z = m.zones.find((_, j) => (stay === 'good' ? j === m.good : j !== m.good))!;
          w.player.x = z.x;
          w.player.y = z.y;
          w.player.vx = 0;
          w.player.vy = 0;
          if (!hp0) hp0 = w.player.hp;
        }
        step(w, NO_INPUT);
        if (w.events.some((e) => e.type === 'menuRain')) {
          rained = true;
          const wrong = (w.events.find((e) => e.type === 'menuRain') as Extract<SimEvent, { type: 'menuRain' }>).zones;
          assert.equal(wrong.length, a.zones - 1);
          // The rain is only on the wrong zones.
          const fresh = w.emitters.filter((e) => e.source === boss.id);
          assert.equal(fresh.length, (a.zones - 1) * a.drops);
          for (const e of fresh) assert.ok(wrong.some((z) => inMenuZone(z, e.x, e.y + 3)), 'cae dentro de una zona mala');
        }
      }
      assert.ok(rained, 'llueve');
      run(w, 0.6);
      if (w.player.hp < hp0) {
        if (stay === 'bad') hurtBad++;
        else hurtGood++;
      }
    }
  }
  assert.ok(hurtBad >= N * 0.8, `en la mala hiere (${hurtBad} de ${N})`);
  assert.equal(hurtGood, 0, 'en la buena no');
});

test('fase 2: llama a un teléfono y cada 10 s pasa a la tostadora a otro departamento, con su patrón', () => {
  const { w, boss } = fight('departamentos');
  boss.damageTaken = Math.ceil(def.hp * 0.42);
  const ev0 = run(w, 0.1);
  assert.equal(boss.bossPhase, 1);
  assert.ok(ev0.some((e) => e.type === 'summon'), 'llama a alguien');
  assert.ok(w.enemies.some((e) => e.def.id === 'telefono-recepcion' && e.owner === boss.id), 'un Teléfono de Recepción');
  const tr = brain.phases[1]!.transfer!;
  const moves: Array<{ from: number; to: number; dist: number }> = [];
  let marks = 0;
  let marked = -1;
  for (let i = 0; i < ticks(tr.first + tr.every * 3 + 2); i++) {
    const before = { x: w.player.x, y: w.player.y };
    step(w, NO_INPUT);
    for (const e of w.events) {
      if (e.type === 'deptMark') {
        marks++;
        marked = w.tick;
      }
      if (e.type === 'deptTransfer') {
        assert.ok((w.tick - marked) * DT >= tr.mark - DT * 1.5, 'tras el aviso');
        moves.push({ from: departmentOf(w.room, before.x, before.y), to: e.dept, dist: Math.hypot(e.x - before.x, e.y - before.y) });
        assert.equal(departmentOf(w.room, w.player.x, w.player.y), e.dept);
        assert.ok(isClear(w, w.player.x, w.player.y, w.player.def.footRadius), 'en suelo libre');
        assert.ok(w.player.invulnerable >= tr.grace - DT, 'con su medio segundo de gracia');
        assert.ok(Math.hypot(w.player.x - boss.x, w.player.y - boss.y) > 60, 'no en brazos de la jefa');
        // Its department's welcome, from its corner, with warning.
        const welcome = w.emitters.find((em) => em.source === boss.id && em.telegraph === tr.warn && em.t < 0);
        assert.ok(welcome, 'la espera un patrón');
        assert.equal(departmentOf(w.room, welcome.x, welcome.y + 12), e.dept, 'desde su departamento');
      }
    }
    assert.deepEqual(checkInvariants(w), []);
  }
  assert.ok(marks >= 3, `suena el timbre (${marks})`);
  assert.equal(moves.length, marks);
  for (const m of moves) assert.notEqual(m.from, m.to, 'a otro departamento');
});

test('la pelea es determinista', () => {
  const play = (): string => {
    const { w } = fight('det', true);
    const bot = new Bot('det');
    for (let i = 0; i < ticks(70); i++) step(w, bot.think(w));
    return worldHash(w);
  };
  assert.equal(play(), play());
});

test('el bot va a la zona buena del menú casi siempre', () => {
  let menus = 0;
  let inGood = 0;
  for (let k = 0; k < 12; k++) {
    const { w, boss } = fight(`bot-${k}`, true);
    const bot = new Bot(`bot-${k}`);
    for (let i = 0; i < ticks(240) && !w.over && !w.finale; i++) {
      step(w, bot.think(w));
      if (w.events.some((e) => e.type === 'menuRain') && boss.menu) {
        menus++;
        if (inMenuZone(boss.menu.zones[boss.menu.good]!, w.player.x, w.player.y)) inGood++;
      }
    }
  }
  assert.ok(menus > 50, `${menus} menús`);
  assert.ok(inGood / menus >= 0.7, `en la buena el ${Math.round((inGood / menus) * 100)} %`);
});
