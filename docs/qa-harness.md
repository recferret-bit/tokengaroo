# QA harness: `scripts/check.mjs`

A single-file, zero-dependency harness. It imports the generator, renders every variant, loads it into
headless Chrome over the DevTools protocol (CDP), and runs four visual-artifact checks. Each check
exists because the artifact really happened while the first two regions were built.

## CLI

```sh
node scripts/check.mjs [--gen <generate.mjs>] [--out <dir>] [--only <substr>] [--seed <n>] [--still <ms>]
```

| Flag | Default | Meaning |
|---|---|---|
| `--gen` | `../template/generate.mjs` (relative to `check.mjs`) | Generator module; must export `render()` and `variants()` |
| `--out` | `./qa` (relative to cwd) | Output dir. **Deleted recursively first.** |
| `--only` | all | Keep variants whose name contains the substring (`australia`, `mobile`, `thailand-line`) |
| `--seed` | `7` | Seed passed to `render()` |
| `--still` | `10000` | Timeline position (ms) of the still frame saved per variant |
| `CHROME_PATH` env | auto | Chrome binary. Auto-discovery covers the usual macOS and Linux paths only |

Exit codes: `0` everything passes · `1` findings · `2` harness error (no Chrome, bad `--gen`, no variant matches, crash).

## Outputs

```
<out>/report.md                 human/agent summary: table + per-finding fix hints + evidence links. Start here.
<out>/report.json               machine-readable, see schema below
<out>/svg/<variant>.svg         exactly what was checked
<out>/img/<variant>.still.png   real frame at --still ms (normal motion)
<out>/img/<variant>.grounding.png         evidence, only if grounding failed
<out>/img/<variant>.landmark.png          evidence, only if landmark failed
<out>/img/<variant>.support.png           evidence (surface map), only if support failed
<out>/img/<variant>.motion-seam-<n>.png   up to 3 seam frames, element boxed
<out>/img/<variant>.motion-rest.png       reduced-motion still with offending elements boxed
```

### `report.json` schema

```jsonc
{
  "generator": "/abs/path/generate.mjs", "seed": 7,
  "limits": { /* LIMITS */ }, "screens": { /* SCREENS */ },
  "results": [{
    "region": "australia", "style": "flat", "format": "mobile", "name": "australia-flat-mobile",
    "still": "img/australia-flat-mobile.still.png",
    "checks": {
      "grounding": { "status": "pass|fail", "findings": [{ "kind", "message", "hint" }], "metrics": { "skyLeakPx", "floatingShare" }, "evidence": [] },
      "landmark":  { "status", "findings", "metrics": { "visible", "covered", "cropped", "safe", "culprits": [{ "layer", "share" }] }, "evidence": [] },
      "motion":    { "status", "findings", "metrics": { "animations" }, "evidence": [] },
      "support":   { "status": "pass|fail|skip", "note"?, "findings", "metrics": { "resters", "causewayShare" }, "evidence": [] }
    }
  }]
}
```

`landmark.metrics.culprits` is filled even on a pass. It is the best early warning for a foreground layer
creeping over the landmark.

## How it runs

```mermaid
sequenceDiagram
  participant H as check.mjs (Node)
  participant C as headless Chrome
  H->>C: spawn --headless=new --remote-debugging-port=0 (temp profile)
  H->>C: Target.createTarget + attachToTarget (flatten)
  H->>C: Runtime.evaluate(pageLib.toString()) → window.__qa
  loop every variant
    H->>H: svg = gen.render(region, style, format, seed)
    H->>C: __qa.grounding(svg) / __qa.landmark(svg, screens) / __qa.support(svg)   (static rasters)
    H->>C: emulate prefers-reduced-motion: no-preference
    H->>C: __qa.motion(svg) → seams + per-element stats
    H->>C: freeze(t) + captureScreenshot (seam evidence, still)
    H->>C: emulate prefers-reduced-motion: reduce
    H->>C: __qa.rest(svg, stats) → reduced-motion findings
  end
  H->>H: write report.json + report.md, kill Chrome
```

`pageLib` is serialised with `toString()` and evaluated in the page, so it **must not reference anything
from the Node module scope**. `LIMITS` is passed in as its argument.

## The checks

### 1. grounding (static raster, animations off)

