# Cookbook

Step-by-step recipes for the changes this project is built for. Every recipe ends with the same loop:

```sh
node template/generate.mjs --all --out examples   # or dist/ for scratch
node scripts/check.mjs --out qa                   # must exit 0 for ALL variants
# then Read qa/img/<variant>.still.png: one desktop and one mobile per touched region
```

(In a user's project, use the project's `generate.mjs` and pass `--gen <project>/generate.mjs`.)

---

## Add a region ("do Canada")

1. **Research the scene.** Pick one hero landmark that is instantly recognisable as a silhouette, 2–4
   supporting motifs, and a time of day. Calm motion only.
2. **Reuse before you write.** Check [api-reference.md](api-reference.md) for existing objects
   (`karst` covers rounded rock domes; `groundBand` covers dunes, hills and meadows; `water` covers any lake or sea).
3. **Create objects** for anything new (see the next recipe), e.g. `objects/landmarks/rockies.mjs`, `objects/plants/pine.mjs`.
4. **Create `regions/canada.mjs`:**
   ```js
   // Canada: Moraine Lake in autumn. Ten Peaks, turquoise lake, larches, a canoe.
   import { W, H, HORIZON } from '../lib/canvas.mjs';
   import { clouds } from '../objects/sky/clouds.mjs';
   import { sun } from '../objects/sky/sun.mjs';
   import { water } from '../objects/water/water.mjs';
   // …

   export const canada = {
     palettes: {
       flat: { skyTop: '…', skyBottom: '…', sun: '…', cloud: '…', ink: '…', waterTop: '…', waterBottom: '…', waveLine: '…', /* object keys */ },
       line: { paper: '#fbf3e4', ink: '…', sun: '…', accent: '…' },
     },
     landmark: 'peaks',
     scene(ctx) {
       const { p, m, k } = ctx;
       return {
         clouds: clouds(ctx, m ? 3 : 4),
         sun: sun(ctx, W * 0.7, HORIZON - 300 * k, 64 * k),
         peaks: /* base at HORIZON + 4, inside the safe area */,
         lake: water(ctx),            // something must cover y ≥ HORIZON across the full width
         larches: /* foreground at the edges, clear of the landmark on mobile */,
       };
     },
   };
   ```
