// Performance (M7): frames per second of the real game with N enemy bullets on screen.
//   node tools/rendimiento.ts [--balas 300] [--segundos 6]
// Headless Chromium draws with SwiftShader (on the CPU), so the absolute numbers are a floor:
// what matters is the drop from an empty room to a room full of bullets, and the frame-time
// spikes (p95). Also times the simulation alone (no drawing) with the same bullets.
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, requirePackage } from './lib/deps.ts';
import { serve } from './lib/serve.ts';
import { createWorld, NO_INPUT, step, type World } from '../src/sim/world.ts';

function arg(name: string, def: number): number {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
}

interface Page {
  goto(url: string): Promise<unknown>;
  waitForFunction(fn: string, arg?: unknown, opts?: { timeout: number }): Promise<unknown>;
  evaluate<T>(fn: string): Promise<T>;
  waitForTimeout(ms: number): Promise<void>;
  screenshot(o: { path: string }): Promise<unknown>;
}
interface Browser {
  newPage(o: { viewport: { width: number; height: number } }): Promise<Page>;
  close(): Promise<void>;
}

/** The bullet-filling code, shared by the page (as text) and the simulation timing. */
const FILL = `(w, n, seed) => {
  let k = seed;
  const rnd = () => ((k = (k * 1103515245 + 12345) % 2147483648) / 2147483648);
  let have = 0;
  for (const b of w.bullets) if (b.owner === 'enemy') have++;
  const colors = ['red', 'cyan', 'ice', 'card'];
  for (; have < n; have++) {
    const a = rnd() * Math.PI * 2;
    const sp = 40 + rnd() * 60;
    w.bullets.push({ id: w.nextId++, owner: 'enemy', x: 40 + rnd() * (w.room.w - 80), y: 70 + rnd() * (w.room.h - 110),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3, life: 4 + rnd() * 3, damage: 1, knockback: 0,
      color: colors[have % colors.length], age: 1, dir: a, speed: sp });
  }
  return k;
}`;

type Fill = (w: World, n: number, seed: number) => number;

/** Milliseconds per simulation tick with `n` enemy bullets kept alive. */
function simMs(n: number): number {
  const fill = eval(FILL) as Fill;
  const w = createWorld({ seed: 'rendimiento', room: 'sala-pruebas' });
  w.noDamage = true;
  let seed = 7;
  const input = { ...NO_INPUT, fire: true, aimX: w.player.x + 100, aimY: w.player.y };
  for (let i = 0; i < 60; i++) {
    seed = fill(w, n, seed);
    step(w, input);
  }
  const t0 = performance.now();
  const N = 600;
  for (let i = 0; i < N; i++) {
    seed = fill(w, n, seed);
    step(w, input);
  }
  return (performance.now() - t0) / N;
}

export interface FrameReport {
  balas: number;
  fps: number;
  p95ms: number;
  peorMs: number;
  /** Sprites the scene keeps (all game objects), to spot leaks. */
  objetos: number;
}

async function frames(page: Page, bullets: number, seconds: number): Promise<FrameReport> {
  return page.evaluate<FrameReport>(`(async () => {
    const fill = ${FILL};
    const s = window.__GE__.scene;
    const w = s.world;
    let seed = 11;
    const times = [];
    let last = performance.now();
    const end = last + ${seconds * 1000};
    await new Promise((done) => {
      const tick = (now) => {
        times.push(now - last);
        last = now;
        if (${bullets} > 0) seed = fill(s.world, ${bullets}, seed);
        if (now < end) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
    times.shift();
    const sorted = [...times].sort((a, b) => a - b);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    return {
      balas: s.world.bullets.filter((b) => b.owner === 'enemy').length,
      fps: Math.round(1000 / mean * 10) / 10,
      p95ms: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10,
      peorMs: Math.round(sorted[sorted.length - 1] * 10) / 10,
      objetos: s.children.list.length,
    };
  })()`);
}

if (import.meta.main) {
  const n = arg('balas', 300);
  const seconds = arg('segundos', 6);
  console.log(`Simulación sola: ${simMs(0).toFixed(3)} ms por paso sin balas, ${simMs(n).toFixed(3)} ms con ${n}.`);
  execSync('node tools/build.ts', { cwd: ROOT, stdio: 'inherit' });
  const { chromium } = requirePackage<{ chromium: { launch(o?: object): Promise<Browser> } }>('playwright', 'Instálalo con «npm install -g playwright».');
  const { server, url } = await serve(join(ROOT, 'dist'));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    await page.goto(url + '?semilla=rendimiento&sala=sala-pruebas');
    await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
    await page.evaluate('window.__GE__.scene.world.noDamage = true');
    await page.waitForTimeout(1500);
    const empty = await frames(page, 0, seconds);
    const full = await frames(page, n, seconds);
    mkdirSync(join(ROOT, 'capturas'), { recursive: true });
    await page.screenshot({ path: join(ROOT, 'capturas', `30-${n}-balas.png`) });
    for (const r of [empty, full]) console.log(`${String(r.balas).padStart(4)} balas: ${r.fps} fps · p95 ${r.p95ms} ms · peor ${r.peorMs} ms · ${r.objetos} objetos en escena`);
  } finally {
    await browser.close();
    server.close();
  }
}

