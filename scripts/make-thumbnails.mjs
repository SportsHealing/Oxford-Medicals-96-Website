#!/usr/bin/env node
// Makes a small copy of every photo that does not have one yet, so the
// Photos page and other grids load quickly. Safe to re-run: photos that
// already have a thumbnail are skipped.
//
// Usage (on your own computer, inside the project folder):
//   npm i -D sharp
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/make-thumbnails.mjs
//
// Needs migration 0008_photo_thumbnails.sql to have been run first.
// The service role key bypasses access rules, so never commit it or share it.

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const EDGE = 640
const QUALITY = 80
const WORKERS = 4

if (!url || !key) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/make-thumbnails.mjs')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const todo = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('photos')
    .select('id, storage_path, thumb_path')
    .order('id')
    .range(from, from + 999)
  if (error) {
    console.error(error.message)
    process.exit(1)
  }
  todo.push(...data.filter((r) => !r.thumb_path))
  if (data.length < 1000) break
}
console.log(`${todo.length} photos need a thumbnail.`)

async function makeOne(row) {
  const dl = await supabase.storage.from('photos').download(row.storage_path)
  if (dl.error) throw new Error(`download: ${dl.error.message}`)
  const input = Buffer.from(await dl.data.arrayBuffer())
  const out = await sharp(input)
    .rotate()
    .resize({ width: EDGE, height: EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer()
  const path = `thumbs/${row.id}.jpg`
  const up = await supabase.storage.from('photos').upload(path, out, { contentType: 'image/jpeg', upsert: true })
  if (up.error) throw new Error(`upload: ${up.error.message}`)
  const { error } = await supabase.from('photos').update({ thumb_path: path }).eq('id', row.id)
  if (error) throw new Error(`save: ${error.message}`)
}

let done = 0
let failed = 0
const queue = [...todo]
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    for (let row = queue.shift(); row; row = queue.shift()) {
      try {
        await makeOne(row)
        done++
        if (done % 25 === 0) console.log(`  ${done} done...`)
      } catch (e) {
        failed++
        console.error(`  ! ${row.storage_path}: ${e.message}`)
      }
    }
  }),
)
console.log(`Finished. ${done} thumbnails made, ${failed} failed.`)
if (failed) console.log('Failed photos keep working; the site shows their full-size version.')
