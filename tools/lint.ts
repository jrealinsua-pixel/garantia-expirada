// Project lint rules (no npm dependencies, so no ESLint plugins for TypeScript).
// They protect the architecture in CLAUDE.md more than the style.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './lib/deps.ts';

export interface Problem {
  file: string;
  line: number;
  rule: string;
  message: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

interface Rule {
  id: string;
  /** Path prefix (relative to the repo) the rule applies to. */
  scope: string[];
  test: RegExp;
  message: string;
}

const RULES: Rule[] = [
  { id: 'sim-sin-phaser', scope: ['src/sim/', 'src/data/'], test: /\bPhaser\b|from ['"]phaser['"]/, message: 'La simulación y los datos no pueden usar Phaser.' },
  { id: 'sim-sin-dom', scope: ['src/sim/', 'src/data/', 'src/art/', 'src/audio/'], test: /\b(window|document|navigator|localStorage|performance)\./, message: 'Código puro: nada de DOM aquí.' },
  { id: 'sim-determinista', scope: ['src/sim/', 'src/data/', 'src/art/', 'src/audio/'], test: /Math\.random|Date\.now|new Date\(/, message: 'Usa el Rng con semilla; nada de Math.random ni relojes.' },
  { id: 'sin-console-log', scope: ['src/'], test: /console\.log\(/, message: 'Nada de console.log en el juego (usa console.info o quítalo).' },
  { id: 'sin-any', scope: ['src/', 'tools/', 'tests/'], test: /:\s*any\b|as any\b|<any>/, message: 'Evita any.' },
  { id: 'sin-only', scope: ['tests/'], test: /\b(test|it|describe)\.only\(/, message: 'No dejes .only en los tests.' },
  { id: 'sin-red-externa', scope: ['src/'], test: /https?:\/\/(?!localhost)/, message: 'El juego no se conecta a servidores de terceros.' },
  { id: 'imports-con-extension', scope: ['src/', 'tools/', 'tests/'], test: /from '\.\.?\/[^']*(?<!\.ts|\.json)'/, message: 'Los imports relativos llevan la extensión .ts.' },
];

export function lint(): Problem[] {
  const problems: Problem[] = [];
  const files = ['src', 'tools', 'tests'].flatMap((d) => walk(join(ROOT, d)));
  for (const f of files) {
    const rel = relative(ROOT, f).replaceAll('\\', '/');
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((text, i) => {
      const code = text.replace(/\/\/.*$/, '');
      for (const r of RULES) {
        if (!r.scope.some((s) => rel.startsWith(s))) continue;
        if (rel === 'tools/lint.ts') continue;
        if (r.test.test(code)) problems.push({ file: rel, line: i + 1, rule: r.id, message: r.message });
      }
      if (text.length > 200) problems.push({ file: rel, line: i + 1, rule: 'linea-larga', message: `Línea de ${text.length} caracteres (máx. 200).` });
      if (/\s+$/.test(text)) problems.push({ file: rel, line: i + 1, rule: 'espacios-finales', message: 'Espacios al final de la línea.' });
    });
  }
  return problems;
}
