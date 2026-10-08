# Oxford Medics 96: website brief v2

Instructions for the design and deployment agent. Read this whole file before writing code.

The site is live at https://oxfordmedics96.com. This brief adds five building blocks agreed by the organisers:

1. Landing page with three group photos (carousel or vertical loop)
2. A photo gallery kept separate from the landing set
3. "Where are we now": map of where everyone is, what each person does, links to public pages
4. Person finder: search by name, show contact details
5. News feed: an automatic agentic workflow that finds classmates in the news and new publications, and posts them as News

Goals for every change: **user friendly** (people in their 50s, mostly on phones, many not technical), **efficient** (fits how the organisers actually work), **fast** (pages usable within 2 seconds on a mid-range phone on 4G).

---

## 1. How to use this brief

- Work in the phases in section 10. Each phase must be shippable on its own.
- Sections 6 to 8 are the feature specs. Each has acceptance criteria. A feature is done only when all of them pass.
- Section 12 lists decisions the site owner must make. The recommended option is marked. Build the recommended option unless the owner says otherwise, but ask before starting a phase that depends on an open decision.
- Section 13 lists photos and other assets the owner must supply.

---

## 2. Current state (read before changing anything)

**Stack**
- Vite + React 19 + TypeScript + Tailwind CSS v4. Router: react-router-dom v7.
- Supabase: Postgres with row level security (RLS), Auth (emailed 6-digit code or password), private Storage buckets `photos` and `avatars`, one Edge Function `send-invites`.
- Email through Resend from `hello@oxfordmedics96.com`. Free plan: 100 emails a day, 3,000 a month, shared with sign-in codes.
- Hosting: GitHub Pages. Every push to `main` builds and deploys (`.github/workflows/deploy.yml`). `404.html` is a copy of `index.html` so deep links work.
- DNS: Amazon Route 53.

**Code map**
- `src/data/types.ts`: the `Repo` interface. All data access goes through it.
- `src/data/supabaseRepo.ts`: live implementation. Lists of photos and members are cached for 3 minutes (`memo()`); every write clears the matching cache.
- `src/data/sample.ts`: in-memory sample data used when no Supabase keys are set. Run `npm run dev` without a `.env` to test UI without the live database. Sign in as the sample user with `localStorage['om96.email'] = 'sam@example.com'`.
- `src/lib/useLoad.tsx`: loader hook. `reload()` refreshes quietly behind what is on screen.
- Pages: `Landing` (public), `SignIn`, `Gallery`, `AddPhotos`, `PhotoView` (tagging, full screen viewer, fixed-position Previous/Next), `Classmates` (directory with a basic search), `Profile`, `Contact`, `Me`, `Admin` (invites, members, photos), `Privacy`.
- Components: `Layout` (header, footer with the "Website by Indi Gupte, powered by SportsHealing Technologies" credit, which must stay), `PhotoLightbox`, `Avatar`, `SocialLinks`, `PasswordPrompt`.
- Migrations in `supabase/migrations/0001` to `0008`. New ones start at `0009`.

**Data model today**
- `members`: one row per person who has signed in. Created by a trigger on first sign-in if their email is in `allowed_emails`. Fields include `full_name`, `known_as`, `college`, `job_title`, `workplace`, `career_path`, `linkedin`, `website`, `instagram`, `twitter`, `accepts_contact`, `allows_tags`, `is_admin`, `avatar_path`.
- `allowed_emails`: the invite list, with `note` and `invite_sent_at`.
- `photos` (with `storage_path` and `thumb_path` for a 640px thumbnail), `photo_tags` (tag suggestions with confirmation by the tagged person), contact messages.
- Emails are private. Members contact each other through a contact form; the recipient sees the sender's email only when a message is sent. The Privacy page promises this.

**Design system**
- Colour tokens in `src/index.css`: navy (primary), rose `#E8A6BD` (single soft accent), stone (warm neutral), mist (cool neutral). The owner rejected a multi-colour "rainbow" look. Keep to navy plus rose. Do not add bright categorical colours.
- Fonts: Source Serif 4 (headings) and Source Sans 3.
- Mascot: Rita the Pink Elephant (`public/rita.svg`, placeholder artwork).

