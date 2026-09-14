# Flow — original Blender sculpture

A separate preview, preserving Signal and the production homepage.

Nine solid, rounded ribbons morph from a folded bundle, through release, into three smooth channels held by metallic clasps. A light passes through the completed flow. The workflow resolves within the first viewport of scrolling; the headline follows.

The actual Blender-exported `assets/ventura-flow.glb` contains 12 meshes and two morph targets per ribbon. The browser uses these shape keys; no per-frame geometry generation or video download is needed. Source and studio renders are in the workspace `outputs/blender-flow/` folder. Rebuild using `build_flow.py` in a separate background Blender process.

- Source: Blender 5.2.1 LTS; original geometry and materials.
- Runtime: existing local Three.js r180.
- Additional loader: official Three.js r180 GLTFLoader and BufferGeometryUtils, with local import paths. Same MIT licence as `../connected-v2/vendor/LICENSE.three.txt`.
- Pure black background; no fog, glow overlays or gradient backgrounds.
- Scroll-driven and reversible; rendering stops when settled or offscreen.
- Reduced motion / short windows / WebGL failure: one static layout and normal scrolling.
- `noindex`: concept preview only.
