// Supabase Edge Function: sort-photos
//
// Called by an admin from the Photos page ("Sort photos", then "Suggest
// categories with AI"). Each call takes the next few photos that have no
// category, shows each photo's small thumbnail to Claude, and saves the
// suggested category. A photo still titled with its file name (IMG_1234.jpg)
// also gets a short descriptive title. Photos someone has already sorted are
// never changed. The page calls again until none are left.
//
// Secrets (Supabase dashboard, Edge Functions, Secrets):
//   ANTHROPIC_API_KEY   required: a key from console.anthropic.com
//
// No service key: the function acts as the signed-in caller, so only an admin
// can read and change the photos here (the database rules decide).

import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

const MODEL = 'claude-opus-5-5'
const BATCH = 6

// Keep in step with src/lib/photoCategories.ts and migration 0014.
const CATEGORIES: Record<string, string> = {
  graduation: 'Graduation day: gowns, hoods, mortarboards, the Sheldonian, degree ceremonies',
  tingewick: 'Tingewick, the Oxford medical students\' Christmas pantomime: stage shows, costumes, rehearsals, cast photos',
  formal: 'Balls and formal dinners: black tie, ball gowns, formal hall, dinners in suits',
  social: 'Parties and nights out: house parties, pubs, bars, birthdays, celebrations',
  sport: 'Sport: rowing, rugby, football, hockey, cricket, teams, matches, kit',
  medicine: 'Wards and studies: hospitals, clinics, white coats, scrubs, lectures, labs, anatomy, revision',
  everyday: 'Friends and everyday life: college, rooms, picnics, punting, walks, casual small groups',
  travel: 'Trips and electives: holidays, travel abroad, elective placements, outdoor trips',
  reunions: 'Reunions: the same people meeting again years later, middle-aged adults, recent digital photos',
  other: 'Anything that fits none of the above, such as documents, scans of text, or unclear images',
}

const SYSTEM = `You help sort the photo archive of the Oxford University medical school class of 1996.
Most photos were taken between about 1990 and 1996 while they were students (often scanned film prints).
Some come from reunions decades later. For each photo, choose the single best category:
${Object.entries(CATEGORIES).map(([id, d]) => `- ${id}: ${d}`).join('\n')}
Also write a short, plain title (3 to 8 words, British English, sentence case, no full stop) describing the scene,
for example "Rowing eight on the river" or "Friends at a summer garden party".
Never name or guess who anyone is, and do not comment on people's looks.`

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Titles that are really file names, e.g. "IMG_1234.jpg", "DSC01234", "20240101_123456".
const looksLikeFileName = (t: string) =>
  /\.(jpe?g|png|gif|webp|heic|tiff?)$/i.test(t) || /^(img|dsc|dscn|pxl|photo|image|scan|p)[\s_-]?\d/i.test(t) || /^[\d\s_-]+$/.test(t)

const MEDIA: Record<string, 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

type Row = { id: string; title: string; storage_path: string; thumb_path: string | null }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY is not set in Edge Function secrets' }, 500)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) return json({ error: 'Only admins can sort photos.' }, 403)

  let skip: string[] = []
  try {
    const body = await req.json()
    if (Array.isArray(body?.skip)) skip = body.skip.filter((s: unknown) => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s)).slice(0, 300)
  } catch {
    /* no body: nothing to skip */
  }
  const notSkipped = <Q extends { not: (c: string, op: string, v: string) => Q }>(q: Q) =>
    skip.length ? q.not('id', 'in', `(${skip.join(',')})`) : q

  const { data: rows, error } = await notSkipped(
    supabase.from('photos').select('id, title, storage_path, thumb_path').is('category', null).order('created_at').limit(BATCH),
  )
  if (error) return json({ error: error.message.includes('category') ? 'Run database update 0014 first (Supabase, SQL Editor).' : error.message }, 500)

  const client = new Anthropic({ apiKey })
  const results = await Promise.all(((rows ?? []) as Row[]).map((row) => sortOne(row)))
  const sorted = results.filter((r) => r === 'ok').length
  const failed = ((rows ?? []) as Row[]).filter((_, i) => results[i] !== 'ok').map((r) => r.id)
  const problems = results.filter((r) => r !== 'ok')

  const { count } = await notSkipped(
    supabase.from('photos').select('id', { count: 'exact', head: true }).is('category', null),
  )
  const remaining = Math.max(0, (count ?? 0) - failed.length)

  // Every photo in the batch failed for the same reason: say what it was.
  if (rows && rows.length > 0 && sorted === 0 && problems.length > 0 && problems.every((p) => p === problems[0]) && problems[0] !== 'unreadable') {
    return json({ error: `The AI sorter could not run: ${problems[0]}` }, 502)
  }
  return json({ sorted, failed, remaining })

  async function sortOne(row: Row): Promise<string> {
    const path = row.thumb_path || row.storage_path
    const media = MEDIA[path.split('.').pop()?.toLowerCase() ?? '']
    if (!media) return 'unreadable'
    const file = await supabase.storage.from('photos').download(path)
    if (file.error || !file.data) return 'unreadable'
    // Full-size originals over about 4 MB are too big to send; those keep no category.
    if (file.data.size > 4_000_000) return 'unreadable'
    const data = encodeBase64(new Uint8Array(await file.data.arrayBuffer()))

    let response
    try {
      response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 2000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: 'low',
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: Object.keys(CATEGORIES) },
                title: { type: 'string' },
              },
              required: ['category', 'title'],
              additionalProperties: false,
            },
          },
        },
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: media, data } },
              { type: 'text', text: `Current title: ${row.title.slice(0, 120)}\nChoose the category and write a title.` },
            ],
          },
        ],
      })
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return 'the ANTHROPIC_API_KEY secret is not a working key'
      if (e instanceof Anthropic.PermissionDeniedError) return 'the Anthropic account does not allow this (check billing and credit)'
      if (e instanceof Anthropic.RateLimitError) return 'too many requests at once; press Carry on with AI in a minute'
      if (e instanceof Anthropic.BadRequestError) return /credit|billing/i.test(e.message) ? 'the Anthropic account has no credit left' : 'unreadable'
      if (e instanceof Anthropic.APIError) return `Anthropic error ${e.status}`
      return 'could not reach Anthropic'
    }

    if (response.stop_reason === 'refusal') return 'unreadable'
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')
    let parsed: { category?: unknown; title?: unknown }
    try {
      parsed = JSON.parse(text)
    } catch {
      return 'unreadable'
    }
    const category = typeof parsed.category === 'string' && parsed.category in CATEGORIES ? parsed.category : null
    if (!category) return 'unreadable'
    const title = typeof parsed.title === 'string' ? parsed.title.trim().replace(/\.$/, '').slice(0, 80) : ''

    const changes: Record<string, string> = { category, category_source: 'ai' }
    if (title && looksLikeFileName(row.title)) changes.title = title
    // "is null" leaves alone any photo a person sorted while this was running.
    const { error: upErr } = await supabase.from('photos').update(changes).eq('id', row.id).is('category', null)
    return upErr ? 'unreadable' : 'ok'
  }
})
