// Supabase Edge Function: join-requests
//
// action "notify" (called by the person who just asked to join, or who got in
//   by matching a name): emails the admins once.
// action "decide" (called by an admin from the Admin page): accepts or declines
//   a request and emails the person the decision.
//
// Secrets (Supabase dashboard, Edge Functions, Secrets):
//   RESEND_API_KEY   required (already set for send-invites)
//   ADMIN_EMAILS     required: who gets the "new request" emails, comma separated
//   SITE_URL         optional, default https://oxfordmedics96.com
//   INVITE_FROM      optional, default "Oxford Medics 96 <hello@oxfordmedics96.com>"
//
// No service key: the function acts as the signed-in caller, and the database
// functions it calls check what that caller may do.

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function page(title: string, body: string, button?: { href: string; label: string }) {
  const btn = button
    ? `<p style="margin:0 0 24px;"><a href="${button.href}" style="display:inline-block;background:#e8a6bd;color:#002147;text-decoration:none;font-weight:600;font-size:16px;padding:13px 26px;border-radius:999px;">${esc(button.label)}</a></p>`
    : ''
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;">
<div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#26303b;">
  <p style="font-family:Georgia,serif;font-size:22px;color:#002147;margin:0 0 24px;">Oxford Medics <span style="color:#a6476f;">96</span></p>
  <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;line-height:1.2;color:#002147;margin:0 0 14px;">${esc(title)}</h1>
  <div style="font-size:16px;line-height:1.55;margin:0 0 20px;">${body}</div>
  ${btn}
</div></body></html>`
}

async function sendEmail(key: string, msg: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  })
  return res.ok ? null : (await res.text()).slice(0, 300)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'RESEND_API_KEY is not set in Edge Function secrets' }, 500)
  const site = (Deno.env.get('SITE_URL') ?? 'https://oxfordmedics96.com').replace(/\/$/, '')
  const from = Deno.env.get('INVITE_FROM') ?? 'Oxford Medics 96 <hello@oxfordmedics96.com>'

  const authHeader = req.headers.get('Authorization') ?? ''
  const apikey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, apikey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let body: { action?: unknown; id?: unknown; accept?: unknown; message?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  if (body.action === 'notify') {
    const admins = (Deno.env.get('ADMIN_EMAILS') ?? '')
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => EMAIL_RE.test(e))
    if (admins.length === 0) return json({ error: 'ADMIN_EMAILS is not set in Edge Function secrets' }, 500)

    const { data: n, error } = await supabase.rpc('take_join_notice')
    if (error) return json({ error: error.message }, 400)
    if (!n) return json({ sent: 0 })

    const who = `<strong>${esc(n.full_name)}</strong>${n.previous_name ? ` (at medical school: ${esc(n.previous_name)})` : ''}, ${esc(n.email)}`
    const isMatch = n.kind === 'name_match'
    const problem = await sendEmail(resendKey, {
      from,
      to: admins,
      reply_to: [n.email],
      subject: isMatch ? `${n.full_name} has joined (name matched the class list)` : `Request to join: ${n.full_name}`,
      html: isMatch
        ? page(
            'Joined by name',
            `<p>${who} was not on the list by email, but their name matched <strong>${esc(n.matched_name ?? '')}</strong> on the class list, so they are now a member.</p><p>If that looks wrong, open Admin, Requests, and remove their access.</p>`,
            { href: `${site}/admin?tab=requests`, label: 'Open Admin' },
          )
        : page(
            'New request to join',
            `<p>${who} has asked to join. They have confirmed their email address but are not on the list.</p><p>Accept or decline in Admin. They will be emailed your decision.</p>`,
            { href: `${site}/admin?tab=requests`, label: 'Review the request' },
          ),
    })
    return problem ? json({ error: problem }, 502) : json({ sent: 1 })
  }

  if (body.action === 'decide') {
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return json({ error: 'Only admins can decide requests' }, 403)
    if (typeof body.id !== 'string') return json({ error: 'Bad request' }, 400)
    const accept = body.accept === true
    const note = typeof body.message === 'string' ? body.message.trim().slice(0, 800) : ''

    const { data: d, error } = await supabase.rpc('decide_join_request', { p_id: body.id, p_accept: accept })
    if (error) return json({ error: error.message }, 400)

    const { data: userData } = await supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''))
    const adminEmail = userData.user?.email
    const first = String(d.full_name).split(' ')[0]
    const noteHtml = note
      ? `<p style="background:#f8ecf1;border-radius:12px;padding:14px 16px;white-space:pre-line;">${esc(note)}</p>`
      : ''
    const problem = await sendEmail(resendKey, {
      from,
      to: [d.email],
      reply_to: adminEmail ? [adminEmail] : undefined,
      subject: accept ? "You're in: Oxford Medics 96" : 'Your request to join Oxford Medics 96',
      html: accept
        ? page(
            `Welcome, ${first}`,
            `<p>The organisers have accepted your request to join Oxford Medics 96, the private site for the Oxford medical class of 1996.</p>${noteHtml}<p>Sign in with this email address and the password you chose. Forgotten it? Choose "Email me a code instead".</p>`,
            { href: `${site}/sign-in`, label: 'Sign in' },
          )
        : page(
            'About your request',
            `<p>Thank you for your interest in Oxford Medics 96. The organisers were not able to confirm you as a member of the Oxford medical class of 1996, so we cannot give you access.</p>${noteHtml}<p>If you think this is a mistake, just reply to this email.</p>`,
          ),
    })
    return json({ status: d.status, emailed: !problem, emailError: problem ?? undefined })
  }

  return json({ error: 'Unknown action' }, 400)
})
