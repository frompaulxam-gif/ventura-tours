# Signal Studio — Blender AI consultancy preview

Original Blender assets show a specific service story: business information → AI processing → human approval → action. Includes an enquiry in an envelope, spreadsheet, raised analytics chart, exposed AI processor, review card, completed tasks, reminders and messages. Copy and outputs are an illustrative workflow, not a live execution interface.

The 240svh scroll gathers the clutter into a four-stage workflow. Mobile uses two rows. Rendering is on demand, reversible and pauses offscreen; reduced motion and short viewports show the finished composition without a pinned journey.

The browser loads the actual `assets/ventura-ai-workflow.glb` exported by Blender 5.2.1. Shared materials are merged per asset to reduce draw calls. The editable Blender source and build script are at `outputs/blender-signal/` in the parent workspace. Font geometry uses the local Arial fonts; no font files are distributed in the model.

Uses existing local Three.js r180, environment setup and the official GLTFLoader from the Flow study, under the existing Three.js MIT licence. No background gradients, video or new remote runtime dependencies. Production homepage, Tours and previous studies are unchanged.
