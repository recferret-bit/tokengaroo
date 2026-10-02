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
| `render` | `(regionName, styleName, formatName, seed = 7, regions = REGIONS) → svgString` |
| `variants` | `() → { region, style, format, name }[]` |

CLI flags: `--all`, `--out <dir>` (default `dist`, only with `--all`), `--region` (default `thailand`),
`--style` (default `flat`), `--format` (default `desktop`), `--seed` (default `7`).
Without `--all` the SVG goes to stdout. Unknown flags are ignored.

### `scripts/gif.mjs`

| Export | Signature | Notes |
|---|---|---|
| `convertSvgToGif` | `(svg: string, options) → Promise<Buffer>` | Mounts SVG in CDP, scrubs timeline, encodes and returns GIF Buffer |
| `findChrome` | `() → string \| undefined` | Discovers Chrome / Chromium path or reads `CHROME_PATH` |
| `launchChrome` | `() → Promise<{ page, close }>` | Launches headless Chrome instance over CDP |

CLI flags: `--region <name>` (converts desktop & mobile by default), `--format <desktop|mobile|both>`,
`--style <flat|line|all>`, `--all`, `--only <substr>`, `--fps <n>` (default 12), `--duration <s>` (default 10),
`--scale <n>` (default 0.5), `--width <px>`, `--gen <path>`, `--seed <n>`, `--out <dir|file>`. Positional args accept `.svg` file paths or directories.

## Support tags

The support check reads two attributes that objects put on their own elements:

| Tag | Objects |
|---|---|
| `data-surface="ground"` | `plain`, `groundBand`, `ridge`, `riverWall`, `promenade` (road and pavement), `templeIsland` (the island), the `reflectingPool` rim, Thailand's inline `beach` |
| `data-surface="water"` | `water`, the `reflectingPool` body |
| `data-rests="ground"` | `chedi`, `uluru`, `capitol`, `obelisk`, `kremlinWall`, `spasskayaTower`, `stBasils`, `westminsterPalace`, `elizabethTower`, `ferrisWheel`, `pagoda`, `greatWall`, `palm`, `ghostGum`, `cherryTree`, `pine`, `spinifex`, `kangaroo`, `doubleDecker` |
| `data-rests="water"` | `longtailBoat` |
| untagged | sky things (`sun`, `clouds`, `snow`, `birds`), `karst` (rises out of land or sea alike), `sunGlints`, wave lines |

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

| `snow` | `(ctx, n)` | `flake` | `snow` · `fall` 16–28 s linear, −20 → H+20 · `.flake`; `flutter` 3 s alternate · `.flutter` | 6 / flake |

`snow`: each flake's rest pose is scattered over the canvas (a `transform` attribute), and the loop starts and ends off canvas, so there is no seam.

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
| `cherryTree` | `(ctx, x, baseY, h, k)` | `trunk`, `blossom`, `blossomDark` (accent) | `sway` · `.crown`; `petals` · `petal` 7 s, fading drift · `.petal` (hidden with reduced motion) | 69 |
| `pine` | `(ctx, x, baseY, h, lean, k)` | `trunk`, `pine`, `pineDark` | `sway` · each branch is a `.crown` pivoting where it leaves the trunk | 12 |
| `useSway` | `(ctx)` | — | registers `sway` · `sway` 5 s ±2.5° · `.crown` | 0 |

`palm.lean` is the horizontal offset of the crown from the base (negative leans left). `spinifexField`
stands tufts on a `groundBand` surface via `band.yAt(x) + 6·ctx.k`.

### terrain/

