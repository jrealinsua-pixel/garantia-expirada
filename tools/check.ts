// npm run check: typecheck (tsc) + the project's own lint rules (tools/lint.ts).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, findPackageDir } from './lib/deps.ts';
import { lint } from './lint.ts';

function typecheck(): boolean {
  const ts = findPackageDir('typescript');
  const nodeTypes = findPackageDir('@types/node');
  if (!ts || !nodeTypes) {
    console.error('Faltan typescript o @types/node. Instálalos con «npm install -g typescript @types/node».');
    return false;
  }
  // tsconfig looks for types in .types/ (git-ignored); point it at wherever @types/node lives.
  const typesDir = join(ROOT, '.types');
  rmSync(typesDir, { recursive: true, force: true });
  mkdirSync(typesDir);
  symlinkSync(nodeTypes, join(typesDir, 'node'), 'dir');
  const bin = existsSync(join(ts, 'bin/tsc')) ? join(ts, 'bin/tsc') : join(ts, 'lib/tsc.js');
  const r = spawnSync(process.execPath, [bin, '--noEmit', '-p', join(ROOT, 'tsconfig.json')], { stdio: 'inherit', cwd: ROOT });
  return r.status === 0;
}

const tOk = typecheck();
console.log(tOk ? '✔ typecheck' : '✖ typecheck');
const problems = lint();
for (const p of problems) console.log(`${p.file}:${p.line}  ${p.rule}  ${p.message}`);
console.log(problems.length === 0 ? '✔ lint' : `✖ lint: ${problems.length} problema(s)`);
process.exit(tOk && problems.length === 0 ? 0 : 1);
