# Oxford Medics 96

Private website for Oxford medics who graduated in 1996. Old photos, who is in them, and what everyone does now.

Live domain: oxfordmedics96.com. See `STATUS.md` for the brief and current phase.

## Phase A: prototype

Clickable static prototype with fictional sample people and photos. No real data, no real sign-in.

```sh
npm install
npm run dev       # local preview
npm run build     # static output in dist/
npm run lint
```

Sample photos are generated SVGs. Regenerate with `python3 scripts/make-sample-photos.py`.

## Structure

- `src/pages/`: one file per page (landing, sign-in, gallery, photo, classmates, profile, contact, privacy).
- `src/data/sample.ts`: sample people, photos and tags. Replace with a database in Phase B.
- `src/auth.tsx`: pretend sign-in. Replace with Supabase Auth in Phase B.
- `docs/alumni-questionnaire.md`: questions sent to alumni to build their profiles.

## Next phases

- Phase B: email sign-in, private photo storage, real profiles, tag confirmation. Backend: Supabase.
- Phase C: opt-in face matching that suggests tags for a person to confirm.