| Function | Signature | Palette | Returns | RNG |
|---|---|---|---|---|
| `plain` | `(ctx, color)` | (arg) | full-width rect from `HORIZON` to `H` (x −10 … W+10) | 0 |
| `cobbles` | `(ctx, y0)` | `cobble`, `cobbleLine` | cobbled street from `y0` to `H`: rows of setts growing toward the viewer, alternate rows offset | 0 |
| `groundBand` | `(ctx, y, amp, color)` | (arg) | `{ svg, yAt(x) }`: two-sine wavy top, filled to `H+10`, x −40 … W+40 | 4 |
| `karst` | `(ctx, x, w, h, color)` | (arg) | steep rounded dome, base at `HORIZON + 4`, random lean | 1 |
| `karstRange` | `(ctx, count, hMin, hMax, wMin, wMax, color, x0 = 0, x1 = W)` | (arg) | `count` domes evenly spread with ±30 % jitter | 4 / dome |
| `ridge` | `(ctx, top, amp, color)` | (arg) | `{ svg, yAt(x) }`: mountain skyline (three summed sines) between `top` and `top + amp`, filled to `H+10` | 6 |

`karst` doubles as Thai limestone karsts, Kata Tjuta and (low, green) Washington's line of trees. Check here before writing a new rock.
`ridge` can sit above the horizon (China's ranges). Keep each nearer ridge's top below the things standing on the one behind it.

### water/

| Function | Signature | Palette | Animation | RNG |
|---|---|---|---|---|
| `water` | `(ctx)` | `waveLine`; body uses `s.water` | `water` · `drift` ±30 px, 4–8 s, alternate · `.wave` | 66 |
| `reflectingPool` | `(ctx, cx, y0, w0, w1, reflection?)` | `poolRim`, `waveLine`, `marble` (reflection); body uses `s.water` | shares `water` · `drift` (via `useWaves`) · `.wave` | 40 |
| `sunGlints` | `(ctx, x)` | `sun` (accent) | `glints` · `shimmer` 3 s · `.glint` | 0 |

`water` fills `HORIZON → H`, full width, with 22 wave lines that lengthen and thicken toward the viewer.
Straight horizontal dashes read as water, so don't reuse them for haze. `useWaves(ctx)` (exported from
`water.mjs`) registers the shared `.wave` drift for any other water body.

`reflectingPool`: a perspective trapezoid, `w0` wide at its far edge `y0`, `w1` wide at the bottom.
`reflection: { x, w }` adds a faint inverted strip for a tall landmark beyond the far end.

### landmarks/

| Function | Signature | Palette | RNG |
|---|---|---|---|
| `uluru` | `(ctx, cx, w, h)` | `uluru` (accent), `uluruShade` | 27 |
| `templeIsland` | `(ctx, x0, w, k)` | `near`, plus `temple` via `chedi` | 0 |
| `stBasils` | `(ctx, x, y, k)` | `brick`, `brickShade`, `trim`, `tent`, `cross`, `domeA–D` (accent), `stripeA–D` | 0 |
| `greatWall` | `(ctx, band, x0, x1, k)` | `wall`, `wallShade` | 0 |

`uluru`, `templeIsland` and `stBasils` (388 × 411 at k = 1) put their base at `HORIZON + 4` so ground layers overlap them;
`uluru` draws a contact shadow first. `greatWall` follows a `ridge`/`groundBand` surface (`band.yAt`), sunk 6k into
it, with five watchtowers whose feet go down to the lowest ground under them, so nothing floats on slopes.

### buildings/ and vehicles/