The SVG is rasterised to a canvas with the sky rect repainted **magenta** (`#ff00ff`) and the landmark
layer painted **cyan** (`#00ffff`).

| Kind | Rule |
|---|---|
| `sky-leak` | Any magenta pixel from `horizon + skyLeakRows` (2) down to the bottom |
| `floating` | For each column containing landmark pixels, find the lowest one. If the pixel 3 rows below it is sky, the column floats. Fails if more than `floatColumns` (2 %) of landmark columns float |
| `contract` | No `data-horizon`, or the landmark layer paints nothing |

### 2. landmark visibility

Three rasters: the landmark **alone**, the full **composite** (landmark cyan), and the composite with each
later layer hidden in turn.

- **Safe area** = the region every target screen shape shows under `xMidYMid slice`:
  `wf = min(1, screens.min / ratio)`, `hf = min(1, ratio / screens.max)`, centred.

  | Format | Screen range (w/h) | Safe box on the canvas |
  |---|---|---|
  | desktop 1600×900 | 16:10 … 21:9 | x 80–1520, y 107–793 |
  | mobile 900×1600 | 9:20 … 9:16 | x 90–810, y 0–1600 |

- `covered = 1 − composite / alone`, `cropped = 1 − alone∩safe / alone`, `visible = composite∩safe / alone`.
- Fails if `visible < landmarkVisible` (85 %). It reports `covered` (if > 2 %) with culprits sorted by share,
  and/or `cropped` (if > 2 %).
- **Culprits**: a later layer whose removal reveals more than 1 % of the landmark.

### 3. motion

**3a. Seams** (normal motion). Every CSS animation in the mounted SVG is paused and scrubbed with `currentTime`.
- 24 samples per period record mean opacity and horizontal travel (`travel` = centre range / W).
- At each loop boundary `t` from the first iteration up to `max(windowMs, 2·dur)`, it compares `t − 1 ms`
  and `t + 1 ms`. If the element is on canvas at either side and moves more than `popPx` (4 px) or
  changes opacity by more than `popOpacity` (0.3), that is a `seam`.
- `alternate` animations are skipped (they cannot seam).

**3b. Rest** (`prefers-reduced-motion: reduce` emulated).

| Kind | Rule |
|---|---|
| `reduced-runs` | Any animation still running |
| `rest-cut` | A **traveller** (`travel > 0.5`) at rest is between 10 % and 90 % inside the canvas (cut by the edge) |
| `rest-pileup` | More than one traveller of the same animation rests at the same `x0` (±3 px) |
| `frozen-transient` | Mean animated opacity below 0.35 but rest opacity above 0.6 (a puff or flash frozen visible) |

Findings on descendants of an already-reported element are suppressed.

### 4. support (static rasters, animations off)

