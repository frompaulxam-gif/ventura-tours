# Three ways to clarity

Three isolated scroll-layout studies using the existing custom objects from `../connected-v2/assets.js` and its pinned local Three.js runtime. There are no new dependencies or duplicated model files. The production homepage and Tours site are unchanged.

- `?variation=mind` — clutter gathers into one calm sculpture, which rises above a centred headline.
- `?variation=signal` — charts and data sort into rows, then resolve into three aligned steps; text appears below.
- `?variation=connected` — four pieces assemble into a workflow and shift to the right of the text on desktop, or above it on mobile.

The selector preserves scroll progress for direct comparison. Each replay button returns to the start of the chosen direction. Query strings provide direct links; no votes are submitted or recorded.

All scene states are computed from scroll progress, including reversed scroll and early input. Models and textures are built once. Rendering stops when settled or off-screen. Reduced motion, short viewports and WebGL failures use the final static composition and ordinary page scrolling. The page background is always pure black.

Serve the repository root and open `/concepts/clarity/`; no build step is needed.
