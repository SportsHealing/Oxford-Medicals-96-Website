# The photo archive and the class code

The site has no accounts. Everything beyond the front page opens with one
8-digit class code. The photos and speeches are published as encrypted files
in this repository (`public/archive/`): the code is turned into the key that
unscrambles them, in the visitor's browser. The code itself is never stored
on the site or in this repository, so keep it out of this folder, out of
GitHub, and share it only within the year group.

What this gives: the archive is unreadable to anyone browsing GitHub or the
site without the code. What it does not give: protection against a determined
attacker with specialist tools, who could try all 100 million 8-digit codes
against the files. If the code ever leaks, change it (see the end).

## Once: get set up on your computer

1. Download the project: on GitHub, open the repository, press the green
   **Code** button, then **Download ZIP**. Unzip it somewhere easy, such as
   `Documents\oxford-medics-96`.
2. Install Node.js if it is not there already (nodejs.org, the LTS version).
3. Open a Command Prompt in the project folder: in File Explorer, click the
   address bar, type `cmd` and press Enter.
4. Type `npm install` and press Enter. This fetches the picture library. It
   takes a minute or two.

## Publishing the photos

You need a folder of the original pictures on your computer (the Kululu
download, plus anything added since). JPEG, PNG and WebP files are read;
sub-folders are fine.

Optional but worth doing: a CSV of titles, years, places and categories.
If the old Supabase project is still reachable, SQL Editor, New query, run:

```sql
select title, year, place, caption, storage_path, category from photos;
```

and press the download button on the results to save `photos.csv`. The
script matches each row to a picture by content, so file names do not
matter. Without a CSV, each photo is titled from its file name.

Then, in the Command Prompt in the project folder (one line each, with the
real code and folder):

```
set ARCHIVE_CODE=12345678
node scripts\build-archive.mjs photos C:\path\to\kululu-photos C:\path\to\photos.csv
```

Each picture is shrunk to 2400px, given a 640px thumbnail, stripped of
camera and location data, encrypted and written to `public\archive`. 800
photos take about ten minutes. Safe to run again: pictures already done are
skipped, so adding new photos to the folder and re-running is quick.

## Uploading to GitHub

The script can push the archive to GitHub for you, which publishes the site.
It needs a token that lets it write to this repository:

1. On GitHub, click your profile picture (top right), **Settings**.
2. At the bottom of the left menu, **Developer settings**, then
   **Personal access tokens**, **Fine-grained tokens**, **Generate new token**.
3. Name: `archive upload`. Expiration: 7 days. Repository access: **Only
   select repositories**, pick this repository. Under **Permissions**,
   **Repository permissions**, set **Contents** to **Read and write**.
4. Press **Generate token** and copy it. It is shown once.

Then in the Command Prompt:

```
set GITHUB_TOKEN=paste-the-token-here
node scripts\build-archive.mjs upload
```

Files already on GitHub are skipped, so re-uploads only send what changed.
The site updates a few minutes after the upload finishes (Actions tab on
GitHub shows a green tick). Afterwards, delete the token on GitHub.

If the upload will not work, the fallback is GitHub Desktop (a free app):
sign in, **Clone** this repository, copy your `public\archive` folder over
the one in the clone, then **Commit to main** and **Push origin**.

## Adding photos later

Put the new pictures in the same folder and run the `photos` step and the
`upload` step again. To remove a photo, delete it from the folder, delete
the whole `public\archive\p` and `public\archive\t` folders, run `photos`
again, then upload. (Files removed from `public\archive` are not removed
from GitHub by the script; delete them on the GitHub website if you want
them gone from the repository as well.)

## Speeches

The speeches are published the same way, from a private folder on your
computer (not in this repository) holding `speeches.json`, the text files
and PDFs it names. For example:

```json
[
  {
    "slug": "ten-years-on",
    "title": "Ten years on",
    "speaker": "Alex",
    "occasion": "10th reunion dinner",
    "year": 2006,
    "pdf": "Ten years on.pdf",
    "quotes": ["A line from the speech for the front page banner."]
  },
  {
    "slug": "thirty-years",
    "title": "30 years!",
    "speaker": "Jo",
    "year": 2026,
    "text": "jo.txt",
    "pdf": "30 years - Jo.pdf",
    "quotes": [{ "text": "A quote", "attribution": "Someone else, quoted by Jo" }]
  }
]
```

`slug` becomes the web address (lower-case letters, digits and dashes).
Each speech needs a `text` file and/or a `pdf`. In a text file, a blank line
starts a new paragraph, a line starting `## ` is a heading, `**bold**` and
`*italic*` work, and `![caption](data:image/jpeg;base64,...)` embeds a
picture. Then:

```
set ARCHIVE_CODE=12345678
node scripts\build-archive.mjs speeches C:\path\to\speeches-folder
node scripts\build-archive.mjs upload
```

The current speeches folder (the two speeches from the 2026 dinner and
their quotes) was prepared by Claude and is not in this repository; ask for
a copy before adding to it, or rebuild the folder from the PDFs.

## Changing the code

Delete the `public\archive` folder, set the new `ARCHIVE_CODE`, run the
`photos` step and the `speeches` step again, then `upload`. Everyone will
need the new code; devices remembering the old one are asked again.
