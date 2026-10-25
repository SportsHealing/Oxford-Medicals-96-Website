# Oxford Medics 96

Private website for the Oxford medical class of 1996: the old photos, the
reunion speeches, and where everyone ended up. Live at oxfordmedics96.com.

The site is static (no accounts, no database). Everything beyond the front
page opens with one 8-digit class code. Photos and speeches are published as
encrypted files under `public/archive/`; the browser turns the code into the
key that reads them. How to publish photos and speeches: `docs/photo-archive.md`.
Project status, decisions and the to-do list: `STATUS.md`.

```sh
npm install
npm run dev       # local preview at http://localhost:5173
npm run build     # static output in dist/
npm run lint
```

## Structure

- `src/pages/`: Landing (public), Gallery and PhotoView, Speeches and SpeechView, MapPage, Privacy.
- `src/access.tsx`: whether this device has the class code; `src/components/CodeGate.tsx` asks for it.
- `src/lib/vault.ts`: the key recipe (PBKDF2, AES-GCM); `src/data/archive.ts` reads and decrypts the archive.
- `scripts/build-archive.mjs`: encrypts a photo folder or a speeches folder and uploads the result to GitHub.
- `public/sw.js`: keeps the encrypted files on the device after the first visit.
- `supabase/`, `scripts/import-photos.mjs`, `scripts/make-thumbnails.mjs`, `docs/*-setup.md`: the earlier sign-in version (Supabase and Resend), kept for a future return; see "Sign in" in `STATUS.md`.

## Hosting

GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main`. Custom domain is set by `public/CNAME`. DNS lives in AWS Route 53: an A record at the apex pointing to the GitHub Pages IPs, and a CNAME on `www` pointing to `sportshealing.github.io`.
