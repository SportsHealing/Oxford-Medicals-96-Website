// Supabase Edge Function: send-invites
//
// Called from the Admin page. Adds the given addresses to the members list
// and emails each person their own invitation through Resend.
//
// Secrets (Supabase dashboard, Edge Functions, Secrets):
//   RESEND_API_KEY   required, the re_... key
//   SITE_URL         optional, default https://oxfordmedics96.com
//   INVITE_FROM      optional, default "Oxford Medics 96 <hello@oxfordmedics96.com>"
//
// No service key is needed: the function acts as the signed-in admin, so the
// database's own rules decide what it may do.

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inviteHtml(opts: { link: string; inviter: string; message: string }) {
  const note = opts.message
    ? `<p style="font-family:Georgia,serif;font-size:17px;line-height:1.5;color:#26303b;background:#f8ecf1;border-radius:12px;padding:16px 18px;margin:0 0 22px;white-space:pre-line;">${escapeHtml(opts.message)}</p>`
    : ''
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;">
<div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#26303b;">
  <p style="font-family:Georgia,serif;font-size:22px;color:#002147;margin:0 0 24px;">Oxford Medics <span style="color:#a6476f;">96</span></p>
  <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;line-height:1.2;color:#002147;margin:0 0 14px;">You're invited</h1>
  <p style="font-size:16px;line-height:1.55;margin:0 0 20px;">
    ${escapeHtml(opts.inviter)} has invited you to <strong>Oxford Medics 96</strong>, a private site for the Oxford medical class of 1996.
    The old photos, who is in them, and what everyone went on to do.
  </p>
  ${note}
  <p style="margin:0 0 24px;">
    <a href="${opts.link}" style="display:inline-block;background:#e8a6bd;color:#002147;text-decoration:none;font-weight:600;font-size:16px;padding:13px 26px;border-radius:999px;">Join the site</a>
  </p>
  <p style="font-size:14px;line-height:1.55;color:#6b7280;margin:0 0 6px;">
    Press the button, then "Email me a code". We'll send a 6-digit code to this address. Type it in and you're in.
  </p>
  <p style="font-size:14px;line-height:1.55;color:#6b7280;margin:0;">
    Only members of the cohort can see anything on the site. If this wasn't meant for you, just ignore it.
  </p>
</div></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'RESEND_API_KEY is not set in Edge Function secrets' }, 500)
  const site = (Deno.env.get('SITE_URL') ?? 'https://oxfordmedics96.com').replace(/\/$/, '')
  const from = Deno.env.get('INVITE_FROM') ?? 'Oxford Medics 96 <hello@oxfordmedics96.com>'

  // Act as the caller.
  const authHeader = req.headers.get('Authorization') ?? ''
  const apikey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, apikey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let body: { emails?: unknown; note?: unknown; message?: unknown; send?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  // The admin check and the sender's name are independent, so ask together.
  const [adminRes, userRes] = await Promise.all([
    supabase.rpc('is_admin'),
    supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, '')),
  ])
  if (adminRes.error || !adminRes.data) return json({ error: 'Only admins can send invitations' }, 403)
  const me = userRes.data.user
  let inviter = 'A classmate'
  if (me) {
    const { data: m } = await supabase.from('members').select('full_name').eq('id', me.id).maybeSingle()
    if (m?.full_name) inviter = m.full_name
  }
  const emails = Array.from(
    new Set(
      (Array.isArray(body.emails) ? body.emails : [])
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e)),
    ),
  ).slice(0, 300)
  if (emails.length === 0) return json({ error: 'No valid email addresses' }, 400)
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 200) : null
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1500) : ''
  const send = body.send !== false

  // Add to the members list. Existing rows keep their note.
  const { error: insErr } = await supabase
    .from('allowed_emails')
    .upsert(emails.map((email) => ({ email, note })), { onConflict: 'email', ignoreDuplicates: true })
  if (insErr) return json({ error: insErr.message }, 400)

  if (!send) return json({ added: emails.length, sent: 0, failed: [] })

  // Email each person individually (Resend batch: up to 100 per call).
  const sent: string[] = []
  const failed: { email: string; reason: string }[] = []
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100)
    const payload = chunk.map((to) => ({
      from,
      to: [to],
      reply_to: me?.email ? [me.email] : undefined,
      subject: `${inviter} has invited you to Oxford Medics 96`,
      html: inviteHtml({ link: `${site}/sign-in?email=${encodeURIComponent(to)}`, inviter, message }),
    }))
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) sent.push(...chunk)
    else {
      const reason = (await res.text()).slice(0, 300)
      chunk.forEach((email) => failed.push({ email, reason }))
    }
  }

  if (sent.length) {
    await supabase.from('allowed_emails').update({ invite_sent_at: new Date().toISOString() }).in('email', sent)
  }
  return json({ added: emails.length, sent: sent.length, failed })
})
