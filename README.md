# tokengaroo

**Animated, geometric backgrounds for travel sites, written as code and checked for visual bugs.**

A [Claude Code](https://claude.com/claude-code) skill: say *"do London"* and you get Big Ben, the
Thames and a red bus driving along the embankment. The result is a pair of tiny SVG files (desktop and
mobile) that animate with pure CSS, drop straight into an `<img>` or a CSS background, and have been
through an automated QA pass before you ever see them.

<p align="center">
  <img src="examples/australia-flat-desktop.svg" alt="Australia, flat style, desktop" width="620">
  <img src="examples/australia-flat-mobile.svg" alt="Australia, flat style, mobile" width="174">
</p>

> "do Australia" → Uluru, red dunes, a ghost gum, and a kangaroo that kicks up dust every time it lands.

## Why it exists

A destination page needs a hero image that says *where* at a glance, stays calm behind a headline,
loads instantly on a phone, and looks like it belongs to the same family as every other destination
on the site. The usual options each miss something:

| Option | The catch |
|---|---|
| Stock photo | Hundreds of KB, busy behind text, licensing, never moves, hard to keep a consistent look across 50 cities |
| Video loop | Megabytes, autoplay restrictions on mobile, battery drain, needs a fallback and a reduced-motion story |
| AI-generated image | Every image is a one-off: hard to keep a set consistent, and changing one detail means regenerating it |
| Lottie / JS animation | Needs a JavaScript player on the page; can't be used as a plain CSS background |
| **tokengaroo** | **11–27 KB of SVG**, pure CSS motion, works as `<img>` or `background-image`, a still layout for reduced motion, one consistent style across every region, editable code, and the same seed always gives the same picture |

### Where it fits

- **Destination and city pages** on travel agencies, tour operators, airlines and hotel chains: one background per country or city, all in one visual language.
- **Booking-flow headers.** "Your trip to Moscow" over a scene of Moscow.
- **Travel app splash and onboarding screens**, using the 9:16 mobile layout.
- **Host-city pages** for conferences, events and sports tournaments.
- **Slides, social cards and print** from a still frame (the line style prints especially well).
- **Empty and loading states** that need a little personality but no weight.

## Gallery

Every region comes in two styles (**flat** colour and ink **line**-art) and two formats (desktop
16:9 and mobile 9:16). All of them animate on GitHub too. Open [`examples/index.html`](examples/index.html)
locally to see every variant side by side.

<table>
  <tr><th width="170"></th><th>Flat</th><th>Line</th></tr>
  <tr>
    <td width="170"><b>Thailand</b><br><sub>Phang Nga bay at sunset: karsts, a temple island, a long-tail boat bobbing, palms swaying</sub></td>
    <td><img src="examples/thailand-flat-desktop.svg" alt="Thailand, flat" width="380"></td>
    <td><img src="examples/thailand-line-desktop.svg" alt="Thailand, line" width="380"></td>
  </tr>
  <tr>
    <td width="170"><b>Australia</b><br><sub>The Red Centre: Uluru, Kata Tjuta, spinifex, a hopping kangaroo</sub></td>
    <td><img src="examples/australia-flat-desktop.svg" alt="Australia, flat" width="380"></td>
    <td><img src="examples/australia-line-desktop.svg" alt="Australia, line" width="380"></td>
  </tr>
  <tr>
    <td width="170"><b>London</b><br><sub>Westminster and Big Ben, the London Eye turning, a double-decker on the embankment</sub></td>
    <td><img src="examples/london-flat-desktop.svg" alt="London, flat" width="380"></td>
    <td><img src="examples/london-line-desktop.svg" alt="London, line" width="380"></td>
  </tr>
  <tr>
    <td width="170"><b>Moscow</b><br><sub>Red Square in winter: St Basil's, the Kremlin wall and Spasskaya Tower, falling snow</sub></td>
    <td><img src="examples/moscow-flat-desktop.svg" alt="Moscow, flat" width="380"></td>
    <td><img src="examples/moscow-line-desktop.svg" alt="Moscow, line" width="380"></td>
  </tr>
  <tr>
    <td width="170"><b>Washington, D.C.</b><br><sub>The National Mall in blossom season: the Monument reflected in the pool, the Capitol, drifting petals</sub></td>
    <td><img src="examples/washington-flat-desktop.svg" alt="Washington, D.C., flat" width="380"></td>
    <td><img src="examples/washington-line-desktop.svg" alt="Washington, D.C., line" width="380"></td>
  </tr>
  <tr>
    <td width="170"><b>China</b><br><sub>The Great Wall riding a ridge at dawn, misty ranges, a red sun, a pagoda</sub></td>
    <td><img src="examples/china-flat-desktop.svg" alt="China, flat" width="380"></td>
    <td><img src="examples/china-line-desktop.svg" alt="China, line" width="380"></td>
  </tr>
  <tr>
    <td width="170"><b>Dublin</b><br><sub>Temple Bar at dusk: painted shopfronts, glowing lanterns, swinging flower baskets, a cyclist on the cobbles</sub></td>
    <td><img src="examples/dublin-flat-desktop.svg" alt="Dublin, flat" width="380"></td>
    <td><img src="examples/dublin-line-desktop.svg" alt="Dublin, line" width="380"></td>
  </tr>
</table>

### Mobile is its own layout, not a crop

Fewer elements, more sky for the headline, foreground pushed to the edges so the landmark stays clear.

<p align="center">
  <img src="examples/thailand-flat-mobile.svg" alt="Thailand, flat, mobile" width="110">
  <img src="examples/australia-flat-mobile.svg" alt="Australia, flat, mobile" width="110">
  <img src="examples/london-flat-mobile.svg" alt="London, flat, mobile" width="110">
  <img src="examples/moscow-flat-mobile.svg" alt="Moscow, flat, mobile" width="110">
  <img src="examples/washington-flat-mobile.svg" alt="Washington, D.C., flat, mobile" width="110">
  <img src="examples/china-flat-mobile.svg" alt="China, flat, mobile" width="110">
  <img src="examples/dublin-flat-mobile.svg" alt="Dublin, flat, mobile" width="110">
</p>
<p align="center">
  <img src="examples/thailand-line-mobile.svg" alt="Thailand, line, mobile" width="110">
  <img src="examples/australia-line-mobile.svg" alt="Australia, line, mobile" width="110">
  <img src="examples/london-line-mobile.svg" alt="London, line, mobile" width="110">
  <img src="examples/moscow-line-mobile.svg" alt="Moscow, line, mobile" width="110">
  <img src="examples/washington-line-mobile.svg" alt="Washington, D.C., line, mobile" width="110">
  <img src="examples/china-line-mobile.svg" alt="China, line, mobile" width="110">
  <img src="examples/dublin-line-mobile.svg" alt="Dublin, line, mobile" width="110">
</p>

## Features

- **Code, not pixels.** Each background is a small script: crisp at any size, editable, and
  deterministic (same seed, same picture), so a redesign never quietly changes a page you didn't touch.
- **Pure CSS motion.** No JavaScript, so it plays inside `<img>` and CSS `background-image`. Motion is
  slow and calm because it sits behind content. Under `prefers-reduced-motion` every scene has a
  deliberate still layout: no half-cut clouds, no frozen dust puffs.
- **A style is a switch.** Flat and line-art work for every region at once. Add a style (say, "retro
  poster") and every region gets it.
- **A shared library of objects.** Palms, karsts, onion domes, a Ferris wheel, snowfall, mountain ridges
  and river banks are reused across regions, and new objects drawn for a project are saved back for the next one.
- **Checked before you see it.** A headless-Chrome QA harness looks for the visual bugs that actually
  happened while building these regions (see [below](#the-qa-harness)).
- **Zero dependencies.** Node ≥ 22 and a local Chrome. No `npm install`.

## Install

```sh
git clone https://github.com/recferret-bit/tokengaroo.git
ln -s "$PWD/tokengaroo" ~/.claude/skills/tokengaroo
```

## Use it with Claude Code

Run `/tokengaroo …` or just ask for a region background in plain words:

| You say | What happens |
|---|---|
| `/tokengaroo do Japan, cherry-blossom season` | A new region: landmark, palettes for both styles, desktop and mobile layouts, QA'd |
| "add a moose to the Canada background" | A new object, placed in the scene, motion included |
| "make a night version of London" | A scene option threaded through, with night palettes |
| "retro poster style" | A new style, applied to every region |
| "the tree hides Uluru on mobile" | A layout fix for that format, rechecked |
| "check the backgrounds for visual bugs" | A full QA run with a report and fixes |

Claude works on a copy of the generator in your project, runs the QA harness, reads the evidence
images, fixes what it finds (up to three rounds), looks at the stills itself, and reports back with
the QA table. New objects it draws for you (a moose, a lighthouse) are copied back into this checkout's
`template/objects/` once they pass QA, so later projects can reuse them. They are left uncommitted for you to review.

## Use it without Claude

```sh
node template/generate.mjs --all --out dist           # every region × style × format + dist/index.html
node template/generate.mjs --region london --style line --format mobile --seed 7 > london.svg
node scripts/check.mjs --out qa                       # visual QA → qa/report.md
```

### On a website

As a hero background, with a gradient on top so a headline stays readable:

```css
.hero {
  min-height: 70vh;
  background: linear-gradient(#0000 45%, #0007), url(/bg/london-flat-desktop.svg) center / cover;
}
@media (orientation: portrait) {
  .hero { background-image: linear-gradient(#0000 45%, #0007), url(/bg/london-flat-mobile.svg); }
}
```

Or as a decorative image:

```html
<picture>
  <source media="(orientation: portrait)" srcset="/bg/london-flat-mobile.svg">
  <img src="/bg/london-flat-desktop.svg" alt="" width="1600" height="900" style="width:100%;height:100%;object-fit:cover">
</picture>
```

Each SVG uses `preserveAspectRatio="xMidYMid slice"` (it behaves like `cover`). The QA guarantees
that the landmark stays visible on desktop screens from 16:10 to 21:9 and on phones from 9:20 to 9:16.

## The QA harness

`scripts/check.mjs` drives headless Chrome over the DevTools protocol and runs four checks on every
variant. It writes `report.md` with a fix hint per finding, evidence images with the problem boxed,
and a mid-animation frame of each variant. All 28 variants run in about 6 seconds.

| Check | Catches |
|---|---|
| **grounding** | sky showing below the horizon (reads as a lake); a landmark with sky under its base (it floats) |
| **landmark** | foreground covering the hero landmark (names the layer and %); the landmark cropped on tall phones or ultrawide screens |
| **motion** | loops that jump or flash when they restart; with reduced motion: elements cut by the edge, copies piled on one spot, effects frozen mid-puff |
| **support** | buildings, trees or a bus standing in the water (or a boat on land); things with only sky under them; a road or bank floating in the middle of a river |

Every check exists because the artifact really happened. London's first draft had Big Ben standing
in the Thames and a road floating along the middle of the river. The support check that catches it
then found Washington's cherry tree planted in the reflecting pool.

The checks see geometry and timing, not meaning, so the workflow also makes Claude look at the stills
itself: straight dashes read as water, wavy lines near a rock read as wind, a blobby animal reads as nothing.

`node scripts/selftest.mjs` proves the harness still catches what it should. It runs the checks over
known-bad scenes in `scripts/fixtures/` (London's first layout, the tree in the pool, a boat on dry
land, a floating rock) and a clean control, and fails if anything goes unreported.

## How it's built

```
SKILL.md                    instructions Claude follows: workflow, contract, design rules
scripts/check.mjs           QA harness (one file, zero deps)
scripts/selftest.mjs        proves the harness catches known-bad scenes in scripts/fixtures/
template/                   the generator; copied into a project on first use
  generate.mjs              orchestration: render(), variants(), CLI
  lib/                      canvas + seeded RNG, formats, styles, CSS registry, preview page
  objects/<kind>/<name>.mjs one drawable per file: sky, animals, plants, terrain, water, landmarks, buildings, vehicles, street
  regions/<name>.mjs        one region per file: palettes per style, the landmark layer, scene()
examples/                   output of `node template/generate.mjs --all --out examples`
docs/                       architecture, API reference, QA internals, cookbook, review
```

A region is one file: palettes for each style, the name of its hero layer, and a `scene(ctx)` that
returns its layers back to front. Objects take position and size, paint only through the style's
painter (so they work in every style), and register their own animation CSS. Adding a region is one
file in `regions/` plus any new objects it needs; see [`docs/cookbook.md`](docs/cookbook.md).

## Limits

- **Illustrative, not literal.** Landmarks are simplified silhouettes, and geography is composed for a
  good picture, not mapped.
- **Scenes, not maps or people.** Calm landscapes and skylines with a few moving details. No
  photographic realism, no portraits, no text beyond what a scene paints itself.
- **CSS-animation support required for motion.** Modern browsers animate SVG-as-image. Where
  animation isn't supported, the scene shows at rest.

## Docs

For contributors and AI agents: [`AGENTS.md`](AGENTS.md) (repo contract) ·
[architecture](docs/architecture.md) · [API reference](docs/api-reference.md) ·
[QA harness](docs/qa-harness.md) · [cookbook](docs/cookbook.md) · [review](docs/review.md).
