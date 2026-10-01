---
name: tokengaroo
description: Generate and QA animated, geometric SVG backgrounds for travel-site regions (Thailand, Australia, Canada, ...) from a plain-language prompt, in desktop 16:9 and mobile 9:16, flat or line style. Ships the generator and a headless-Chrome harness that runs four visual-artifact checks (grounding, landmark visibility, motion integrity, support: nothing standing in water, no land floating in it) and drives a fix loop. Use when asked to create, change or fix a region background, add a region, style or format, or check the backgrounds for visual artifacts.
---

# tokengaroo: region backgrounds

Deterministic, dependency-free animated SVG backgrounds. You turn the user's words into code in
the generator, and the harness checks the result for visual artifacts before the user sees it.

```
template/                     the generator project; copy this whole folder into the user's project
  generate.mjs                orchestration only: render(), variants(), CLI (--all builds everything + index.html)
  lib/canvas.mjs              current canvas (W, H, HORIZON live bindings), seeded RNG, f(), smooth()
  lib/formats.mjs             desktop / mobile canvas sizes and motif scale k
  lib/styles.mjs              flat / line painters: s.paint(), s.line()
  lib/css.mjs                 useCss(): objects register their own animation CSS
  lib/preview.mjs             dist/index.html side-by-side page
  objects/<kind>/<name>.mjs   one object per file: sky/ animals/ plants/ terrain/ water/ landmarks/ buildings/ street/ vehicles/
  regions/<name>.mjs          one region per file: palettes, landmark, scene()
  regions/index.mjs           the REGIONS list
scripts/check.mjs             QA harness: headless Chrome over CDP, four checks, report.md + evidence PNGs
```

Requirements: Node >= 22 (global WebSocket) and Chrome/Chromium (`CHROME_PATH` to override). No npm install.

## Workflow

1. **Find the working copy.** Project work happens on the project's copy, never on this skill's
   `template/` (the one exception is step 7). If the project has none, copy the whole `template/` folder into it
   (`cp -R ~/.claude/skills/tokengaroo/template/. <project>/`). Ask where the project lives if it is unclear.
2. **Translate the request into code.**

   | User says | You change |
   |---|---|
   | "do Canada" | new `regions/canada.mjs` (palettes per style, `landmark`, `scene()`), listed in `regions/index.mjs`; new objects it needs under `objects/` |
   | "add a moose" | new `objects/animals/moose.mjs`, then call it from a region's `scene()` |
   | "retro poster style" | new `poster` entry in `lib/styles.mjs` + a `poster` palette in every region |
   | "night version" | a new option threaded through `render()` into `ctx`, palettes per option |
   | "the tree hides the rock" | that region's `scene()` layout for the format (`ctx.m` is true on mobile) |

3. **Build:** `node generate.mjs --all --out dist` (writes every SVG + `dist/index.html` side-by-side preview).
4. **Run the harness** (from anywhere):
   ```
   node ~/.claude/skills/tokengaroo/scripts/check.mjs --gen <project>/generate.mjs --out <project>/qa
   ```
   `--only <substring>` limits variants (e.g. `--only australia`, `--only mobile`). Exit 0 = pass, 1 = findings, 2 = harness error.
5. **Fix loop.** Read `qa/report.md`. For every failing variant, Read its evidence PNGs and its still
   (`qa/img/<variant>.still.png`) *before* editing. Fix the cause in the generator, then rerun. Up to
   3 rounds; if something still fails, stop and report it to the user with the evidence paths.
   - Never loosen `LIMITS` or special-case the harness to get a pass. If a finding is a genuine false
     positive, fix the check's logic for that whole class of element and tell the user what you changed.
   - Fixes must hold for every format and style, so rerun the full set, not just the variant you touched.
6. **Look at it yourself (mandatory).** The checks cover geometry and timing, not meaning. Read at least
   one desktop and one mobile still of every region you changed and ask: does every shape read as what
   it is meant to be? Things the checks cannot see (all of these happened on this project):
   - straight horizontal dashes read as **water**, even when meant as heat haze
   - wavy squiggles near a rock read as **wind**
   - a blobby animal reads as nothing; build silhouettes from a few deliberate paths
   - two layers with almost the same colour read as one
