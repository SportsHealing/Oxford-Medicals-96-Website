# Project status: Oxford Medics 96

Last updated: 2026-10-25 (Europe/London)

## Current phase

Code-only access. Site live at https://oxfordmedics96.com as a static site: no accounts, no database, no email. The front page is public; the photos, speeches and map open with one 8-digit class code shared within the year group. Sign-in (Supabase and Resend) was removed on 2026-10-25 because it had started to cost money; everything needed to bring it back is under "Sign in" below. Current focus: the owner publishes the photo archive with `scripts/build-archive.mjs` (steps in `docs/photo-archive.md`).

## Site brief

- **Site name and domain:** Oxford Medics 96. Domain: oxfordmedics96.com.
- **Purpose:** A private place for the Oxford medical students of 1996 to view old photos, read the reunion speeches, and see where everyone ended up.
- **Audience:** Oxford medical alumni who graduated in 1996, across multiple colleges. Now in their 50s. Needs: large readable text, simple navigation, works on phone and desktop.
- **Access:** One 8-digit class code (numbers only), remembered on the device. The public sees the front page only. The photos and speeches are stored encrypted with a key made from the code, so the files on GitHub are unreadable without it. This protects against browsing, not against a determined attacker: an 8-digit code can be tried by brute force with specialist tools. If the code leaks, the organisers change it and republish.
- **Core features now:** photo archive grouped by occasion with search, year filter, small and large views, and a full-screen viewer; the speeches (text, view as PDF, download); the known-locations map.
- **Pages:** Landing (public), Photos, Photo, Speeches, Speech, Where are we now, Privacy. The code prompt appears in place of any page behind the code.
- **Content:** The owner publishes photos from a folder on their computer (titles, years, places and categories can come from a CSV) and speeches from a private folder, using one script. No member data is held by the site.
- **Visual style:** Calm, two-colour system (tokens in `src/index.css`). Navy `#002147` and one rose accent `#E8A6BD` (deep `#A6476F`, soft `#F8ECF1`), stone and mist neutrals, warm paper background, serif headings, sans body. No ribbons or gradients. Every text pairing 4.5:1 or better. Footer credit "Website by Indi Gupte, powered by SportsHealing Technologies" (linked) on every page.
- **Tone:** Warm, plain, a little nostalgic. Short sentences.
- **Legal and safety:** UK GDPR. Speeches shared with the speakers' permission. Location and camera data stripped from every picture. No face recognition. Avoid official University of Oxford crests or logos without permission.

## Decisions made

- Project lives in `SportsHealing/oxford-medicals-96-website`, a public repository (decided 2026-10-08; GitHub Pages is free only for public repositories).
- 2026-10-25: sign-in, Supabase and Resend removed; access by one class code; photos and speeches encrypted in the repository. May be re-implemented later.
- 2026-10-25: the class code was chosen to be easy for the year group to remember. It was given to the owner privately and is never written in this repository. Change it by republishing the archive.
- 2026-10-21: owner chose to wait for Supabase's billing reset rather than pay, then decided to drop Supabase altogether.
- Earlier: 1996 is the graduation year; Tingewick pink from tingewick.org and the Rita logo; palette navy plus one softened rose; manual tagging first, face recognition later and opt-in only (both now out of scope without sign-in); hosting GitHub Pages via GitHub Actions, DNS in AWS Route 53.

## Open questions

- None blocking. See the to-do list.

## Files

