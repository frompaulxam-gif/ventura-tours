# Ventura Solutions and Ventura Tours

Static sites hosted together in the existing Ventura GitHub Pages repository.

- Main consultancy: https://venturasolutions.co.uk/
- Virtual tours: https://venturasolutions.co.uk/tours/

The root index.html, css/main stylesheet and js/main.js are the AI consultancy. The independent Tours site and all its assets are under tours/. Relative assets ensure both routes work on the same domain. CNAME belongs at root only.

No package install or build is needed. Run python3 -m http.server 4173 from this directory to preview both routes.

## Email

The proposed hello@venturasolutions.co.uk and tours@venturasolutions.co.uk mailboxes have not been purchased or provisioned. Tours retains its earlier enquiry address until the new mailbox is ready.

## Stock photography

Interior photo by Clay Banks: https://unsplash.com/photos/modern-living-room-with-stylish-furniture-and-large-windows-FL-ZcDK8tMo under https://unsplash.com/license. Existing rooftop render concepts are labelled as concepts, not completed client work.

## Restore points

The original site is on codex/ventura-before-preview-2026-09-14. The Tours-only custom-subdomain version is commit c38248f. Use a new revert commit to restore rather than rewriting main history.
