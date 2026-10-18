# TikTok edit 9

Lightskin video review at https://venturasolutions.co.uk/tiktokedit9/.

Eight original 2160 × 3840, 60 fps videos, with audio and natural Rec.709 colour. Original MP4s are GitHub release assets under `tiktokedit9-media-2026-10-17`; they are not transcoded. Full resolution frames and smaller display previews were extracted from the actual edits.

The page saves every choice and independent comment in browser storage and the dedicated `tiktokedit9-review` Cloudflare Worker / `tiktokedit9-feedback` D1 database. Send answers makes that review appear on the saved answers page. Feedback is per reviewer and round, with source filenames, source timing, cut timing and exact frame boundaries. End frames are exclusive. The page is public and unlisted, with search indexing discouraged.

The maintained source is this folder inside `/Users/paulventura/Websites/Ventura`. The original local board and its feedback remain in the 13 October Lightskin task. Do not copy the full portfolio or replace older rounds. Add a new manifest and media release for revised videos, and add the manifest to the Worker round map and round selector.

The API is at https://tiktokedit9-review.raspy-waterfall-454f.workers.dev. Worker source and D1 schema are in `api/`. Deploy the API with Wrangler from that directory. No credentials are stored in this source. The public review supports public feedback; do not put private information in comments.

Export online feedback at `/api/feedback?round=round-01` on the API. The task's `outputs/review/sync_online_feedback.py` saves this export locally for the next edit. Video downloads retain the original uploaded bytes.
