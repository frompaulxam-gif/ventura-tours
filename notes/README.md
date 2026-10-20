# Jarvis Notes capture

Public static shell at https://venturasolutions.co.uk/notes/, inside the maintained Ventura repository. No private notes, credentials or personal records are bundled or uploaded by this app.

This is device-local capture, NOT the shared Jarvis workspace. Typed notes and original recorded audio stay in IndexedDB. Text drafts also use localStorage. The exported JSON contains text, timestamps, current drafts and base64 audio; keep it private. There is no in-app restore yet.

A Web Lock prevents concurrent capture windows sharing the same draft slots. An idle background window releases its lock; a recording or save finishes first. The visible window reloads the shared draft after acquiring the lock. MediaRecorder writes partial recording checkpoints while active; interrupted audio may be incomplete or unplayable. Users must stop and wait for the saved-draft confirmation before leaving. Original audio and typed text are saved together atomically. No transcription, task creation or AI execution occurs.

The PWA manifest and service worker are scoped to /notes/. The service worker caches the application shell, not remote personal records. Safari and a Home Screen install may have separate storage. Use the same surface, test a note, and export before clearing data. Real iPhone microphone/PWA/Action button testing must be done on the device.

Source review plus browser testing and mocked media failure tests are recorded in the owning Codex task outputs/jarvis-notes-qc.txt. Keep website deployment limited to notes/; the maintained repository has unrelated concurrent changes and divergent unpublished commits.
