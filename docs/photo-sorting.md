# Sorting the photos into categories

The Photos page groups photos by occasion: Graduation, Tingewick, Balls & dinners,
Parties & nights out, Sport, Wards & studies, Friends & everyday life,
Trips & electives, Reunions, Other. Photos with no category show under
"Not sorted yet". Members browse a grid of small thumbnails, filter by category,
year or a search, and Previous/Next on a photo stays inside the category it was
opened from.

## Step 1: turn it on (2 minutes)

Supabase, SQL Editor, New query: paste all of
`supabase/migrations/0014_photo_categories.sql` and press Run. Until then the
site works as before, without categories.

## Step 2: sort by hand (any time)

Admins: Photos page, press **Sort photos**.

1. Tap photos to select them. Hold Shift and click to select a run.
2. At the bottom of the screen choose **Move to…**, pick a category, press **Move**.
3. Press **Done sorting** when finished.

Admins, and whoever added a photo, can also open a photo and press
**Edit details** to change its title, year, place, caption and category.

## Step 3 (optional): let AI suggest categories

The AI looks at each photo's small thumbnail and suggests a category. Photos
still named after their file (for example `IMG_1234.jpg`) also get a short
title such as "Rowing eight on the river". It never names people, and it
never changes a photo someone has already sorted. Every suggestion is marked
**AI** in sorting mode and can be changed.

Cost: well under $1 for 800 photos (Claude Haiku 5.5, charged by Anthropic).
It takes 10 to 20 minutes with the page left open.

1. Make an Anthropic API key: go to console.anthropic.com, sign in, add a
   payment method and a small amount of credit ($5 is plenty) (Settings, Billing), then
   Settings, API keys, **Create key**. Copy it. Do not paste it anywhere else,
   including chats.
2. Supabase, Edge Functions, Secrets: add a secret named `ANTHROPIC_API_KEY`
   with the key as its value.
3. Supabase, Edge Functions, **Deploy a new function**, Via editor. Name it
   exactly `sort-photos`. Replace the starter code with everything in
   `supabase/functions/sort-photos/index.ts`. Deploy. Then open the function's
   Details and turn **Verify JWT** off (the function checks the caller is an
   admin itself), as for the other two functions.
4. On the site: Photos, **Sort photos**, **Suggest categories with AI**. Keep
   the page open. **Stop** pauses; **Carry on with AI** continues.

Privacy: thumbnails are sent to Anthropic only for this. By default Anthropic
does not use data sent through its API to train its models. Delete the secret afterwards if you like;
the site does not need it for anything else.
