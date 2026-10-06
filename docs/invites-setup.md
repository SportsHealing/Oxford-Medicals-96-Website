# Invitation emails: one-time setup

The Admin page's **Invite members** form adds people to the members list and emails each one their own invitation. Emails are sent by a small Supabase Edge Function (`supabase/functions/send-invites`) through Resend, from `hello@oxfordmedics96.com`. Replies go to the admin who sent the invite.

The email links to `https://oxfordmedics96.com/sign-in?email=…` with the address pre-filled. It contains no one-time login token, so mail apps that pre-open links cannot use it up. The person presses "Email me a code", types the code, and is in.

## 1. Database (SQL Editor)

```sql
alter table public.allowed_emails add column if not exists invite_sent_at timestamptz;
```

## 2. Resend API key as a secret

1. Resend, API Keys: use the `re_…` key created for Supabase SMTP, or create a new one with Sending access for `oxfordmedics96.com`.
2. Supabase, **Edge Functions**, **Secrets** (or Project Settings, Edge Functions): add `RESEND_API_KEY` with that value.

## 3. Create the function (Supabase dashboard, no install needed)

1. **Edge Functions**, **Deploy a new function**, **Via Editor**.
2. Name it exactly `send-invites`.
3. Replace the template code with the whole of `supabase/functions/send-invites/index.ts`.
4. **Deploy**.

## 4. Test

Admin page, Invite members, enter your own second address, Send 1 invitation. The row shows "Email sent <date>". Check that inbox.

## If something fails

- "Failed to send a request to the Edge Function" or "Could not reach the send-invites function": step 3 is missing, the name is not exactly `send-invites`, or the deploy failed. Check Edge Functions lists `send-invites` and open its Logs.
- "Only admins can send invitations": you are not signed in as an admin.
- "RESEND_API_KEY is not set": step 2 missing or misspelt.
- "Invalid JWT" or 401: in the function's settings turn off **Enforce JWT verification** (or "Verify JWT"). Safe, because the function checks admin rights itself using the caller's sign-in.
- Resend error about the domain: check the domain is still Verified in Resend.

## Limits

Resend's free plan sends 100 emails a day and 3,000 a month, shared with sign-in codes. For a large cohort, send invites in batches of about 80 a day, or upgrade Resend for the launch week.
