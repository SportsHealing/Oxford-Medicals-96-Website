# Importing the photos

Two steps: get the 744 photos off Kululu onto your computer, then push them into the site in one go.

## Step 1: download from Kululu

**Best route: Download All.** Kululu has a "Download All" button that gives the album owner a ZIP of every photo. It is on their Plus and Pro plans. If you (or whoever created the album) can use it, do that: it is the only route that guarantees full-resolution originals.

**Fallback: the script.** If Download All is not available, run on your own computer:

```sh
git clone https://github.com/SportsHealing/Oxford-Medicals-96-Website.git
cd Oxford-Medicals-96-Website
npm install
npm i -D playwright && npx playwright install chromium
node scripts/download-kululu.mjs https://app.kululu.com/oxfordmedics30years ./kululu-photos
```

A browser window opens. If the album asks for a name or password, type it in that window. The script then scrolls through the album, opens each photo, and saves the largest version it sees into `kululu-photos/`. It takes 10 to 20 minutes for 744 photos. If it saves nothing, it writes `kululu-page.html`; send that file to Claude and the script will be adjusted.

## Step 1b: remove preview copies

The download saves both Kululu's small preview and the full-size version of many photos. Run:

```
npm i -D sharp
node scripts/dedupe-photos.mjs ./kululu-photos
```

It moves preview copies to `kululu-photos-duplicates` and any photo with no full-size version to `kululu-photos-small` for you to check. Nothing is deleted. Look at the `-small` folder: if those photos are worth keeping, move them back into `kululu-photos`.

## Step 2: upload to the site

1. In Supabase: Project Settings, API Keys, **Legacy anon, service_role API keys** tab, Reveal the `service_role` key. This key bypasses every access rule. Use it only on your own computer, never put it in the website or share it.
2. Optional: make `captions.csv` with a header row `file,title,year,place,caption` and one row per photo you want described. Unlisted photos get their file name as the title.
3. Run:

```sh
SUPABASE_URL=https://YOURREF.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=PASTE_KEY_HERE \
node scripts/import-photos.mjs ./kululu-photos ./captions.csv
```

Safe to re-run: photos already uploaded are skipped. Afterwards, the photos appear on the site for all members. Titles, years and places can be tidied later from the Admin page.
