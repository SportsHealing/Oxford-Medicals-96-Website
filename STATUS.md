# Project status: Oxford Medics 96

Last updated: 2026-10-10 (Europe/London)

## Current phase

Phase 3: Phase B. Site live at https://oxfordmedics96.com in live mode. Sign-in by emailed 6-digit code or password; Resend sends the emails. All pages read and write the database. User is admin. Kululu photos imported (787) and all have thumbnails. Invites are being sent. Current focus: making sure every invited classmate can sign in.

## Site brief

- **Site name and domain:** Oxford Medics 96. Domain: oxfordmedics96.com (obtained).
- **Purpose:** A private place for the Oxford medical students of 1996 to view old photos, identify classmates, and see what they do now.
- **Audience:** Oxford medical alumni who graduated in 1996, across multiple colleges. Now in their 50s. Needs: large readable text, simple navigation, works on phone and desktop.
- **Access:** Signed-in members only, with email login. Public sees a landing page only.
- **Core features:**
  - View all photos.
  - Look up classmates: who they are and what they do now.
  - Tag people in photos manually. The tagged person confirms the tag.
  - Profile per person, built from their questionnaire answers.
  - Connect: link to the person's LinkedIn plus a contact request form.
  - Members upload their own photos and tag people straight after upload.
  - Face recognition: options set out to user (detection-assisted tagging now; opt-in recognition later). Awaiting decision.
