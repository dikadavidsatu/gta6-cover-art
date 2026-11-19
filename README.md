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

- **Private by construction.** Drop in 1–5 photos (file picker or drag &
  drop). They are read locally and never uploaded; the app issues zero network
  requests and keeps working with the network cable pulled.
- **Five cover layouts** — the classic five-panel collage, a triptych, a hero
  panel over strips, a duo split, and an asymmetric six-panel **Mosaic**. Tap
  any panel on the poster to select it, then frame that panel with its own
  zoom and pan sliders.
- **The Vice City grade, four ways.** A neon-sunset wash (soft-light sky
  gradient, saturation/contrast curve, warm tint), a glowing sun disc,
  seeded skyline and palm silhouettes, film grain and a vignette. Presets:
  **Sunset Blvd**, **Neon Rain**, **Golden Hour** and the new after-dark
  **Midnight Vice** — plus sliders for grade strength, grain and vignette, and
  a toggle for every overlay.
- **Cover lettering.** Your title in heavy condensed type with a gradient
  fill, hard outline, chromatic pink/cyan offset and neon glow; a wide-tracked
  subtitle over a neon rule; a bottom credit strip; and an optional rotated
  numeral badge in the corner.
- **Export** a finished PNG at 1080×1350 (portrait post), 1080×1080,
  1920×1080, or the new 1080×1920 story size — rendered at full resolution by
  the exact code that draws the live preview.
- **Extras:** hold **Before / After** to peek at your ungraded photos, hit
  **Shuffle look** for a surprise layout/preset/caption pairing, or load the
  demo set — five scenes (beach, boulevard, night drive, portrait, marina)
  painted procedurally on canvases at runtime, so the demo needs no image
  files at all.

## Running it

No build step, no dependencies — plain static files:

- Open `app/index.html` in a desktop browser, **or**
- run `node serve.ts` and visit http://localhost:8080

The make.fun handoff is:

```sh
node main.ts
```

It copies `app/` and `screenshots/` into the output directory (`/output`, or
`$MAKEFUN_OUTPUT_DIR` when set) and writes `dossier.json` there via the
vendored scorer library in `vendor/makefun-app.ts`.

## Screenshots

1. `screenshots/1-cover.jpg` — a finished cover (Sunset Blvd, Classic layout)
2. `screenshots/2-editor.jpg` — the editor with the demo scenes loaded
3. `screenshots/3-cover.jpg` — a Neon Rain cover, square, Mosaic layout
4. `screenshots/4-cover.jpg` — a Midnight Vice cover in the Hero layout

<sub>Entered on [make.fun](https://make.fun/?ref=vyqgkf3p&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
