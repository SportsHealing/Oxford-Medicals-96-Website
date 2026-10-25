// Oxford Medics 96: notes service (Cloudflare Worker, free plan).
//
// Keeps the names and places classmates add to photos. Each photo's notes
// arrive already encrypted with the key from the class code, so this service
// only ever stores scrambled data and cannot read it.
//
//   GET /notes/<photo-id>   -> { data } or 404     (anyone; data is scrambled)
//   PUT /notes/<photo-id>   body { data }          (needs the write proof)
//
// The write proof is a value only a browser that has the class code can work
// out (src/lib/vault.ts, writeToken). This file holds only its SHA-256, in
// WRITE_HASH below. If the class code changes, WRITE_HASH must be updated.
//
// Set-up: docs/naming-setup.md. Needs one KV namespace bound as NOTES.

const WRITE_HASH = 'ee02f9e4826d957b87e5563b75a7be597330e8c9254edff16202d10f88259a0b'
const ALLOWED_ORIGINS = ['https://oxfordmedics96.com', 'https://www.oxfordmedics96.com', 'http://localhost:5173', 'http://localhost:5199']
const MAX_BYTES = 16 * 1024

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? ''
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Archive-Token',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    }
    const json = (status, body) =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (!env.NOTES) return json(500, { error: 'The NOTES storage is not connected to this Worker.' })

    const url = new URL(request.url)
    if (url.pathname === '/') return json(200, { ok: true, service: 'Oxford Medics 96 notes' })
    const match = url.pathname.match(/^\/notes\/([a-z0-9-]{1,40})$/)
    if (!match) return json(404, { error: 'Not found' })
    const id = match[1]

    if (request.method === 'GET') {
      const data = await env.NOTES.get(`photo:${id}`)
      return data === null ? json(404, { error: 'No notes' }) : json(200, { data })
    }

    if (request.method === 'PUT') {
      const token = request.headers.get('X-Archive-Token') ?? ''
      if (!/^[0-9a-f]{64}$/.test(token) || (await sha256Hex(token)) !== WRITE_HASH) return json(403, { error: 'Not allowed' })
      const text = await request.text()
      if (text.length > MAX_BYTES) return json(413, { error: 'Too large' })
      let data
      try {
        data = JSON.parse(text).data
      } catch {
        return json(400, { error: 'Bad request' })
      }
      if (typeof data !== 'string' || !/^[A-Za-z0-9+/=]{40,}$/.test(data)) return json(400, { error: 'Bad request' })
      await env.NOTES.put(`photo:${id}`, data)
      return json(204)
    }

    return json(405, { error: 'Method not allowed' })
  },
}

async function sha256Hex(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
