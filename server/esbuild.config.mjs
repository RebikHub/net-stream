import esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
);

const external = Object.keys(pkg.dependencies || {});

await esbuild.build({
  entryPoints: ['../server/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  outfile: 'dist/server.js',
  external,
}).catch(() => process.exit(1));
