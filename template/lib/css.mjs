// Objects register the CSS their animation needs while they draw; render() emits each block once,
// so a picture carries only the keyframes of the objects it actually uses.
// Use one key per block. Objects sharing a motion import the same helper (see plants/sway.mjs).

export function useCss(ctx, key, css) {
  if (!ctx.css.has(key)) ctx.css.set(key, css);
}
