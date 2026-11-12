// Herramienta de una sesión: saca capturas del Mostrador con un perfil dado (para mirar el
// cartel de la cita previa). node tools/mirar-mostrador.ts [salida] [perfil-json]
import { join } from 'node:path';
import { ROOT, requirePackage } from './lib/deps.ts';
import { serve } from './lib/serve.ts';
interface P {
  goto(u: string): Promise<unknown>;
  waitForFunction(f: string, a?: unknown, o?: object): Promise<unknown>;
  evaluate<T>(f: string): Promise<T>;
  screenshot(o: object): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  keyboard: { press(k: string): Promise<void> };
}
const { chromium } = requirePackage<{ chromium: { launch(o?: object): Promise<{ newPage(o: object): Promise<P>; close(): Promise<void> }> } }>('playwright', '');
const outDir = process.argv[2] ?? join(ROOT, 'capturas');
const prof = process.argv[3] ?? '{}';
const at = process.argv[4] ?? '';
const { server, url } = await serve(join(ROOT, 'dist'));
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto(`${url}?mostrador`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`localStorage.setItem('garantia-expirada/perfil', ${JSON.stringify(prof)})`);
  await page.goto(`${url}?mostrador`);
  await page.waitForFunction("window.__GE__ && window.__GE__.state().ready && window.__GE__.scene.world.room.kind === 'hub'", undefined, { timeout: 20000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, 'mostrador.png') });
  if (at) {
    await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.stations.find((s) => s.kind === '${at}'); w.player.x = c.x; w.player.y = c.y + 6; })()`);
    await page.waitForTimeout(200);
    await page.keyboard.press('f');
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(outDir, `mostrador-${at}.png`) });
  }
} finally {
  await b.close();
  server.close();
}