5. **Register it** in `regions/index.mjs`: `export const REGIONS = { thailand, australia, canada };`
6. **Palettes:** every key an object reads must exist in every palette of every region that uses that
   object. Avoid colours near `#ff00ff` and `#00ffff` (see the [harness limitations](qa-harness.md#known-limitations)).
   Keep adjacent layers clearly different in value, or they read as one.
7. **Mobile:** branch on `m`. Use fewer elements, more sky, foreground pushed to the edges, and the landmark
   within x 90–810 of the 900-wide canvas.
8. Run the loop. Then update the `SKILL.md` "Existing objects" list, the README gallery if you add
   examples, and [api-reference.md](api-reference.md).

## Add an object ("add a moose")

1. File: `objects/<kind>/<name>.mjs` (new kind folder if none fits). Header comment: one line on what it
   is, its anchor point, and its size at `k = 1`.
2. Signature: `export function moose(ctx, x, y, k)`. Position and size come in, nothing is hard-coded per format.
3. Colours only via `s.paint(p.<key>)` / `s.line(p.<key>, w)`. Use `{ accent: true }` for the one or two
   fills that should keep colour in line style.
4. Animation: `useCss(ctx, '<unique-key>', css)`, with class names prefixed by the object (`.moose-head`).
   - Spin/scale/bob: `transform-box: fill-box; transform-origin: center`.
   - Pivot (head, crown): px `transform-origin` in viewBox units, set inline per instance.
   - Travels across the canvas: start and end fully off canvas, allowing for the element's own width,
     **and** put a deterministic on-canvas rest pose in the `transform` attribute.
   - Transient (puff, sparkle): add `@media (prefers-reduced-motion: reduce) { .x { opacity: 0 } }` in its own block.
5. Randomness only via `between()` / `random()`. Count your calls, because they shift everything drawn after the object.
6. Build silhouettes from a few deliberate paths. A blob reads as nothing.
7. Call it from a `scene()` as its own named layer (`moose: moose(ctx, …)`), then run the loop.

## Add a style ("retro poster style")

1. Add `poster: (p) => ({ paint, line, sky, water })` to `lib/styles.mjs`. It receives the region's palette for that style.
2. Add a `poster` palette to **every** region. `variants()` only emits styles a region has a palette for.
3. If the style needs gradients/patterns, add them to `<defs>` in `render()` keyed off palette values.
4. Run the loop over all regions. A new style hits every object at once, so expect line-weight and contrast surprises.

## Add a format ("square 1:1 for social")

1. Add `square: { w: 1200, h: 1200, horizon: …, k: … }` to `lib/formats.mjs`.
2. Add a `SCREENS.square = { min, max }` entry in `check.mjs`. Without it the harness uses the exact canvas ratio.
3. Decide how scenes branch. `ctx.m` is `formatName === 'mobile'` only, so add a field (e.g. `ctx.format`)
   to `ctx` in `render()` if square needs its own layout.
4. Update `lib/preview.mjs`. It renders only `desktop` and `mobile` columns.
5. Run the loop.

## Add a scene option ("night version")

1. Thread it through: `render(region, style, format, seed, { time = 'day' } = {})` → `ctx.time`.
2. Palettes per option: e.g. `palettes.flat` and `palettes.flatNight`, or `palettes.flat.night = {…}`
   selected in `render()`. Keep `variants()` and names (`<region>-<style>-<format>[-night]`) in sync so the harness covers it.
3. Add a CLI flag in `cli()`.
4. Run the loop over the option's variants too.

## Refactor without changing the picture

```sh
node template/generate.mjs --all --out /tmp/before   # before the change (use your scratch dir)
# … refactor …
node template/generate.mjs --all --out /tmp/after
for f in /tmp/before/*.svg; do
  diff <(sed '/<style>/,/<\/style>/d' "$f") <(sed '/<style>/,/<\/style>/d' "/tmp/after/$(basename "$f")") >/dev/null || echo "CHANGED $f";
done
```

The drawing outside `<style>` must be byte-identical. Preserve RNG call order.

## Fixing each finding

Read `qa/report.md`, then the evidence PNG and still for that variant, **before** editing.

| Finding | Usual cause | Fix |
|---|---|---|
| `sky-leak` | No ground/water from `HORIZON` across the full width, or it's drawn after a gap | `plain()`/`water()`/`groundBand()` starting at `HORIZON`, x −10 … W+10, drawn before landmarks |
| `floating` | Landmark base above the first ground layer | Base at `HORIZON + 4`; add a contact shadow; put ground under it |
| `covered` | Foreground layer (the culprit) over the landmark | Move/shrink the culprit **for that format** (`ctx.m`), push it to the edge, or reorder layers |
| `cropped` | Landmark outside the safe area | Pull toward the centre or narrow it for that format |
| `seam` | 0 % and 100 % keyframes differ while on canvas | Make them identical, or start/end fully off canvas, counting the element's width and this format's `W` |
| `reduced-runs` | Reduced-motion rule removed or not last | Restore it as the last rule in `<style>` |
| `rest-cut` | Traveller has no rest pose (path at x = 0) | Add an on-canvas `transform` attribute; clamp by its width |
| `rest-pileup` | Copies share one rest pose | Spread rest poses deterministically across the width |
| `frozen-transient` | Puff/flash visible when motion is off | `opacity: 0` under `prefers-reduced-motion: reduce` |
| `contract` | Broken generator/harness contract | See [architecture § The harness contract](architecture.md#the-harness-contract) |

Up to 3 fix rounds. If something still fails, stop and report it with the evidence paths. Never touch `LIMITS`.

## Things the checks can't see (look for them yourself)

- Straight horizontal dashes read as **water**, even when meant as heat haze.
- Wavy squiggles near a rock read as **wind**.
- A blobby animal reads as nothing.
- Two layers of almost the same colour read as one.
- In line style, a closed shape that ends exactly on the canvas edge draws an outline along that edge.
