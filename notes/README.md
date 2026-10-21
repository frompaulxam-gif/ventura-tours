# Jarvis Notes capture

Public shell: https://venturasolutions.co.uk/notes/. Private notes and original recordings are stored in local IndexedDB and, after email verification, uploaded automatically to the owner’s Cloudflare D1 database. No private notes or credentials are bundled in the website.

The allowed email is verified through Cloudflare Access One-time PIN. The login Worker validates Access’s signed JWT, issuer, audience and owner email. A one-use, two-minute code with a device-held proof key creates a 30-day hashed server session. The API requires that session for all note and audio reads/writes. Public shell availability does not expose note data.

Plain text uses native Enter/newlines. Each London calendar day has a separate page; saved entries remain separate sections within it. Drafts autosave after typing pauses. Text and stopped original audio upload together; incomplete recordings are never acknowledged as saved online. Online status only appears after server acknowledgement. Offline changes remain locally queued and retry when the app is open and connected. iOS background uploading is not guaranteed.

Local Web Locks prevent simultaneous capture windows sharing draft slots. Recording checkpoints survive interruption where browser storage permits; users must stop recording and wait for the voice-attached message before leaving. A failed upload retains the local data. Server versions prevent silent overwrites from another device; a conflict keeps both versions for an inline choice and allows unrelated notes to keep uploading.

The service worker caches only the /notes/ shell. Safari and a Home Screen installation may have separate local storage and require separate email verification. Existing local notes upload after that surface signs in. Export backup includes text and original audio, never session credentials; keep the file private. There is no in-app backup restore yet.

No transcription, task creation or AI execution is triggered by saving. This is capture storage, not a live Jarvis agent integration. Real iPhone microphone, Action button and Home Screen testing must be performed on the phone.

Backend source is in _services/jarvis-notes. D1 stores immutable, SHA-256-verified audio chunks of 1 MiB, with a 25 MiB per-recording cap. Keep website deployment scoped to notes/: the maintained repository contains unrelated concurrent changes and divergent unpublished commits.
