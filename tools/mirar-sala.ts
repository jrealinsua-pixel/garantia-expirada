// Herramienta de una sesión: captura de una sala o una planta por URL, sin pasar el e2e entero.
// node tools/mirar-sala.ts <salida.png> '<consulta, p. ej. sala=banco-pruebas&planta=6>' [ms]
import { join } from 'node:path';
import { ROOT, requirePackage } from './lib/deps.ts';
import { serve } from './lib/serve.ts';
interface P {
  goto(u: string): Promise<unknown>;
  waitForFunction(f: string, a?: unknown, o?: object): Promise<unknown>;
  evaluate<T>(f: string): Promise<T>;
  screenshot(o: object): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
}
const { chromium } = requirePackage<{ chromium: { launch(o?: object): Promise<{ newPage(o: object): Promise<P>; close(): Promise<void> }> } }>('playwright', '');
const out = process.argv[2] ?? join(ROOT, 'capturas/sala.png');
const query = process.argv[3] ?? 'sala=sala-pruebas';
const wait = Number(process.argv[4] ?? 1500);
const { server, url } = await serve(join(ROOT, 'dist'));
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto(`${url}?${query}`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out });
} finally {
  await b.close();
  server.close();
}
