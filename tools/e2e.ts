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
  fps: number;
  shots: number;
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
  await page.goto(url + '?semilla=e2e');
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
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
  // Gamepad: a fake pad through the Gamepad API (standard mapping).
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
  console.log(`e2e: ${s3.tick} ticks, ${s3.shots} disparos, ${s3.dummyDamage} de daño al maniquí, ~${Math.round(s3.fps)} fps.`);
  if (s3.tick < 60 * seconds * 0.5) throw new Error(`La simulación va lenta: ${s3.tick} ticks en ${seconds} s`);
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
