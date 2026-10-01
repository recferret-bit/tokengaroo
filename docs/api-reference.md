# API reference

Every exported function in `template/`, with units, the palette keys it reads, the animation it
registers and how many random values it consumes. All coordinates are viewBox units of the current
format. `k` is a size multiplier: pass `ctx.k`, or a multiple of it, for format-aware sizing.

**RNG cost** is the number of `between()`/`random()` calls. It matters for [determinism](architecture.md#determinism).

## lib/

### `lib/canvas.mjs`

| Export | Signature | Notes |
|---|---|---|
| `W`, `H`, `HORIZON` | `let` numbers | Live bindings of the current canvas; `0` before `begin()` |
| `begin` | `(format, seed) → void` | Called by `render()` only. Sets the bindings and reseeds mulberry32 |
| `random` | `() → [0,1)` | Throws if called before `begin()` |
| `between` | `(a, b) → number` | Uniform in `[a, b)` |
| `f` | `(n) → number` | Rounds to 1 decimal for compact SVG |
| `smooth` | `(pts: [x,y][]) → pathData` | Catmull-Rom spline through points, as cubic Béziers; starts with `M` |

### `lib/formats.mjs`

`FORMATS = { desktop: { w: 1600, h: 900, horizon: 620, k: 1 }, mobile: { w: 900, h: 1600, horizon: 1040, k: 1.2 } }`

### `lib/styles.mjs`

`STYLES[name](palette) → { paint(c, { accent }?), line(c, w?), sky, water }`. See [architecture § Styles](architecture.md#styles).
The `line` style **requires** `paper` and `ink` in its palette.

### `lib/css.mjs`

`useCss(ctx, key, css) → void`. Registers a CSS block once per render under `key`.

### `lib/preview.mjs`

`previewPage(files: { region, style, format, name }[]) → html`. One section per `region · style`,
with desktop and mobile side by side.

### `generate.mjs`

| Export | Signature |
|---|---|
| `render` | `(regionName, styleName, formatName, seed = 7) → svgString` |
| `variants` | `() → { region, style, format, name }[]` |

CLI flags: `--all`, `--out <dir>` (default `dist`, only with `--all`), `--region` (default `thailand`),
`--style` (default `flat`), `--format` (default `desktop`), `--seed` (default `7`).
Without `--all` the SVG goes to stdout. Unknown flags are ignored.

## Palette keys read by the generator itself

| Key | Used for | Fallback |
|---|---|---|
| `skyTop`, `skyBottom` | `#sky` gradient (flat style) | `paper` |
| `waterTop`, `waterBottom` | `#water` gradient (flat style) | `skyBottom`, then `paper` |
| `paper`, `ink` | the line style's everything | required in line palettes |

## objects/

Signature convention: `(ctx, …position/size) → svgString`. The `ctx` destructures to `{ s, p }` (painter, palette).

### sky/

| Function | Signature | Palette | Animation (CSS key · keyframes · class) | RNG |
|---|---|---|---|---|
| `sun` | `(ctx, x, y, r)` | `sun` (accent) | `sun` · `pulse` 6 s · `.halo` (two rings, offset −3 s) | 0 |
| `clouds` | `(ctx, n)` | `cloud` | `clouds` · `cloud` 120 s linear, −400 → W+100 · `.cloud` | 4 / cloud |

`clouds`: y in `HORIZON × [0.15, 0.5]`, widths 160–320. The rest pose is spread across the width and
clamped inside the canvas. Delays are staggered by `120/n` s so clouds never bunch.

### animals/

| Function | Signature | Palette | Animation | RNG |
|---|---|---|---|---|
| `birds` | `(ctx, n)` | `ink` | `birds` · `fly` 45 s linear, −120 → W+120 · `.bird` | 3 / bird |
| `kangaroo` | `(ctx, y, k)` | `animal`, `dust` | `kangaroo` · `roo-run` 40 s (crosses in 60 %, then off-screen), `hop` 0.75 s, `dust` 0.75 s · `.roo-run`, `.roo-hop`, `.dust` | 0 |

`kangaroo`: faces right; `y` is the ground line under its feet. Rest pose `x = 0.55 W`. Dust is hidden
under reduced motion. The dust-drift formula hard-codes the 40 s / 60 % / 0.75 s timings: change them together.

### plants/

| Function | Signature | Palette | Animation | RNG |
|---|---|---|---|---|
| `palm` | `(ctx, x, baseY, h, lean)` | `palm` | `sway` (via `useSway`) · `.crown`, pivot at trunk top | 1 |
| `ghostGum` | `(ctx, x, baseY, h, k)` | `trunk`, `leaf`, `leafDark` | `sway` · `.crown`, pivot at the fork | 60 |
| `spinifex` | `(ctx, x, y, k)` | `spinifex` | none | 18 |
| `spinifexField` | `(ctx, band, n, k, x0, x1)` | `spinifex` | none | 19 / tuft |
| `useSway` | `(ctx)` | — | registers `sway` · `sway` 5 s ±2.5° · `.crown` | 0 |

`palm.lean` is the horizontal offset of the crown from the base (negative leans left). `spinifexField`
stands tufts on a `groundBand` surface via `band.yAt(x) + 6·ctx.k`.

### terrain/

| Function | Signature | Palette | Returns | RNG |
|---|---|---|---|---|
| `plain` | `(ctx, color)` | (arg) | full-width rect from `HORIZON` to `H` (x −10 … W+10) | 0 |
| `groundBand` | `(ctx, y, amp, color)` | (arg) | `{ svg, yAt(x) }`: two-sine wavy top, filled to `H+10`, x −40 … W+40 | 4 |
| `karst` | `(ctx, x, w, h, color)` | (arg) | steep rounded dome, base at `HORIZON + 4`, random lean | 1 |
| `karstRange` | `(ctx, count, hMin, hMax, wMin, wMax, color, x0 = 0, x1 = W)` | (arg) | `count` domes evenly spread with ±30 % jitter | 4 / dome |

`karst` doubles as Thai limestone karsts and Kata Tjuta. Check here before writing a new rock.

### water/

| Function | Signature | Palette | Animation | RNG |
|---|---|---|---|---|
| `water` | `(ctx)` | `waveLine`; body uses `s.water` | `water` · `drift` ±30 px, 4–8 s, alternate · `.wave` | 66 |
| `sunGlints` | `(ctx, x)` | `sun` (accent) | `glints` · `shimmer` 3 s · `.glint` | 0 |

`water` fills `HORIZON → H`, full width, with 22 wave lines that lengthen and thicken toward the viewer.
Straight horizontal dashes read as water, so don't reuse them for haze.

### landmarks/

| Function | Signature | Palette | RNG |
|---|---|---|---|
| `uluru` | `(ctx, cx, w, h)` | `uluru` (accent), `uluruShade` | 27 |
| `templeIsland` | `(ctx, x0, w, k)` | `near`, plus `temple` via `chedi` | 0 |

Both put their base at `HORIZON + 4` so ground layers overlap them, and `uluru` draws a contact shadow first.

### buildings/ and vehicles/

| Function | Signature | Palette | Animation | RNG |
|---|---|---|---|---|
| `chedi` | `(ctx, x, y, k)` | `temple` | none; 210 units tall at k = 1, base centre at (x, y) | 0 |
| `longtailBoat` | `(ctx, x, y, k)` | `boat`, `accent` | `boat` · `bob` 4 s · `.boat` | 0 |

## regions/

A region is `{ palettes: { <style>: {...} }, landmark: '<layer>', scene(ctx) → { layer: svg } }`,
registered in `regions/index.mjs` as `REGIONS`.

### `thailand`: Phang Nga bay at sunset

- **Landmark:** `temple`
- **Layers (back → front):** `clouds`, `sun`, `birds`, `karstFar`, `karstMid`, `temple`, `karstNear`,
  `water`, `glints`, `boat`, `beach` (inline), `palms`
- **RNG order:** `sunX` (1), then layer order
- **Flat palette:** `skyTop skyBottom sun cloud far mid near waterTop waterBottom waveLine temple palm boat accent ink`
- **Line palette:** `paper ink sun accent waveLine` (`accent` and `waveLine` only reach `s.line()`, which ignores colour in line style)
- **Mobile:** fewer karsts (4/3 vs 7/5), temple island shifted left (x0 30 vs 120), palms pulled into the right edge

### `australia`: the Red Centre

- **Landmark:** `uluru`
- **Layers (back → front):** `clouds`, `sun`, `birds`, `plain`, `kataTjuta`, `uluru`, `duneFar`, `duneMid`,
  `tuftsMid`, `kangaroo`, `duneNear`, `tuftsNear`, `ghostGum`
- **RNG order:** `groundBand` far, mid, near (4 each), then layer order
- **Flat palette:** `skyTop skyBottom sun cloud far uluru uluruShade plain dune1 dune2 dune3 dust spinifex trunk leaf leafDark animal ink`
- **Line palette:** `paper ink sun uluru accent` (`accent` is currently unused)
- **Mobile:** Uluru `0.72 W` wide, 3 Kata Tjuta domes, ghost gum moved to x 50 and shortened. Uluru is 86–87 % visible, close to the 85 % limit.

## Palette key → consumer index

| Key | Consumers |
|---|---|
| `accent` | `longtailBoat` (flat only in practice) |
| `animal`, `dust` | `kangaroo` |
| `boat` | `longtailBoat` |
| `cloud` | `clouds` |
| `ink` | `birds`; line style painter |
| `leaf`, `leafDark`, `trunk` | `ghostGum` |
| `near` | `templeIsland`; Thailand `karstNear` |
| `palm` | `palm`; Thailand `beach` |
| `spinifex` | `spinifex`, `spinifexField` |
| `sun` | `sun`, `sunGlints` |
| `temple` | `chedi` |
| `uluru`, `uluruShade` | `uluru` |
| `waveLine` | `water` |
| `far`, `mid`, `plain`, `dune1-3` | passed as `color` args by region scenes |
