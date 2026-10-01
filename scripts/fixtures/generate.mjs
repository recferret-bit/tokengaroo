// Known-bad scenes for selftest.mjs. Each reproduces an artifact the harness must catch; `expect`
// lists the finding kinds every variant of it must produce. A fixture with expect [] is a control
// and must come out clean. Shaped like template/generate.mjs (render + variants), so check.mjs
// runs it with --gen.

import { render as base } from '../../template/generate.mjs';
import { W, H, HORIZON, f } from '../../template/lib/canvas.mjs';
import { REGIONS } from '../../template/regions/index.mjs';
import { water } from '../../template/objects/water/water.mjs';
import { reflectingPool } from '../../template/objects/water/reflecting-pool.mjs';
import { plain } from '../../template/objects/terrain/plain.mjs';
import { uluru } from '../../template/objects/landmarks/uluru.mjs';
import { obelisk } from '../../template/objects/buildings/obelisk.mjs';
import { ferrisWheel } from '../../template/objects/buildings/ferris-wheel.mjs';
import { westminsterPalace } from '../../template/objects/buildings/westminster-palace.mjs';
import { elizabethTower } from '../../template/objects/buildings/elizabeth-tower.mjs';
import { cherryTree } from '../../template/objects/plants/cherry-tree.mjs';
import { doubleDecker } from '../../template/objects/vehicles/double-decker.mjs';
import { longtailBoat } from '../../template/objects/vehicles/longtail-boat.mjs';

// London's first layout: a full-width bridge running along the river (a road floating in the
// water) and the palace and Eye standing straight in the Thames, with no far bank.
function oldBridge(ctx, y, h, span) {
  const { s, p, k } = ctx, yb = y + h, ah = h * 0.62, aw = span * 0.8;
  let d = `M${f(-span)},${f(y)} H${f(W + span)} V${f(yb)} H${f(-span)} Z`;
  for (let ax = -span * 0.6; ax < W + span * 0.2; ax += span) d += ` M${f(ax)},${f(yb)} C${f(ax)},${f(yb - ah)} ${f(ax + aw)},${f(yb - ah)} ${f(ax + aw)},${f(yb)} Z`;
  return `<rect x="${f(-span)}" y="${f(y - 14 * k)}" width="${f(W + 2 * span)}" height="${f(14 * k)}" ${s.paint(p.parapet)}/>`
    + `<path data-surface="ground" d="${d}" fill-rule="evenodd" ${s.paint(p.road)}/>`;
}

export const FIXTURES = {
  'old-london': {
    expect: ['wrong-support', 'causeway'],
    palettes: { flat: REGIONS.london.palettes.flat },
    landmark: 'westminster',
    scene(ctx) {
      const { m, k } = ctx, deckY = HORIZON + (H - HORIZON) * (m ? 0.5 : 0.55), towerX = W * (m ? 0.56 : 0.46);
      return {
        londonEye: ferrisWheel(ctx, W * (m ? 0.86 : 0.8), (m ? 150 : 190) * k, k),
        westminster: westminsterPalace(ctx, W * 0.1, towerX + 46 * k, k) + elizabethTower(ctx, towerX, HORIZON + 4, k),
        thames: water(ctx),
        bridge: oldBridge(ctx, deckY, 64 * k, 220 * k),
        bus: doubleDecker(ctx, deckY, k),
      };
    },
  },
  // Washington's first layout: the left cherry tree's trunk stood in the reflecting pool.
  'tree-in-pool': {
    expect: ['wrong-support'],
    palettes: { flat: REGIONS.washington.palettes.flat },
    landmark: 'monument',
    scene(ctx) {
      const { p, m, k } = ctx, monX = W * (m ? 0.27 : 0.36);
      return {
        lawn: plain(ctx, p.lawn),
        monument: obelisk(ctx, monX, HORIZON + 4, 36 * k, 400 * k),
        pool: reflectingPool(ctx, monX, HORIZON + 16 * k, 150 * k, m ? W * 1.1 : W * 0.75),
        cherries: cherryTree(ctx, m ? 40 : 90, H - 24 * k, 360 * k, k),
      };
    },
  },
  'boat-on-land': {
    expect: ['wrong-support'],
    palettes: { flat: REGIONS.thailand.palettes.flat },
    landmark: 'boat',
    scene(ctx) {
      return { ground: plain(ctx, ctx.p.near), boat: longtailBoat(ctx, W * 0.5, HORIZON + (H - HORIZON) * 0.5, ctx.k) };
    },
  },
  // No ground at all: the sky shows below the horizon and Uluru floats (check 1).
  'floating-rock': {
    expect: ['sky-leak', 'floating'],
    palettes: { flat: REGIONS.australia.palettes.flat },
    landmark: 'uluru',
    scene(ctx) {
      return { uluru: uluru(ctx, W * 0.5, ctx.m ? W * 0.72 : 640, 175 * ctx.k) };
    },
  },
  // Control: the shipped London (far bank + near embankment) must stay clean.
  'london': { ...REGIONS.london, expect: [] },
};

export function render(region, style, format, seed = 7) {
  return base(region, style, format, seed, FIXTURES);
}

export function variants() {
  return Object.keys(FIXTURES).flatMap((region) => ['desktop', 'mobile'].map((format) => ({ region, style: 'flat', format, name: `${region}-flat-${format}` })));
}
