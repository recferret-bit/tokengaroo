// Australia: the Red Centre. Uluru with Kata Tjuta behind, red dunes, spinifex, a ghost gum,
// and a kangaroo hopping across.

import { W, H, HORIZON } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { birds } from '../objects/animals/birds.mjs';
import { kangaroo } from '../objects/animals/kangaroo.mjs';
import { plain } from '../objects/terrain/plain.mjs';
import { karstRange } from '../objects/terrain/karst.mjs';
import { groundBand } from '../objects/terrain/ground-band.mjs';
import { uluru } from '../objects/landmarks/uluru.mjs';
import { spinifexField } from '../objects/plants/spinifex.mjs';
import { ghostGum } from '../objects/plants/ghost-gum.mjs';

export const australia = {
  palettes: {
    flat: {
      skyTop: '#3f8fcf', skyBottom: '#fbd9a6', sun: '#fff6dc', cloud: '#fdf3e3',
      far: '#d99a74', uluru: '#c8532b', uluruShade: '#8f3519',
      plain: '#eeb083', dune1: '#e8995a', dune2: '#d4703a', dune3: '#9c4322',
      dust: '#f3cfa6', spinifex: '#e3c46a', trunk: '#f4ece0', leaf: '#7c9a4e', leafDark: '#5b7a3a',
      animal: '#4a2116', ink: '#3b1d14',
    },
    line: {
      paper: '#fbf3e4', ink: '#3b1d14', sun: '#f4a259', uluru: '#e9a37f', accent: '#c8532b',
    },
  },
  landmark: 'uluru',
  scene(ctx) {
    const { p, m, k } = ctx;
    const depth = H - HORIZON;
    const far = groundBand(ctx, HORIZON + depth * 0.09, 8 * k, p.dune1);
    const mid = groundBand(ctx, HORIZON + depth * 0.39, 8 * k, p.dune2);
    const near = groundBand(ctx, H - depth * 0.39, 30 * k, p.dune3);
    // mobile pushes the gum to the left edge and shortens it so Uluru stays visible
    const treeX = m ? 50 : 220, treeH = (m ? 340 : 420) * k;
    return {
      clouds: clouds(ctx, 3),
      sun: sun(ctx, W * (m ? 0.72 : 0.8), HORIZON - 330 * k, 64 * k),
      birds: birds(ctx, 3),
      // desert floor the rocks stand on; without it the sky shows through under them
      plain: plain(ctx, p.plain),
      // Kata Tjuta domes, hazy, behind Uluru
      kataTjuta: karstRange(ctx, m ? 3 : 6, 70 * k, 125 * k, 110 * k, 170 * k, p.far, W * (m ? 0.62 : 0.66), W * (m ? 1.02 : 0.94)),
      uluru: uluru(ctx, W * 0.42, m ? W * 0.72 : 640, 175 * k),
      duneFar: far.svg,
      duneMid: mid.svg,
      tuftsMid: spinifexField(ctx, mid, m ? 7 : 10, 0.8 * k, 0, W),
      kangaroo: kangaroo(ctx, mid.yAt(W / 2) + 18 * k, k),
      duneNear: near.svg,
      tuftsNear: spinifexField(ctx, near, m ? 10 : 14, 1.2 * k, treeX + 160 * k, W),
      ghostGum: ghostGum(ctx, treeX, near.yAt(treeX) + 20 * k, treeH, k),
    };
  },
};
