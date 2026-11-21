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

import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- Preflight validation ---------------------------------------------------
// Fail loudly, before copying anything, when a required input is missing.
// The previous version silently skipped a missing directory, which could
// produce a plausible-looking but incomplete handoff. A clear non-zero exit
// is far easier to diagnose in CI and in the grading container.
const REQUIRED_PATHS = [
  { rel: 'app', kind: 'directory' },
  { rel: 'app/index.html', kind: 'file' },
  { rel: 'app/style.css', kind: 'file' },
  { rel: 'app/src/main.js', kind: 'file' },
  { rel: 'app/src/render.js', kind: 'file' },
  { rel: 'app/src/scenes.js', kind: 'file' },
  { rel: 'screenshots', kind: 'directory' },
];

function preflight() {
  const problems = [];
  for (const { rel, kind } of REQUIRED_PATHS) {
    const abs = join(here, rel);
    if (!existsSync(abs)) {
      problems.push(`missing ${kind}: ${rel}`);
      continue;
    }
    const info = statSync(abs);
    if (kind === 'directory' && !info.isDirectory()) {
      problems.push(`expected a directory but found a file: ${rel}`);
    }
    if (kind === 'file' && !info.isFile()) {
      problems.push(`expected a file but found a directory: ${rel}`);
    }
    if (kind === 'file' && info.isFile() && info.size === 0) {
      problems.push(`required file is empty: ${rel}`);
    }
  }
  const shotsDir = join(here, 'screenshots');
  if (existsSync(shotsDir) && statSync(shotsDir).isDirectory()) {
    const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
    if (shots.length === 0) problems.push('screenshots/ contains no screenshots');
  }
  if (problems.length > 0) {
    console.error('Vice Frame handoff aborted — preflight validation failed:');
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(`Source directory checked: ${here}`);
    process.exit(1);
  }
}

preflight();

mkdirSync(outDir, { recursive: true });

for (const dir of ['app', 'screenshots']) {
  const src = join(here, dir);
  cpSync(src, join(outDir, dir), { recursive: true });
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

// --- Post-copy verification + manifest --------------------------------------
// Re-read the dossier we just wrote and prove it parses, then walk the whole
// output tree and record a sha256 + size for every file in manifest.json.
// That gives a grader (or a future me) a tamper-evident inventory of exactly
// what was handed off, without having to trust the copy step blindly.
function walkFiles(dir, base = dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walkFiles(abs, base));
    else if (entry.isFile()) found.push(relative(base, abs).split('\\').join('/'));
  }
  return found.sort();
}

function sha256File(absPath) {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}

function verifyAndManifest() {
  const dossierPath = join(outDir, 'dossier.json');
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(dossierPath, 'utf8'));
  } catch (err) {
    console.error(`Vice Frame handoff failed verification: dossier.json does not parse (${err.message})`);
    process.exit(1);
  }
  if (!parsed || typeof parsed !== 'object') {
    console.error('Vice Frame handoff failed verification: dossier.json is not a JSON object');
    process.exit(1);
  }
  for (const rel of ['app/index.html', 'screenshots']) {
    if (!existsSync(join(outDir, rel))) {
      console.error(`Vice Frame handoff failed verification: ${rel} missing from the output directory`);
      process.exit(1);
    }
  }

  // The manifest lists itself by name only; its own hash would be circular,
  // so it is computed over every other file and stored alongside the totals.
  const relFiles = walkFiles(outDir).filter((rel) => rel !== 'manifest.json');
  const files = relFiles.map((rel) => {
    const abs = join(outDir, rel);
    return { path: rel, bytes: statSync(abs).size, sha256: sha256File(abs) };
  });
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const manifest = {
    tool: 'vice-frame-handoff',
    version: 2,
    generatedAt: new Date().toISOString(),
    outputDir: outDir,
    fileCount: files.length,
    totalBytes,
    dossierBytes: statSync(dossierPath).size,
    files,
  };
  const manifestPath = join(outDir, 'manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, manifestPath };
}

const { manifest, manifestPath } = verifyAndManifest();

// --- Human summary ------------------------------------------------------------
// A short, greppable receipt so a person skimming the log can confirm the
// handoff at a glance instead of inspecting the output directory by hand.
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

const appFiles = manifest.files.filter((f) => f.path.startsWith('app/')).length;
const shotFiles = manifest.files.filter((f) => f.path.startsWith('screenshots/')).length;
console.log(`handoff complete: app/, screenshots/ and dossier.json written to ${outDir}`);
console.log('Vice Frame handoff summary:');
console.log(`  files copied : ${manifest.fileCount} (${appFiles} app, ${shotFiles} screenshots, plus dossier.json)`);
console.log(`  total bytes  : ${manifest.totalBytes} (${formatBytes(manifest.totalBytes)})`);
console.log(`  dossier      : ${join(outDir, 'dossier.json')} (${formatBytes(manifest.dossierBytes)}, JSON verified)`);
console.log(`  manifest     : ${manifestPath}`);
