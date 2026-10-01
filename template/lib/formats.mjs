// Canvas shapes. k scales motifs, since a phone shows the image much smaller than a monitor does.
// Scenes branch on ctx.m (true on mobile) for layout.

export const FORMATS = {
  desktop: { w: 1600, h: 900, horizon: 620, k: 1 },
  mobile: { w: 900, h: 1600, horizon: 1040, k: 1.2 },
};
