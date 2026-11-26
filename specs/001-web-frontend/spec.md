# Feature Specification: Myths and Legends web frontend

**Feature Branch**: `docs/web-frontend-spec` (spec directory is independent of branch name)

**Created**: 2026-11-25

**Status**: Clarified (visual direction approved 2026-11-26)

**Input**: User description: "Web frontend for The API of Myths and Legends: a public catalog of mythological entities plus an admin panel to load and maintain the data. Separate repository from the API (roadmap Phase 2, sessions 2.1 to 2.8)."

## Investigation (2026-11-25)

Facts verified against the API repository (`myths-and-legends-api`, `develop` at 66609d0):

- The API's real data model is Salvadoran folklore: categories are MYTH, LEGEND and TRADITION; entity types are CHARACTER, PLACE, OBJECT, GROUP and EVENT; locations are Salvadoran departments; seed entities include La Ciguanaba, El Cipitillo (El Cipitío), El Cadejo Blanco and Negro, Volcán Izalco, La Llorona, El Duende, La Familia Girola, La Carreta Chillona, El Justo Juez de la Noche and Laguna de Olomega. The API's OpenAPI examples and descriptions still mention Egyptian, Greek and Norse mythologies; they are stale and must not guide the UI.
- Public reads exist for entities (paginated list with filters by entity type and category, sort by id/name/created_at, page size up to 100), entity search (`q`, 1 to 200 characters, over name, description and origin), entity detail with nested relations, categories, entity types, locations and sources. All writes are superuser-only.
- The entity list has **no filter by country**, and `Country` has no relations to entities (API roadmap risk 14). A country-based catalog view is therefore out of scope until the API models it.
- Login returns `access_token`, `refresh_token` and `expires_at` in the JSON body; the API never sets cookies. The refresh token is single-use, rotated, stored hashed, and there is one session per user: a second login kills the first session's refresh token, and reusing a rotated token returns 401.
- There is no user registration endpoint. Admin accounts are created outside the UI.
- Two open API findings from session 1.6 affect any client: (16) a 429 has two body shapes, `{"error": ...}` for the default limit and `{"detail": {"message", "type", "retry_after"}}` for per-route limits; (17) entity detail lists symmetric relations (SIBLINGS, ALLIES, ENEMIES) twice, once as origin and once as destination.

## Clarifications

### Session 2026-11-25 (Carlos)

- Q: Same repository as the API or separate? → A: **Separate repository** (`myths-and-legends-web`), with its own CI, constitution, Spec Kit setup, versioning and GitHub tags. No frontend code is created in the API repository.
- Q: Who holds the admin session credentials so page scripts cannot read them? → A: A thin server layer inside the frontend project keeps the credentials in `httpOnly`, `Secure`, `SameSite` cookies and forwards admin calls to the API. The API does not change and does not set cookies. This layer holds no business logic and no database.
- Q: Scope of v1? → A: As in the roadmap, with equal weight: the public catalog first (2.3), then login and the admin panel (2.4 to 2.6). No user registration, no country-based catalog view, no extras (relationship graph, favorites, i18n).
- Q: Own constitution? → A: Yes. Same three principles as the API (Test-First, Security-First, Minimalism) plus frontend-specific ones: the API client is generated from the OpenAPI document and never edited by hand, accessibility is a testable requirement, and API errors go through one single layer. Conventional commits as in the API.
- Q: Visual direction? → A: Second round of mockups (research brief `design/visual-brief.md`: Añil, Baraja, Faro) reviewed by Carlos. Constraint he added: the API structure is fixed and the artwork will be made by Salvadoran artists in any style, so the site must be a **restrained, art-neutral frame** where the artists' work and the API's information are the protagonists; no illustrations baked into the interface and no layout that depends on one art style. **Approved by Carlos on 2026-11-26: the combined mockup "Mezcla" (`design/mockups/mezcla/`) is the base visual direction.** Chosen as a **combination**: typography and layout of Añil (Fraunces + DM Sans); from Faro the dark palette, the pointer-following light and lantern-window cards; from Baraja the card format and flipping a card to see its data. Dropped: the illustrated map hero (too custom), baked-in character illustrations, and Baraja's print look. Images use a **neutral gallery frame** (each work keeps its own proportion on a neutral ground, never cropped, artist credit under it). Light theme: undyed-cotton light theme from Añil (assumption, confirm in the plan). Cadejo eye-color accent: kept as an idea but the API has no data to drive it, so the default accent comes from the entity category and the Cadejo idea is decided in the plan.
- Q: Accessibility and themes? → A: WCAG 2.1 AA with light and dark themes that follow the system preference, and reduced motion respected.
- Q: How are the two API findings (429 shapes, duplicated symmetric relations) handled? → A: **The API must fix them first.** They are decided in API session 1.7 (API freeze), before frontend session 2.3 starts. The frontend does not carry an adapter for either. If 1.7 decides to keep either behavior, this spec is amended before 2.3.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and find entities (Priority: P1)