7. **Save new objects into the skill.** Once QA passes and the stills look right, copy every *new*
   object file from the project's `objects/<kind>/` to the same path in this skill's
   `template/objects/` (`~/.claude/skills/tokengaroo/template/objects/<kind>/`). Bring any new helper
   it imports from `objects/`, too. Later projects then start with it.
   - New files only. Don't copy regions, palettes, inline one-off shapes or edits to objects the skill
     already has: those would change the skill's own examples. Mention such edits in the report instead.
   - Never overwrite. If the skill already has a different file at that path, leave it and tell the user.
   - The object must work against the skill's own `lib/`. If it needs a `lib/` change (a new painter
     method, a new `ctx` field), don't copy it; say why in the report. Check that it loads:
     `node -e "import('<skill>/template/objects/<kind>/<name>.mjs')"`.
   - Record it in the skill: add it to "Existing objects" below, and add a row (signature, palette
     keys, animation, RNG cost) under its kind in the skill's `docs/api-reference.md`.
   - Don't commit in the skill repo. List the added files so the user can review and commit them.
8. **Report** in plain words: what changed, the QA table, the objects saved into the skill (step 7),
   and anything that still looks off. Offer `open dist/index.html` for the user to watch the motion.

## The four checks

Every variant is checked: region × style × format.

| # | Check | Catches | Typical fix |
|---|---|---|---|
| 1 | **grounding** | `sky-leak`: sky visible below the horizon, which reads as a lake and makes rocks float. `floating`: sky right under the landmark's base | Ground/water layer from `HORIZON` across the full width, drawn before the landmark. Base at `HORIZON + 4`, plus a contact shadow |
| 2 | **landmark** | `covered`: later layers paint over the hero landmark (names the culprit layer and %). `cropped`: landmark outside the area every target screen shows under `slice` (desktop 16:10 to 21:9, mobile 9:20 to 9:16). Needs 85% visible | Move or shrink the culprit for that format. Pull the landmark toward the centre |
| 3 | **motion** | `seam`: a loop jumps or flashes when it restarts while on canvas. With reduced motion emulated: `reduced-runs` (animations still running), `rest-cut` (a travelling element rests cut by the edge), `rest-pileup` (copies resting on one spot), `frozen-transient` (a puff or flash stuck visible) | Start and end loops off canvas, allowing for the element's own width. Rest poses as `transform` attributes. Hide transients in a reduced-motion block |
| 4 | **support** | `wrong-support`: something that stands (building, tree, land vehicle) has water under its base, or a boat has land under it. `unsupported`: only sky under its base. `causeway`: a strip of ground with water right above and below it across most of the width (a road floating in the river, running along it) | A bank or embankment under buildings on a waterfront; move trees and vehicles onto ground, or narrow the water for that format; bridges cross the water into the distance, never along it |

Evidence colours: grounding images paint the sky magenta and the landmark cyan. Landmark images paint
the landmark cyan, with red culprit boxes and a dashed safe area. Motion images are real frames with the element boxed.
Support images are a surface map: ground green, water blue, sky magenta, with the bad footprint or floating strip boxed.
Support is reported as skipped for an SVG with no `data-surface` tags (a project copy older than the check).

## Contract between generator and harness

Keep this when editing, or the harness reports `contract` findings:
- `scene()` returns an **ordered object** `{ layerName: svg }`; `render()` wraps each in `<g data-layer>`.
  Draw order = key order. Name layers by what they are (`uluru`, `ghostGum`, `duneNear`).
- `region.landmark` = the hero layer's name; the root `<svg>` gets `data-horizon` and `data-landmark`.
- The sky rect is `data-layer="sky"`; the reduced-motion block stays the last rule in `<style>`.
- Surfaces tag themselves `data-surface="ground"` or `"water"` (plain, groundBand, ridge, water, banks…), and
  things that stand on one tag their root element `data-rests="ground"` (buildings, trees, the bus) or `"water"`
  (the boat). Rocks rising out of land or sea (`karst`) and sky things stay untagged.
- `generate.mjs` exports `render(region, style, format, seed)` and `variants()`. The CLI only runs when the file is executed directly.
- After a refactor that should not change the picture, diff the new output against the old output
  (the drawing outside `<style>` must be byte-identical for the same seed) before running the harness.

## Design rules (learned the hard way)

- **Everything standing on the horizon needs ground under it.** No gap between rocks and the first ground band.
- **Water has banks.** Buildings on a waterfront stand on a bank or embankment, never straight in the water,
  and a road or path runs along a bank, not through the middle of the water. A bridge crosses into the distance.
  (London first had a full-width bridge along the Thames and Big Ben standing in the river.)
- **Mobile is its own layout, not a crop.** Branch on `ctx.m`, scale motifs by `ctx.k`, give more sky
  (headline space), and use fewer elements. Push foreground (trees, palms) to the edges, clear of the landmark.
- **Travelling elements carry a rest pose** as a `transform` attribute. A running CSS animation
  overrides it, and with reduced motion it is what shows. Clamp rest poses inside the canvas, allowing for the element's width.
