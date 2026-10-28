// npm run stats: recomputes the metrics and milestone progress in progress.json.
// Session entries, screenshots, «proximo» and «bloqueos» are written by hand each session.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHARACTERS } from '../src/data/characters.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import * as content from '../src/data/index.ts';
import { ROOT } from './lib/deps.ts';
import { runBots } from './bot.ts';
import { version } from './build.ts';

interface Hito {
  id: string;
  nombre: string;
  estado: string;
  hechas: number;
  total: number;
}

function countLines(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) n += countLines(p);
    else if (p.endsWith('.ts')) n += readFileSync(p, 'utf8').split('\n').filter((l) => l.trim() !== '').length;
  }
  return n;
}

export function milestones(roadmap: string): Hito[] {
  const out: Hito[] = [];
  let cur: Hito | null = null;
  let accepted = false;
  for (const line of roadmap.split('\n')) {
    const h = /^## (M\d+) · (.+?)\s*(\(hecho\))?$/.exec(line);
    if (h) {
      cur = { id: h[1]!, nombre: h[2]!, estado: 'pendiente', hechas: 0, total: 0 };
      accepted = !!h[3];
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    if (/^- \[x\]/i.test(line)) {
      cur.hechas++;
      cur.total++;
    } else if (/^- \[ \]/.test(line)) cur.total++;
    if (accepted) cur.estado = 'hecho';
  }
  let current = false;
  for (const m of out) {
    if (m.estado === 'hecho') continue;
    if (!current) {
      m.estado = 'en_curso';
      current = true;
    }
  }
  return out;
}

function testCounts(): { tests: number; ok: number } {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/**/*.test.ts'], { cwd: ROOT, encoding: 'utf8' });
  const total = Number(/^# tests (\d+)/m.exec(r.stdout)?.[1] ?? 0);
  const pass = Number(/^# pass (\d+)/m.exec(r.stdout)?.[1] ?? 0);
  return { tests: total, ok: pass };
}

const path = join(ROOT, 'progress.json');
const progress = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
const hitos = milestones(readFileSync(join(ROOT, 'docs/HOJA_DE_RUTA.md'), 'utf8'));
const t = testCounts();
const bot = runBots(100, 60);
progress.version = version();
progress.hitos = hitos;
progress.hito_actual = hitos.find((h) => h.estado === 'en_curso')?.id ?? hitos.at(-1)?.id ?? '';
progress.metricas = {
  personajes: Object.keys(CHARACTERS).length,
  enemigos: Object.keys(content.ENEMIES).length,
  jefes: Object.keys(content.BOSSES).length,
  armas: Object.keys(WEAPONS).length,
  objetos: Object.keys(content.ITEMS).length,
  plantillas_sala: Object.keys(ROOMS).length,
  tests: t.tests,
  tests_ok: t.ok,
  partidas_bot: bot.partidas,
  fallos_bot: bot.fallos,
  lineas_codigo: countLines(join(ROOT, 'src')),
};
writeFileSync(path, JSON.stringify(progress, null, 2) + '\n');
console.log('progress.json actualizado:', JSON.stringify(progress.metricas));
