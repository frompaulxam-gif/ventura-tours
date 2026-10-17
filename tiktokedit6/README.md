# TikTok edit 6

Aston Martin review: 8 edits, 75 ordered clip thumbnails, original 4k60 downloads and H.264 playback copies. Whole-video and per-clip likes/dislikes are independent from comments. Review rounds and browser autosaves are preserved.

Media release: `tiktokedit6-media-2026-10-18` in `frompaulxam-gif/ventura-tours`. There are 14 distinct video files. Playback 7 and 8 reuse the identical original downloads. No video files are committed to the website repository.

Online feedback: `https://ventura-tiktokedit6-feedback.raspy-waterfall-454f.workers.dev`. Service source is `_services/tiktokedit6/feedback`; D1 database is `tiktokedit6-feedback`. Drafts use a browser-specific reviewer ID. Saved answers can be revised without creating duplicate rows for that reviewer. The service exports complete source filenames and source/timeline cut timings at `/api/feedback?round=round-01`.

Local originals and feedback remain in `/Users/paulventura/Documents/Codex/2026-10-13/i-need-you-to-edit-for/outputs/review`. The task's `outputs/download_online_feedback.py` snapshots online feedback into separate dated files for the next edit. Never overwrite an existing round when publishing revisions; add a new round to the registry and the feedback service's manifest map.

Live page: https://venturasolutions.co.uk/tiktokedit6/

The fourteen release assets were verified against source file sizes and SHA256 digests, with public MP4 byte ranges checked before publication. Source feedback remains in the local original review; online feedback snapshots are stored separately by the task's download script.

The earlier chunk-based media-service files in `_services/tiktokedit6/media` are unused preparation and should not be deployed. Do not rerun the initial `work/prepare_publish.py`, which predates the release-media approach.
