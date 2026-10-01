# AGENTS.md — tokengaroo

Instructions for AI coding agents (Claude Code, Codex, Cursor, Crush, …) working **on this repository**.
Humans start at [`README.md`](README.md).

> **Scope note.** This repo sits inside the `casino-github-personal` workspace, but it is **not** part of the
> casino platform. The workspace rules (MCP 5-stage loop, Graphiti/GitNexus, BigNumber, NATS, Clean Arch,
> `FEATURES.md`/`TESTS.md`, `sync-agent-rules.sh`) do **not** apply here. This file is the complete contract.

## What this is

A Claude Code **skill** that turns a plain-language prompt ("do Australia") into an animated, geometric,
dependency-free SVG background for a travel site, in desktop 16:9 and mobile 9:16, flat or line style,
then runs a headless-Chrome QA harness that catches visual artifacts and drives a fix loop.

Three moving parts:

| Part | File(s) | Role |
|---|---|---|
| Skill instructions | `SKILL.md` | What Claude follows **at runtime** when the skill triggers in a user's project |
| Generator | `template/` | Pure-JS SVG generator; the skill copies it into a user's project on first use |
| QA harness | `scripts/check.mjs` | Headless Chrome over CDP; three checks; `report.md` + evidence PNGs |

## Two modes: know which one you are in

1. **Developing the skill (this repo).** `template/` **is the source**. Edit it directly, regenerate
   `examples/`, run the harness. This is what this file is about.
2. **Using the skill on someone's project.** Follow `SKILL.md`: work on the project's *copy* of
   `template/`, never on this one.

