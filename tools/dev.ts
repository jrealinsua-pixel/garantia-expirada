// Development server: esbuild watch + serve on http://localhost:5173
import { join } from 'node:path';
import { ROOT, importPackage, type Esbuild } from './lib/deps.ts';
import { buildOptions, copyStatic, esbuildHint } from './build.ts';

const esbuild = await importPackage<Esbuild>('esbuild', esbuildHint);
copyStatic();
const ctx = await esbuild.context(buildOptions(true));
await ctx.watch();
const port = Number(process.env.PORT ?? 5173);
await ctx.serve({ servedir: join(ROOT, 'dist'), port });
console.log(`Servidor de desarrollo en http://localhost:${port} (los sprites se regeneran con «npm run sprites»).`);
