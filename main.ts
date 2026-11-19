// Vice Frame — gta6-cover-art-01 handoff program (Node 22, standard library only).
//
// The deliverable is the static web app in app/ (open app/index.html in a browser;
// it runs fully offline). This program performs the make.fun handoff: it copies
// app/ and screenshots/ into the output directory and writes dossier.json there
// using the vendored scorer library in vendor/makefun-app.ts.
//
// The output directory is /output inside the grader's container; set
// MAKEFUN_OUTPUT_DIR to a local folder to rehearse the handoff anywhere else:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const root = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

for (const name of ['app', 'screenshots']) {
  const from = join(root, name);
  if (existsSync(from)) {
    cpSync(from, join(outputDir, name), { recursive: true });
  }
}

// Caps mirror the competition gate: the dossier text budget shapes the output,
// the remaining caps make this program fail on exactly the inputs the scorer
// would refuse (too many / too large screenshots or app files, over-long paths).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`handoff complete: app/, screenshots/ and dossier.json written to ${outputDir}`);