**Owner and workflow constraints**
- The owner uses Windows, has little technical experience, and has no Git installed.
- The owner runs SQL by pasting it into the Supabase SQL Editor, and deploys Edge Functions by pasting code into the Supabase dashboard editor. There is no Supabase CLI.
- Legacy Supabase API keys are disabled. One-off scripts use a temporary `sb_secret_...` key, which is deleted afterwards.
- **The GitHub repository is public.** Never commit personal data: no real names, emails, the cohort spreadsheet, or private album links. Real data lives only in Supabase.

---

## 3. Ground rules

1. **Privacy first.** Everything except the landing page and privacy notice is members only, enforced by RLS, not just the UI. Test every new table's policies as a non-member, a member and an admin.
2. **No personal data in the repo.** Sample data uses obviously fake names. Clean-up tasks: remove the co-admin's real name from `STATUS.md`, and replace the real Kululu album URL in `docs/photo-import.md` and `scripts/download-kululu.mjs` with a placeholder.
3. **Do not break what works:** sign-in, invites, tagging, thumbnails, full screen viewer, the footer credit, and Previous/Next staying in a fixed position under the photo.
4. **Database changes go out before the code that needs them.** If a push depends on a new column or table, do not push until the owner confirms the SQL has run. Give the owner one paste-able SQL block per phase, written so it can be re-run safely (`if not exists`, `create or replace`, `drop policy if exists`).
5. **Owner instructions must be click-by-click.** Name every menu item. Say what they should see when a step worked. Never ask the owner to paste a key into chat.
6. **Test before pushing:** `npm run lint`, `npx tsc -b`, `npm run build`, and a browser check at 390px and 1280px wide using sample mode (extend `sample.ts` with fake roster, places and news). No console errors.
7. **Accessibility:** WCAG 2.2 AA. Keyboard use, visible focus, alt text, 44px touch targets, respect `prefers-reduced-motion`, and a pause control for anything that moves for more than 5 seconds.

---

## 4. What the owner sent (analysis)

### 4.1 Website plan (five building blocks)
As listed at the top. The only open question it records is carousel or vertical loop. See decision D1.

### 4.2 Map infographic "Oxford Medicine 1996: Known locations"
- Two panels: "UK & Ireland" and "Overseas", bubbles sized by number of doctors, plus "Cruise ship doctor (1): everywhere".
- **Use it as a content reference, not as an image on the site.** It is an illustration: positions are approximate and some are wrong. Build the map from data (section 6.5).
- **Figures do not add up.** The UK panel header says 36 locations and 60 doctors, but the labelled bubbles add to 34 places and 74 doctors. The overseas panel says 7 locations and 9 doctors, which matches its labels, but one of those 7 places (Wexford) is in Ireland. The site must calculate all counts from the data and never hard-code them.
- **Wexford is in Ireland** but appears in the overseas panel, drawn near mainland Europe. On the site it belongs in the UK & Ireland view.
- "Yorkshire" and "Dorset" are counties, not towns. Places can be region-level.
- The illustration uses a different bright colour for each bubble. Do not copy this; see the design system.
- Appendix A lists every place with approximate coordinates and the count shown on the infographic, for seeding and checking.

### 4.3 Cohort list with specialties
- About 112 people: 98 in the main (clinical) list and 14 under "Preclinical" (people who did their preclinical years at Oxford).
- Data quality points the import must handle:
  - One person appears twice with two versions of their specialty. Merge into one record and ask the owner to confirm.
  - Two entries have an unknown or unclear specialty ("?", "Not practicing ?").
  - Spelling variants: "Ophthamology", "Clincial radiology", "Cinical oncology", "Respiratory Mmedicine", "Orthopedic" (use UK "Orthopaedic"), and mixed capitals ("General Practice" and "General practice").
  - Some entries are not clinical specialties (industry, start-ups, barrister, cruise ship medicine, space medicine). Keep them under "Other careers".
  - The list has no towns. The map infographic has towns but no names. Each person's location has to come from the owner or from the person (section 7).
  - Several people may have changed surname since 1996. Search must cover previous names.
- The source spreadsheet colour-codes related specialties. Use that grouping as the filter categories in Appendix B, but show it in the site's own palette.

