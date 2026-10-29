// npm run e2e: builds the game, opens it in headless Chromium, plays ~30 s with simulated
// keyboard and mouse, and saves screenshots to capturas/. Fails on page errors or if the game
// does not react to input.
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, requirePackage } from './lib/deps.ts';
import { serve } from './lib/serve.ts';

interface State {
  ready: boolean;
  tick: number;
  x: number;
  y: number;
  ammo: number;
  bullets: number;
  rolling: boolean;
  dummyDamage: number;
  warnings: number;
  charges: number;
  enemyDamage: number;
  fps: number;
  shots: number;
  kills: number;
  coupons: number;
  pickups: number;
  hp: number;
  over: boolean;
  report: string[];
}

interface Page {
  goto(url: string): Promise<unknown>;
  waitForFunction(fn: string, arg?: unknown, opts?: { timeout: number }): Promise<unknown>;
  evaluate<T>(fn: string): Promise<T>;
  screenshot(o: { path: string }): Promise<unknown>;
  keyboard: { down(k: string): Promise<void>; up(k: string): Promise<void>; press(k: string): Promise<void> };
  mouse: { move(x: number, y: number, o?: { steps: number }): Promise<void>; down(): Promise<void>; up(): Promise<void>; wheel(dx: number, dy: number): Promise<void> };
  waitForTimeout(ms: number): Promise<void>;
  on(ev: string, cb: (x: { message?: string; type?: () => string; text?: () => string }) => void): void;
}
interface Browser {
  newPage(o: { viewport: { width: number; height: number } }): Promise<Page>;
  close(): Promise<void>;
}
interface Playwright {
  chromium: { launch(o?: object): Promise<Browser> };
}

const seconds = Number(process.env.E2E_SECONDS ?? 30);
const out = join(ROOT, 'capturas');
mkdirSync(out, { recursive: true });

