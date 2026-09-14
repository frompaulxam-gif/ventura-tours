# Scattered to connected — study 02

A standalone refinement of the first Ventura Solutions animation concept. The production homepage and Tours site are unaffected.

## Assets

`assets.js` builds six original, reusable Three.js groups: a folded envelope with an enquiry letter, layered project documents with a metal paper clip, a task list, an interwoven metal AI sculpture, a human approval card with a raised seal, and a folded paper plane with a sent receipt. Paper faces, lettering, document marks and task details are drawn locally into canvas textures. There are no stock images or externally loaded model assets.

The meshes are built once. `motion.js` moves them along reversible, scroll-driven curved paths using quaternion interpolation and time-based smoothing. It renders only while progress is changing, on resize, or after a visibility change. Geometry is not recreated for each frame. Pixel count is capped at 1.2 million, DPR at 1.7. Reduced-motion preferences, compact screens and rendering failures use a static layout with the full explanatory content available below.

## Preview

Serve the repository root with a static HTTP server and visit `/concepts/connected-v2/`. No build step is needed. Three.js 0.180.0 is pinned and served locally in `vendor/`; its MIT licence is included. Only the shared Google Fonts are fetched externally.

Blender was not used or installed. Models remain procedural source meshes in `assets.js`; this is not a `.blend` or exported `.glb` asset pack.
