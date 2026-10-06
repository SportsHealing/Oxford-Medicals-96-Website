# Phase B setup: Supabase

Supabase gives the site real email sign-in, a private database and private photo storage. Nothing is visible to anyone who is not on the members list.

## 1. Create the project (you)

1. Go to https://supabase.com and sign up (free tier is fine).
2. New project. Name: `oxfordmedics96`. Region: London (eu-west-2). Choose a strong database password and keep it somewhere safe; the site never needs it.
3. Wait a minute for the project to start.

## 2. Apply the schema (you, one paste)

1. In the Supabase dashboard open **SQL Editor**, then **New query**.
2. Paste the whole of `supabase/migrations/0001_init.sql` and click **Run**.
3. You should see "Success. No rows returned".

## 2b. Apply the privacy migration (you, one more paste)

Same as step 2, with `supabase/migrations/0002_privacy.sql`. It stops members reading each other's email addresses or promoting themselves to admin, and adds the message inbox.

## 2c. Let members upload photos (you, one more paste)

Same as step 2, with `supabase/migrations/0003_member_uploads.sql`. Members can then add photos from the Photos page, tag people straight after uploading, and delete their own uploads. Images only, 15 MB max.

## 3. Set the site address for sign-in links (you)

1. **Authentication** then **URL Configuration**.
2. Site URL: `https://oxfordmedics96.com`
3. Redirect URLs: add `https://oxfordmedics96.com/**` and `http://localhost:5173/**`.

## 3b. Switch the sign-in email to a 6-digit code (you)

Links break on iPhones (mail apps pre-open the link and use up the one-time token). The site asks for a code instead, so the email must contain the code and nothing that can be pre-opened.

1. **Authentication**, **Email Templates**, **Magic Link**.
2. Subject: `Your Oxford Medics 96 sign-in code`
3. Body: replace everything with the HTML in `docs/email-templates/magic-link.html`.
4. Save.

## 4. Add the first members (you)

In **SQL Editor**, run something like:

```sql
insert into public.allowed_emails (email, note) values
  ('you@example.com', 'organiser'),
  ('someone@example.com', 'Balliol');
```

Emails must be lower case. Then, after you have signed in once yourself, make yourself an admin:

```sql
update public.members set is_admin = true where email = 'you@example.com';
```

## 5. Give the site its keys (you, in GitHub)

1. In Supabase: **Project Settings** then **API**. Copy the **Project URL** and the **anon public** key. Both are safe to be public; they only allow what the row level security rules allow.
2. In GitHub: repo **Settings** then **Secrets and variables** then **Actions** then the **Variables** tab. Add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon key
3. Push to `main` or re-run the deploy workflow. The site switches from prototype mode to live mode automatically.

Never share the **service_role** key with anyone, including in chat. The site does not need it.

## 6. Running locally with live data

Create `.env.local` in the project root (it is ignored by git):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Then `npm run dev`.

## Day to day

- **Admin page** (`/admin`, admins only): upload photos, paste email addresses to invite members, see who has signed in, delete photos.
- **Me page** (`/me`): each member fills in their own profile, confirms or declines tags of themselves, and reads messages sent to them.
- To make someone else an admin: `update public.members set is_admin = true where email = 'them@example.com';` after they have signed in once.

## How access control works

- Anyone can request a sign-in link, but a `members` row is created only if the email is in `allowed_emails`. Everyone else sees a polite "not on the list" page and can read nothing.
- Database rules (row level security) enforce this on the server. The React code just tidies the experience.
- Photos live in a private storage bucket. Only members can read them; only admins can upload.
- Tags are invisible to others until the tagged person confirms.
