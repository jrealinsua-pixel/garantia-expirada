// Production build: bundles src/main.ts with esbuild and copies the static files to dist/.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, importPackage, type Esbuild } from './lib/deps.ts';

export const esbuildHint = 'Instálalo con «npm install -g esbuild» (ver docs/BITACORA.md).';

export function buildOptions(dev: boolean) {
  return {
    entryPoints: [join(ROOT, 'src/main.ts')],
    bundle: true,
    format: 'iife' as const,
    target: 'es2022',
    sourcemap: dev,
    minify: !dev,
    outfile: join(ROOT, 'dist/game.js'),
    define: { __DEV__: String(dev), __VERSION__: JSON.stringify(version()) },
    logLevel: 'warning' as const,
  };
}

export function version(): string {
  return (JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }).version;
}

export function copyStatic(): void {
  const dist = join(ROOT, 'dist');
  mkdirSync(join(dist, 'vendor'), { recursive: true });
  cpSync(join(ROOT, 'index.html'), join(dist, 'index.html'));
  cpSync(join(ROOT, 'vendor/phaser/phaser.min.js'), join(dist, 'vendor/phaser.min.js'));
  if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), dist, { recursive: true });
}

async function main(): Promise<void> {
  const esbuild = await importPackage<Esbuild>('esbuild', esbuildHint);
  rmSync(join(ROOT, 'dist'), { recursive: true, force: true });
  copyStatic();
  await esbuild.build(buildOptions(false));
  writeFileSync(join(ROOT, 'dist/version.txt'), version() + '\n');
  console.log('Build listo en dist/ (versión ' + version() + ').');
}

if (import.meta.main) await main();
