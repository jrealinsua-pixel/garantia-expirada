// The project has no npm dependencies on purpose: the automatic sessions run without access to
// the npm registry. Tools are looked up in this order: ./node_modules, the global npm root and
// a few known folders of the cloud environment. See docs/BITACORA.md (2026-10-28).
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

export const ROOT = resolve(import.meta.dirname, '..', '..');

let globalRoot: string | null | undefined;
function npmGlobalRoot(): string | null {
  if (globalRoot === undefined) {
    try {
      globalRoot = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      globalRoot = null;
    }
  }
  return globalRoot;
}

/** Folders where a package may live, most specific first. */
export function searchDirs(): string[] {
  const dirs = [join(ROOT, 'node_modules')];
  const g = npmGlobalRoot();
  if (g) dirs.push(g);
  dirs.push('/opt/npm-tools/node_modules', '/opt/node-tools/node_modules', '/opt/node22/lib/node_modules');
  if (process.env.NODE_PATH) dirs.push(...process.env.NODE_PATH.split(':').filter(Boolean));
  return dirs;
}

export function findPackageDir(name: string): string | null {
  for (const d of searchDirs()) {
    const p = join(d, name);
    if (existsSync(join(p, 'package.json'))) return p;
  }
  return null;
}

export function requirePackage<T>(name: string, hint: string): T {
  const dir = findPackageDir(name);
  if (!dir) {
    console.error(`No encuentro el paquete «${name}». ${hint}`);
    process.exit(2);
  }
  const req = createRequire(join(dir, 'package.json'));
  return req(dir) as T;
}

export async function importPackage<T>(name: string, hint: string): Promise<T> {
  const dir = findPackageDir(name);
  if (!dir) {
    console.error(`No encuentro el paquete «${name}». ${hint}`);
    process.exit(2);
  }
  const req = createRequire(join(dir, 'package.json'));
  return (await import(pathToFileURL(req.resolve(dir)).href)) as T;
}

/** The small part of the esbuild API the tools use (its types are not installed). */
export interface Esbuild {
  build(options: object): Promise<unknown>;
  context(options: object): Promise<{ watch(): Promise<void>; serve(o: { servedir: string; port: number }): Promise<unknown> }>;
}
