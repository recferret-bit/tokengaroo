// Victorian bookshop in a Georgian brick building: bottle-green shopfront under a gilt BOOKS fascia,
// lit display windows stacked with books, a glazed door, two wall lanterns, window boxes in flower,
// and a hanging sign that swings gently from its bracket. Base centre at (x, y), 528 wide (plus the
// sign, 322 right of centre) and 508 tall at k = 1. Parts are drawn back to front, one path per
// colour, which keeps the file small.

import { between, f } from '../../lib/canvas.mjs';
import { lanterns } from '../street/street-lamp.mjs';
import { lettering } from '../street/lettering.mjs';
import { useSwing } from '../street/swing.mjs';

const dot = (cx, cy, r) => `M${cx - r},${cy}a${r},${r} 0 1 0 ${2 * r},0a${r},${r} 0 1 0 ${-2 * r},0Z`;
const box = (x, y, w, h) => `M${x},${y}h${w}v${h}h${-w}Z`;

// Books standing side by side on a shelf from x0 to x1, leaving the skip range free. 3 RNG per book.
function shelf(books, x0, x1, base, hMax, skip) {
  for (let x = x0; ;) {
    if (skip && x + 11 > skip[0] && x < skip[1]) { x = skip[1]; continue; }
    const w = Math.round(between(6, 11));
    if (x + w > x1) break;
    const h = Math.round(between(18, hMax)), c = Math.floor(between(0, 5));
    books[c] += `M${x},${base}h${w}v${-h}h${-w}Z`;
    x += w + 1;
  }
}

