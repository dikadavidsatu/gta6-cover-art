# gta6-cover-art

![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/dikadavidsatu/gta6-cover-art/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/dikadavidsatu/gta6-cover-art/reward.svg)

**Vice Frame** — a fully offline browser tool that turns your own photos into
GTA-style cover art: the famous multi-panel collage poster, a Vice City
neon-sunset colour grade, palm and skyline silhouettes, film grain, and big
condensed cover lettering with a chromatic neon edge — exported as a PNG that
is ready to post.

## What you get

- **Private by construction.** Drop in 1–6 photos (file picker or drag &
  drop). They are read locally and never uploaded; the app issues zero network
  requests and keeps working with the network cable pulled.
- **Six cover layouts** — the classic five-panel collage, a triptych, a hero
  panel over strips, a duo split, an asymmetric six-panel **Mosaic**, and the
  new equal-weight **Grid 2×2**. Tap any panel on the poster to select it (or
  press 1–6 / the arrow keys), then frame that panel with its own zoom and
  pan sliders.
- **The Vice City grade, four ways.** A neon-sunset wash (soft-light sky
  gradient, saturation/contrast curve, warm tint), a glowing sun disc,
  seeded skyline and palm silhouettes, film grain and a vignette. Presets:
  **Sunset Blvd**, **Neon Rain**, **Golden Hour** and the new after-dark
  **Midnight Vice** — plus sliders for grade strength, grain and vignette, and
  a toggle for every overlay.
- **Analogue light leak.** A new finish pass blooms warm, preset-tinted light
  in from the top corners with a diagonal flare streak — composited with
  `screen` so it only ever lifts the image, like light sneaking through a
  cracked film-camera back. Dial it from a whisper to a full leak, or set it
  to 0 for a clean digital finish. It is drawn through the same code path in
  the preview and the export, and can be preset with `?leak=0.45`.
- **Cover lettering.** Your title in heavy condensed type with a gradient
  fill, hard outline, chromatic pink/cyan offset and neon glow; a wide-tracked
  subtitle over a neon rule; a bottom credit strip; and an optional rotated
  numeral badge in the corner.
- **Export** a finished PNG at 1080×1350 (portrait post), 1080×1080,
  1920×1080, the 1080×1920 story size, or the new 1440×1800 large post —
  rendered at full resolution by the exact code that draws the live preview.
- **Keyboard shortcuts:** **Ctrl/Cmd+E** exports, **S** shuffles the look,
  **D** loads the demo set, **1–6** selects a panel and **← / →** moves the
  selection. Controls carry `aria-label`s throughout for screen readers.
- **Extras:** hold **Before / After** to peek at your ungraded photos, hit
  **Shuffle look** for a surprise layout/preset/caption pairing (it now rolls
  the light leak too), or load the demo set — six scenes (beach, boulevard,
  night drive, portrait, marina, and a rooftop pool at dusk) painted
  procedurally on canvases at runtime, so the demo needs no image files at
  all and fills every panel of the six-panel layouts.

## Running it

No build step, no dependencies — plain static files:

- Open `app/index.html` in a desktop browser, **or**
- run `node serve.ts` and visit http://localhost:8080

The local preview server (`node serve.ts`) answers missing paths with a
proper HTML **404** page, serves HTML with `no-cache`, and serves the other
static assets with an **ETag** plus a short public cache — a matching
`If-None-Match` gets a bodyless **304**, and **HEAD** returns headers only.

The make.fun handoff is:

```sh
node main.ts
```

It works in three checked stages:

1. **Preflight validation.** Before copying anything it verifies that every
   required input exists and has the right shape (`app/`, `app/index.html`,
   `app/style.css`, the three `app/src/*.js` modules, and a non-empty
   `screenshots/`). If anything is missing or empty it prints each problem
   and exits non-zero — it no longer silently skips a missing directory and
   hands off a plausible-looking but incomplete bundle.
2. **Copy + dossier.** It copies `app/` and `screenshots/` into the output
   directory (`/output`, or `$MAKEFUN_OUTPUT_DIR` when set) and writes
   `dossier.json` there via the vendored scorer library in
   `vendor/makefun-app.ts`, under the same caps as before.
3. **Verification + manifest.** It re-reads `dossier.json` and proves it
   parses as JSON, walks the whole output tree, and writes **`manifest.json`**
   alongside it: a per-file **sha256** and byte size for every handed-off
   file, plus the file count and total bytes. The run ends with a short human
   summary (files copied, total bytes, manifest path), so a log skim confirms
   the handoff at a glance and anyone can later verify the bundle against the
   manifest hashes.

## Screenshots

1. `screenshots/1-cover.jpg` — a finished cover (Sunset Blvd, Classic layout)
2. `screenshots/2-editor.jpg` — the editor with the demo scenes loaded
3. `screenshots/3-cover.jpg` — a Neon Rain cover, square, Mosaic layout
4. `screenshots/4-cover.jpg` — a Midnight Vice cover in the Hero layout

<sub>Entered on [make.fun](https://make.fun/?ref=vyqgkf3p&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
