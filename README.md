# gta6-cover-art

![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/dikadavidsatu/gta6-cover-art/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/dikadavidsatu/gta6-cover-art/reward.svg)

**Vice Frame** — an offline browser app that turns your own photos into GTA-style
cover art: the iconic multi-panel collage poster with a Vice City neon-sunset
grade, palm and skyline silhouettes, film grain, and big condensed cover
lettering, exported as a share-ready PNG.

## What it does

- **Your photos, your machine.** Load 1–5 photos by file picker or drag & drop.
  Nothing is uploaded — the app makes zero network requests and works fully
  offline.
- **Four cover layouts** — the classic 5-panel collage, a triptych, a hero
  panel with strips, and a duo split. Click any panel on the poster to select
  it, then frame it with per-panel zoom and pan sliders.
- **The Vice City grade.** A neon-sunset palette wash (soft-light sky gradient,
  saturation/contrast S-curve, warm tint), a glowing sun disc, deterministic
  skyline and palm-tree silhouettes, film grain and a vignette. Three one-click
  presets — **Sunset Blvd**, **Neon Rain**, **Golden Hour** — plus sliders for
  grade intensity, grain and vignette, and toggles for each overlay.
- **Cover lettering.** Your caption set in big condensed bold type with a
  gradient fill, hard outline and neon glow, a letter-spaced subtitle with a
  neon rule, and an optional rotated "VI"-style numeral badge.
- **Export** a PNG at 1080×1350 (portrait post), 1080×1080 or 1920×1080,
  rendered at full resolution from the same drawing code as the live preview.
- **Extras:** hold **Before / After** to compare against your raw photos, hit
  **Randomize** for a fresh layout/preset/caption combo, or load the built-in
  demo photos (four scenes painted procedurally on a canvas — no image files)
  to see it work instantly.

## Run it

The app is plain static files — no build step, no dependencies:

- Open `app/index.html` directly in a desktop browser, **or**
- Serve it: `node serve.ts` then visit http://localhost:8080

For the make.fun handoff, run:

```sh
node main.ts
```

That copies `app/` and `screenshots/` to the output directory (`/output`, or
`$MAKEFUN_OUTPUT_DIR` when set) and writes `dossier.json` using the vendored
scorer library in `vendor/makefun-app.ts`.

## Screenshots

1. `screenshots/1-cover.jpg` — an exported-style cover (Sunset Blvd, classic layout)
2. `screenshots/2-editor.jpg` — the editor with demo photos loaded
3. `screenshots/3-cover.jpg` — a Neon Rain cover at square size
4. `screenshots/4-cover.jpg` — a Golden Hour hero-layout cover

<sub>Entered on [make.fun](https://make.fun/?ref=vyqgkf3p&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
