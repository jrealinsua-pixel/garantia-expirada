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
  // The sounds are synthesised in the background before the first click (no stall on it): within
  // a few seconds every effect and song is ready, with no AudioContext yet.
  await page.waitForFunction('(() => { const s = window.__GE__.scene.sound2; return s.buffers.size >= 50 && s.songs.size >= 2 && !s.ctx; })()', undefined, { timeout: 8000 })
    .catch(() => { throw new Error('Los sonidos no se han preparado antes del primer clic'); });
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
  const tapKeys = async (...keys: string[]): Promise<void> => {
    for (const k of keys) {
      await page.keyboard.press(k);
      await page.waitForTimeout(60);
    }
  };

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
  // Put them next to the toaster, still (they may be sliding from the drop) and ready to be picked up.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; for (const k of w.pickups) { k.x = w.player.x + 12; k.y = w.player.y; k.vx = 0; k.vy = 0; k.age = Math.max(k.age, 1); } })()`);
  await page.waitForFunction('window.__GE__.state().coupons > 0', undefined, { timeout: 2500 }).catch(() => undefined);
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
  // In the middle of the empty row 3, so no box or enemy against its side can hold it back.
  await page.evaluate(`(() => { const p = window.__GE__.scene.world.player; p.x = 240; p.y = 3 * 24 + 12; p.vx = 0; p.vy = 0; })()`);
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
  // (From the left, or from the right if a box stands in the way on the left: it would stop it.)
  const bulletAt = (dx: number): string => `(() => { const w = window.__GE__.scene.world; const p = w.player; const y = p.y - 9;
    const blocked = (x0, x1) => w.room.props.some((pr) => pr.box.y <= y && y <= pr.box.y + pr.box.h && pr.box.x < Math.max(x0, x1) && pr.box.x + pr.box.w > Math.min(x0, x1));
    const s = blocked(p.x - ${dx}, p.x) ? -1 : 1;
    w.bullets.push({ id: w.nextId++, owner: 'enemy', x: p.x - s * ${dx}, y, vx: 140 * s, vy: 0, r: 2.5, life: 3, damage: 1, knockback: 0,
      color: 'red', age: 0, dir: s > 0 ? 0 : Math.PI, speed: 140, by: 'microondas' }); })()`;
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

  // M8: floor 2 (Informática) has its own tiles and colour; ?planta=2 paints the same rooms with them.
  for (const [i, q] of ['sala=carga-descarga&profundidad=5', 'semilla=e2e-planta', 'sala=jefe'].entries()) {
    await page.goto(`${url}?semilla=e2e-p2-${i}&${q}&planta=2`);
    await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
    await page.evaluate('window.__GE__.scene.world.noDamage = true');
    if ((await page.evaluate<number>('window.__GE__.scene.world.level')) !== 2) throw new Error(`?planta=2 no pone la planta 2 (${q})`);
    await page.waitForTimeout(i === 2 ? 4200 : 1600);
    await shot(`33${'abc'[i]}-planta2-${['sala', 'entrada', 'jefe'][i]}.png`);
  }

  // M8: floors in a row. A floor won (here, a lift under the toaster's feet at the entrance) and
  // R: the run goes on in floor 2 with the same toaster, coupons and all.
  await page.goto(`${url}?semilla=e2e-cadena`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.player.coupons = 37; w.lift = { x: w.player.x, y: w.player.y, t: 10 }; })()`);
  await page.waitForFunction('window.__GE__.state().won && window.__GE__.state().report.length > 0', undefined, { timeout: 8000 });
  await page.waitForTimeout(900);
  const chainReport = (await state()).report.join(' | ');
  if (!chainReport.includes('Informática')) throw new Error(`El parte no anuncia la planta 2: ${chainReport}`);
  await shot('34a-cadena-parte.png');
  await page.waitForTimeout(400);
  await page.keyboard.press('r');
  await page.waitForFunction('window.__GE__.state().ready && !window.__GE__.state().won && window.__GE__.scene.world.level === 2', undefined, { timeout: 8000 });
  const chain = await page.evaluate<{ coupons: number; kind: string }>('(() => { const w = window.__GE__.scene.world; return { coupons: w.player.coupons, kind: w.room.kind }; })()');
  if (chain.coupons !== 37 || chain.kind !== 'start') throw new Error(`La planta 2 no sigue con la misma tostadora: ${JSON.stringify(chain)}`);
  await page.waitForTimeout(600);
  await shot('34b-cadena-planta2.png');
  console.log('Plantas encadenadas: tras la planta 1, la 2 con la misma tostadora.');

  // M8: floor 2's own passive items, on a treasure pedestal and in the inventory.
  await page.goto(`${url}?semilla=e2e-objetos2&sala=tesoro&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForTimeout(1400);
  await shot('35a-planta2-tesoro.png');
  await page.evaluate(`(() => { const g = window.__GE__; for (const id of ['usb', 'antivirus', 'hdmi', 'ventilador', 'actualizacion']) g.giveItem(id); })()`);
  const own2 = await page.evaluate<number>("window.__GE__.scene.world.player.items.filter((id) => ['usb', 'antivirus', 'hdmi', 'ventilador', 'actualizacion'].includes(id)).length");
  if (own2 !== 5) throw new Error(`Faltan objetos de la planta 2 en la tostadora (${own2} de 5)`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('35b-planta2-inventario.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  // The gaming mouse: a critical hit on a dummy (every shot a critical, for the picture).
  await page.goto(`${url}?semilla=e2e-critico&sala=sala-pruebas&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.enemies = [];
    for (const id of ['raton', 'bateria', 'cookies', 'avion', 'copia']) g.giveItem(id); w.player.weapon.def.bullets = { crit: { chance: 1, mul: 2 } };
    const d = w.dummies[0]; w.player.x = d.x - 80; w.player.y = d.y; })()`);
  await page.waitForTimeout(500);
  const dc = await dummy(0);
  await aimAt(dc.x, dc.y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await aimAt(dc.x, dc.y);
  await shot('35c-critico.png');
  await page.mouse.up();
  const crit = await page.evaluate<number>('window.__GE__.scene.world.dummies[0].damageTaken');
  if (crit < 4) throw new Error(`El Ratón Gaming no hace críticos (${crit} de daño)`);
  // The backup: half a heart left and a bullet in the face; it comes back instead of going down.
  await page.waitForTimeout(700);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.hp = 1; w.player.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction("window.__GE__.scene.world.player.hp === 2 && !window.__GE__.scene.world.player.items.includes('copia')", undefined, { timeout: 3000 });
  await page.waitForTimeout(350);
  await shot('35d-copia.png');
  if (await page.evaluate<boolean>('window.__GE__.state().over')) throw new Error('La Copia de Seguridad no ha evitado la baja');
  console.log('Planta 2: sus objetos pasivos, en el tesoro y en el inventario; el doble clic del ratón y la copia de seguridad.');

  // M8: the printer of floor 2. Invoices in the air, then a jam («Atasco de papel»).
  await page.goto(`${url}?semilla=e2e-impresora-6&sala=taller-expres&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForFunction("window.__GE__.scene.world.bullets.some((b) => b.color === 'invoice')", undefined, { timeout: 12000 });
  await page.waitForTimeout(250);
  await shot('35e-impresora.png');
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'jam' && e.t > 0.15)", undefined, { timeout: 25000 });
  await shot('35f-impresora-atasco.png');
  console.log('Impresora: facturas al vuelo y un atasco de papel.');

  // M8: the fake chargers: lying as bait, then jumping up and giving a shock.
  await page.goto(`${url}?semilla=e2e-cargador-1&sala=taller-expres&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  // Only the chargers, and the toaster near them (but not near enough to wake them), so the camera shows them.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.enemies = w.enemies.filter((e) => e.def.id === 'cargador');
    const c = w.enemies[0]; w.player.x = c.x - 110; w.player.y = c.y + 30; })()`);
  await page.waitForTimeout(1200);
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.enemies.every((e) => e.state === 'lurk')"))) throw new Error('Los cargadores no esperan tirados en el suelo');
  await shot('35g-cargador-cebo.png');
  await page.evaluate("(() => { const w = window.__GE__.scene.world; const c = w.enemies[0]; w.player.x = c.x - 52; w.player.y = c.y; w.player.vx = 0; w.player.vy = 0; })()");
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'reveal')", undefined, { timeout: 3000 });
  await page.waitForTimeout(200);
  await shot('35h-cargador-descubierto.png');
  await page.waitForFunction("window.__GE__.scene.world.bullets.some((b) => b.owner === 'enemy' && b.color === 'cyan')", undefined, { timeout: 8000 });
  await page.waitForTimeout(120);
  await shot('35i-cargador-calambre.png');
  console.log('Cargador Falso: de cebo en el suelo a calambre.');

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
  // From the floor into the boss room (not the loose ?sala=jefe): the start room's door is rewired
  // to lead there, as if it were next door. She must be there, with her entrance, doors shut.
  await page.goto(`${url}?semilla=e2e-planta`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const toBoss = await page.evaluate<{ dir: string }>(`(() => {
    const w = window.__GE__.scene.world; const f = w.floor; const here = f.layout.rooms[f.current];
    const boss = f.layout.rooms[f.layout.boss]; const opp = { N: 'S', S: 'N', E: 'W', W: 'E' };
    const door = here.doors.find((d) => !d.secret && boss.doors.some((b) => b.dir === opp[d.dir])) || here.doors.find((d) => !d.secret);
    door.to = f.layout.boss;
    const d = w.room.doors.find((x) => x.dir === door.dir); const p = w.player;
    p.x = d.dir === 'E' ? d.x - 20 : d.dir === 'W' ? d.x + d.w + 20 : d.x + d.w / 2;
    p.y = d.dir === 'N' ? d.y + d.h + 20 : d.dir === 'S' ? d.y - 20 : d.y + d.h / 2 + 4;
    return { dir: door.dir };
  })()`);
  const tkey = { N: 'w', S: 's', E: 'd', W: 'a' }[toBoss.dir] ?? 'd';
  await page.keyboard.down(tkey);
  await page.waitForFunction(`window.__GE__.scene.world.room.kind === 'boss'`, undefined, { timeout: 4000 });
  await page.keyboard.up(tkey);
  await page.waitForTimeout(900);
  const inBoss = await page.evaluate<{ boss: boolean; intro: boolean; shut: boolean }>(
    '(() => { const w = window.__GE__.scene.world; return { boss: w.enemies.some((e) => e.def.boss), intro: !!w.intro, shut: w.doorsShut }; })()',
  );
  await shot('16f-planta-jefa.png');
  console.log(`Planta: de la entrada a la sala de la jefa por la puerta ${toBoss.dir}: ${JSON.stringify(inBoss)}`);
  if (!inBoss.boss || !inBoss.intro || !inBoss.shut) throw new Error(`Al entrar desde la planta, la jefa no está o no se presenta: ${JSON.stringify(inBoss)}`);

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
  // The boss's song is on (the click above unlocked the sound).
  const song = await page.evaluate<string | null>('window.__GE__.scene.sound2.playing?.name ?? null');
  if (song !== 'jefa') throw new Error(`En la sala de la jefa suena «${song}» en vez de «jefa»`);
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
  const baseMag = await page.evaluate<number>('window.__GE__.scene.world.player.weapon.base.magazine');
  if (mag !== baseMag + 16) throw new Error(`El modificador no cambia el cargador: ${mag}`);
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
  await tapKeys('ArrowDown', 'ArrowDown', 'Enter', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowDown', 'Enter', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('25b-opciones.png');
  const saved = await page.evaluate<string | null>("localStorage.getItem('garantia-expirada/opciones')");
  const so = JSON.parse(saved ?? '{}') as Record<string, unknown>;
  if (JSON.stringify([so.volume, so.music, so.shake, so.flashes, so.bigText]) !== JSON.stringify([4, 6, false, false, true])) throw new Error(`Opciones mal guardadas: ${saved}`);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('25c-controles.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  await page.waitForTimeout(300);
  if ((await page.evaluate<number>('window.__GE__.scene.world.tick')) === pausedAt) throw new Error('El juego no vuelve después de la pausa');
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  console.log('Pausa: congela el juego, guarda volumen 4, sin temblor, con destellos suaves y texto grande, enseña los controles y vuelve.');

  // M7: Opciones › Teclas. Rolling goes to K and up to I; then K rolls and the space bar does
  // not, I goes up and W does not; the controls hint says so.
  await page.goto(`${url}?semilla=e2e-teclas&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('32a-teclas.png');
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('32b-teclas-esperando.png');
  await tapKeys('k', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'Enter', 'p', 'i');
  await page.waitForTimeout(150);
  await shot('32c-teclas-cambiadas.png');
  const keymap = JSON.parse((await page.evaluate<string | null>("localStorage.getItem('garantia-expirada/opciones')")) ?? '{}').keys as Record<string, string[]>;
  if (keymap?.roll?.[0] !== 'KeyK' || keymap?.up?.[0] !== 'KeyI' || keymap.roll.includes('Space')) throw new Error(`Teclas mal guardadas: ${JSON.stringify(keymap)}`);
  await tapKeys('Escape', 'Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  await page.waitForTimeout(200);
  const yAt = (): Promise<number> => page.evaluate<number>('window.__GE__.scene.world.player.y');
  const holdKey = async (k: string, ms: number): Promise<number> => {
    const y0 = await yAt();
    await page.keyboard.down(k);
    await page.waitForTimeout(ms);
    await page.keyboard.up(k);
    await page.waitForTimeout(100);
    return (await yAt()) - y0;
  };
  if ((await holdKey('i', 300)) > -8) throw new Error('La I no sube después de cambiarla');
  if (Math.abs(await holdKey('w', 300)) > 0.5) throw new Error('La W sigue subiendo');
  await page.waitForTimeout(800);
  await page.keyboard.press('Space');
  await page.waitForTimeout(60);
  if (await page.evaluate<boolean>('window.__GE__.scene.world.player.rollT >= 0')) throw new Error('El espacio sigue rodando');
  await page.keyboard.press('k');
  await page.waitForFunction('window.__GE__.scene.world.player.rollT >= 0', undefined, { timeout: 1000 });
  const hint = await page.evaluate<string>('window.__GE__.scene.hintText');
  if (!hint.startsWith('I') || !hint.includes('K RODAR')) throw new Error(`La ayuda de controles no dice las teclas nuevas: ${hint}`);
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  console.log('Teclas: rodar a la K y subir a la I; la P (pausa) no se deja; la ayuda las nombra.');

  // M6: the inventory, in the pause menu, with a few items, an active one and a synergy.
  await page.goto(`${url}?semilla=e2e-inventario&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true;
    for (const id of ['pila', 'resistencia', 'garantia', 'etiqueta', 'manual', 'broca', 'cinta']) g.giveItem(id); g.giveActive('espera'); })()`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('27a-inventario.png');
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.player.synergies.length > 0"))) throw new Error('La prueba del inventario no tiene sinergia');
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
  await page.waitForTimeout(150);
  await shot('27b-inventario-activo.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  console.log('Inventario: siete objetos, el activo y la sinergia, con las estadísticas antes y después.');
  // The sick-leave report lists what it was carrying; Esc goes from it to the title.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.hp = 1; w.player.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await shot('28-parte-con-equipaje.png');
  await page.keyboard.press('Escape');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('title')", undefined, { timeout: 4000 });
  console.log('Parte de baja: con su equipaje, y Esc lleva a la portada.');

  // M7: «Texto grande». The description window, the synergy's plate (after the window goes),
  // the room's name and the till's bubble, all at double size.
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`localStorage.setItem('garantia-expirada/opciones', JSON.stringify({ bigText: true }))`);
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.waitForTimeout(500);
  await shot('31a-texto-grande-sala.png');
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; g.giveItem('manual'); const k = w.pickups.find((p) => p.kind === 'objeto');
    k.item = 'broca'; w.player.x = k.x - 36; w.player.y = k.y + 2; })()`);
  await page.waitForTimeout(400);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.synergies.includes("bricolaje")', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(350);
  await shot('31b-texto-grande-objeto.png');
  if (await page.evaluate<boolean>('window.__GE__.scene.synergyText.alpha > 0')) throw new Error('Con texto grande, la sinergia sale encima de la ventana');
  await page.waitForFunction('window.__GE__.scene.synergyText.alpha === 1', undefined, { timeout: 9000 });
  await page.waitForTimeout(200);
  await shot('31c-texto-grande-sinergia.png');
  await page.goto(`${url}?semilla=e2e-tienda&sala=tienda`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; const k = w.pickups.find((p) => p.kind === 'objeto');
    w.player.x = k.x; w.player.y = k.y + 46; })()`);
  await page.waitForTimeout(1100);
  await shot('31d-texto-grande-tienda.png');
  await page.goto(`${url}?semilla=e2e-inventario&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; for (const id of ['pila', 'resistencia', 'garantia', 'etiqueta', 'manual', 'broca', 'cinta']) g.giveItem(id);
    const w = g.scene.world; w.player.hp = 1; w.player.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await shot('31e-texto-grande-parte.png');
  await page.goto(`${url}?semilla=e2e-inventario&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true;
    for (const id of ['pila', 'resistencia', 'garantia', 'etiqueta', 'manual', 'broca', 'cinta']) g.giveItem(id); g.giveActive('encuesta'); })()`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('31f-texto-grande-inventario.png');
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
  await page.waitForTimeout(150);
  await shot('31g-texto-grande-inventario-activo.png');
  // Seven items, the active one and two synergies: «Volver» is three lines down.
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown');
  await page.waitForTimeout(150);
  if ((await page.evaluate<string>('window.__GE_PHASER__.scene.getScene("pause").menu.current.id')) !== 'back') throw new Error('El inventario no llega a «Volver»');
  await shot('31h-texto-grande-inventario-volver.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  // The boss card, with its motto at double size.
  await page.goto(`${url}?semilla=e2e-jefe&sala=jefe`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForTimeout(2300);
  await shot('31i-texto-grande-jefa.png');
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  console.log('Texto grande: ventana de descripción, sinergia después, nombre de sala, bocadillo de la caja, parte de baja, inventario y tarjeta de la jefa.');

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

  // M6: the record. A run on a floor ends with the toaster down; the title's history shows it.
  await tapKeys('Enter');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('game') && window.__GE__ && window.__GE__.state().ready", undefined, { timeout: 20000 });
  await page.waitForTimeout(400);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.hp = 1; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await page.keyboard.press('Escape');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('title')", undefined, { timeout: 4000 });
  const savedProfile = await page.evaluate<string | null>("localStorage.getItem('garantia-expirada/perfil')");
  const prof = JSON.parse(savedProfile ?? '{}') as { runs?: number; downs?: number; causes?: Record<string, number> };
  if (prof.runs !== 1 || prof.downs !== 1 || !prof.causes?.['microondas:bullet']) throw new Error(`El historial no apunta la partida: ${savedProfile}`);
  await tapKeys('ArrowUp', 'ArrowUp', 'Enter');
  await page.waitForTimeout(150);
  await shot('29-historial.png');
  await page.evaluate("localStorage.removeItem('garantia-expirada/perfil')");
  console.log('Historial: una reclamación, una baja por microondas.');
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
