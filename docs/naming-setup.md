# Names and places on photos: one-off set-up

Anyone with the class code can say who is in a photo and where it was taken:
on a photo's page, **Edit** (or **Add names**), type, **Save**. Others see
the change straight away and can correct it the same way. Full screen shows
the photo only.

The website itself is just files, so the names need a small free service to
keep them: a Cloudflare "Worker" with a storage box. The names are scrambled
with the class code in the visitor's browser before they are sent, so
Cloudflare only ever stores gibberish. The free plan allows 100,000 visits
and 1,000 saves a day, far more than the class needs, and asks for no card.

Until this is done the site works as before, with no naming on photos.

## Steps (about 10 minutes)

The Cloudflare menus move around from time to time; the names below are the
ones to look for.

1. **Sign up.** Go to dash.cloudflare.com and create a free account (email
   and password). If it asks to add a website or domain, skip that.
2. **Make the storage box.** In the left menu open **Storage & databases**,
   then **Workers KV**. Press **Create** (or **Create namespace**), name it
   `om96-notes`, and press **Add** / **Create**.
3. **Make the Worker.** In the left menu open **Compute (Workers)** (or
   **Workers & Pages**), press **Create**, choose **Start with Hello World**,
   name it `om96-notes`, and press **Deploy**.
4. **Put in the code.** Press **Edit code**. Select everything in the editor
   and delete it. Paste in everything from `cloudflare/notes-worker.js` (from
   this repository, or the copy sent in chat). Press **Deploy**.
5. **Connect the box to the Worker.** Go back to the Worker's page, open
   **Bindings** (sometimes under **Settings**), press **Add binding**, choose
   **KV namespace**. Variable name: `NOTES` (capitals). Namespace:
   `om96-notes`. Press **Add binding** / **Save**.
6. **Check it.** On the Worker's page, copy its address, which looks like
   `https://om96-notes.something.workers.dev`. Open it in a browser tab. You
   should see `{"ok":true,"service":"Oxford Medics 96 notes"}`.
7. **Tell the website.** Send that address to Claude, or on GitHub open
   `src/lib/notes.ts`, press the pencil icon, put the address between the
   quotes on the line `export const NOTES_URL = ''` (no slash at the end),
   and press **Commit changes**. The site updates in about 3 minutes and the
   names section appears on every photo.

## Good to know

- Anyone with the class code can change names and places. Each photo keeps
  its last 20 versions (scrambled, with the rest), so a mistake can be put
  right; ask Claude to restore an earlier version if needed.
- If the class code changes, the line `const WRITE_HASH = '...'` in the
  Worker must be updated (ask Claude for the new value), and names saved
  under the old code can no longer be read. Ask for them to be carried over
  before changing the code.
- To remove everything: delete the Worker and the `om96-notes` storage in
  Cloudflare, and empty `NOTES_URL` again.
