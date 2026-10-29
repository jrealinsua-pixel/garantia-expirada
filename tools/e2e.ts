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
  mouse: { move(x: number, y: number, o?: { steps: number }): Promise<void>; down(): Promise<void>; up(): Promise<void> };
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