- **Pages:** Landing (public), sign in, photo gallery, photo view with tags, classmates directory, profile, contact request, privacy notice.
- **User journey:** Sign in. Browse photos. Tag or confirm a classmate. Open their profile. See their current work. Send a contact request or open LinkedIn.
- **Content:** Admins upload photos. Member information arrives as text answers to a questionnaire (see `docs/alumni-questionnaire.md`). Photos and answers will be supplied later.
- **Data collected:** Name, college, photos, questionnaire answers, contact preferences, tag confirmations. Facial data only in the later opt-in phase.
- **Visual style:** Calm, two-colour system (tokens in `src/index.css`). Pop comes from contrast (navy hero, navy footer) and one accent, not from more hues. Warm paper background, white cards, serif headings, sans body. No ribbons or gradients. Every text pairing 4.5:1 or better.
  - Navy `#002147`: text, dark surfaces, secondary buttons, selected filters.
  - Rose `#E8A6BD` (Rita, softened from #FB67AA, saturation 95% to 59%): primary buttons with navy text (8.1:1), active tab underline, highlights. Deep rose `#A6476F` for small accent text. Soft rose `#F8ECF1`.
  - Stone `#F1EBE2` with `#6B5D4C` text: "Then" panels, members-only panel.
  - Mist `#E7ECF3`: cool neutral for some initials circles.
  - Rita drawing recoloured to the rose family.
- **Tone:** Warm, plain, a little nostalgic. Short sentences.
- **Legal and safety:** UK GDPR. Consent before a tag is published. Any member can remove a tag of themselves. Privacy notice. Facial recognition needs explicit opt-in and a DPIA. Avoid official University of Oxford crests or logos without permission.

## Build scope

- Phase A (now): clickable static prototype with sample photos and sample profiles. Vite + React + Tailwind, builds to static files.
- Phase B: email sign-in, private photo storage, real profiles, tagging with confirmation. Small private backend (Supabase) approved. Non-members must not be able to access anything.
- Phase C: opt-in face matching that suggests tags for a human to confirm.

## Decisions made

- Project lives in `SportsHealing/oxford-medicals-96-website`. Unrelated to kneescore-research.
- Community is the 1996 Oxford medical cohort, all colleges.
- Members-only access with email login.
- Small private backend approved for Phase B.
- 1996 is the graduation year.
- Tingewick pink taken from tingewick.org (#FB67AA) and the Rita logo.
- Manual tagging first. Face recognition later and opt-in only.
- Profiles are built from questionnaire answers.
- Palette: navy plus one softened rose accent, with stone and mist neutrals. Earlier four-hue version rejected as too saturated and "rainbow-y"; top ribbon removed.
- Hosting: GitHub Pages via GitHub Actions. DNS in AWS Route 53.

## Open questions

- None blocking.

## Files

- `STATUS.md`: project status and brief. In progress.
- `docs/alumni-questionnaire.md`: draft questions for alumni. Draft.
- `src/`: Phase A prototype (Vite, React, Tailwind). Built, lint clean, screenshots checked.
- `src/data/sample.ts`: fictional sample people, photos, tags.
- `scripts/make-sample-photos.py`: generates placeholder photos.
- `supabase/migrations/0001_init.sql`: database schema, access rules, storage bucket.
- `src/lib/supabase.ts`, `src/auth.tsx`: live sign-in when env vars are set, prototype mode otherwise.
- `docs/phase-b-setup.md`: step by step Supabase setup for the user.
- `supabase/migrations/0002_privacy.sql`: column grants (emails hidden, is_admin locked), inbox and admin functions.
- `src/data/`: `types.ts` Repo contract, `sample.ts` in-memory, `supabaseRepo.ts` live, `repo.ts` picks one.
- `src/pages/Me.tsx`: profile form, tag confirmations, message inbox.
- `src/pages/Admin.tsx`: photo upload, invite members, delete photos, promote or demote admins.
- `supabase/migrations/0004_set_admin.sql`: admin-only `set_admin` function.
- `supabase/migrations/0005_profile_pictures.sql`: private `avatars` bucket, `members.avatar_path`, re-runnable member-upload rules.
- `supabase/migrations/0007_invite_emails.sql`, `supabase/functions/send-invites/index.ts`, `docs/invites-setup.md`: Admin invite form emails each person via Resend (Edge Function acting as the signed-in admin, no service key). Email links to /sign-in?email=… (no token). Rows show Email sent date and Resend.
- `supabase/migrations/0006_social_links.sql`: website, Instagram, X columns. LinkedIn already existed.
- First sign-in shows a one-time "Set a password?" dialog (`src/components/PasswordPrompt.tsx`); seen-flag stored in the auth user's metadata so it appears once per person, not per device.
- Profile pictures: set on the Me page, square-cropped to 512px in the browser, shown in Classmates, profiles, photo tags and messages.
- `supabase/migrations/0003_member_uploads.sql`: members upload, edit and delete their own photos; self-tags confirm instantly.
- `src/pages/AddPhotos.tsx`: member upload (up to 20 at once, shrunk to 2400px), then a tag-as-you-go queue.
- `scripts/download-kululu.mjs`, `scripts/import-photos.mjs`, `docs/photo-import.md`: one-off Kululu migration.
- `supabase/migrations/0008_photo_thumbnails.sql`, `scripts/make-thumbnails.mjs`: 640px thumbnails for grids (run 2026-10-08: 787 made, 0 failed).
- `supabase/migrations/0009_membership_on_invite.sql`: adding an address to the list now also grants membership to an existing account, repairs people already stuck, and lists sign-in attempts from addresses not on the list (Admin page).
- `supabase/migrations/0010_join_requests.sql`, `supabase/functions/join-requests/index.ts`, `docs/sign-up-setup.md`: self-service sign-up (email on list, or name on the class list, or request to join with admin accept/decline and decision emails), class list (`roster`) and import, Admin redesigned into Requests, People and Add people tabs. Tested against a local Postgres copy of the schema (24 scenarios, 32 name-matching cases).
- 2026-10-10 build (brief phases 1 to 3): members' Home at "/" with a crossfade carousel of featured photos (admins press Feature on Home on a photo, up to 5; falls back to the most-tagged photos), public front page shows `public/landing.jpg` (+ `landing-800.jpg`) when present, otherwise Rita. Person finder on Classmates (search incl. name at medical school, specialty, town; specialty-group filters; "/" shortcut). "Where are we now" map (Classmates, Map view; `src/components/ClassmatesMap.tsx`, d3-geo, outlines and town list in `public/geo/` generated from Natural Earth via world-atlas and GeoNames via all-the-cities). Me page: name at medical school, specialty, town picker, Wikipedia/ORCID/Scholar/hospital links, opt-in "show my email". Gallery draws 48 at a time; less-visited pages load on demand. `supabase/migrations/0011_profiles_map_home.sql` adds the columns (site works before it runs; the new fields appear after).
- `docs/website-brief-v2.md`: brief for the next build (home carousel, roster, person finder, map, news feed). No personal data.
- Members' Home redesign (2026-10-10): Home tab in the header; navy band with the 1996 and 2026 class photos side by side (tap to enlarge, `src/components/ThenAndNow.tsx`), then the quote banner, the speeches (read or download PDF), and an archive slideshow only when admins have featured photos (the random most-tagged fallback was removed).
- Speeches (2026-10-10): `supabase/migrations/0012_speeches.sql` adds `speeches` and `speech_quotes` (members read, admins manage). Members' Home shows a quote banner (`src/components/QuoteBanner.tsx`) and a Speeches tile; full texts at `/speeches` and `/speeches/:slug` (`src/components/SpeechBody.tsx` renders paragraphs, `## ` headings, `**bold**`, `*italic*` and embedded `data:image` pictures, never HTML). The speech texts and quotes are loaded by a separate SQL file kept off GitHub; the site works before 0012 runs (no banner). `supabase/migrations/0013_speech_pdfs.sql` adds `pdf_name` and `pdf_base64` so members can download each speech as a PDF (stored in the database, fetched only on click; button hidden until a PDF is loaded).

## To-do list

**Now (sign-in reliability)**
- [x] Owner: run `supabase/migrations/0009_membership_on_invite.sql` in the Supabase SQL Editor.
- [x] Owner: sign-up setup steps 1 to 7 in `docs/sign-up-setup.md` (done 2026-10-10).
- [ ] Owner: run `supabase/migrations/0011_profiles_map_home.sql` in the SQL Editor (turns on the new profile fields, map, email opt-in and Home photos).
- [x] Reunion group photo published on the public front page as `public/landing.jpg` and `landing-800.jpg` (resized, location and camera data removed), 2026-10-10. To take it down, delete both files; Rita shows again. The 1996 class photo (`public/then-1996.jpg`, cropped from a phone snapshot of the print, metadata removed) sits over its corner as an old print.
- [ ] Owner: run `supabase/migrations/0012_speeches.sql`, then the private `speeches-content.sql` (sent in chat, not on GitHub), to show the reunion speeches and the Home quote banner. Then the private `step3-speech-pdfs.sql` (includes 0013) for the PDF downloads.
- [ ] Owner: choose up to 5 Home photos (open a photo, Feature on Home).
- [ ] Owner: check the bounced invite addresses in Resend and correct them via the sign-up sheet import.
- [ ] Owner: check Resend (Emails log and Domains page) for failed or bounced invites; add a DMARC record in Route 53 if Resend flags it.
- [ ] Owner: in Supabase, Authentication, Rate Limits, raise "emails sent per hour" so a batch of new invitees can all get codes.
- [x] Owner: decided the GitHub repository stays public (2026-10-08).

**Next build (later, from `docs/website-brief-v2.md`)**
- [x] Phase 1: Home carousel, gallery paging, code splitting (2026-10-10). Image width/height columns skipped: grids use fixed-shape cards, so there is no layout shift to fix.
- [x] Phase 2: person finder for members (2026-10-10). Shows joined members only; showing class-list names of people who have not joined is decision D4.
- [x] Phase 3: "Where are we now" map and profile links (2026-10-10). Members place themselves by adding a town.
- [ ] Phase 4: news feed (weekly scan, admin approval, opt-out). Needs owner decisions D5 to D7 and an Anthropic API key.
- [ ] Owner decisions D1 to D10 in the brief; owner supplies the 3 group photos.

**Earlier items still open**
- [ ] Second organiser as co-admin (owner promotes them in Admin once they have signed in).
- [ ] Email alerts for tags and messages.
- [ ] Proper Rita artwork.
- [ ] Face recognition: owner decision pending.

## Clean-up at the end (user request)

When the site is finished, remove everything installed on the user's PC during this project. Nothing on the PC is needed to keep the site running; it all lives on GitHub, Supabase and Resend.

- Node.js: Windows Settings, Apps, Installed apps, Node.js, Uninstall.
- The project folder `Documents\Oxford-Medicals-96-Website-main` (includes `node_modules` and the downloaded `kululu-photos` once they are uploaded).
- Playwright browsers: delete the folder `%USERPROFILE%\AppData\Local\ms-playwright`.
- npm cache: delete `%USERPROFILE%\AppData\Local\npm-cache` and `%USERPROFILE%\AppData\Roaming\npm`.
- Any `.env` file containing the Supabase service_role key. Legacy service_role keys cannot be regenerated alone. Tidy option: once the site is confirmed to use the `sb_publishable_` key (GitHub variable `VITE_SUPABASE_ANON_KEY`), press Disable JWT-based API keys on the Legacy tab. For any future bulk job, create an `sb_secret_` key, use it, then delete it.
- Keep: the Supabase, Resend, GitHub and AWS accounts. They run the live site.

## Handover notes

- Hosting: the site is built and served by GitHub Pages from the `main` branch. AWS (Route 53) only provides the domain name. GitHub Pages only works for a private repository on a paid GitHub plan (Team or above). Free alternatives that build from a private repository: Cloudflare Pages, Netlify. AWS Amplify Hosting also works (small monthly cost). Any move needs the two `VITE_SUPABASE_*` values copied into the new host and the Route 53 records repointed.

- Source: one page of handwritten notes, then answers in chat.
- Claude cannot be trained to recognise faces and does not identify people from their faces. Face matching would use a dedicated service, run only for members who opt in.
- Real photos of identifiable people must not go on a public URL before access control exists.
- Messages and tag suggestions do not send email yet. Members see them on /me when they next sign in. Add Supabase Edge Function + Resend later if wanted.
- Rita logo is a placeholder drawing. Replace with a proper illustration or the cohort's own Rita artwork if they have one.