- `STATUS.md`: this file. `README.md`: how to run and where things are.
- `docs/photo-archive.md`: how the owner publishes photos and speeches and changes the code.
- `src/access.tsx`, `src/components/CodeGate.tsx`: the code prompt and whether the device has the code (key kept in localStorage; Lock in the footer forgets it).
- `src/lib/vault.ts`: key recipe (PBKDF2-SHA256, 600,000 rounds, fixed salt; AES-256-GCM; 12-byte IV then ciphertext and tag). Must match `scripts/build-archive.mjs`.
- `src/data/archive.ts`: fetches and decrypts `/archive/speeches.enc` (speeches and quotes), `/archive/photos.enc` (photo list) and the pictures `/archive/p/<id>.enc` (2400px) and `/archive/t/<id>.enc` (640px); decrypted pictures become object URLs for the visit. `src/components/EncImage.tsx` shows one.
- `public/archive/`: the published archive. `speeches.enc` (in the repository) holds the two 2026 speeches (text, PDFs and 12 banner quotes), built 2026-10-25. The photos (`photos.enc`, `p/`, `t/`) are not in the repository: the owner's script uploads the whole archive as `archive.tar` to the GitHub release tagged `archive`, and `.github/workflows/deploy.yml` downloads and unpacks it into `dist/archive` on every build (a copy of `speeches.enc` in the tar overrides the repository's). GitHub's limit of about 500 created files an hour ruled out committing the ~1,550 files one by one.
- `public/sw.js`: service worker keeping archive files on the device (lists network-first, pictures cache-first). Cleared by Lock.
- `scripts/build-archive.mjs`: `photos <folder> [csv]`, `speeches <folder>`, `upload` (packs `archive.tar`, replaces it on the `archive` release, triggers the deploy workflow; token needs Contents and Actions read and write). Exact duplicate pictures are listed once. Photo ids are the first 16 hex characters of the SHA-1 of the file, the same as the old Supabase `storage_path`, so a CSV export of the old photos table matches by content.
- `src/pages/Landing.tsx`: public front page with `public/landing.jpg` (2026 reunion photo) and `public/then-1996.jpg` as an old print, the View photos call to action, and, once the code is in, the quote banner. `public/known-locations.jpg`: the organisers' map (town counts only).
- `public/archive/extra.enc` and `public/archive/x/`: the two front-page class photos (1996 and September 2026), encrypted and kept in the repository so the front page can open the grid with one highlighted (`/photos?focus=class-1996`, `focus=reunion-2026`). Photos without a real title show as "Photo 1", "Photo 2"... in display order; the script marks CSV titles as `named` so they are kept.
- Names and places on photos (2026-10-25): `src/components/PhotoNotes.tsx` on the photo page ("Who's in this photo" and "Place": Edit, type, Save); `src/lib/notes.ts` encrypts each photo's notes with the code key (AES-GCM, last 20 versions kept inside) and stores them through `cloudflare/notes-worker.js` (Cloudflare Worker + KV namespace bound as `NOTES`; GET is open but returns ciphertext, PUT needs `X-Archive-Token` = SHA-256(raw key ‖ "om96-notes-write"), and the Worker holds only SHA-256 of that token as `WRITE_HASH`). Hidden until `NOTES_URL` in `src/lib/notes.ts` is set. Set-up: `docs/naming-setup.md`. Full screen shows no title, names or place.
- `src/pages/Gallery.tsx`, `PhotoView.tsx`, `src/components/PhotoLightbox.tsx`: the archive, grouped by the 10 occasions in `src/lib/photoCategories.ts`, with Previous/Next inside a category (`?in=`).
- `src/pages/Speeches.tsx`, `SpeechView.tsx`, `src/components/SpeechBody.tsx`: speeches by year; text rendered from paragraphs, `## ` headings, bold, italic and embedded `data:image` pictures (never HTML); PDF-only speeches shown on the page on wide screens.
- Kept for the future (not used by the site): `supabase/migrations/0001` to `0015`, `supabase/functions/{send-invites,join-requests,sort-photos}`, `scripts/download-kululu.mjs`, `scripts/dedupe-photos.mjs`, `scripts/import-photos.mjs`, `scripts/make-thumbnails.mjs`, `docs/phase-b-setup.md`, `docs/invites-setup.md`, `docs/sign-up-setup.md`, `docs/photo-import.md`, `docs/photo-sorting.md`, `docs/email-templates/`, `docs/website-brief-v2.md`, `docs/alumni-questionnaire.md`.

## Sign in

Removed on 2026-10-25 (commit "Code-only access"). The last version of the site with sign-in is commit `b04ea0b` (2026-10-20, "Speeches tab"); browse it on GitHub under that commit, or restore files from it with `git checkout b04ea0b -- src`.

**Why.** Supabase's free plan allows 5 GB of downloads a month. Photos were re-downloaded on every visit (each visit made new signed links), so 70 members used 27 GB in October and Supabase blocked the project until 5 November. Staying would have meant Pro at about $25 a month. The owner chose a free, static site instead.

**Features lost with sign-in** (all need a backend):
- Member accounts: email code or password sign-in, invitations by email (Resend), self-service sign-up with admin review, name matching against the class list, "Set a password" prompt.
- Classmates directory and profiles: name at medical school, college, specialty, job, workplace, town and country, links (LinkedIn, website, Instagram, X, Wikipedia, ORCID, Scholar, hospital), profile pictures, opt-in email display, the person finder with specialty filters.
- "Where are we now" from profiles: the interactive UK and world maps and the Home heat map built from members' towns. Only the organisers' static map remains.
- Tagging: suggesting who is in a photo, confirmation by the tagged person, "In this photo" lists, pending-tag reminders.
- Messages: contact requests between classmates, the inbox on the Me page.
- Member photo uploads from the site, with tag-as-you-go. Photos are now added by the owner's script.
- Admin page: invites, people and class-list import, join requests (accept or decline with email), remove access, make admin, delete photos, Feature on Home.
- Photo sorting on the site (select and move, Edit details) and the AI sorter. Categories now come from the CSV given to the script.
- Adding or deleting speeches on the site. Now done with the script.
- Per-member privacy controls (hide email, remove own tag, delete own profile).
- The members' Home page (welcome by name, featured-photo slideshow). The front page now carries the then-and-now photos and, once unlocked, the quote banner.