`~/.claude/skills/tokengaroo` is (on the maintainer's machine) a **symlink to this repo**. Every edit to
`SKILL.md`, `template/` or `scripts/` is live in every Claude Code session immediately. Don't leave
`SKILL.md` half-edited.

## Commands

No `npm install`. There is no `package.json`. Requirements: **Node ≥ 22** (global `WebSocket`) and a local
Chrome/Chromium (`CHROME_PATH` overrides discovery).

```sh
node template/generate.mjs --all --out examples          # rebuild the committed examples + examples/index.html
node template/generate.mjs --all --out dist              # scratch build (dist/ is gitignored)
node template/generate.mjs --region thailand --style line --format mobile --seed 7 > out.svg
node scripts/check.mjs --out qa                          # QA every variant → qa/report.md (qa/ is gitignored)
node scripts/check.mjs --out qa --only australia-flat    # substring filter on variant names
open dist/index.html                                     # watch the motion side by side
```

Harness exit codes: `0` all pass · `1` findings · `2` harness error (Chrome missing, contract broken, crash).
A full run of all 8 variants takes about 2 s.

⚠️ `check.mjs` **deletes `--out` recursively** before writing. Always pass a dedicated directory (`qa`,
or a scratch dir), never a project root.

## Layout

```
SKILL.md                         runtime instructions for Claude (frontmatter name/description = trigger)
README.md                        human-facing intro, install, usage
scripts/check.mjs                QA harness (single file, zero deps)
template/
  generate.mjs                   orchestration only: render(), variants(), CLI
  lib/canvas.mjs                 W/H/HORIZON live bindings, seeded RNG (mulberry32), f(), smooth()
  lib/formats.mjs                desktop 1600×900 (horizon 620, k 1) · mobile 900×1600 (horizon 1040, k 1.2)
  lib/styles.mjs                 flat / line painters: s.paint(), s.line(), s.sky, s.water
  lib/css.mjs                    useCss(): objects register their own keyframes once
  lib/preview.mjs                index.html side-by-side preview page
  objects/<kind>/<name>.mjs      one drawable per file (sky, animals, plants, terrain, water, landmarks, buildings, vehicles)
  regions/<name>.mjs             one region per file: palettes per style, landmark layer name, scene(ctx)
  regions/index.mjs              REGIONS registry
examples/                        committed output of `generate.mjs --all --out examples` (seed 7)
docs/                            deep-dive docs for agents (see index below)
```

## Hard rules

- **Zero dependencies.** No npm packages, no bundler, no TypeScript. Node built-ins only; ESM `.mjs`.
- **Determinism.** All randomness goes through `between()` / `random()` from `lib/canvas.mjs`. Never
  `Math.random()`, `Date`, or anything environment-dependent in drawing code. The RNG is one stream per
  render, consumed in **evaluation order**: adding or removing a random call reshuffles everything after
  it (see [`docs/architecture.md`](docs/architecture.md#determinism)).
- **Colours only through the style painter:** `s.paint(color, { accent })` and `s.line(color, width)`.
  Never write `fill=`/`stroke=` with a literal colour in an object, or the object breaks in other styles.
- **Keep the harness contract** (see `SKILL.md` § Contract and [`docs/architecture.md`](docs/architecture.md#the-harness-contract)):
  `scene()` returns an ordered `{ layerName: svg }`; `region.landmark` names a layer; root `<svg>` has
  `data-horizon` + `data-landmark`; sky rect is `data-layer="sky"`; the reduced-motion rule is last in `<style>`;
  `generate.mjs` exports `render()` + `variants()` and only runs its CLI when executed directly.
- **Never loosen `LIMITS`** in `check.mjs` or special-case a region/layer to get a pass. A genuine false
  positive is fixed in the check's logic for the whole class of element, and called out in the summary.
- **Pure CSS motion.** No `<script>`, no SMIL. Must play inside `<img>` and CSS `background-image`.
- **Calm and small.** Each SVG ≈ 15–25 KB; slow, low-amplitude motion. This sits behind content.

## Definition of done

For any change to `template/` or `scripts/`:

1. `node template/generate.mjs --all --out examples`. The committed examples must match the generator.
2. `node scripts/check.mjs --out qa` exits `0` across **all** variants, not just the one you touched.
3. **Look at the stills** (`qa/img/<variant>.still.png`): at least one desktop and one mobile per region
   you changed. The harness checks geometry and timing, not meaning (dashes read as water, blobs as nothing).
4. Refactor that should not change the picture? Diff old vs new output first. The drawing outside
   `<style>` must be byte-identical for the same seed.
5. New object or region? Update the "Existing objects" list in `SKILL.md`, the README if user-visible,
   and [`docs/api-reference.md`](docs/api-reference.md).
6. Changed the contract, a check or a limit? Update `SKILL.md`, `README.md` and [`docs/qa-harness.md`](docs/qa-harness.md) together.

## Gotchas

- `W`, `H`, `HORIZON` are **live `let` bindings** set by `begin()`. Read them inside functions, never
  capture them at module top level (they are `0` at import time).
- `render()` is synchronous and uses module-level state. Don't make objects `async` or render two
  variants concurrently in one process.
- **Line style ignores the colour argument** of `s.line()` and of non-accent `s.paint()`. Everything is
  `ink` on `paper` except `{ accent: true }` fills. Palette keys that only feed those calls are unused in line style.
- Shapes closed along the canvas edge (e.g. Thailand's `beach`, which ends at `x = W`) draw a visible
  outline along that edge in line style. Extend closed shapes past the canvas (`-40 … W+40`) like `groundBand` does.
- Mobile is a separate layout (`ctx.m`), not a crop. Motif scale is `ctx.k` (1.2 on mobile).
- The harness marks sky as magenta `#ff00ff` and the landmark as cyan `#00ffff` with ±40 per-channel
  tolerance. A palette colour near either can cause false findings (see [`docs/qa-harness.md`](docs/qa-harness.md#known-limitations)).
- Australia mobile keeps only **86–87 %** of Uluru visible (needs 85 %). Anything new in its foreground on mobile will likely fail `covered`.
- Don't judge designs with `qlmanage`/Quick Look: no clipping, square crop, no animation. Use the harness stills.

## Docs index

| Doc | Read it when |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | You need the render pipeline, `ctx`, output anatomy, determinism rules |
| [`docs/api-reference.md`](docs/api-reference.md) | You call or write an object/region: signatures, palette keys, animations, RNG cost |
| [`docs/qa-harness.md`](docs/qa-harness.md) | A check fails, or you change `check.mjs`: algorithms, limits, report schema |
| [`docs/cookbook.md`](docs/cookbook.md) | Step-by-step: new region, object, style, format, scene option, fixing each finding |
| [`docs/review.md`](docs/review.md) | Known issues and improvement backlog from the 2026-10-01 project review |
| [`SKILL.md`](SKILL.md) | Runtime workflow Claude follows in a user's project (keep it consistent with the above) |

## Git

Small, focused commits with conventional prefixes (`feat:`, `fix:`, `docs:`, `refactor:`), matching
existing history. Commit regenerated `examples/` in the same commit as the generator change that caused them.
Never commit `qa/` or `dist/`.