| Function | Signature | Palette | Animation | RNG |
|---|---|---|---|---|
| `chedi` | `(ctx, x, y, k)` | `temple` | none; 210 units tall at k = 1, base centre at (x, y) | 0 |
| `capitol` | `(ctx, x, y, k)` | `marble`, `marbleShade` | none; 524 × 346 at k = 1 | 0 |
| `obelisk` | `(ctx, x, y, w, h)` | `marble`, `marbleShade` | none | 0 |
| `kremlinWall` | `(ctx, x0, x1, h, k, towers = [])` | `brick`, `brickShade`, `roof` | none; swallowtail merlons, base at `HORIZON + 4` | 0 |
| `spasskayaTower` | `(ctx, x, y, k)` | `brick`, `brickShade`, `trim`, `roof`, `ink`, `clock`, `star` (accent) | none; 96 × 401 at k = 1 | 0 |
| `westminsterPalace` | `(ctx, x0, x1, k)` | `stone`, `stoneShade`, `roof` | none; base at `HORIZON + 4`. Run it past a tower placed in front | 0 |
| `elizabethTower` | `(ctx, x, y, k)` | `stone`, `stoneShade`, `roof`, `ink`, `clockFace` (accent) | none; 66 × 490 at k = 1 | 0 |
| `ferrisWheel` | `(ctx, cx, r, k)` | `steel`, `capsule` | `wheel` · `spin` 160 s linear · `.wheel` (a full turn, so no seam) | 0 |
| `riverWall` | `(ctx, y, h)` | `bank`, `bankShade` | none; far bank's wall face, full width, `y` to `y + h`. Draw it after the water, at `HORIZON` | 0 |
| `promenade` | `(ctx, y, k)` | `parapet`, `parapetShade`, `lamp` (accent), `road`, `pavement` | none; near bank: parapet and lamps, road surface at `y`, pavement below. Vehicles go at `y + 30k` | 0 |
| `pagoda` | `(ctx, x, y, k)` | `plinth`, `roof`, `pagoda` (accent) | none; 132 × 224 at k = 1 | 0 |
| `bookshop` | `(ctx, x, y, k)` | `brick`, `brickShade`, `pot`, `stone`, `trim`, `glass`, `glow` (accent), `leaf`, `flower` (accent), `shop`, `shopShade`, `fascia`, `gilt`, `wood`, `bookA`–`bookE`, `door` (accent), `sign` (accent), `page`, `iron` | `swing` via `useSwing` (the sign); `glow` via `lanterns`. 528 × 508 at k = 1, the sign reaches 322 right of centre | 3 / book (≈ 60) |
| `templeBarPub` | `(ctx, x, y, k)` | `pub` (accent), `pubShade`, `pubDark`, `letter`, `trim`, `glass`, `glow` (accent), `leaf`, `moss`, `flowerA`–`flowerC` (accent), `stone`, `iron` | `swing` via `useSwing` (three hanging baskets); `glow` via `lanterns`. 496 × 424 at k = 1, lanterns reach 284 either side | 0 |
| `paintedShops` | `(ctx, x0, x1, k, first = 0)` | `paintA`–`paintD`, `trim`, `glass`, `glow` (accent), `pubDark`, `letter`, `bookA`–`bookE` | none; 150-wide shops of five heights from `x0` until they pass `x1`, base at `HORIZON + 4`. Every fifth (by `i + first`) is a bookshop | 0 |
| `georgianTerrace` | `(ctx, x0, x1, k, first = 0)` | `brickB`, `brickC`, `brickShade`, `pot`, `stone`, `glass`, `glow` (accent), `trim`, `doorA`–`doorD` (accent), `ink`, `iron` | none; 200 × 454 houses from `x0` until they pass `x1`, base at `HORIZON + 4`. `first` shifts door colours and brick shades | 0 |
| `longtailBoat` | `(ctx, x, y, k)` | `boat`, `accent` | `boat` · `bob` 4 s · `.boat` | 0 |
| `doubleDecker` | `(ctx, y, k)` | `bus` (accent), `busWindow`, `trim`, `tyre` | `bus` · `bus-drive` 44 s (crosses in 50 %, then off-screen) · `.bus-drive`; rest pose 0.3 W | 0 |
| `cyclist` | `(ctx, y, k)` | `tyre`, `spoke`, `frame`, `trousers`, `ink`, `bookB`, `basket`, `coat`, `scarf` (accent), `skin`, `cap` | `cyclist` · `ride` 38 s (crosses in 55 %, then off-screen), `spin` 1.6 s · `.ride`, `.wheel`; rest pose 0.22 W | 0 |