### Future sign in implementation

Everything below is what was in place on 2026-10-20 and what to do to bring it back.

**Accounts and services**
- Supabase project (owner's account, free plan). Keep the project alive or export its data: free projects pause after about a week without traffic and paused projects are eventually deleted. Export now (SQL Editor, run `select * from <table>` and download the CSV, or Database, Backups): `members`, `allowed_emails`, `roster`, `photos`, `photo_tags`, `join_requests`, `messages`, `speeches`, `speech_quotes`. The photo files in the `photos` bucket are the same as the Kululu folder on the owner's PC plus any member uploads (paths `<user-id>/<uuid>.jpg`); download those from Storage before the project goes.
- Resend account with the domain oxfordmedics96.com verified; sending address `hello@oxfordmedics96.com`. Its DNS records (DKIM TXT, the `send` subdomain MX and SPF, and DMARC if added) are in AWS Route 53 and can stay. The Resend API key lived only in Supabase Edge Function secrets.
- GitHub repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the `sb_publishable_` key; legacy JWT keys were disabled) under Settings, Secrets and variables, Actions. They may still be set; the workflow no longer reads them.
- Anthropic API key (optional AI photo sorter): stored only as a Supabase secret.

**Database.** Migrations `supabase/migrations/0001_init.sql` to `0015_speech_library.sql`, run in order in the SQL Editor. 0001 to 0011 had been run on the live project; 0012 to 0015 had not (they add speeches, PDF downloads, photo categories and the speech library). Each is safe to run more than once. They create: tables `members` (one row per auth user, `is_admin`, profile columns), `allowed_emails`, `photos` (`storage_path`, `thumb_path`, `featured_rank`, `category`), `photo_tags` (pending, confirmed, rejected), `messages`, `roster` (class list, email where known), `join_requests`, `speeches`, `speech_quotes`; private buckets `photos` and `avatars`; row-level security (members read, people edit their own, admins manage), column grants hiding emails; functions `is_member`, `is_admin`, `set_admin`, `my_email`, `member_contact_emails`, `admin_unrecognised_signins`, `claim_access` (sign-up by email on the list or name on the class list), `take_join_notice`, `decide_join_request`, `admin_remove_access`, `admin_import_people`; triggers that make a member row on sign-up, grant membership when an email is added to the list, and guard `featured_rank`. Name matching (nicknames, spelling distance) is in 0010. Tested against a local Postgres copy (24 sign-up scenarios, 32 name cases).

**Auth settings.** Email provider on; sign in by emailed 8-digit code (the OTP email template was changed from 6 to 8 digits; templates in `docs/email-templates/`) or by password; rate limit "emails sent per hour" raised for batches of invitees; site URL and redirect URL set to https://oxfordmedics96.com; "Confirm email" off for the OTP flow. The `ADMIN_EMAILS` secret named who gets join-request emails.

**Edge Functions** (Supabase, Edge Functions, deployed by pasting each `index.ts`, Verify JWT off because each function checks the caller itself): `send-invites` (secrets `RESEND_API_KEY`, optional `SITE_URL`, `INVITE_FROM`), `join-requests` (`RESEND_API_KEY`, `ADMIN_EMAILS`, `SITE_URL`, `INVITE_FROM`), `sort-photos` (`ANTHROPIC_API_KEY`; Claude Haiku 5.5 suggests a category per photo from the thumbnail). Set-up steps: `docs/invites-setup.md`, `docs/sign-up-setup.md`, `docs/photo-sorting.md`.

**Front end.** At `b04ea0b`: `src/lib/supabase.ts` (client from the two env vars; prototype mode without them), `src/auth.tsx` (session, member row, `claimAccess`, password set-up), `src/data/types.ts` (`Repo` contract), `src/data/supabaseRepo.ts` (all reads and writes; signed URLs in batches of 500; feature detection for columns not yet migrated), `src/data/sample.ts` (demo data), pages Sign in, Classmates, Profile, Contact, Me, Admin, Add photos, Home, components RequireMember, JoinPanel, PasswordPrompt, Avatar, SocialLinks, TownPicker, ClassmatesMap and WorldHeatMap (d3-geo, outlines in `public/geo/`), PhotoCarousel, ThenAndNow, SortTools, PhotoDetailsForm, AddSpeechForm. Packages `@supabase/supabase-js`, `d3-geo`, `@types/d3-geo`.