execSync('node tools/build.ts', { cwd: ROOT, stdio: 'inherit' });
const { chromium } = requirePackage<Playwright>('playwright', 'Instálalo con «npm install -g playwright».');
const { server, url } = await serve(join(ROOT, 'dist'));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors: string[] = [];
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => {
    if (m.type?.() === 'error') errors.push(m.text?.() ?? '');
  });
  await page.goto(url + '?semilla=e2e&sala=sala-pruebas');
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  // The scripted play is not about surviving: nothing hurts the toaster until the damage test at the end.
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const state = (): Promise<State> => page.evaluate<State>('window.__GE__.state()');
  // Screen position of a world point.
  const toScreen = (x: number, y: number): Promise<{ x: number; y: number }> =>
    page.evaluate(`(() => {
      const s = window.__GE__.scene; const cam = s.cameras.main; const c = s.game.canvas.getBoundingClientRect();
      const z = c.width / 480; return { x: c.left + (${x} - cam.scrollX) * z, y: c.top + (${y} - cam.scrollY) * z };
    })()`);
  const dummy = (i: number): Promise<{ x: number; y: number }> => page.evaluate(`(() => { const d = window.__GE__.scene.world.dummies[${i}]; return { x: d.x, y: d.y - 16 }; })()`);
  const aimAt = async (wx: number, wy: number): Promise<void> => {
    const p = await toScreen(wx, wy);
    await page.mouse.move(p.x, p.y, { steps: 4 });
  };
  const shot = (name: string): Promise<unknown> => page.screenshot({ path: join(out, name) });

  const s0 = await state();
  await shot('01-inicio.png');

  const d0 = await dummy(0);
  await aimAt(d0.x, d0.y);
  await page.keyboard.down('d');
  await page.waitForTimeout(500);
  await shot('02-andando.png');
  await page.waitForTimeout(400);
  await page.keyboard.up('d');
  const s1 = await state();
  if (s1.x <= s0.x + 20) throw new Error(`La tostadora no se ha movido (x ${s0.x} → ${s1.x})`);

  await aimAt(d0.x, d0.y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await aimAt(d0.x, d0.y);
  await shot('03-disparando.png');
  await page.waitForTimeout(900);
  await page.mouse.up();
  const s2 = await state();
  if (s2.shots === 0) throw new Error('No se ha disparado');
  if (s2.dummyDamage === 0) throw new Error('Ninguna bala ha dado al maniquí');

  // Attack warning: an aimed burst (key 4) blinks, beeps and shows its direction before firing.
  await page.keyboard.press('4');
  await page.waitForTimeout(300);
  await shot('07-aviso.png');
  if ((await state()).warnings === 0) throw new Error('El ataque no ha avisado antes de disparar');
  await page.waitForTimeout(900);

  // Enemy bullet patterns (test room keys 1-5): check they read well on the floor.
  await page.keyboard.press('1');
  await page.waitForTimeout(700);
  await page.keyboard.press('2');
  await page.waitForTimeout(1400);
  await shot('06-patrones.png');

  await page.keyboard.down('s');
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  await shot('04-rodando.png');
  await page.waitForTimeout(400);
  await page.keyboard.up('s');

  // Bombilla de Bajo Consumo and its moth: stand at a distance and wait for the spiral.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const b = w.enemies.find((e) => e.def.id === 'bombilla');
    w.player.x = b.x + 20; w.player.y = b.y + 110; })()`);
  const bulb = await page.evaluate<{ x: number; y: number }>(`(() => { const b = window.__GE__.scene.world.enemies.find((e) => e.def.id === 'bombilla'); return { x: b.x, y: b.y - 20 }; })()`);
  await aimAt(bulb.x, bulb.y);
  const bulbFiring = `(() => { const w = window.__GE__.scene.world; const b = w.enemies.find((e) => e.def.id === 'bombilla');
    return b.state === 'fire' && b.t > 1.7; })()`;
  await page.waitForFunction(bulbFiring, undefined, { timeout: 8000 });
  await shot('08-bombilla.png');

  // Batidora de Mano: let it come close, and catch it winding up for a lunge, already in TURBO.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'batidora');
    m.damageTaken = Math.ceil(m.def.hp * 0.7); w.player.x = m.x - 70; w.player.y = m.y; })()`);
  const mixerWinding = `(() => { const m = window.__GE__.scene.world.enemies.find((e) => e.def.id === 'batidora');
    return !!m && m.state === 'warn' && m.turbo && m.t > m.until * 0.5; })()`;
  await page.waitForFunction(mixerWinding, undefined, { timeout: 6000 });
  await shot('08b-batidora.png');

  // Mandos a Distancia: stand near the group and catch one switching off like an old TV, with the
  // static crackling where it will come back.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'mando');
    if (m) { w.player.x = m.x + 90; w.player.y = m.y - 20; } })()`);
  const remoteBlinking = `(() => { const w = window.__GE__.scene.world;
    return w.enemies.some((e) => e.def.id === 'mando' && (e.state === 'gone' || (e.state === 'blink' && e.t > e.until * 0.4))); })()`;
  await page.waitForFunction(remoteBlinking, undefined, { timeout: 8000 });
  await shot('08c-mando.png');
  await page.waitForTimeout(600);

  // Taking an enemy apart: the microwave, already worn down, shot from close; then pick up its coupons.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'microondas');
    m.damageTaken = m.def.hp - 3; w.player.x = m.x + 60; w.player.y = m.y + 6; w.player.weapon.ammo = w.player.weapon.def.magazine; w.player.weapon.reload = 0; })()`);
  const mw = await page.evaluate<{ x: number; y: number }>(`(() => { const m = window.__GE__.scene.world.enemies.find((e) => e.def.id === 'microondas'); return { x: m.x, y: m.y - 14 }; })()`);
  // Let the camera settle on the new spot, then keep the crosshair on it while firing.
  await page.waitForTimeout(700);
  await aimAt(mw.x, mw.y);
  await page.mouse.down();
  for (let i = 0; i < 25 && (await state()).kills === 0; i++) {
    await aimAt(mw.x, mw.y);
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  if ((await state()).kills === 0) {
    await shot('error-desmontaje.png');
    const dbg = await page.evaluate<string>(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'microondas');
      return JSON.stringify({ m: m && { x: m.x, y: m.y, dmg: m.damageTaken }, p: { x: w.player.x, y: w.player.y, aim: w.player.aim, ammo: w.player.weapon.ammo } }); })()`);
    throw new Error('El microondas no se ha desmontado: ' + dbg);
  }
  await page.waitForTimeout(160);
  await shot('09-desmontaje.png');
  await page.waitForTimeout(700);
  await shot('10-cupones.png');
  const sk = await state();
  if (sk.pickups === 0 && sk.coupons === 0) {
    // The loot roll can give nothing only for enemies whose range starts at 0: the microwave always drops some.
    throw new Error('El microondas no ha soltado cupones');
  }
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; for (const k of w.pickups) { k.x = w.player.x + 20; k.y = w.player.y; } })()`);
  await page.waitForTimeout(600);
  if ((await state()).coupons === 0) throw new Error('La tostadora no ha recogido los cupones');

  // Free play for the rest of the time: strafe around shooting at both dummies.
  const keys = ['w', 'a', 's', 'd'];
  const t0 = Date.now();
  let k = 0;
  while (Date.now() - t0 < Math.max(0, seconds - 5) * 1000) {
    const key = keys[k % 4]!;
    const d = await dummy(k % 2);
    await aimAt(d.x, d.y);
    await page.keyboard.down(key);
    await page.mouse.down();
    await page.waitForTimeout(700);
    if (k % 3 === 0) await page.keyboard.press('Space');
    await page.mouse.up();
    await page.keyboard.up(key);
    k++;
  }
  // Gamepad: a fake pad through the Gamepad API (standard mapping). Reload first, so the trigger
  // test does not land on an empty magazine.
  await page.keyboard.press('r');
  await page.waitForTimeout(1300);
  await page.evaluate(`(() => {
    const pad = { id: 'mando-falso', index: 0, connected: true, mapping: 'standard', timestamp: 0,
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__PAD__ = pad;
    navigator.getGamepads = () => [pad];
  })()`);
  const sp0 = await state();
  await page.evaluate(`(() => { const p = window.__PAD__; p.axes[0] = -1; p.axes[2] = -1; p.buttons[7].pressed = true; })()`);
  await page.waitForTimeout(700);
  await page.evaluate(`(() => { const p = window.__PAD__; p.axes[0] = 0; p.axes[2] = 0; p.buttons[7].pressed = false; })()`);
  const sp1 = await state();
  if (sp1.x >= sp0.x - 10) throw new Error(`El mando no mueve a la tostadora (x ${sp0.x} → ${sp1.x})`);
  if (sp1.shots <= sp0.shots) throw new Error('El gatillo del mando no dispara');
  await page.evaluate(`(() => { navigator.getGamepads = () => []; })()`);
  await page.mouse.move(10, 10);

  const d1 = await dummy(1);
  await aimAt(d1.x, d1.y);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await shot('05-final.png');
  await page.mouse.up();
  const s3 = await state();
  console.log(
    `e2e: ${s3.tick} ticks, ${s3.shots} disparos, ${s3.dummyDamage} de daño al maniquí, ${s3.enemyDamage} a los enemigos, ` +
      `${s3.charges} embestidas, ${s3.kills} bajas, ${s3.coupons} cupones, ~${Math.round(s3.fps)} fps.`,
  );
  if (s3.charges === 0) throw new Error('El aspirador no ha embestido en toda la partida');
  if (s3.tick < 60 * seconds * 0.5) throw new Error(`La simulación va lenta: ${s3.tick} ticks en ${seconds} s`);

  // Damage: an enemy bullet at the toaster takes half a heart and leaves it blinking.
  const bulletAt = (dx: number): string => `(() => { const w = window.__GE__.scene.world; const p = w.player;
    w.bullets.push({ id: w.nextId++, owner: 'enemy', x: p.x - ${dx}, y: p.y - 9, vx: 140, vy: 0, r: 2.5, life: 3, damage: 1, knockback: 0,
      color: 'red', age: 0, dir: 0, speed: 140, by: 'microondas' }); })()`;
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
  const hp0 = (await state()).hp;
  await page.evaluate(bulletAt(24));
  await page.waitForTimeout(260);
  await shot('11-herida.png');
  const sh = await state();
  if (sh.hp !== hp0 - 1) throw new Error(`Una bala enemiga no quita medio corazón (${hp0} → ${sh.hp})`);
  // Down: with half a heart left, one more bullet ends it. The toaster comes apart (slices,
  // spring, screws), the sick-leave report drops in with its stamp, and R asks for a new unit.
  await page.waitForTimeout(1300);
  await page.evaluate(`(() => { const p = window.__GE__.scene.world.player; p.hp = 1; p.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(950);
  await shot('12-desmontaje.png');
  await page.waitForTimeout(2000);
  await shot('13-parte-de-baja.png');
  const rep = (await state()).report;
  if (!rep.some((l) => l.startsWith('Causa: ')) || !rep.some((l) => l.startsWith('Recomendación del fabricante: ')))
    throw new Error(`El parte de baja no trae causa o recomendación: ${JSON.stringify(rep)}`);
  console.log(`Parte de baja: ${rep.join(' | ')}`);
  await page.keyboard.press('r');
  await page.waitForFunction('!window.__GE__.state().over && window.__GE__.state().tick < 120', undefined, { timeout: 4000 });

  // Floor room templates (M3), slots filled for a deep room: they load, nothing breaks, and they read.
  for (const [i, sala] of ['carga-descarga', 'archivo-tickets', 'camara-garantias'].entries()) {
    await page.goto(`${url}?semilla=e2e-${sala}&sala=${sala}&profundidad=5`);
    await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
    await page.evaluate('window.__GE__.scene.world.noDamage = true');
    await page.waitForTimeout(1600);
    await shot(`14${'abc'[i]}-sala-${sala}.png`);
    const n = await page.evaluate<number>('window.__GE__.scene.world.enemies.length');
    if (n === 0) throw new Error(`La sala ${sala} no tiene enemigos`);
    if (!(await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut'))) throw new Error(`La sala ${sala} no cierra las persianas`);
  }
  // Clearing the last room rolls its shutters up.
  await page.evaluate('window.__GE__.scene.world.enemies.forEach((e) => { e.damageTaken = e.def.hp; })');
  await page.waitForTimeout(250);
  await shot('15a-persianas-subiendo.png');
  await page.waitForTimeout(900);
  await shot('15b-persianas-abiertas.png');
  if (await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut')) throw new Error('Las persianas no se abren al vaciar la sala');

  // A whole floor (the default page): walk out of the entrance through a door and into the next room.
  await page.goto(`${url}?semilla=e2e-planta`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const where = (): Promise<{ room: number; kind: string; shut: boolean; enemies: number }> =>
    page.evaluate(`(() => { const w = window.__GE__.scene.world; return { room: w.floor.current, kind: w.room.kind, shut: w.doorsShut, enemies: w.enemies.length }; })()`);
  const start = await where();
  if (start.kind !== 'start' || start.shut) throw new Error(`La planta no empieza en una entrada abierta: ${JSON.stringify(start)}`);
  await page.waitForTimeout(600);
  await shot('16a-planta-entrada.png');
  // Stand a few steps from a door and walk into it (east or west if there is one: it is a longer walk on screen).
  const door = await page.evaluate<{ dir: string }>(`(() => {
    const w = window.__GE__.scene.world; const ds = w.room.doors;
    const d = ds.find((x) => x.dir === 'E') || ds.find((x) => x.dir === 'W') || ds[0];
    const p = w.player;
    p.x = d.dir === 'E' ? d.x - 30 : d.dir === 'W' ? d.x + d.w + 30 : d.x + d.w / 2;
    p.y = d.dir === 'N' ? d.y + d.h + 30 : d.dir === 'S' ? d.y - 30 : d.y + d.h / 2 + 4;
    return { dir: d.dir };
  })()`);
  const key = { N: 'w', S: 's', E: 'd', W: 'a' }[door.dir] ?? 'd';
  await page.keyboard.down(key);
  await page.waitForFunction(`window.__GE__.scene.world.floor.current !== ${start.room}`, undefined, { timeout: 4000 });
  await page.waitForTimeout(60);
  await shot('16b-planta-fundido.png');
  await page.keyboard.up(key);
  await page.waitForTimeout(700);
  await shot('16c-planta-sala-vecina.png');
  const next = await where();
  console.log(`Planta: de la sala ${start.room} (entrada) a la ${next.room} (${next.kind}, ${next.enemies} enemigos) por la puerta ${door.dir}`);
  if (next.kind === 'combat' && (!next.shut || next.enemies === 0)) throw new Error('Al entrar en una sala de combate no se cierran las persianas');
  if ((await state()).fps < 30) throw new Error(`Va lento en la planta: ${(await state()).fps} fps`);
  // Clear it and walk back the way we came.
  await page.evaluate('window.__GE__.scene.world.enemies.forEach((e) => { e.damageTaken = e.def.hp; })');
  await page.waitForTimeout(1200);
  const back = { N: 'S', S: 'N', E: 'W', W: 'E' }[door.dir]!;
  await page.evaluate(`(() => {
    const w = window.__GE__.scene.world; const d = w.room.doors.find((x) => x.dir === '${back}'); const p = w.player;
    p.x = d.dir === 'E' ? d.x - 20 : d.dir === 'W' ? d.x + d.w + 20 : d.x + d.w / 2;
    p.y = d.dir === 'N' ? d.y + d.h + 20 : d.dir === 'S' ? d.y - 20 : d.y + d.h / 2 + 4;
  })()`);
  const bkey = { N: 'w', S: 's', E: 'd', W: 'a' }[back] ?? 'a';
  await page.keyboard.down(bkey);
  await page.waitForFunction(`window.__GE__.scene.world.floor.current === ${start.room}`, undefined, { timeout: 4000 });
  await page.keyboard.up(bkey);
  await page.waitForTimeout(500);
  await shot('16d-planta-vuelta.png');
  // The minimap with the whole floor known (as if every room had been visited): icons and corridors.
  await page.evaluate('(() => { const s = window.__GE__.scene; s.world.floor.rooms.forEach((r) => { r.visited = true; }); s.drawMinimap(); })()');
  await page.waitForTimeout(100);
  await shot('16e-minimapa.png');

  // The boss room (M4): La Nevera Suprema makes her entrance; firing again skips the rest.
  await page.goto(`${url}?semilla=e2e-jefe&sala=jefe`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  if (!(await page.evaluate<boolean>('!!window.__GE__.scene.world.intro'))) throw new Error('La sala del jefe no tiene presentación');
  await page.waitForTimeout(450);
  await shot('17a-jefe-entrada.png');
  await page.waitForTimeout(850);
  await shot('17b-jefe-nombre.png');
  await page.waitForTimeout(700);
  await shot('17c-jefe-lema.png');
  await page.mouse.move(240, 120);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForFunction('!window.__GE__.scene.world.intro', undefined, { timeout: 1500 });
  await page.waitForTimeout(900);
  await shot('17d-jefe-combate.png');
  if (!(await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut'))) throw new Error('La sala del jefe no cierra las persianas');
  // Phase 1: ice cubes from the dispenser, then frost lobbed at the toaster that slows it down.
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'ice' && b.age > 0.4 && v.contains(b.x, b.y)).length >= 10; })()`,
    undefined,
    { timeout: 15000 },
  );
  await shot('17e-nevera-cubitos.png');
  await page.waitForFunction('window.__GE__.scene.world.frost.some((f) => f.t < 0 && f.t > -0.5)', undefined, { timeout: 20000 });
  await shot('17f-nevera-escarcha-aire.png');
  await page.waitForFunction('window.__GE__.scene.world.frost.some((f) => f.t > 0.3)', undefined, { timeout: 5000 });
  await page.evaluate(`(() => {
    const w = window.__GE__.scene.world; const f = w.frost.find((x) => x.t > 0.3); w.player.x = f.x; w.player.y = f.y;
  })()`);
  await page.keyboard.down('d');
  await page.waitForTimeout(300);
  await shot('17g-nevera-escarcha.png');
  await page.keyboard.up('d');
  if ((await state()).fps < 30) throw new Error(`Va lento contra la jefa: ${(await state()).fps} fps`);
  // Phase 2 («Oferta irrechazable»): half her life gone, the door opens; loyalty cards that chase
  // and expired products spat from the fridge.
  await page.evaluate(`(() => { const b = window.__GE__.scene.world.enemies[0]; b.damageTaken = Math.ceil(b.def.hp / 2) + 1; })()`);
  await page.waitForFunction('window.__GE__.scene.world.enemies[0].bossPhase === 1', undefined, { timeout: 3000 });
  // The phase change: she stops, the screen clears and the phase card comes up over her life bar.
  await page.waitForTimeout(450);
  if ((await page.evaluate<string>('window.__GE__.scene.world.enemies[0].state')) !== 'roar') throw new Error('La nevera no se detiene al cambiar de fase');
  if (await page.evaluate<boolean>("window.__GE__.scene.world.bullets.some((b) => b.owner === 'enemy')")) throw new Error('Quedan balas enemigas al cambiar de fase');
  await shot('17k-nevera-cambio-fase.png');
  // Between attacks, so the open door is not hidden by the warning blink.
  await page.waitForFunction("window.__GE__.scene.world.enemies[0].state === 'idle'", undefined, { timeout: 8000 });
  await shot('17h-nevera-fase2.png');
  await page.waitForFunction(`window.__GE__.scene.world.bullets.filter((b) => b.color === 'card' && b.age > 0.6).length >= 3`, undefined, { timeout: 20000 });
  await shot('17i-nevera-tarjetas.png');
  await page.waitForFunction('window.__GE__.scene.world.frost.some((f) => f.product !== undefined && f.t > -0.45)', undefined, { timeout: 20000 });
  await shot('17j-nevera-caducados.png');
  if ((await state()).fps < 30) throw new Error(`Va lento en la fase 2: ${(await state()).fps} fps`);
  // Her life runs out: she comes apart for a while, then «Liquidación total» and the shutters go up.
  await page.evaluate(`(() => { const b = window.__GE__.scene.world.enemies[0]; b.damageTaken = b.def.hp; })()`);
  await page.waitForFunction("window.__GE__.scene.world.enemies[0]?.state === 'dying'", undefined, { timeout: 3000 });
  await page.waitForTimeout(1500);
  await shot('17l-nevera-cayendo.png');
  await page.waitForFunction('window.__GE__.scene.world.enemies.length === 0', undefined, { timeout: 5000 });
  await page.waitForTimeout(1100);
  await shot('17m-nevera-liquidada.png');
  if (await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut')) throw new Error('Las persianas no suben al caer la jefa');
  // The reward: a spare heart among the coupons, and the goods lift down to the next floor.
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.pickups.some((k) => k.kind === 'corazon')"))) throw new Error('La jefa no suelta un corazón');
  if (!(await page.evaluate<boolean>('!!window.__GE__.scene.world.lift'))) throw new Error('No aparece el montacargas');
  await page.waitForFunction('window.__GE__.scene.world.lift.t > 3.1', undefined, { timeout: 5000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.x = w.lift.x - 40; w.player.y = w.lift.y; })()`);
  await page.waitForTimeout(150);
  await shot('17n-montacargas.png');
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.state().won', undefined, { timeout: 5000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(700);
  await shot('17o-montacargas-bajando.png');
  await page.waitForFunction('window.__GE__.state().report.length > 0', undefined, { timeout: 5000 });
  await page.waitForTimeout(900);
  await shot('17p-planta-superada.png');
  const won = await state();
  console.log(`Planta superada: ${won.report.join(' | ')}`);
  // R asks for a new unit: the run starts again.
  await page.waitForTimeout(400);
  await page.keyboard.press('r');
  await page.waitForFunction('window.__GE__.state().ready && !window.__GE__.state().won', undefined, { timeout: 5000 });

  // M5: modifiers. In the test room the toaster gets three bullets per shot, bigger and bouncing,
  // and a longer magazine (the HUD grows a second row of pips).
  await page.goto(`${url}?semilla=e2e-mods&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => {
    window.__GE__.scene.world.noDamage = true;
    window.__GE__.addModifier({
      id: 'prueba',
      stats: [{ stat: 'pellets', add: 2 }, { stat: 'spreadDeg', add: 8 }, { stat: 'bulletRadius', mul: 1.6 }, { stat: 'magazine', add: 16 }],
      bullets: { bounce: 2 },
    });
  })()`);
  const mag = await page.evaluate<number>('window.__GE__.scene.world.player.weapon.def.magazine');
  if (mag !== 30) throw new Error(`El modificador no cambia el cargador: ${mag}`);
  await page.mouse.move(60, 150);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await shot('18a-modificadores.png');
  await page.mouse.up();
  const bounced = await page.evaluate<number>("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'player' && b.bounce < 2).length");
  console.log(`Modificadores: cargador ${mag}, ${bounced} balas ya rebotadas en pantalla.`);

  // M5: weapons. The test room has the Grapadora and the Plancha on their pedestals: walk onto
  // them, fire each at the enemies, and change weapon with E and the mouse wheel.
  await page.goto(`${url}?semilla=e2e-armas&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  const goTo = (id: string, dx: number): Promise<unknown> =>
    page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; const k = w.pickups.find((p) => p.weapon === '${id}'); w.player.x = k.x + ${dx}; w.player.y = k.y + 2; })()`);
  await goTo('grapadora', -40);
  await page.waitForTimeout(500);
  await shot('19a-arma-en-pedestal.png');
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.arsenal.length === 2', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(250);
  await shot('19b-arma-recogida.png');
  const fireAtEnemy = (): Promise<unknown> =>
    page.evaluate(`(() => { const s = window.__GE__.scene; const w = s.world; const p = w.player;
      const e = w.enemies.filter((x) => x.state !== 'gone').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      s.controls.override = e ? { aimX: e.x, aimY: e.y - 14, fire: true } : { aimX: p.x + 80, aimY: p.y - 10, fire: true }; })()`);
  await fireAtEnemy();
  await page.waitForTimeout(450);
  await shot('19c-grapadora.png');
  await page.evaluate('window.__GE__.scene.controls.override = null');
  await goTo('plancha', -40);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.arsenal.length === 3', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  // Up close to an enemy for the steam.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world;
    const e = w.enemies.find((x) => x.state !== 'gone' && x.def.id !== 'bombilla'); if (e) { w.player.x = e.x - 90; w.player.y = e.y; } })()`);
  // Let the camera catch up after the jump.
  await page.waitForTimeout(800);
  await fireAtEnemy();
  await page.waitForFunction("window.__GE__.scene.world.player.weapon.ammo < window.__GE__.scene.world.player.weapon.def.magazine", undefined, { timeout: 3000 });
  await page.waitForTimeout(10);
  await shot('19d-plancha.png');
  await page.evaluate('window.__GE__.scene.controls.override = null');
  const slotOf = (): Promise<string> => page.evaluate<string>('window.__GE__.scene.world.player.weapon.base.id');
  const before = await slotOf();
  await page.keyboard.press('e');
  await page.waitForTimeout(120);
  const afterE = await slotOf();
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(160);
  const afterWheel = await slotOf();
  await shot('19e-cambio-de-arma.png');
  if (before === afterE || afterE === afterWheel) throw new Error(`El cambio de arma no funciona: ${before} → ${afterE} → ${afterWheel}`);
  console.log(`Armas: ${before} → E → ${afterE} → rueda → ${afterWheel}.`);

  // M5: passive items. A treasure room played on its own has a weapon and an item on its
  // pedestals: walk onto the item, read its name and description, then try a full build.
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  const item = await page.evaluate<string>(`(() => { const w = window.__GE__.scene.world; const k = w.pickups.find((p) => p.kind === 'objeto');
    w.player.x = k.x - 36; w.player.y = k.y + 2; return k.item; })()`);
  await page.waitForTimeout(600);
  await shot('20a-objeto-en-pedestal.png');
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.items.length === 1', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(300);
  await shot('20b-objeto-recogido.png');
  await page.goto(`${url}?semilla=e2e-build&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true; for (const id of ['manual', 'regleta', 'tarjeta', 'resistencia', 'garantia']) g.giveItem(id); })()`);
  await fireAtEnemy();
  await page.waitForTimeout(700);
  await shot('20c-build.png');
  await page.evaluate('window.__GE__.scene.controls.override = null');
  const carried = await page.evaluate<number>('window.__GE__.scene.world.player.items.length');
  if (carried !== 5) throw new Error(`La tostadora lleva ${carried} objetos en vez de 5`);
  console.log(`Objetos: recogido ${item} en el tesoro; build de prueba con ${carried} objetos.`);

  // M5: active items. Pick one up in the treasure room, then in the test room put everything on
  // hold with the Música de Espera and wipe a pattern with the Encuesta (Q).
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const k = w.pickups.find((p) => p.kind === 'activo');
    w.player.x = k.x - 36; w.player.y = k.y + 2; })()`);
  await page.waitForTimeout(400);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.active !== null', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(300);
  await shot('21a-activo-recogido.png');
  await page.goto(`${url}?semilla=e2e-activos&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true; g.giveActive('espera'); })()`);
  await page.waitForTimeout(300);
  await page.keyboard.press('3');
  await page.waitForTimeout(500);
  await page.keyboard.press('q');
  await page.waitForTimeout(400);
  await shot('21b-musica-de-espera.png');
  if (!(await page.evaluate<boolean>('window.__GE__.scene.world.holdT > 0'))) throw new Error('La Música de Espera no pone la sala en espera');
  await page.waitForFunction('window.__GE__.scene.world.holdT === 0', undefined, { timeout: 6000 });
  await page.evaluate(`window.__GE__.giveActive('encuesta')`);
  await page.waitForTimeout(400);
  await page.keyboard.press('2');
  await page.waitForTimeout(450);
  const before2 = await page.evaluate<number>("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'enemy').length");
  await page.keyboard.press('q');
  await page.waitForTimeout(150);
  await shot('21c-encuesta.png');
  const after2 = await page.evaluate<number>("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'enemy').length");
  if (before2 === 0 || after2 > 0) throw new Error(`La Encuesta no borra las balas: ${before2} → ${after2}`);
  await page.keyboard.press('q');
  await page.waitForTimeout(200);
  await shot('21d-sin-bateria.png');
  console.log(`Activos: en espera y encuesta (${before2} balas borradas).`);

  // M5: synergies. With the Manual en Chino already carried, pick up the Broca del Ocho in the
  // treasure room: Bricolaje Avanzado switches on, with its banner under the item's.
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; g.giveItem('manual'); const k = w.pickups.find((p) => p.kind === 'objeto');
    k.item = 'broca'; w.player.x = k.x - 36; w.player.y = k.y + 2; })()`);
  await page.waitForTimeout(400);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.synergies.includes("bricolaje")', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(350);
  await shot('22-sinergia.png');
  console.log('Sinergias: Bricolaje Avanzado al juntar Manual y Broca.');

  // M5: chests. One drops in the test room; without a ticket it complains; with the ticket that
  // pops out next to it, it opens and leaves an item and coupons.
  await page.goto(`${url}?semilla=e2e-cofres&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = [];
    g.placeChest(w.player.x + 70, w.player.y - 30); })()`);
  await page.waitForTimeout(150);
  await shot('23a-cofre-cayendo.png');
  await page.waitForTimeout(600);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.props.find((p) => p.chest); w.player.x = c.x; w.player.y = c.y + 30;
    window.__GE__.dropTicket(c.x + 40, c.y + 10); })()`);
  await page.keyboard.down('w');
  await page.waitForTimeout(450);
  await page.keyboard.up('w');
  await shot('23b-cofre-sin-ticket.png');
  if (await page.evaluate<boolean>('window.__GE__.scene.world.room.props.find((p) => p.chest).chest.open')) throw new Error('El cofre se abre sin ticket');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const k = w.pickups.find((p) => p.kind === 'ticket'); w.player.x = k.x - 20; w.player.y = k.y; })()`);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.tickets === 1', undefined, { timeout: 3000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(200);
  await shot('23c-ticket-recogido.png');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.props.find((p) => p.chest); w.player.x = c.x; w.player.y = c.y + 22; })()`);
  await page.keyboard.down('w');
  await page.waitForFunction('window.__GE__.scene.world.room.props.find((p) => p.chest).chest.open', undefined, { timeout: 3000 });
  await page.keyboard.up('w');
  await page.keyboard.down('a');
  await page.waitForTimeout(250);
  await page.keyboard.up('a');
  await page.waitForTimeout(300);
  await shot('23d-cofre-abierto.png');
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.pickups.some((k) => k.kind === 'objeto')"))) throw new Error('El cofre no suelta ningún objeto');
  console.log('Cofres: cerrado sin ticket, abierto con ticket y con su objeto.');

  // M5: the shop. The till greets; without coupons it says no; with them the item is bought.
  await page.goto(`${url}?semilla=e2e-tienda&sala=tienda`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; const k = w.pickups.find((p) => p.kind === 'objeto');
    w.player.x = k.x; w.player.y = k.y + 46; })()`);
  await page.waitForTimeout(1100);
  await shot('24a-tienda.png');
  await page.keyboard.down('w');
  await page.waitForFunction("window.__GE__.scene.world.events.some((e) => e.type === 'shop') || window.__GE__.scene.tillNoT > 0", undefined, { timeout: 3000 });
  await page.keyboard.up('w');
  await page.waitForTimeout(250);
  await shot('24b-tienda-sin-cupones.png');
  if (await page.evaluate<number>('window.__GE__.scene.world.player.items.length')) throw new Error('Se compra sin cupones');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.coupons = 31; w.player.y += 40; })()`);
  await page.waitForTimeout(200);
  await page.keyboard.down('w');
  await page.waitForFunction('window.__GE__.scene.world.player.items.length === 1', undefined, { timeout: 3000 });
  await page.keyboard.up('w');
  await page.waitForTimeout(350);
  await shot('24c-tienda-comprado.png');
  if (await page.evaluate<number>('window.__GE__.scene.world.player.coupons') !== 16) throw new Error('La compra no cobra 15 cupones');
  console.log('Tienda: saludo, sin cupones no vende y con cupones cobra 15 y da el objeto.');

  // M6: the pause menu. Esc freezes the game; options change and are kept; the controls are listed; Esc goes back.
  await page.goto(`${url}?semilla=e2e-pausa&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForFunction('window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  const pausedAt = await page.evaluate<number>('window.__GE__.scene.world.tick');
  await page.waitForTimeout(400);
  if ((await page.evaluate<number>('window.__GE__.scene.world.tick')) !== pausedAt) throw new Error('El juego sigue en pausa');
  await shot('25a-pausa.png');
  const tapKeys = async (...keys: string[]): Promise<void> => {
    for (const k of keys) {
      await page.keyboard.press(k);
      await page.waitForTimeout(60);
    }
  };
  await tapKeys('ArrowDown', 'Enter', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowDown', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('25b-opciones.png');
  const saved = await page.evaluate<string | null>("localStorage.getItem('garantia-expirada/opciones')");
  if (saved !== JSON.stringify({ volume: 4, shake: false })) throw new Error(`Opciones mal guardadas: ${saved}`);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('25c-controles.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  await page.waitForTimeout(300);
  if ((await page.evaluate<number>('window.__GE__.scene.world.tick')) === pausedAt) throw new Error('El juego no vuelve después de la pausa');
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  console.log('Pausa: congela el juego, guarda volumen 4 y sin temblor, enseña los controles y vuelve.');

  // M6: the title screen. Credits, then a run; from the pause, back to the title.
  await page.goto(url);
  await page.waitForFunction("window.__GE_PHASER__ && window.__GE_PHASER__.scene.isActive('title')", undefined, { timeout: 20000 });
  await page.waitForTimeout(500);
  await shot('26a-portada.png');
  await tapKeys('ArrowUp', 'Enter');
  await page.waitForTimeout(150);
  await shot('26b-creditos.png');
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('game') && window.__GE__ && window.__GE__.state().ready", undefined, { timeout: 20000 });
  if (!(await page.evaluate<boolean>('!!window.__GE__.scene.world.floor'))) throw new Error('«Presentar reclamación» no empieza una planta');
  await page.waitForTimeout(600);
  await shot('26c-partida-desde-portada.png');
  await tapKeys('Escape', 'ArrowUp', 'Enter');
  await page.waitForTimeout(150);
  await shot('26d-salir-al-menu.png');
  await tapKeys('ArrowDown', 'Enter');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('title') && !window.__GE_PHASER__.scene.isActive('game')", undefined, { timeout: 5000 });
  console.log('Portada: créditos, partida nueva y vuelta a la portada desde la pausa.');
} catch (e) {
  failed = true;
  console.error('✖ e2e:', (e as Error).message);
} finally {
  await browser.close();
  server.close();
}
if (errors.length) {
  failed = true;
  console.error('✖ Errores en la página:\n' + errors.join('\n'));
}
if (failed) process.exit(1);
console.log('✔ e2e: capturas en capturas/');
