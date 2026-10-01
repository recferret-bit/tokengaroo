// The Temple Bar pub: red-painted front with white sash windows, window boxes and hanging baskets
// spilling flowers, a black fascia lettered THE TEMPLE BAR, small-paned lit pub windows, and a
// lantern at each corner. Base centre at (x, y), 496 wide (lanterns reach 284 either side) and 424
// tall at k = 1. One path per colour, drawn back to front. No RNG.

import { f } from '../../lib/canvas.mjs';
import { lanterns } from '../street/street-lamp.mjs';
import { lettering, letteringWidth } from '../street/lettering.mjs';
import { useSwing } from '../street/swing.mjs';

const box = (x, y, w, h) => `M${x},${y}h${w}v${h}h${-w}Z`;
const dot = (cx, cy, r) => `M${cx - r},${cy}a${r},${r} 0 1 0 ${2 * r},0a${r},${r} 0 1 0 ${-2 * r},0Z`;
// A row of leafy bumps from x0, n bumps 10 wide, standing on y.
const bush = (x0, y, n) => `M${x0},${y}${'q5,-10 10,0'.repeat(n)}Z`;

export function templeBarPub(ctx, x, y, k) {
  const { s, p } = ctx;
  useSwing(ctx);
  const fl = ['', '', ''];
  let frames = '', glass = '', lit = '', bars = '', sills = '', leaves = '', boxes = '';
  for (const [floor, wy, wh] of [[0, -384, 76], [1, -282, 86]]) {
    for (const [i, wx] of [-165, -55, 55, 165].entries()) {
      const pane = box(wx - 21, wy + 6, 42, wh - 12), by = wy + wh + 6;
      if ((floor * 4 + i) % 3 === 1) lit += pane; else glass += pane;
      frames += box(wx - 27, wy, 54, wh);
      bars += `M${wx},${wy + 6}V${wy + wh - 6}M${wx - 21},${f(wy + wh / 2)}h42`;
      sills += box(wx - 31, wy + wh, 62, 6);
      boxes += box(wx - 28, by, 56, 12);
      leaves += bush(wx - 30, by + 2, 6);
      for (let j = 0; j < 4; j++) fl[(i + j + floor) % 3] += dot(wx - 21 + j * 14, by - 5, 3.5);
    }
  }
  // Hanging baskets between the first-floor windows: chains, a mossy bowl, flowers and trailing leaves.
  let baskets = '';
  for (const [i, bx] of [-110, 0, 110].entries()) {
    baskets += `<g transform="translate(${bx} -290)"><g class="swing">`
      + `<path d="M-12,12L0,0L12,12" ${s.line(p.iron, 1.5)}/>`
      + `<path d="${bush(-18, 13, 3)}${bush(-10, 34, 2)}" ${s.paint(p.leaf)}/>`
      + `<path d="M-16,12A16,13 0 0 0 16,12Z" ${s.paint(p.moss)}/>`
      + `<path d="${dot(-11, 7, 3.5)}${dot(0, 4, 3.5)}${dot(11, 7, 3.5)}" ${s.paint([p.flowerA, p.flowerB, p.flowerC][i], { accent: true })}/>`
      + `</g></g>`;
  }
  const sign = 'THE TEMPLE BAR';
  let panes = '', risers = '';
  for (const [a, b] of [[-224, -56], [56, 224]]) {
    for (let j = 1; j < 4; j++) panes += `M${a + ((b - a) * j) / 4},-118V-26`;
    panes += `M${a},-90H${b}`;
    risers += box(a + 6, -20, b - a - 12, 14);
  }
  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <path d="${box(-240, -424, 480, 424)}" ${s.paint(p.pub, { accent: true })}/>
    <path d="${box(-248, -406, 496, 10)}${sills}" ${s.paint(p.trim)}/>
    <path d="${frames}" ${s.paint(p.trim)}/>
    <path d="${glass}" ${s.paint(p.glass)}/>
    <path d="${lit}" ${s.paint(p.glow, { accent: true })}/>
    <path d="${bars}" ${s.line(p.trim, 3)}/>
    <path d="${leaves}" ${s.paint(p.leaf)}/>
    ${fl.map((d, i) => `<path d="${d}" ${s.paint([p.flowerA, p.flowerB, p.flowerC][i], { accent: true })}/>`).join('')}
    <path d="${boxes}" ${s.paint(p.pubShade)}/>
    <path d="${box(-240, -128, 480, 128)}${box(-246, -176, 492, 48)}" ${s.paint(p.pubDark)}/>
    <path d="${box(-238, -172, 476, 40)}${risers}" ${s.line(p.letter, 1.5)}/>
    <path d="${lettering(sign, -letteringWidth(sign) / 2, -163)}" ${s.line(p.letter, 3)}/>
    <path d="${box(-224, -118, 168, 92)}${box(56, -118, 168, 92)}" ${s.paint(p.glow, { accent: true })}/>
    <path d="${panes}" ${s.line(p.pubDark, 3)}/>
    <path d="${box(-38, -118, 76, 114)}" ${s.paint(p.pub, { accent: true })}/>
    <path d="${box(-30, -108, 26, 50)}${box(4, -108, 26, 50)}" ${s.paint(p.glow, { accent: true })}/>
    <path d="M0,-118V-4" ${s.line(p.pubDark, 2)}/>
    <path d="${box(-46, -4, 92, 4)}" ${s.paint(p.stone)}/>
    <path d="M240,-206h18v6M-240,-206h-18v6" ${s.line(p.iron, 3)}/>
    ${lanterns(ctx, [[-258, -200], [258, -200]])}
    ${baskets}
  </g>`;
}
