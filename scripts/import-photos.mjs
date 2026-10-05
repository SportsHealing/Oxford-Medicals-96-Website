#!/usr/bin/env node
// Bulk-import photos into the site.
//
// Usage (run on your own computer, inside the project folder):
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/import-photos.mjs ./path/to/photos [./captions.csv]
//
// - Uploads every .jpg/.jpeg/.png/.webp/.heic in the folder (and sub-folders)
//   to the private "photos" bucket and creates a photos row for each.
// - Optional captions.csv with a header row: file,title,year,place,caption
//   (file = the file name; unmatched files get the file name as title).
// - Safe to re-run: files already imported (same name) are skipped.
//
// The service role key bypasses access rules, so never commit it or share it.

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const [, , folder, csvPath] = process.argv

if (!url || !key || !folder) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-photos.mjs <folder> [captions.csv]')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif'])
const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.heic': 'image/heic', '.gif': 'image/gif' }

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (exts.has(extname(entry.name).toLowerCase())) out.push(p)
  }
  return out.sort()
}

function parseCsv(text) {
  const rows = []
  let field = '', row = [], quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim()))
  const idx = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]))
  const byFile = new Map()
  for (const r of body) {
    const get = (k) => (idx[k] === undefined ? '' : (r[idx[k]] ?? '').trim())
    byFile.set(get('file').toLowerCase(), { title: get('title'), year: get('year'), place: get('place'), caption: get('caption') })
  }
  return byFile
}

const captions = csvPath ? parseCsv(await readFile(csvPath, 'utf8')) : new Map()
const files = await walk(folder)
console.log(`Found ${files.length} image files.`)

const { data: existing, error: exErr } = await supabase.from('photos').select('storage_path')
if (exErr) throw exErr
const have = new Set((existing ?? []).map((r) => r.storage_path))

let done = 0, skipped = 0, failed = 0
for (const file of files) {
  const name = basename(file)
  const ext = extname(name).toLowerCase()
  const bytes = await readFile(file)
  // Stable path from the file's contents, so re-runs skip duplicates even if renamed.
  const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 16)
  const path = `import/${hash}${ext}`
  if (have.has(path)) { skipped++; continue }

  const meta = captions.get(name.toLowerCase()) ?? {}
  const title = meta.title || name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')

  const up = await supabase.storage.from('photos').upload(path, bytes, { contentType: types[ext] ?? 'image/jpeg', upsert: false })
  if (up.error && !/already exists/i.test(up.error.message)) {
    failed++; console.error(`  ! ${name}: ${up.error.message}`); continue
  }
  const { error } = await supabase.from('photos').insert({
    title, year: meta.year || null, place: meta.place || null, caption: meta.caption || null, storage_path: path,
  })
  if (error) { failed++; console.error(`  ! ${name}: ${error.message}`); continue }
  done++
  if (done % 25 === 0) console.log(`  ${done} uploaded…`)
}
const { size } = await stat(folder)
void size
console.log(`Done. ${done} uploaded, ${skipped} already there, ${failed} failed.`)
