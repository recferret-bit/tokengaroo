// How shapes are painted. Objects never write colours directly: they call
//   s.paint(color, { accent })  for solid shapes
//   s.line(color, width)        for strokes
// so every object works in every style. A style receives the region's palette for that style.

export const STYLES = {
  flat: () => ({
    paint: (c) => `fill="${c}"`,
    line: (c, w = 3) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"`,
    sky: `url(#sky)`,
    water: `url(#water)`,
  }),
  line: (p) => ({
    paint: (c, o = {}) =>
      `fill="${o.accent ? c : p.paper}" stroke="${p.ink}" stroke-width="2.5" stroke-linejoin="round"`,
    line: (_c, w = 2.5) => `fill="none" stroke="${p.ink}" stroke-width="${w}" stroke-linecap="round"`,
    sky: p.paper,
    water: p.paper,
  }),
};
