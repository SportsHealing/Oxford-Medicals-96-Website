# Project status: Oxford Medics 96

Last updated: 2026-10-04 (Europe/London)

## Current phase

Phase 2: Build. Phase A prototype redesigned (cleaner visual pass). Awaiting review.

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
  - Face recognition: deferred to a later, opt-in phase.
- **Pages:** Landing (public), sign in, photo gallery, photo view with tags, classmates directory, profile, contact request, privacy notice.
- **User journey:** Sign in. Browse photos. Tag or confirm a classmate. Open their profile. See their current work. Send a contact request or open LinkedIn.
- **Content:** Admins upload photos. Member information arrives as text answers to a questionnaire (see `docs/alumni-questionnaire.md`). Photos and answers will be supplied later.
- **Data collected:** Name, college, photos, questionnaire answers, contact preferences, tag confirmations. Facial data only in the later opt-in phase.
- **Visual style:** Calm and airy. Warm off-white page (#FBFAF8), white cards with hairline borders, serif headings, sans body. Navy for text, pink used sparingly as the one accent. Shared page header, initials avatars, pill buttons.
  - Navy `#002147`: text, headers. 16:1 on white.
  - Tingewick pink `#FB67AA` (from tingewick.org): accents, brand marks, backgrounds behind navy text. 5.8:1 with navy.
  - Rita pink `#F7B7D0` (sampled from the Rita logo): tag markers, soft highlights. 9.7:1 with navy.
  - Deep pink `#B8396F`: links and buttons on white. 5.5:1 on white.
  - Blush `#FDEAF2`: section backgrounds.
  - White `#FFFFFF`: page background.
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
- Palette: Oxford navy plus softened Tingewick pink.
- Hosting: GitHub Pages via GitHub Actions. DNS in AWS Route 53.

## Open questions

- None blocking.

## Files

- `STATUS.md`: project status and brief. In progress.
- `docs/alumni-questionnaire.md`: draft questions for alumni. Draft.
- `src/`: Phase A prototype (Vite, React, Tailwind). Built, lint clean, screenshots checked.
- `src/data/sample.ts`: fictional sample people, photos, tags.
- `scripts/make-sample-photos.py`: generates placeholder photos.

## Next step

User finishes DNS (www CNAME) and enables GitHub Pages with the custom domain. Confirm https://oxfordmedics96.com loads. Then start Phase B (Supabase email sign-in).

## Handover notes

- Source: one page of handwritten notes, then answers in chat.
- Claude cannot be trained to recognise faces and does not identify people from their faces. Face matching would use a dedicated service, run only for members who opt in.
- Real photos of identifiable people must not go on a public URL before access control exists.
- Rita logo is a placeholder drawing. Replace with a proper illustration or the cohort's own Rita artwork if they have one.
