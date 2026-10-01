# Project review: 2026-10-01

Full review of `tokengaroo` at commit `60e110b`: every file read, the generator and harness run, and the stills inspected.

## Verified state

| Item | Result |
|---|---|
| `node template/generate.mjs --all` | 8 variants + `index.html`; **byte-identical** to the committed `examples/` |
| `node scripts/check.mjs` | **All 8 variants pass** grounding, landmark and motion (exit 0, ~1.9 s, Node 24.15, Chrome on macOS) |
| Landmark visibility | Thailand 92–94 % (water covers 5–7 % of the island base, by design) · Australia desktop 100 % · **Australia mobile 86–87 %** (ghost gum covers ~12 %) |
| File sizes | 14.6–23.5 KB per SVG, within the 15–25 KB target |
| Dependencies | None. Node built-ins plus a local Chrome |
| Per-object RNG costs | Measured; they match [`api-reference.md`](api-reference.md) |

Overall: a small, coherent, well-commented codebase with a clear generator/harness contract, real
determinism, and a harness whose checks map one-to-one to artifacts that actually happened. The issues
below are mostly sharp edges, not design flaws.

## Findings

Severity: **High** = can lose data or silently mislead · **Medium** = will bite on the next region/feature · **Low** = polish.

### High

1. **`check.mjs` deletes `--out` recursively with no guard** (`scripts/check.mjs:514`, `rmSync(OUT, { recursive: true, force: true })`).
   The tool is agent-driven. One mistaken `--out <project>` (instead of `<project>/qa`) wipes the user's
   project. *Suggest:* refuse to delete a directory that exists and lacks `report.json`/`report.md`, or
   only clear `svg/`, `img/` and the two report files.

### Medium

2. **Harness can hang if Chrome dies mid-run.** `connect()` has no `onclose` handler and no per-call timeout,
   so pending CDP promises never settle and the documented exit code `2` never happens.
   *Suggest:* reject all pending calls on `ws.onclose`/`onerror`, and add a timeout around `send()`.
3. **Australia mobile landmark margin is thin:** 86–87 % visible against an 85 % limit, with `ghostGum`
   the culprit. Any added foreground, or a different seed, likely fails `covered`. *Suggest:* shorten or
   shift the gum's right canopy clump on mobile to buy headroom.
4. **Colour-collision blind spot in the pixel checks.** Sky/landmark detection is ±40 per channel around
   `#ff00ff`/`#00ffff`. Plausible future palettes (cherry blossom pink, turquoise lakes like Moraine Lake)
   will cause false `sky-leak` or inflated `visible`. *Suggest:* render the classification passes with
   *every other* layer forced to a neutral colour, or pick marker colours at runtime that are far from the palette.
5. **Line-style edge outline.** Thailand's inline `beach` path closes at exactly `x = W`/`y = H`, so in
   line style its stroke draws a visible vertical line along the right canvas edge (visible in
   `thailand-line-desktop.still.png`). *Suggest:* extend the path to `W + 40`/`H + 10` like `groundBand` does.
6. **Kangaroo timing is duplicated.** The dust-drift formula in `objects/animals/kangaroo.mjs` hard-codes
   `W + 400`, `24` (60 % of 40 s) and `0.75`, separately from the CSS that defines them. Changing one
   desyncs the dust. *Suggest:* derive them all from named constants at the top of the function.

### Low

7. **Silent CLI mistakes.** `--only` with no value runs every variant. `--seed abc` becomes `NaN`, which
   silently acts as an arbitrary fixed seed. Unknown flags are ignored. *Suggest:* validate and exit `2`.
8. **Dead palette keys.** In line style `s.line()` ignores its colour, so `thailand.line.waveLine` and
   `thailand.line.accent` have no effect, and `australia.line.accent` has no consumer at all. They are
   harmless but misleading. Remove them, or document that line style is ink-only.
9. **No Node version guard.** On Node < 22 the harness fails with `ReferenceError: WebSocket is not defined`.
   A minimal `package.json` with `"engines": { "node": ">=22" }` (still zero deps) or an explicit runtime check would make this clear.
10. **No LICENSE file**, although the README invites `git clone` from a public GitHub repo.
11. **No automated sync check for `examples/`.** They are in sync today. A one-line CI or pre-commit step
    (`generate --all --out examples && git diff --exit-code examples`) would keep it that way.
12. **Windows Chrome paths** are not in `findChrome()`. `CHROME_PATH` works, but the README doesn't mention it.
13. **Doc nit:** `SKILL.md` line 133 says "see the design rules below", but that section is above it.
14. **Readability nit:** `palm.mjs` frond angles include the literal `160 + 35` (= 195). Write `195` or explain it.
15. **`render()` is not re-entrant** (module-level canvas and RNG state). That's fine for the CLI and
    harness, but a future server or parallel use must render sequentially or in separate processes. This is documented in `AGENTS.md`.

## Strengths worth keeping

- **Contract-first design.** The `data-layer`/`data-horizon`/`data-landmark` contract lets a generic
  harness reason about any region without per-region code.
- **Objects own their CSS** through `useCss`, so pictures carry only the keyframes they use.
- **Reduced motion is designed in:** rest poses as `transform` attributes, transients hidden, a global kill switch, plus checks for all three.
- **Actionable reports:** every finding kind has a fix hint and boxed evidence, built for an agent fix loop.
- **Honest scope:** `SKILL.md` and the report footer both say the checks don't judge meaning, and make looking at the stills mandatory.

## Suggested backlog (in order)

1. Guard the `--out` deletion (finding 1).
2. CDP close/timeout handling (2).
3. Mobile Australia headroom, and the line-style beach edge (3, 5).
4. Marker-colour robustness (4) before adding a pink- or turquoise-heavy region.
5. `package.json` with `engines`, a LICENSE, and the examples sync check (9–11).
6. A multi-seed harness mode (`--seeds 1..5`) to catch layouts that only pass on seed 7.