**Steps to re-enable**
1. Restore the files above from `b04ea0b` (the archive-based Photos and Speeches pages can stay alongside, or be swapped back to the database versions).
2. `npm install @supabase/supabase-js d3-geo` and `npm install -D @types/d3-geo`; put the two `VITE_SUPABASE_*` lines back in `.github/workflows/deploy.yml` under the build step, and set the repository variables.
3. Supabase: new or revived project; run migrations 0001 to 0015; create the buckets if 0001 did not; deploy the three functions with their secrets; set the Auth settings above.
4. Import photos with `scripts/import-photos.mjs` (service key, run on the owner's PC, `docs/photo-import.md`) and thumbnails with `scripts/make-thumbnails.mjs`; add the class list with the Admin page's Add people tab or `admin_import_people`; add allowed emails and send invites.
5. Avoid the download problem: keep the 3-day reusable signed links and the service worker from commit `aa564a8` (2026-10-19), or serve pictures through a CDN that caches them, or keep the pictures in this encrypted archive and use Supabase only for accounts and profiles. Expect Supabase Pro (about $25 a month) if traffic is heavy.
6. Restore members' data from the exports (`allowed_emails` and `roster` first, so people can sign in; `photo_tags` need the same photo ids, which `import-photos.mjs` reproduces from file content).

## To-do list

**Now**
- [x] Owner: `photos` step run on the Kululu folder, 2026-10-25: 777 pictures, 0 unreadable, 1 exact duplicate (shown once).
- [x] Owner: `upload` step, 2026-10-25: 1,554 files packed (226 MB) onto the `archive` release; site rebuilt and deployed with the archive (Pages artifact 237 MB).
- [ ] Owner: delete the GitHub token used for the upload.
- [ ] Owner: set up the Cloudflare notes Worker (`docs/naming-setup.md`, about 10 minutes) and send the Worker address so `NOTES_URL` can be set. Until then naming on photos is hidden.
- [ ] If the class code changes: update `WRITE_HASH` in the Worker and carry existing notes over (they are encrypted with the old code).
- [ ] Owner: optional, before Supabase pauses the old project: export the `photos` table as CSV (titles, years, places, categories) and give it to the `photos` step, and export the other tables for the future (see "Sign in").
- [ ] Owner: share the class code with the year group, by a private message rather than a public post.
- [ ] Owner: Supabase, remove the GitHub repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if not wanted (harmless), and decide whether to keep the Supabase and Resend accounts (free to keep; export data first if not).
- [x] 2026-10-25: speeches published in `public/archive/speeches.enc` (Jo and Simon, 2026, with PDFs and 12 quotes).
- [x] Reunion group photo on the public front page (`public/landing.jpg`, `landing-800.jpg`) with the 1996 class photo (`public/then-1996.jpg`) as an old print, 2026-10-10.
- [x] Owner: decided the GitHub repository stays public (2026-10-08).

**Later**
- [ ] Older speeches: build a speeches folder (see `docs/photo-archive.md`) and republish.
- [ ] Photo titles, years and places: the owner sends corrections; apply them in the CSV and republish.
- [ ] If the code leaks: change it and republish (steps at the end of `docs/photo-archive.md`).
- [ ] Sign in again, if the group wants profiles, tagging and messages back: "Future sign in implementation" above.
- [ ] Proper Rita artwork.

## Clean-up at the end (user request)

When the site is finished, remove everything installed on the user's PC during this project. Nothing on the PC is needed to keep the site running; it all lives on GitHub. Keep the original photo folder somewhere safe, since it is the source for any republish.

- Node.js: Windows Settings, Apps, Installed apps, Node.js, Uninstall.
- The project folder (includes `node_modules` and `public\archive`).
- Playwright browsers: delete the folder `%USERPROFILE%\AppData\Local\ms-playwright`.
- npm cache: delete `%USERPROFILE%\AppData\Local\npm-cache` and `%USERPROFILE%\AppData\Roaming\npm`.
- Any `.env` file or Command Prompt history containing a Supabase service key or a GitHub token. Delete used GitHub tokens on GitHub (Settings, Developer settings).
- Keep: the GitHub and AWS accounts; they run the live site. Supabase and Resend can be closed once their data has been exported.

## Handover notes

- Hosting: the site is built and served by GitHub Pages from the `main` branch; AWS (Route 53) only provides the domain name. The site is fully static, so it can move to any static host (Cloudflare Pages, Netlify) by building `dist/` and repointing the Route 53 records. GitHub Pages only works for a private repository on a paid GitHub plan.
- The photo archive lives on the `archive` release, not in the repository, so the repository stays small. GitHub Pages sites are limited to 1 GB; the archive is a few hundred MB.
- Claude cannot be trained to recognise faces and does not identify people from their faces.
- Rita logo is a placeholder drawing. Replace with a proper illustration or the cohort's own Rita artwork if they have one.
