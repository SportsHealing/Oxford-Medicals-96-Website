# New sign-up and Admin: one-time setup

How joining works now:

1. A new person opens the site, chooses **First time here?**, and enters their name (and their name at medical school, if different) and email.
2. They get an 8-digit code by email, type it in and choose a password. This proves the email is theirs.
3. The site checks the list:
   - **Email on the list:** they are in straight away.
   - **Name on the class list, but no email known for that name:** they are in straight away. Admins get an email so they can check.
   - **Neither:** a request to join goes to the admins by email. An admin accepts or declines it on the Admin page (Requests tab), and the person is emailed the decision. If accepted, their name and email are added and they can sign in with their password.

Returning members choose **Sign in** and use their email and password, or "Email me a code instead".

## Setup steps (owner)

1. **Database.** Supabase, SQL Editor, new query: paste all of `supabase/migrations/0010_join_requests.sql`, Run. Expect "Success. No rows returned".
2. **New Edge Function.** Edge Functions, Deploy a new function, Via Editor. Name it exactly `join-requests`. Replace the sample code with all of `supabase/functions/join-requests/index.ts`. Deploy. In the function's settings, turn **off** "Verify JWT" (the function checks who is calling itself).
3. **Secret.** Edge Functions, Secrets: add `ADMIN_EMAILS` with the addresses that should get "new request" emails, separated by commas.
4. **Update the invite email.** Edge Functions, `send-invites`, Code: replace `index.ts` with the latest `supabase/functions/send-invites/index.ts`. Deploy.
5. **Email templates.** Authentication, Emails (Templates). Brand-new people get the **Confirm signup** email; returning people get **Magic Link**. Both must show the code: `{{ .Token }}`. If either only has a link, paste the body of `docs/email-templates/magic-link.html` into it.
6. **Load the lists.** On the site: Admin, **Add people**:
   - Paste all the rows from the sign-up sheet (every column is fine), then Import.
   - Then paste the class list from the spreadsheet (name and specialty columns, including the "Preclinical" heading row), then Import.
   - The result lists any rows to check.
7. **Test** with a second email address that is not on the list: you should get a "Request to join" email, and the request should appear under Admin, Requests.

## Things to know

- Matching names copes with titles, middle names, maiden names, common nicknames (Tom/Thomas, Jo/Joanne) and one-letter surname typos. A name can be claimed once. If two class-list names could match, the person goes to the admins instead.
- Anyone who knows a classmate's name could try to join as them. Admins are emailed every name match. "Remove access" (Requests or People tab) undoes a wrong one.
- Declined requests are kept so the same person cannot ask again and again. Admins can delete them.
- Supabase, Authentication, Rate Limits: keep "emails sent per hour" at 100 or more.