---

## 5. Information architecture

**Members' navigation (top bar on desktop, compact on phones):**

| Item | Purpose |
|---|---|
| Home | Group photo carousel, latest News, quick links |
| Photos | The full gallery (unchanged, separate from the Home set) |
| Classmates | Person finder, with a **List / Map** switch. "Where are we now" lives here, so the menu stays short |
| News | The news feed |
| Me | Own profile and settings |
| Admin | Organisers only |

- **Public visitors** keep the current public landing page with Rita. Group photos are not shown publicly unless decision D2 says otherwise.
- **Phone layout:** no horizontal scrolling at 360px. If six items do not fit, use a bottom tab bar with icons and labels.
- **Deep links** must work for every page, for example `/classmates?view=map` and `/news/<id>`.

---

## 6. Feature specs

### 6.1 Home: group photo carousel (block 01)

**Behaviour**
- Shows the three featured group photos large, with a caption for each (occasion, year, place).
- **Recommended format: a crossfade carousel** (see D1):
  - Changes slide every 7 seconds.
  - Pauses on hover, on keyboard focus, and when the tab is hidden.
  - Has Previous/Next buttons and three dots.
  - Supports swiping on phones.
  - Has a visible Pause button.
  - Does not auto-advance when `prefers-reduced-motion` is set.
- Tapping a slide opens that photo in the existing full screen viewer.
- Below the carousel: the latest 3 News items and links to Photos and Classmates.

**Admin workflow**
- On any photo page, an admin can choose **Feature on Home**.
- In Admin, a **Home photos** card shows the featured photos and lets the admin drag or move them into order.
- Allow up to 5 featured photos; the brief asks for 3.
- If the photos already exist among the uploaded photos, nothing needs uploading again.

**Data**
- Add `featured_rank int null` to `photos`. Featured means `featured_rank is not null`.
- Add `width int` and `height int` to `photos` so images reserve their space and the page does not jump while loading.
- Extend `scripts/make-thumbnails.mjs` to also fill `width` and `height`, and to make a 1600px "display" copy (`display_path`) for featured photos.

**Performance**
- Load the first slide with `fetchpriority="high"` and the other slides lazily.
- Use the 1600px display copy, not the original.
- The Home page must not load the whole photo list. Use a small query for featured photos and latest news only.

**Acceptance**
- Three photos rotate.
- Pause works.
- Keyboard and screen reader can operate the carousel.
- No layout shift.
- Largest Contentful Paint under 2.5 seconds on throttled "Fast 4G".
- Gallery still lists all photos.

### 6.2 Photo gallery (block 02)

The gallery already exists and is separate from the Home set. Changes:
- **Render in pages of 48** with automatic "load more" as the visitor scrolls (IntersectionObserver), instead of all ~744 cards at once. Keep the year filter.
- Use `width`/`height` to avoid layout shift. Thumbnails are already in place.
- Add a **"Featured on Home"** badge for admins only.

**Acceptance**
- First paint of /photos under 1.5 seconds on a laptop.
- Scrolling stays smooth with all photos loaded.

### 6.3 The cohort roster (foundation for blocks 03, 04, 05)

Today only people who have signed in have a profile. The finder, map and news need **everyone in the cohort**, including people who have not joined yet.

