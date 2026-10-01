// Row of Georgian terraced houses: brick fronts, sash windows, area railings, chimney stacks on the
// party walls, and the Dublin doors, each painted a different colour under a fanlight. Houses are
// 200 wide and 454 tall at k = 1, from x0 until they pass x1, base at HORIZON + 4. `first` shifts the
// door colours and brick shades so two terraces in one scene don't repeat each other. No RNG.
// Same-coloured parts of every house share one path, which keeps the file small.

import { HORIZON, f } from '../../lib/canvas.mjs';

const box = (x, y, w, h) => `M${x},${y}h${w}v${h}h${-w}Z`;

export function georgianTerrace(ctx, x0, x1, k, first = 0) {
  const { s, p } = ctx;
  const d = { brick: ['', ''], doors: ['', '', '', ''], pot: '', shade: '', stone: '', glass: '', lit: '', bars: '', fan: '', spokes: '', panels: '', rails: '' };
  for (let i = 0; i < Math.ceil((x1 - x0) / (200 * k) - 1e-9); i++) {
    const n = i + first, o = i * 200, dx = o + (n % 2 ? 160 : 40);
    d.brick[n % 2] += box(o - 18, -444, 36, 32) + box(o, -400, 200, 400);
    d.pot += box(o - 12, -454, 9, 10) + box(o + 3, -454, 9, 10);
    d.shade += box(o, -412, 200, 12);
    d.stone += box(o, -404, 200, 6) + `M${dx - 28},-96A28,28 0 0 1 ${dx + 28},-96V-6h-7V-96h-42V-6h-7Z` + box(dx - 32, -6, 64, 6);
    for (const [floor, wy, wh] of [[0, -384, 56], [1, -300, 92], [2, -168, 92]]) {
      for (const bay of [40, 100, 160]) {
        const wx = o + bay;
        if (floor === 2 && wx === dx) continue;
        const r = box(wx - 20, wy, 40, wh);
        if ((n * 3 + floor * 2 + bay / 60) % 5 < 1) d.lit += r; else d.glass += r;
        d.bars += `M${wx},${wy}v${wh}M${wx - 20},${f(wy + wh / 2)}h40`;
        d.stone += box(wx - 24, wy + wh, 48, 5);
      }
    }
    d.fan += `M${dx - 20},-96A20,20 0 0 1 ${dx + 20},-96Z`;
    d.spokes += [30, 60, 90, 120, 150].map((a) => {
      const t = (a * Math.PI) / 180;
      return `M${dx},-96L${f(dx - 20 * Math.cos(t))},${f(-96 - 20 * Math.sin(t))}`;
    }).join('');
    d.doors[n % 4] += box(dx - 21, -96, 42, 90);
    d.panels += `M${dx - 13},-86v30M${dx + 13},-86v30M${dx - 13},-46v30M${dx + 13},-46v30`;
    for (let rx = 4; rx <= 196; rx += 16) if (Math.abs(o + rx - dx) > 32) d.rails += `M${o + rx},0V-40`;
    d.rails += `M${o},-36H${dx - 32}M${dx + 32},-36H${o + 200}`;
  }
  const doors = [p.doorA, p.doorB, p.doorC, p.doorD];
  const path = (pd, attrs) => (pd ? `<path d="${pd}" ${attrs}/>` : '');
  return `
  <g data-rests="ground" transform="translate(${f(x0)} ${f(HORIZON + 4)}) scale(${f(k)})">
    ${path(d.brick[0], s.paint(p.brickC))}${path(d.brick[1], s.paint(p.brickB))}
    ${path(d.pot, s.paint(p.pot))}${path(d.shade, s.paint(p.brickShade))}${path(d.stone, s.paint(p.stone))}
    ${path(d.glass, s.paint(p.glass))}${path(d.lit, s.paint(p.glow, { accent: true }))}${path(d.bars, s.line(p.trim, 3))}
    ${path(d.fan, s.paint(p.glow, { accent: true }))}${path(d.spokes, s.line(p.trim, 1.5))}
    ${d.doors.map((pd, i) => path(pd, s.paint(doors[i], { accent: true }))).join('')}
    ${path(d.panels, s.line(p.ink, 1.5))}${path(d.rails, s.line(p.iron, 2))}
  </g>`;
}
