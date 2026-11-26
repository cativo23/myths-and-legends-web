# Catalog mockups: three directions

Static HTML mockups of the public catalog for Salvadoran myths and legends, built from `design/visual-brief.md` section (c).

## How to open

Open `design/mockups/index.html` in a browser (double-click, or `xdg-open design/mockups/index.html`). No build or server is needed. Each page is a single self-contained file. The only network request is the Google Fonts stylesheet; without it the pages fall back to system fonts.

## What each page shows

| Direction | Listing | Detail | Idea |
|---|---|---|---|
| Añil | `anil/index.html` | `anil/entity.html` (La Ciguanaba) | Indigo dye bath: the hero and detail header oxidize from green-yellow to indigo; resist-dye (jaspe) feathered edges, woven-band dividers, cloth-swatch cards. |
| Baraja | `baraja/index.html` | `baraja/entity.html` (El Cipitío) | Numbered print-card deck: cards deal in and flip to a Salvadoran "canta" verse; rótulo-style headings, halftone and misregistered ink. |
| Faro | `faro/index.html` | `faro/entity.html` (El Cadejo Blanco) | Night ridge map lit by the Izalco beacon (historical, 1770–1958): parallax ridges, beacon pulse and sweep, lamp-per-entity map, lantern-window cards; a Cadejo eye control switches the page accent between blue (calm) and red (hostile). |

Every listing has search (1–200 characters), filters for kind, category and department, sort by name or date, a result count, an empty state and pagination; filtering runs client-side on the 9 demo cards. Every page has a light and a dark theme (follows the system, with a toggle saved in `localStorage` under `myl-theme`), a reduced-motion path, a skip link and labelled controls.

## Mezcla (combined direction for review)

`mezcla/index.html` (listing) and `mezcla/entity.html` (El Cadejo Blanco) apply the decision in `specs/001-web-frontend/spec.md` (Clarifications, FR-016, FR-020, FR-021, FR-022): a restrained, art-neutral frame where the artists' work and the API data lead.

- **From Añil:** Fraunces display + DM Sans body, the layout, the light theme (undyed cotton `#F6F0E4`, indigo ink `#12203F`) and a faint woven band. No character illustrations.
- **From Faro:** the night palette (`#070B14` family), the pointer-following light and the lantern windows: each work sits whole on a dark mat with a soft glow at the sill. The glow colour comes from the category (Mito blue, Leyenda teal, Tradición ember), and the category name is always written next to it. The hero is type, palette, thread texture and light only.
- **From Baraja:** each entity is a card that flips (button with `aria-pressed`, label "Datos de …") to a back with type, category, departments, short facts and a relation (Ciguanaba "Madre de" Cipitío, Cipitío "Hijo de" Ciguanaba, the Cadejos as enemies). The hidden face is `inert`. With reduced motion the turn becomes a crossfade.
- **Gallery frame:** works keep their own proportion (3:4, 4:3, 1:1, 16:9), never cropped. The cards sit in a masonry grid: CSS grid with 8 px rows, and a `ResizeObserver` gives each card the row span it needs. Placement stays row by row, so tab order follows reading order. Without JS it is a plain grid. Some cards carry a credit line and some don't. La Llorona shows the neutral "Sin imagen todavía" mat.
- **Placeholder works:** nine SVG pieces in deliberately different techniques (watercolour wash, flat colour blocks, linocut, charcoal hatching, photographic gradient with grain, torn-paper collage, digital gradients). They are abstract, tagged "Marcador" and labelled as placeholders for screen readers. None depicts a legend's character.
- **Interaction:** search (1 to 200 characters; a blank submit explains itself), type, category, department and sort, a live count, removable filter chips, an empty state and static pagination. The theme toggle follows the system until used, then stores `myl-theme`. Where View Transitions exist, the new theme opens as a circle from the toggle.

Contrast (WCAG 2.x, computed): light text/bg 14.19, muted/bg 6.73, Mito `#2457B8` 5.91, Leyenda `#0B645B` 6.19, Tradición `#9A3F14` 5.98, field border `#6B7598` 4.00, credit `#B7BFD6` on window `#111A33` 9.38. Dark text/bg 15.50, muted 7.78 (7.14 on surface), Mito `#6EA8FF` 8.16, Leyenda `#3DD6C4` 10.88, Tradición `#FF7A2F` 7.57 (6.94 on surface), field `#8E97AE` 6.74, credit on window 7.50. The "Marcador" tag (80% night over white) is 8.70.

Checked for Mezcla: both pages were screenshotted in headless Brave at 1440 and 390 px in both themes, plus flipped cards with and without reduced motion. An injected script exercised filters, chips, the empty state, blank search, sort, flip/`inert` and the theme toggle, and found no horizontal overflow at 360 px. `node --check` passes on the inline scripts. The Impeccable detector leaves only: Fraunces flagged as overused (pinned by the decision), the thread texture flagged as repeating stripes (deliberate Añil texture at 2–3% alpha), and the flat-colour placeholder flagged as shape-assembled (it is a labelled placeholder). Not checked: the pointer light, hover and the View Transition (they need a real mouse), screen readers, forced-colours rendering, touch devices, Safari and Firefox. The description of La Familia Girola is a generic placeholder: the brief has no source for it.

## Known limits

- Demo data. Descriptions are short paraphrases of the brief's findings; the departments for the Cadejos, the creation dates and the card numbers are invented. Pagination is static (page 2 links back to page 1).
- Every card links to the single detail page of its direction.
- Illustrations are hand-written SVG placeholders for real art; per the brief, final art should be commissioned from (and credited to) Salvadoran illustrators.
- The fonts the brief pins (Fraunces, DM Sans, Space Grotesk, Instrument Serif) are flagged by the Impeccable detector as overused; they were kept because the brief chose them.
- Checked: inline scripts parse (`node --check`), every local link and `#id` reference resolves, the Impeccable detector ran, and the pages were screenshotted in headless Brave (desktop and 390 px, light, dark and reduced motion). Not checked: real screen readers, touch devices, Safari/Firefox, or low-end phone performance of the SVG filters. Interactions (filters, flip, theme toggle, eye control) were not clicked through in a browser.