**Data model** (exact design is the agent's call, but meet these rules)
- **One record per person** (`classmates` table): `id`, `full_name`, `previous_names text[]`, `known_as`, `cohort` (`clinical` or `preclinical`), `specialty`, `specialty_group`, `role_title`, `workplace`, `place_id` (references `places`), `location_visibility` (`town`, `region`, `hidden`), `links jsonb` (wikipedia, orcid, scholar, nhs_profile, website, linkedin, other), `orcid`, `member_id` (null until they join), `news_opt_out boolean`, timestamps.
- **Private contact details in a separate table** (`classmate_private`): `classmate_id`, `email`, `show_email_to_members boolean default false`. RLS: admins read and write; the person reads and updates their own row; nobody else.
- Expose an email to members only through a function or view that returns it when `show_email_to_members` is true.
- **`places`**: `id`, `name`, `region`, `country`, `lat`, `lng`, `kind` (`town`, `region`, `at_sea`). Seed from Appendix A.
- **Linking accounts:** when someone signs in, link their `members` row to the `classmates` row with the same email (extend the existing sign-up trigger). Profile fields shown on the site come from one place. Pick either `members` or `classmates` as the source of truth and migrate. Do not leave two copies that can disagree.
- Importing the roster also adds each email to `allowed_emails`, so the admin can invite people straight away.

**Specialty normalisation:** store the canonical name and group from Appendix B. Keep the original wording in an admin-only `specialty_source` column for checking.

### 6.4 Person finder (block 04)

**Where:** Classmates page, List view (already has a search box).

**Search**
- Instant, on the device, with no network call per keystroke. ~112 records is tiny.
- Matches full name, known-as, **previous names**, specialty, specialty group, workplace and town.
- Ignores case and accents.
- Partial words match ("chin" finds a first name starting "Chin").

**Results**
- Cards with avatar or initials, name, specialty, town, and a "Not joined yet" badge where relevant.
- Filter chips by specialty group (Appendix B) and Clinical / Preclinical.
- Keyboard: `/` focuses the search.

**Contact**
- Follows decision D3. Recommended: show the email only if that person opted in.
- Otherwise show the existing **Send a message** button.
- For people who have not joined, show nothing for members. Admins see the email and an **Invite** button.
- Copy-to-clipboard for emails.

**Admin efficiency**
- Filter "Not joined yet" plus a **Select all → Invite** action, using the existing `send-invites` function in batches of 80 to stay inside the Resend limit.

**Acceptance**
- Typing any part of a name shows the person within 100ms.
- Searching a previous surname finds the person.
- A hidden email never appears in the network response for a member.

### 6.5 Where are we now: map and careers (block 03)

**Where:** Classmates page, **Map** view.

**Map**
- Two views: **UK & Ireland** (default) and **World**, plus an "At sea" chip for the cruise ship doctor.
- One bubble per place. Bubble **area** is proportional to the number of people (radius = k × square root of count).
- Bubbles in navy with a rose outline. Clicked state in rose.
- Every bubble has at least a 44px tap area.
- **Click or tap a bubble:** a side panel (bottom sheet on phones) lists the people there with avatar, name and specialty, each linking to their profile.
- **Dense areas:** London has about 23 people. The panel lists them all. Do not try to draw individual dots.
- **Filters:** specialty group chips (same as the finder). Counts update live.
- **List alternative:** a "View as list" table grouped by country and town, for screen readers and small screens.
- Totals strip: "N people in N places, N countries", calculated from data.

**Technology (recommended, for speed and privacy)**
- Draw the map as **inline SVG with `d3-geo`**, not a tiled web map. No third-party tile servers, no API keys, no tracking, and it can match the site's style exactly.
- Pre-simplify the outlines (Natural Earth via `world-atlas`, plus a higher-detail UK & Ireland outline) into small static files under `public/geo/`.
- Budget: under 60 KB gzipped for both outlines together. The browser caches them.
- Load the Map view and `d3-geo` **only when someone opens the Map view** (`React.lazy`). Budget: under 40 KB gzipped of JavaScript for that chunk, excluding geometry.
- Aggregate counts in the database (a view or RPC returning place, coordinates and count, filtered by group). Respect `location_visibility`: `region` rolls up to the region's place; `hidden` is left off the map.

**What each person does now (profile page)**
- Shows specialty, role title, workplace, town, and a **Links** row: Wikipedia, ORCID, Google Scholar, NHS or hospital profile, website, LinkedIn.
- Reuse and extend `SocialLinks`.
- Accept only `https://` links. Show the site name on each button.

**Collecting the data (efficient for everyone)**
- **Me page:** fields for town (type-ahead from `places`; new towns allowed), location visibility, specialty (pick from the canonical list), role, workplace, ORCID and public links.
- **Admin:** edit any roster record (for people who have not joined).
- **Geocoding new towns:** when a town is not in `places`, an admin-only Edge Function geocodes it once with OpenStreetMap Nominatim. Follow its usage policy: identify the app, at most 1 request per second, cache the result in `places`. Admins can correct the coordinates.

**Acceptance**
- Map view usable within 1.5 seconds of tapping Map on a laptop.
- Counts match the roster.
- Hidden people never appear.
- Works at 360px wide.
- Keyboard can reach every bubble.

### 6.6 News feed (block 05, agentic)

**Purpose:** spot classmates in the news and new publications, and post them as News, with an organiser approving each item.

**Pipeline (runs weekly, automatically)**
1. **Schedule:** Supabase Cron (pg_cron plus pg_net) calls an Edge Function `news-scan` every 10 minutes during a weekly window.
   - Each call processes the next 5 people whose `last_checked_at` is oldest, so no single call hits the Edge Function time limit.
   - Do **not** use GitHub Actions: the repo is public, so its logs would be public.
2. **Publications:** query **Europe PMC** (free REST API, includes PubMed).
   - Use the person's ORCID when present (exact match).
   - Otherwise use name plus affiliation or specialty keywords, limited to items published since the last check.
3. **News:** one Claude API call per person with the server-side web search tool (`web_search_20260209`).
   - `max_uses` 3, results from the last 14 days.
   - Prompt includes the person's name, previous names, specialty and town, to tell apart people with the same name.
4. **Relevance check:** each candidate goes through Claude with **structured output** (`output_config.format`, JSON schema) returning:

   ```json
   {"is_about_person": true, "confidence": 0.0, "kind": "publication|news|award|appointment|other",
    "tone": "positive|neutral|negative|sensitive", "title": "...", "summary": "two sentences, plain English",
    "url": "https://...", "published_on": "YYYY-MM-DD"}
   ```

5. **Store:**
   - Candidates with `is_about_person` and confidence 0.7 or above go to `news_candidates` with status `pending`.
   - Drop duplicates by URL and by DOI.
6. **Human approval (required):**
   - Admin page **News review** queue shows title, summary, source, the person, and a link.
   - Keyboard shortcuts: `A` approve, `E` edit, `R` reject.
   - Approved items become `news_posts`, shown on News and Home.
   - **Never auto-publish.** Never publish items with tone `negative` or `sensitive` (legal, disciplinary, health, bereavement). Show those to admins with a warning, and default the action to reject.
7. **Notify:** after each weekly run, email the admins a one-line summary ("4 new items to review") through Resend. Only send when there is something to review.

**Model and API (Claude API, TypeScript SDK `@anthropic-ai/sdk` in Deno via `npm:`)**
- Default model: **`claude-opus-5-5`** with `output_config.effort: "low"` for the relevance check, and `"medium"` for the news search step.
- On this model thinking cannot be turned off; use effort to control cost.
- Use structured output, not forced `tool_choice`, which this model rejects.
- Opt in to refusal fallbacks with `fallbacks: "default"` and the beta `server-side-fallback-2026-07-01`.
- Always check `stop_reason` before reading content.
- Volume is small: about 110 people a week and a few hundred candidates. Estimate the monthly cost from a first run and show it to the owner.
- A cheaper model (`claude-haiku-5-5`) is possible for the relevance check. That is the owner's choice (decision D7). Do not switch without it.
- Secret: `ANTHROPIC_API_KEY` stored as an Edge Function secret. The owner creates it in the Anthropic Console. Never in the repo or the browser.

**Data**
- `news_candidates`: `id`, `classmate_id`, `kind`, `title`, `summary`, `url`, `source`, `published_on`, `confidence`, `tone`, `raw jsonb`, `status`, `found_at`.
- `news_posts`: `id`, `classmate_id`, `title`, `summary`, `url`, `kind`, `published_on`, `approved_by`, `approved_at`.
- `classmates.last_checked_at`, `classmates.news_opt_out`.
- RLS: members read `news_posts`; only admins read or write candidates; the Edge Function writes with a service role secret key.

**Privacy controls**
- Anyone can opt out on their Me page ("Don't look for me in the news"). Opted-out people are skipped entirely.
- The Privacy page must explain the feature in plain English before it goes live.
- Approved posts can be removed by the person featured, as well as by admins.

**News page**
- Reverse date order, filter by kind.
- Each item shows the person (linked), date, summary and source link.
- 20 per page.

**Acceptance**
- A dry run on 5 test people produces candidates in the queue and nothing published.
- Approve and reject work.
- Opted-out people are never queried (check the logs).
- The weekly run finishes inside the window.

---

## 7. Roster import (efficient admin workflow)

The organisers keep a spreadsheet. Make it easy to load and to reload.

**Admin → Roster import**
1. Paste CSV or upload a `.csv` file.
2. See a preview with counts: new, updated, unchanged, problems (unknown specialty, duplicate name, unknown town).
3. Confirm.

- Matching for updates: by email when present, otherwise by normalised full name. Never create duplicates.
- Re-running the same file changes nothing.
- The import runs in the browser as the signed-in admin, through RLS. No service key is needed.

**CSV columns** (header row required; only `full_name` is mandatory):
`full_name, previous_names, known_as, cohort, specialty, town, country, email, wikipedia, orcid, linkedin, website, notes`

- `previous_names` may hold several names separated by `;`.
- Specialty text is mapped to Appendix B; unknown values are flagged, not rejected.
- Towns are matched to `places`; unknown towns are flagged for geocoding.
- Provide a downloadable empty template.
- **Do not commit the real file.** The owner uploads it through the Admin page.

---

## 8. Performance budget (fast on phones)

| Measure | Target |
|---|---|
| Initial JavaScript (gzipped) | 110 KB or less. Today about 102 KB in one chunk. |
| Route chunks | Map, News, Admin and Roster import loaded only when opened (`React.lazy`) |
| Largest Contentful Paint (Home, Fast 4G, mid-range phone) | Under 2.5 seconds |
| Cumulative Layout Shift | Under 0.1 (store and use image width and height) |
| Interaction to Next Paint | Under 200 ms (search filtering on every keystroke) |
| Map geometry | Under 60 KB gzipped, static, cached |

**Techniques**
- Keep the 3-minute list caches.
- Use small purpose-built queries for Home and Map, not full lists.
- Thumbnails everywhere in grids.
- Display copies for large images.
- `loading="lazy"` and `decoding="async"` on all non-critical images.
- Signed URLs created in one batch call.
- Add database indexes on `classmates(full_name)`, `classmates(place_id)`, `news_posts(published_on desc)` and `news_candidates(status)`.

Measure with Lighthouse (mobile) before and after each phase, and report the numbers to the owner.

---

## 9. Privacy and security checklist

- [ ] RLS on every new table; policies tested as non-member, member, person themselves, and admin.
- [ ] Emails only visible according to D3; never sent to the browser otherwise.
- [ ] Location only to the level each person chose; default `town`.
- [ ] No personal data, keys or private links in the repo; repo clean-up done (rule 2).
- [ ] Privacy page updated for: roster of people not yet joined, map, email display, news monitoring, and how to opt out or ask for removal.
- [ ] Invitation email mentions that a basic directory entry exists and how to opt out.
- [ ] Anthropic and Resend keys only in Edge Function secrets.
- [ ] Only `https://` links accepted in profile links.

---

## 10. Delivery plan

Each phase ends with:
- a push
- a short plain-English summary for the owner
- a numbered list of anything the owner must do

| Phase | Contents | Owner steps |
|---|---|---|
| 1. Quick wins | Repo privacy clean-up; route code-splitting; gallery paging; image width and height; Home carousel with featured photos and admin picker | Run SQL 0009; choose the 3 featured photos (or upload them); re-run the thumbnail script for display copies and sizes |
| 2. Roster and finder | `classmates`, `classmate_private`, `places` (seeded), account linking, Roster import, finder search and filters, contact rules, "Not joined yet" invites | Decide D3 and D4; run SQL 0010; import the cohort spreadsheet in Admin; review flagged rows |
| 3. Where are we now | Map view, profile links, Me page location and links fields, geocoding function | Run SQL 0011; deploy `geocode-place` Edge Function by pasting code; check a few towns |
| 4. News feed | Tables, `news-scan` Edge Function, cron schedule, review queue, News page, opt-out, Privacy page text | Create an Anthropic API key and add it as a secret; deploy the function; run the cron SQL; approve the first items |

---

## 11. Testing checklist (every phase)

- [ ] Lint, type-check and build pass.
- [ ] Sample mode extended with fake data for the new features; all pages work at 390px and 1280px.
- [ ] No console errors.
- [ ] Existing features: sign-in, invite, upload, tag, full screen viewer, Previous/Next position, footer credit.
- [ ] RLS tested with real accounts after the SQL has run (ask the owner for a test member account, or use a second admin email).
- [ ] Lighthouse mobile numbers recorded.

---

## 12. Decisions for the owner

| # | Question | Options | Recommended |
|---|---|---|---|
| D1 | Landing photos: carousel or vertical loop? | Crossfade carousel / continuous vertical loop | **Carousel.** A constantly moving loop is distracting, hard to read on phones, and must still have a pause control. A carousel shows each photo large and is easy to control. |
| D2 | Should group photos be visible to the public? | Members only / public | **Members only** (on the new Home). Showing identifiable people publicly needs everyone's consent. |
| D3 | Person finder: show email addresses? | Everyone's / only people who opt in / never (message button) | **Only people who opt in.** The Privacy page currently promises emails are shared only when someone sends a message. |
| D4 | Show classmates who have not joined yet? | Yes, name + specialty + town to members / no | **Yes**, with no email or photo, plus an opt-out mentioned in the invite email. |
| D5 | News feed: auto-post or approve first? | Approve first / auto-post | **Approve first.** Common names give false matches, and some news is not something a classmate would want posted. |
| D6 | Who approves news? | All admins / named organisers | All admins, with an email when items are waiting. |
| D7 | AI model and budget for the news feed | `claude-opus-5-5` at low effort (default) / cheaper `claude-haiku-5-5` for the relevance check | Start on the default, measure the first month, then decide. |
| D8 | Preclinical group | Include, labelled "Preclinical years at Oxford" / leave out | **Include.** |
| D9 | Data fixes | Confirm the duplicate entry, the two unknown specialties, the town for the Ireland-based classmate, and the map totals | Owner confirms in the Roster import preview. |
| D10 | Keeping the roster up to date | Re-import the spreadsheet / edit in Admin / members edit their own | All three. Members' own edits win over imports for their own fields. |

---

## 13. Photos and assets the owner needs to supply

| Item | Needed for | Details |
|---|---|---|
| **3 group photos** (required) | Home carousel | Landscape, at least 2000px wide, the best original available. For each: occasion, year, place. **If they are already among the uploaded photos, just say which ones** (for example "Photo 412"); no upload needed. Confirm everyone in them is happy to be shown to members (or publicly if D2 changes). |
| Rita artwork (optional) | Header, landing, favicon | The cohort's own Rita drawing, if one exists. PNG with transparent background, at least 1024px, or SVG. |
| Link preview image (optional) | WhatsApp and email link previews | 1200 x 630px, no identifiable faces (for example Rita, or an Oxford building). |
| Cohort spreadsheet | Roster import | The owner uploads it through Admin → Roster import in phase 2. Never commit it. |
| Not needed | Map | Built from data. The infographic's illustrations, including the cruise ship, are not used. |

---

## Appendix A: Places from the map infographic

Coordinates are approximate town centres (counties and regions use a representative point). Verify before seeding. Counts are as printed on the infographic and are for checking only; live counts come from the roster.

| Place | Region / country | Lat | Lng | Count on infographic |
|---|---|---|---|---|
| London | England | 51.507 | -0.128 | 23 |
| Oxford | England | 51.752 | -1.258 | 6 |
| Leeds | England | 53.801 | -1.549 | 4 |
| Liverpool | England | 53.408 | -2.991 | 3 |
| Manchester | England | 53.481 | -2.243 | 3 |
| Cambridge | England | 52.205 | 0.122 | 3 |
| Southampton | England | 50.910 | -1.404 | 3 |
| Edinburgh | Scotland | 55.953 | -3.188 | 2 |
| Yorkshire (region) | England | 53.960 | -1.082 | 2 |
| Blackpool | England | 53.817 | -3.036 | 1 |
| Wigan | England | 53.545 | -2.632 | 1 |
| Barnsley | England | 53.553 | -1.483 | 1 |
| Stockport | England | 53.408 | -2.149 | 1 |
| Macclesfield | England | 53.259 | -2.127 | 1 |
| Oswestry | England | 52.860 | -3.055 | 1 |
| Shrewsbury | England | 52.707 | -2.754 | 1 |
| Nottingham | England | 52.954 | -1.158 | 1 |
| Norwich | England | 52.630 | 1.297 | 1 |
| Birmingham | England | 52.486 | -1.890 | 1 |
| High Wycombe | England | 51.629 | -0.748 | 1 |
| High Barnet | England | 51.650 | -0.200 | 1 |
| Reading | England | 51.454 | -0.978 | 1 |
| Epsom | England | 51.336 | -0.268 | 1 |
| Cardiff | Wales | 51.481 | -3.179 | 1 |
| Bristol | England | 51.455 | -2.588 | 1 |
| Bath | England | 51.381 | -2.359 | 1 |
| Canterbury | England | 51.280 | 1.079 | 1 |
| Taunton | England | 51.015 | -3.106 | 1 |
| Horsham | England | 51.063 | -0.326 | 1 |
| Dorset (county) | England | 50.715 | -2.437 | 1 |
| Poole | England | 50.715 | -1.987 | 1 |
| Brighton | England | 50.823 | -0.137 | 1 |
| Isle of Wight | England | 50.701 | -1.293 | 1 |
| Plymouth | England | 50.376 | -4.143 | 1 |
| Wexford | Ireland | 52.336 | -6.463 | 1 (shown as overseas on the infographic) |
| Seattle | USA | 47.606 | -122.332 | 1 |
| The Gambia (Banjul) | The Gambia | 13.454 | -16.579 | 1 |
| Singapore | Singapore | 1.352 | 103.820 | 3 |
| Gold Coast | Australia | -28.017 | 153.400 | 1 |
| Adelaide | Australia | -34.929 | 138.601 | 1 |
| Melbourne | Australia | -37.814 | 144.963 | 1 |
| At sea (cruise ship) | none | none | none | 1 (kind `at_sea`, not drawn on the map) |

---

## Appendix B: Specialty groups

Use these groups for filters and map filtering. Counts are approximate, from the owner's list (clinical plus preclinical), for checking the import only.

| Group | Canonical specialties (map spelling variants to these) | Approx. people |
|---|---|---|
| Primary care | General practice; General practice (prison healthcare); General practice and biotech | 22 |
| Medical specialties | Cardiology; Cardiology and general internal medicine; Respiratory medicine; Respiratory and general internal medicine; Gastroenterology and general internal medicine; Hepatology; Infectious diseases; Infectious diseases and medical microbiology; Renal medicine; Neurology; Endocrinology and general internal medicine; Rheumatology; Dermatology; Clinical genetics; Occupational medicine; Public health and genitourinary medicine; Palliative care | 32 |
| Surgical specialties | Orthopaedic surgery; General surgery; Breast surgery; Plastic surgery; Urological surgery; Cardiothoracic surgery; Oral and maxillofacial surgery; ENT surgery; Ophthalmology | 17 |
| Radiology | Clinical radiology | 8 |
| Anaesthesia and intensive care | Anaesthetics; Anaesthetics and intensive care | 7 |
| Cancer and blood | Medical oncology; Clinical oncology; Haematology | 8 |
| Psychiatry | Psychiatry; Old age psychiatry; Child and adolescent psychiatry; Forensic psychiatry | 5 |
| Emergency medicine | Emergency medicine | 3 |
| Women and children | Obstetrics; Paediatrics | 3 |
| Other careers | Healthcare industry; Healthcare start-ups; Barrister; Cruise ship medicine; Space medicine and orthopaedics | 5 |
| Unknown | To be confirmed | 2 |

Spelling map (case-insensitive): "Ophthamology" → Ophthalmology; "Clincial radiology" → Clinical radiology; "Cinical oncology" → Clinical oncology; "Respiratory Mmedicine" → Respiratory medicine; "Orthopedic surgery" → Orthopaedic surgery; "ENT" → ENT surgery; "Anaesthetics / ITU" → Anaesthetics and intensive care; "Genetics" → Clinical genetics; "Prison GP" → General practice (prison healthcare); "General practice (Ireland)" → General practice (country Ireland).
