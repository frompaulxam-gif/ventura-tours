# Ventura Tours

Static website, compatible with the existing GitHub Pages deployment. No build or package installation required. Serve this directory with `python3 -m http.server 4173` and open http://localhost:4173.

## Content to replace

- `index.html`: four client-logo placeholders and two upcoming-project placeholders. Only add approved brands and work that may be shown publicly.
- Featured Skyline Terrace is labelled as a render-based, draggable image concept. It is not a complete 360° tour or a completed client project. Replace the figure with a real tour/embed when supplied.
- Enquiries currently use the existing `hello@venturatours.uk` address with a prefilled subject. Mailbox ownership/delivery is not verified. No form backend is implied.
- Canonical URL currently uses the existing GitHub Pages address. Change it if a custom domain is connected.
- The 48-hour turnaround and fourteen-stop/60-second sample claims were removed because they were unconfirmed. Current copy reflects the requested free photo-based demo offer.

## Stock image

Hero: Clay Banks, “Modern living room with stylish furniture and large windows.”
Source: https://unsplash.com/photos/modern-living-room-with-stylish-furniture-and-large-windows-FL-ZcDK8tMo
Original download: https://images.unsplash.com/photo-1773754532196-014342510e64?auto=format&fit=crop&w=2400&q=85
License: https://unsplash.com/license — free commercial use and modification; attribution appreciated, not required. Selected 11 September 2026.
Stored locally as JPEG and responsive WebP files. Stock photography illustrates the service; it is not presented as client work.

Existing logo and rooftop imagery are preserved from the supplied folder.

## Animation

The arch reveal and circle wipe remain. Wheel, touch-scroll, scrolling keys, a skip button, resize, or a direct section link can complete the intro. Final visual state and the scroll pin are established once, synchronously; there is no delayed reset of the visitor's scroll position. Fonts and hero readiness are capped. Reduced motion, missing animation libraries and disabled JavaScript have a readable static layout.

GSAP 3.13.0 and ScrollTrigger 3.13.0 are vendored under `js/vendor/`, preserving their original license headers. The separate Flip animation was replaced with a tween owned by the intro timeline, so skipping cannot leave a second animation moving the logo.

## Validation

Checked in Chrome: normal opening, early wheel input at three intro stages, mobile skip/navigation, direct section links, panorama keyboard control, stalled hero loading, reduced motion and disabled JavaScript. Browser checks assert a single scroll pin and no lingering page lock or inert content.

Temporary GitHub Pages update requested on 14 September 2026. The previous live version is preserved on `codex/ventura-before-preview-2026-09-14` (commit `c796b8f`). Restore it with a new revert commit rather than rewriting main history.