### street/

| Function | Signature | Palette | Animation | RNG |
|---|---|---|---|---|
| `streetLamp` | `(ctx, x, y, k)` | `iron`, `glow` (accent) | `glow` via `lanterns`; 310 tall at k = 1, base at (x, y) | 0 |
| `lettering` | `(text, x, y, advance = 22)` | — | none; returns path data for capitals A B E H K L M O P R S T in a 15 × 22 box. `letteringWidth(text, advance)` gives its width | 0 |
| `useSwing` | `(ctx)` | — | registers `swing` · `swing` 7 s ±3° · `.swing` (fill-box, pivot at its top middle) | 0 |
| `lanterns` | `(ctx, [[x, y], …])` | `iron`, `glow` (accent) | `glow` · `glow` 4 s alternate, halo opacity .3 → .55 · `.glow` (rest opacity .4) | 0 |

`lanterns` draws in the caller's coordinates, each 28 tall hanging from its point, all in three paths.

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

### `washington`: Washington, D.C., the National Mall in cherry-blossom season

- **Landmark:** `capitol`
- **Layers:** `clouds`, `sun`, `birds`, `lawn`, `trees` (low green `karstRange`), `monument`, `capitol`, `pool`, `cherries`
- **Line palette:** `paper ink sun blossom blossomDark`
- **Mobile:** Monument at 0.27 W, Capitol at 0.62 W and scale 0.75, cherries low in the corners

### `moscow`: Red Square on a winter evening

- **Landmark:** `stBasils`
- **Layers:** `clouds`, `sun`, `birds`, `square`, `kremlinWall`, `spasskaya`, `stBasils`, `driftFar`, `drift`, `snow`
- **RNG order:** the two `groundBand` drifts first, then layer order
- **Line palette:** `paper ink sun star clock domeA domeB domeC domeD`
- **Mobile:** one wall tower, Spasskaya at 0.16 W and scale 0.9, cathedral at 0.6 W

### `london`: the Thames at dusk

- **Landmark:** `westminster` (palace + Elizabeth Tower in one layer)
- **Layers:** `clouds`, `sun`, `birds`, `londonEye`, `westminster`, `thames`, `farBank`, `embankment`, `bus`
- **Composition rule:** the river runs *between* two banks. Buildings stand on `farBank`, and the bus drives on the near
  `embankment`. (An earlier full-width bridge ran parallel to the far bank and read as a road floating in the water.)
- **Line palette:** `paper ink sun clockFace lamp bus`
- **Mobile:** tower at 0.56 W, the Eye at the right edge (partly cropped, not the landmark)

### `china`: the Great Wall at dawn

- **Landmark:** `greatWall`
- **Layers:** `clouds`, `sun`, `birds`, `ridgeFar`, `ridgeBack`, `ridgeWall`, `greatWall`, `ridgeNear`, `pine`, `pagoda`
- **RNG order:** four `ridge` calls first, then layer order
- **Line palette:** `paper ink sun pagoda`
- **Mobile:** the near ridge drops lower, and the pine and pagoda stand low on it, well under the wall

### `dublin`: Temple Bar at dusk

- **Landmark:** `templeBar` (the red Temple Bar pub)
- **Layers:** `clouds`, `sun`, `birds`, `street`, `shopsLeft`, `shopsRight`, `templeBar`, `lamps`, `cyclist`
- **Composition rule:** the pub stands centred and taller than the painted shops either side; a narrow pavement
  runs from `HORIZON`, then cobbles to the bottom edge. The cyclist rides low on the cobbles, clear of the shopfronts.
- **Line palette:** `paper ink sun pub glow flowerA-C scarf` (the pub front stays red in line style)
- **Mobile:** one painted shop each side, lamps at the edges. `bookshop` and `georgianTerrace` (an earlier Dublin
  scene) are not used by any region now

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
