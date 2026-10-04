# Project status: Oxford Medics 96

Last updated: 2026-10-04 (Europe/London)

## Current phase

Phase 1: Understand. Step 5 (final brief shown, awaiting build approval).

## Site brief

- **Site name and domain:** Oxford Medics 96. Domain: oxfordmedics96.com (obtained).
- **Purpose:** A private place for the Oxford medical students of 1996 to view old photos, identify classmates, and see what they do now.
- **Audience:** Oxford medical student alumni from 1996, across multiple colleges. Now in their 50s. Needs: large readable text, simple navigation, works on phone and desktop.
- **Access:** Signed-in members only. Alternative: each member gets a unique personal access code. Public sees a landing page only.
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
- **Visual style:** Clean serif headings, clean sans body. Oxford navy with a softened Tingewick pink (Rita the Pink Elephant).
  - Navy `#002147`: text, headers. 16:1 on white.
  - Rita pink, soft `#F4B6CF`: highlights, tag markers, backgrounds behind navy text. 9.5:1 with navy.
  - Rita pink, deep `#B03A6F`: links and buttons. 5.7:1 on white.
  - Blush `#FBE6EE`: section backgrounds.
  - White `#FFFFFF`: page background.
  - Pink values are provisional. tingewick.org could not be fetched from this environment.
- **Tone:** Warm, plain, a little nostalgic. Short sentences.
- **Legal and safety:** UK GDPR. Consent before a tag is published. Any member can remove a tag of themselves. Privacy notice. Facial recognition needs explicit opt-in and a DPIA. Avoid official University of Oxford crests or logos without permission.

## Build scope

- Phase A (now): clickable static prototype with sample photos and sample profiles.
- Phase B: real sign-in or access codes, real photos and profiles, tagging with confirmation. Needs a backend.
- Phase C: opt-in face matching that suggests tags for a human to confirm.

## Decisions made

- Project lives in `SportsHealing/oxford-medicals-96-website`. Unrelated to kneescore-research.
- Community is the 1996 Oxford medical cohort, all colleges.
- Members-only access, with personal codes as an option.
- Manual tagging first. Face recognition later and opt-in only.
- Profiles are built from questionnaire answers.
- Palette: Oxford navy plus softened Tingewick pink.

## Open questions

- Sign-in method: email login or personal access codes?
- Static-only rule: a static site cannot truly protect members-only photos. Allow a small backend from Phase B?
- Tingewick pink: confirm or supply the exact shade.
- "1996": year of matriculation or graduation?

## Files

- `STATUS.md`: project status and brief. In progress.
- `docs/alumni-questionnaire.md`: draft questions for alumni. Draft.

## Next step

Ask: "Shall I build the site from this brief?" Then build Phase A.

## Handover notes

- Source: one page of handwritten notes, then answers in chat.
- Claude cannot be trained to recognise faces and does not identify people from their faces. Face matching would use a dedicated service, run only for members who opt in.
- Real photos of identifiable people must not go on a public URL before access control exists.