Needs the generator to tag surfaces (`data-surface="ground|water"`) and the things that stand on them
(`data-rests="ground|water"`, on the object's root element). An SVG with no `data-surface` at all gets
`status: "skip"`, so older project copies still run.

- **Surface map:** one raster with everything hidden except tagged surfaces, ground painted green
  `#00ff00` and water blue `#0000ff` in draw order (a bank drawn after the water wins), sky magenta.
- **Footprints:** each `data-rests` element's rest box comes from a live mount with animations off.
  Elements whose columns don't overlap share one raster (painted cyan, everything else hidden). Its
  footprint is the lowest pixel per column, kept only within `footBand` (6 px) of its very lowest. A
  tree is judged by its trunk, not by a crown overhanging the water. What it stands on is the surface
  3 px under the footprint. An element whose base runs off the bottom edge, or that mostly stands on
  untagged things (a rock), is not judged.

| Kind | Rule |
|---|---|
| `wrong-support` | More than `supportShare` (25 %) of the footprint is over the other surface: water under a `ground` rester, or ground under a `water` one |
| `unsupported` | More than 25 % of the footprint has only sky under it |
| `causeway` | In more than `causewayWidth` (50 %) of the columns, a run of ground has water directly above it and directly below it (untagged gaps up to 8 % of H are skipped, e.g. a parapet), and it doesn't run down to the bottom edge. That's a road or bank floating in the water, running along it |

Findings are grouped per layer and element type (`2 × westminster › g`).

## Self-test: `scripts/selftest.mjs`

```sh
node scripts/selftest.mjs     # exit 0 = every fixture caught as expected, 1 = something slipped through
```

`scripts/fixtures/generate.mjs` is a generator (same `render`/`variants` shape) whose regions are
known-bad scenes. Each declares `expect`, the finding kinds every variant must produce. A fixture with
`expect: []` is a control that must come out clean. `render()` takes an optional `regions` map, so the
fixtures don't have to be in the real `REGIONS`.

| Fixture | Reproduces | Must report |
|---|---|---|
| `old-london` | London's first layout: full-width bridge along the Thames, palace and Eye standing in the river | `wrong-support`, `causeway` |
| `tree-in-pool` | Washington's first layout: a cherry trunk inside the reflecting pool | `wrong-support` |
| `boat-on-land` | a long-tail boat on a plain | `wrong-support` |
| `floating-rock` | Uluru with no ground at all | `sky-leak`, `floating` |
| `london` | the shipped London (control) | nothing |

Run it after any change to `check.mjs`, and when you find a new artifact by eye, add a fixture for it.
A check that only ever passes proves nothing. Mutation-tested: raising `causewayWidth` past 1 makes
the self-test fail on `old-london`.

## Limits

```js
const LIMITS = {
  skyLeakRows: 2, floatColumns: 0.02, landmarkVisible: 0.85,
  popPx: 4, popOpacity: 0.3, transientMeanOpacity: 0.35,
  edgeCut: 0.1, travel: 0.5, windowMs: 60000,
  footBand: 6, supportShare: 0.25, causewayWidth: 0.5,
};
```

**Never loosen these to get a pass.** If a finding is a genuine false positive, change the check's
*logic* for that whole class of element and say so in your summary.

## Evidence colour key

| Image | Means |
|---|---|
| `*.grounding.png` | sky magenta, landmark cyan, red box = problem area |
| `*.landmark.png` | landmark cyan, red boxes = what covers it, dashed black box = safe area |
| `*.motion-seam-N.png` | real frame 1 ms after the jump, red box = the element |
| `*.motion-rest.png` | reduced-motion still, red boxes = offending elements |
| `*.support.png` | surface map: ground green, water blue, sky magenta, everything else hidden; red boxes = bad footprints or the floating strip |

## Known limitations

- **Colour collisions.** Pixel classification uses ±40 per channel around magenta and cyan (alpha > 200).
  A palette colour close to `#ff00ff` (hot pink, cherry blossom) in a ground layer can be counted as a
  sky leak. One close to `#00ffff` (tropical water, glacier ice) inside the safe area can inflate the
  landmark's visible share. Check new palettes against both.
- **Hero landmark only.** Secondary motifs (the kangaroo, the boat) are not checked for being covered or cropped.
- **Support needs tags.** Untagged objects aren't judged: sky things, `karst` rocks (they rise out of land or sea alike),
  and any project object nobody tagged. On long sloped things (the Great Wall) only the part near the lowest point counts as the footprint.
- **Stills are not byte-stable.** The same SVG can give slightly different `still.png` bytes from run to run, so compare
  SVG output (drawing outside `<style>`), not stills, to prove a refactor changed nothing.
- **One seed.** Only `--seed` (default 7) is checked. Other seeds can produce layouts that fail.
- **Meaning is out of scope.** The checks can't tell whether a shape reads as what it is meant to be.
  Always look at the stills.
- **Hang risk.** CDP calls have no timeout, and a WebSocket close does not reject pending calls. If Chrome
  dies mid-run the harness can hang instead of exiting `2`.
- **Platforms.** Chrome auto-discovery covers macOS and Linux paths only. On Windows, set `CHROME_PATH`.

## Extending a check

1. Add the logic inside `pageLib` (page-side, self-contained) and return `{ findings: [{ kind, message, box? }], metrics }`.
2. Add a `HINTS[kind]` entry. It is the fix advice printed in `report.md` and is what Claude acts on.
3. If it needs evidence, capture it in `checkVariant()` and describe its colours in `EVIDENCE`.
4. Add a threshold to `LIMITS` instead of inlining a magic number.
5. Document it in `SKILL.md` § The four checks, `README.md` § The QA harness, and this file.
6. Prove it with a fixture in `scripts/fixtures/generate.mjs` that must trigger it, and run `node scripts/selftest.mjs`.