- **Transient effects** (dust, sparkles, flashes) get `opacity: 0` in a `prefers-reduced-motion` block.
- **Loops:** the 0% and 100% keyframes must match, or the element must be fully off canvas at both
  ends. Use `fill-box` + `transform-origin: center` for spin and scale; use a px `transform-origin` for pivots (palm crowns).
- **Coupled motion** (hop + dust) shares one period and start. Derive drift from the actual speeds
  in the CSS (the dust drifts back by one hop's worth of the kangaroo's run).
- **Determinism:** every `between()` call shifts the random stream for everything after it. A new
  random call in the middle of a scene reshuffles the rest of that picture for the same seed. Use
  deterministic values (as the rest poses do), or warn the user the layout will change.
- Keep files small (each ~15–25 KB). Motion should stay calm, because this sits behind content.

## Adding an object

One file per kind of object, in the folder for its kind; create a new kind folder when none fits.
Before writing one, check whether an existing object already does it (for example, `terrain/karst.mjs`
draws both Thai karsts and Kata Tjuta).

```js
// objects/animals/moose.mjs: Moose standing side-on, head lowered to graze now and then.

import { W, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function moose(ctx, x, y, k) {           // position and size come in; nothing is hard-coded per format
  const { s, p } = ctx;                         // s = style painter, p = the region's palette for this style
  useCss(ctx, 'moose', `
  @keyframes graze { ... }
  .moose-head { transform-box: fill-box; animation: graze 9s ease-in-out infinite }`);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <path d="..." ${s.paint(p.animal)}/>       // colours only through s.paint / s.line
    <g class="moose-head">...</g>
  </g>`;
}
```
Rules for objects:
- Import canvas values (`W`, `H`, `HORIZON`) and randomness (`between`, `random`) from `lib/canvas.mjs`.
  Never use `Math.random()`.
- The object owns its animation: register keyframes with `useCss` under one key. Objects sharing a
  motion share a helper (see `plants/sway.mjs`).
- It needs a rest pose and a reduced-motion rule if it travels or flashes (see the design rules above).
- Tag it for the support check: `data-surface="ground|water"` if things stand on it, `data-rests="ground|water"`
  on its root element if it stands on something. Wrap several top-level elements in one `<g data-rests>`.
- New palette colours an object reads (`p.animal`, `p.dust`) must exist in every region palette that uses it.
- One-off shapes used by one scene only (Thailand's beach curve) may stay inline in the region file.

## Adding a region (skeleton)

```js
// regions/canada.mjs, then add it to regions/index.mjs
import { W, HORIZON } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { water } from '../objects/water/water.mjs';

export const canada = {
  palettes: { flat: { skyTop, skyBottom, sun, cloud, ink, /* object colours */ }, line: { paper, ink, sun, accent } },
  landmark: 'peaks',
  scene(ctx) {
    const { p, m, k } = ctx;
    return {
      clouds: clouds(ctx, m ? 3 : 4),
      sun: sun(ctx, W * 0.7, HORIZON - 300 * k, 64 * k),
      peaks: /* landmark, base at HORIZON + 4 */,
      lake: water(ctx),               // or plain()/groundBand(): something must cover y >= HORIZON
      pines: /* foreground, kept off the landmark on mobile */,
    };
  },
};
```
Existing objects: sky `sun`, `clouds`, `snow`; animals `birds`, `kangaroo`; plants `palm`, `ghostGum`,
`spinifex`/`spinifexField`, `cherryTree`, `pine`; terrain `plain`, `cobbles`, `groundBand` and `ridge` (both return
`{ svg, yAt }` for standing things on their surface), `karst`/`karstRange`; water `water`, `sunGlints`,
`reflectingPool`; landmarks `uluru`, `templeIsland`, `stBasils`, `greatWall`; buildings `chedi`, `capitol`,
`obelisk`, `kremlinWall`, `spasskayaTower`, `westminsterPalace`, `elizabethTower`, `ferrisWheel`,
`riverWall`/`promenade` (embankments), `pagoda`, `bookshop`, `georgianTerrace`, `templeBarPub`, `paintedShops`; street `streetLamp`,
`lanterns`, `lettering` (shop-sign text), `useSwing` (hanging signs and baskets); vehicles `longtailBoat`, `doubleDecker`, `cyclist`.
Regions: `thailand`, `australia`, `washington` (D.C.), `moscow`, `london`, `china`, `dublin`.

## Previewing tips

- Real frame at time t: the harness's `qa/img/<variant>.still.png` (t = 10s, change it with `--still <ms>`).
- Reduced-motion still: `"<chrome>" --headless=new --force-prefers-reduced-motion --window-size=1600,900 --screenshot=out.png file:///abs/path.svg`
- Avoid `qlmanage` for judging a design: it renders without clipping (off-canvas parts show), crops
  to a square, and does not animate.
