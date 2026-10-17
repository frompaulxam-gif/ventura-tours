# TikTok edit 7

Live review: https://venturasolutions.co.uk/tiktokedit7/

Eight navy stripey edits in each of two preserved rounds, with 54 source cuts per round.
The 2160 × 3840, 60 fps MP4 files are uploaded without re-encoding as release assets
in `tiktokedit7-media-2026-10-17` in this repository. Preserve those assets.

The round manifests include stable video and clip IDs, frame-exact cut boundaries,
source filenames, source in/out times and video SHA-256 hashes. Thumbnails were
extracted from the actual cuts. Local filesystem paths and private feedback are
not part of the published files.

Votes and independent clip, video and overall comments save immediately in the
browser and automatically to the dedicated Cloudflare feedback service. Saved
reviews also appear on the feedback page. Copy and download export all current
feedback and saved snapshots for the selected round. Each browser keeps its own
reviewer ID; the service retains notes for the next edit.

Service source: `_services/tiktokedit7/feedback`. Endpoint:
https://ventura-tiktokedit7-feedback.raspy-waterfall-454f.workers.dev
The read-only `/api/feedback?round=round-01` (or round-02) returns canonical reports
with source filenames and frame-exact timing. `outputs/download_online_feedback.py`
in the editing workspace saves dated local snapshots without replacing old rounds.

All assets are relative to /tiktokedit7/. No build is required. Never overwrite a
round's manifest or media when revising: add a new round, new media asset names and
a distinct localStorage ID, then update rounds.json.
