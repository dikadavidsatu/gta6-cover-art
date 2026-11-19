// Vice Frame · gta6-cover-art-01 — handoff entry point (Node 22, stdlib only).
//
// The product itself is the static web app under app/ — open app/index.html in
// a browser and it runs entirely offline. This file performs the make.fun
// handoff: copy app/ and screenshots/ into the output directory, then write
// dossier.json there with the vendored scorer library (vendor/makefun-app.ts).
//
// Graders run this inside a container where the output directory is /output.
// To rehearse locally, point MAKEFUN_OUTPUT_DIR at any folder first:
//   MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

for (const dir of ['app', 'screenshots']) {
  const src = join(here, dir);
  if (existsSync(src)) cpSync(src, join(outDir, dir), { recursive: true });
}

// The caps below mirror the competition gate: the text budget shapes the
// dossier, and the rest make this program fail on exactly the inputs the
// scorer would reject (too many or too large screenshots / app files, or
// over-long paths).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`handoff complete: app/, screenshots/ and dossier.json written to ${outDir}`);