export function bookshop(ctx, x, y, k) {
  const { s, p } = ctx;
  useSwing(ctx);

  // Upper floors: brick front with stone quoins, two floors of sash windows, window boxes in flower.
  let stone = box(-262, -452, 524, 10), shade = box(-195, -498, 50, 6) + box(145, -498, 50, 6);
  let frames = '', glass = '', lit = '', bars = '', leaves = '', flowers = '', green = '';
  for (let i = 0, qy = -444; qy < -206; i++, qy += 21) {
    const w = i % 2 ? 16 : 26;
    stone += box(-250, qy, w, 20) + box(250 - w, qy, w, 20);
  }
  for (const [floor, wy, wh] of [[0, -430, 64], [1, -340, 100]]) {
    for (const [i, wx] of [-150, 0, 150].entries()) {
      const pane = box(wx - 24, wy + 6, 48, wh - 12);
      if ((floor === 0 && i === 2) || (floor === 1 && i === 1)) lit += pane; else glass += pane;
      shade += box(wx - 36, wy - 10, 72, 10);
      frames += box(wx - 30, wy, 60, wh);
      bars += `M${wx},${wy + 6}V${wy + wh - 6}M${wx - 24},${f(wy + wh / 3)}h48M${wx - 24},${f(wy + (2 * wh) / 3)}h48`;
      stone += box(wx - 34, wy + wh, 68, 6);
      if (floor === 1) {
        for (let fx = wx - 22; fx <= wx + 22; fx += 11) { leaves += dot(fx, wy + wh + 2, 6); flowers += dot(fx, wy + wh - 1, 4); }
        green += box(wx - 30, wy + wh + 6, 60, 12);
      }
    }
  }

  // Shopfront: display windows with two shelves of books, a stack lying flat in the middle,
  // transom lights on top; pilasters, consoles and a fascia with gilt lettering.
  const books = ['', '', '', '', ''];
  let windows = '', boards = '', stacks = '', dark = box(-264, -206, 528, 10) + box(-264, -196, 16, 44) + box(248, -196, 16, 44);
  let frameLines = '', gilt = box(-238, -188, 476, 30) + 'M-252,-140H-230M230,-140H252M-56,-140H-46M46,-140H56';
  for (const [a, b] of [[-226, -58], [58, 226]]) {
    const mid = (a + b) / 2;
    windows += box(a, -148, b - a, 114);
    boards += box(a + 2, -86, b - a - 4, 4) + box(a + 2, -40, b - a - 4, 6);
    shelf(books, a + 6, b - 6, -86, 34);
    shelf(books, a + 6, b - 6, -40, 36, [mid - 34, mid + 34]);
    stacks += box(mid - 30, -48, 60, 8) + box(mid - 26, -56, 54, 8) + box(mid - 22, -64, 46, 8);
    dark += box(a, -132, b - a, 4);
    for (let j = 1; j < 4; j++) dark += box(a + ((b - a) * j) / 4 - 1.5, -148, 3, 16);
    frameLines += box(a, -148, b - a, 114);
    gilt += box(a + 8, -28, b - a - 16, 18);
  }
  green += box(-256, -198, 512, 198);

  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <path d="M-192,-494h44v26h-44Z M148,-494h44v26h-44Z M-256,-468h512v16h-512Z M-250,-444h500v246h-500Z" ${s.paint(p.brick)}/>
    <path d="${box(-184, -508, 9, 12)}${box(-165, -508, 9, 12)}${box(156, -508, 9, 12)}${box(175, -508, 9, 12)}" ${s.paint(p.pot)}/>
    <path d="${shade}" ${s.paint(p.brickShade)}/>
    <path d="${stone}" ${s.paint(p.stone)}/>
    <path d="${frames}" ${s.paint(p.trim)}/>
    <path d="${glass}" ${s.paint(p.glass)}/>
    <path d="${lit}" ${s.paint(p.glow, { accent: true })}/>
    <path d="${bars}" ${s.line(p.trim, 3)}/>
    <path d="${leaves}" ${s.paint(p.leaf)}/>
    <path d="${flowers}" ${s.paint(p.flower, { accent: true })}/>
    <path d="${green}" ${s.paint(p.shop)}/>
    <path d="M-228,-254h16M-220,-254V-240M212,-254h16M220,-254V-240M250,-300H310M250,-278Q256,-300 270,-300" ${s.line(p.iron, 3)}/>
    ${lanterns(ctx, [[-220, -240], [220, -240]])}
    <path d="${box(-244, -192, 488, 38)}" ${s.paint(p.fascia)}/>
    <path d="${windows}" ${s.paint(p.glow, { accent: true })}/>
    <path d="${boards}" ${s.paint(p.wood)}/>
    ${books.map((d, i) => `<path d="${d}" ${s.paint(p[`book${'ABCDE'[i]}`])}/>`).join('')}
    <path d="${stacks}" ${s.paint(p.bookB)}/>
    <path d="${dark}" ${s.paint(p.shopShade)}/>
    <path d="${frameLines}" ${s.line(p.shopShade, 4)}/>
    <path d="${gilt}" ${s.line(p.gilt, 1.5)}/>
    <path d="${lettering('BOOKS', -55.5, -182, 24)}" ${s.line(p.gilt, 3)}/>
    <path d="${box(-30, -148, 60, 142)}" ${s.paint(p.door, { accent: true })}/>
    <path d="${box(-22, -138, 44, 60)}" ${s.paint(p.glow, { accent: true })}/>
    <path d="M0,-138V-78${box(-22, -66, 18, 50)}${box(4, -66, 18, 50)}" ${s.line(p.shopShade, 2)}/>
    <path d="M-86,-171l6,-6l6,6l-6,6Z M74,-171l6,-6l6,6l-6,6Z${dot(-256, -150, 4)}${dot(256, -150, 4)}${dot(20, -72, 3)}" ${s.paint(p.gilt)}/>
    <path d="${box(-40, -6, 80, 6)}" ${s.paint(p.stone)}/>
    <g transform="translate(300 -300)"><g class="swing">
      <path d="M-14,0V10M14,0V10" ${s.line(p.iron, 2)}/>
      <rect x="-22" y="10" width="44" height="52" rx="3" ${s.paint(p.sign, { accent: true })}/>
      <path d="${box(-18, 14, 36, 44)}" ${s.line(p.gilt, 1.5)}/>
      <path d="M-13,46Q-6,40 0,44Q6,40 13,46V28Q6,22 0,26Q-6,22 -13,28Z" ${s.paint(p.page)}/>
      <path d="M0,26V44" ${s.line(p.gilt, 1.5)}/>
    </g></g>
  </g>`;
}