A visitor with no account opens the site and explores the catalog of Salvadoran myths and legends: a paginated list they can filter by kind (character, place, object, group, event) and by category (myth, legend, tradition), sort, and search by a free-text term.

**Why this priority**: it is the public face of the project and delivers value with no login and no write path.

**Independent Test**: with the API running and seeded, open the list, filter by one kind and one category, change the sort order, move between pages, and search for a known name; each step shows the expected entities.

**Acceptance Scenarios**:

1. **Given** the catalog has more entities than one page, **When** a visitor opens the list, **Then** they see the first page and can reach the others, and the current page, filters and sort are reflected in the address so the view can be shared and reloaded.
2. **Given** a visitor selects a kind and a category, **When** the list reloads, **Then** only matching entities appear and the active filters are visible and removable.
3. **Given** a visitor types a search term, **When** they submit it, **Then** matching entities appear, or a clear "no results" message with a way to clear the search.
4. **Given** a visitor types an empty or over-long search term, **When** they submit, **Then** they see a plain explanation instead of an error screen.

---

### User Story 2 - Read an entity and follow its relations (Priority: P1)

A visitor opens an entity and reads its image, description, category, kind, characteristics, locations (by department), sources and relations to other entities, and can jump to a related entity.

**Why this priority**: the relations are what makes this catalog more than a list; it completes the public read journey.

**Independent Test**: open an entity that has relations of each kind, check that every field renders, and follow a relation to the other entity and back.

**Acceptance Scenarios**:

1. **Given** an entity with relations, **When** a visitor opens it, **Then** relations are grouped by type and each related entity is a link to its own page.
2. **Given** a symmetric relation (sibling, ally, enemy), **When** the entity is shown, **Then** each related entity appears exactly once.
3. **Given** an entity without image, relations, locations or sources, **When** it is opened, **Then** the page renders without empty sections or broken images.
4. **Given** an entity id that does not exist, **When** a visitor opens it, **Then** they see a clear "not found" page with a way back to the catalog.

---

### User Story 3 - Admin signs in and out securely (Priority: P2)

An administrator signs in with email and password to reach the admin panel, stays signed in while they work, and signs out. Non-admins and anonymous visitors cannot reach any admin screen.

**Why this priority**: every admin capability depends on it, and it carries the main security requirement of the project.

**Independent Test**: sign in as an admin and reach the panel; sign in as a non-admin and be refused; visit an admin address while anonymous and be sent to sign-in; sign out and confirm the panel is no longer reachable.

**Acceptance Scenarios**:

1. **Given** valid admin credentials, **When** the administrator signs in, **Then** they reach the panel and no credential is readable by scripts running in the page.
2. **Given** wrong credentials, **When** they sign in, **Then** they see a generic failure message that does not reveal which field was wrong.
3. **Given** a signed-in administrator whose short-lived credential expired, **When** they take an action, **Then** the session renews transparently and the action completes without losing form data.
4. **Given** two tabs acting at the same moment when the credential expires, **When** both need to renew, **Then** neither tab is signed out by the other (the API's refresh credential is single-use).
5. **Given** the same account signs in elsewhere (the API allows one session per user), **When** the first session next renews, **Then** the administrator is sent to sign-in with a message that the session ended.
6. **Given** an authenticated non-admin account, **When** it opens an admin address, **Then** access is denied.
7. **Given** an administrator signs out, **When** they press back or open an admin address, **Then** they are asked to sign in again.
8. **Given** the API answers "too many attempts", **When** they sign in, **Then** they see how long to wait.

---

### User Story 4 - Admin manages entities and countries, with images (Priority: P2)

An administrator creates, edits and deletes entities (including their image) and countries from the panel, with validation and clear success and error feedback.

**Why this priority**: entities are the core data; this is the reason the panel exists.

**Independent Test**: create an entity with an image, find it in the public catalog, edit it, delete it, and confirm it is gone; repeat for a country.

**Acceptance Scenarios**:

1. **Given** the entity form, **When** the administrator submits invalid data, **Then** each problem is shown next to its field and nothing is saved.
2. **Given** a name that already exists, **When** they save, **Then** they are told the name is taken (the API answers conflict) and keep their input.
3. **Given** an image file, **When** they attach it, **Then** they see a preview, and an unsupported or too large file is rejected before upload with a clear reason.
4. **Given** an entity or country is deleted, **When** the administrator confirms, **Then** it disappears from admin and public views; deletion always asks for confirmation.

---

### User Story 5 - Admin manages reference data and relations (Priority: P3)

An administrator manages categories, entity types, locations and sources, and creates or removes relations between entities (the API stores symmetric relations as a pair and deletes both rows).

**Why this priority**: reference data and relations are needed for complete entities, but entities are usable first with seeded reference data.

**Independent Test**: create a category and a source, use them on an entity, create a symmetric relation between two entities and check both ends show it once, then delete it and check it is gone from both.

**Acceptance Scenarios**:

1. **Given** two entities, **When** the administrator creates a relation of a symmetric type, **Then** both entities show it once.
2. **Given** a relation exists, **When** the administrator deletes it from either end, **Then** it disappears from both ends.
3. **Given** a category, entity type or source in use, **When** it is edited, **Then** public pages reflect the change; cached reference data may take up to the API cache window to refresh, and the admin is told so.

---

### User Story 6 - Public documentation and fair use (Priority: P3)

A visitor reads the API documentation in the site's own visual style and a page explaining fair use of the data and the API (roadmap 2.7).

**Why this priority**: it completes the public surface but depends on the API's fair-use text from API session 1.7.

**Independent Test**: open the documentation and fair-use pages from the navigation, in light and dark themes, using only the keyboard.

**Acceptance Scenarios**:

1. **Given** the documentation page, **When** a visitor opens it, **Then** it lists the public endpoints and is generated from the API's current OpenAPI document, so it cannot drift from it.
2. **Given** the fair-use page, **When** a visitor opens it, **Then** it states the same terms as the API documentation.

---

### Edge Cases

- The API is down or slow: public pages show a friendly error with a retry action; admin forms keep user input.
- The API answers "too many requests" on any call: the user sees a wait message with the retry time when the API provides one.
- A session ends mid-edit: the administrator is sent to sign-in and, after signing in again, returns to where they were.
- An entity is deleted by one administrator while another is editing it: the editor sees "no longer exists" and no partial state.
- Very long names or descriptions, missing images, and entities with dozens of relations render without breaking the layout, including on a phone.
- Text with markup characters in names or descriptions is shown as plain text and never interpreted.
- JavaScript disabled or slow: public catalog pages remain readable (content is available on first load).
- A deep link to a filtered, paginated list or to an entity works on a cold load.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Visitors MUST be able to list entities with pagination, filter by kind and category, sort by name, id or creation date in both directions, and have that view reflected in the address.
- **FR-002**: Visitors MUST be able to search entities by free text (1 to 200 characters) and see matches or a "no results" state.
- **FR-003**: Visitors MUST be able to open an entity and see its image, description, category, kind, characteristics, locations, sources and relations, with each relation linking to the related entity.
- **FR-004**: Symmetric relations MUST be shown once per related entity.
- **FR-005**: Administrators MUST be able to sign in with email and password and sign out.
- **FR-006**: Session credentials MUST NOT be readable by scripts running in the page and MUST NOT be kept in browser storage or in the page bundle.
- **FR-007**: The session MUST renew transparently when it expires, MUST serialize concurrent renewals so that simultaneous tabs do not invalidate each other, and MUST end cleanly when the API reports the session is over.
- **FR-008**: All admin screens MUST be unreachable to anonymous visitors and to non-admin accounts, and every admin write MUST be performed with the administrator's own session.
- **FR-009**: Administrators MUST be able to create, edit and delete entities (with image upload), countries, categories, entity types, locations and sources.
- **FR-010**: Administrators MUST be able to create and delete relations between entities.
- **FR-011**: Every form MUST validate input before sending, show problems next to the field, and show the API's validation and conflict responses in the same place; destructive actions MUST ask for confirmation.
- **FR-012**: All API errors (validation, conflict, not found, forbidden, rate limit, server error, network) MUST be presented to users through one single error-handling layer with consistent, non-technical messages that do not expose internal details.
- **FR-013**: The API client MUST be generated from the API's OpenAPI document, MUST NOT be edited by hand, and a check MUST fail when the generated client differs from the committed snapshot of that document.
- **FR-014**: The interface MUST meet WCAG 2.1 AA (contrast, keyboard operation, visible focus, text alternatives, form labels and errors, reduced motion) and MUST offer light and dark themes following the system preference.
- **FR-015**: The site MUST be usable from phone width upward.
- **FR-016**: The visual identity MUST be an art-neutral frame (see Clarifications): palette, typography and texture give identity, and no entity-specific illustration is part of the interface. The approved base is the "Mezcla" mockup (`design/mockups/mezcla/`); the earlier Añil, Baraja and Faro mockups stay only as the record of the exploration.
- **FR-020**: Entity images MUST be shown whole, in their own proportion (portrait, landscape or square) on a neutral ground, never cropped or restyled, and the layout MUST hold for any art style; an entity without image shows a neutral placeholder that is not an illustration.
- **FR-021**: Each list card MUST be able to show the entity's key data on its back (flip) without leaving the list, with a keyboard-operable control and a no-motion alternative.
- **FR-022**: A pointer-following light effect MAY highlight the content under the cursor; it MUST be disabled on touch, with reduced motion, and in forced-colors, and MUST NOT carry information.
- **FR-017**: The public documentation page MUST be generated from the API's current OpenAPI document, and a fair-use page MUST state the same terms as the API's own documentation.
- **FR-018**: The frontend MUST NOT start session 2.3 against the API until API session 1.7 has decided the 429 body shape and the duplicated symmetric relations (see Clarifications).
- **FR-019**: Secrets and the API base address MUST come from environment configuration; none is committed.

### Key Entities *(include if feature involves data)*

- **Entity**: a Salvadoran myth or legend subject (for example La Ciguanaba, El Cipitío, El Cadejo, a volcano or a lagoon), with name, alternative names, description, origin, image, category (myth, legend, tradition), kind (character, place, object, group, event), characteristics, locations by department, sources and relations.
- **Relation**: a typed link between two entities; symmetric types (sibling, ally, enemy) are one logical link stored as a pair by the API.
- **Reference data**: categories, entity types, locations and sources; read publicly, written by administrators.
- **Country**: a country record managed by administrators; not linked to entities in the API today.
- **Admin session**: the signed-in administrator's state, with a short-lived credential and a single-use renewal credential, one active session per account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor finds a named entity through search or filters and opens it in under 30 seconds without instructions.
- **SC-002**: The main public pages show their main content in under 2.5 seconds on a mid-range phone over a typical mobile connection (largest content paint at the 75th percentile).
- **SC-003**: An administrator creates a complete entity (fields, image, one relation) in under 3 minutes.
- **SC-004**: Automated accessibility checks report zero serious or critical violations on every public and admin page, in both themes; the full public and admin journeys can be completed with the keyboard alone.
- **SC-005**: A script injected into a page cannot read any session credential (verified by an automated test).
- **SC-006**: Two tabs renewing an expired session at the same moment both stay signed in in 100% of automated runs.
- **SC-007**: Every API error category listed in FR-012 produces a user-facing message in automated tests, with no raw API payload shown.
- **SC-008**: The check from FR-013 fails in CI when the API document changes without regenerating the client.

## Assumptions

- The API is the source of truth and is reachable at a configured address; its contract is frozen at API release `v0.2.0` (session 1.7) before this feature's catalog work starts.
- Admin accounts already exist (created outside the UI); there is no sign-up, password change or user management screen in v1. Password recovery is out of scope for v1 and may be added later.
- The public catalog is keyless and read-only, protected by the API's own rate limits.
- The catalog is about Salvadoran myths and legends. Content is served by the API in English with Spanish names and titles; no translations in v1.
- The country-based catalog view is out of scope because the API does not relate countries to entities.
- Visual direction: combined Añil + Faro + Baraja elements as recorded in Clarifications; exact palette, scale and layout are fixed by the approved mockup and the plan.
- **Open, needs the API before 1.7:** the API stores only `image_url` per entity; there is no field for the artwork's author or credit. The cultural brief requires crediting the artists, so either the API gains an optional credit field (a contract change to decide before the freeze) or the credit is carried in sources. Until decided, FR-020 shows the credit only if the API provides it.
- Hosting, domain and reverse proxy are decided in roadmap Phase 3; this spec only requires configuration-driven addresses and that the session layer be same-site with the page.
- Technology choices (framework, language, test tools, component library) belong to the plan, not to this spec. The decisions already taken are the separate repository, the thin server layer for the session, and the generated API client.
- Dependency on the API repository: sessions 1.7 and the two findings (429 shape, duplicated symmetric relations) must be resolved first; the API roadmap records this.
