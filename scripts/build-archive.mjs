#!/usr/bin/env node
// Builds the encrypted archive the site reads from /archive, and can upload
// it to GitHub. Run on your own computer, inside the project folder.
//
//   set ARCHIVE_CODE=12345678            (Windows cmd; the 8-digit class code)
//   node scripts/build-archive.mjs photos  C:\path\to\photos  [photos.csv]
//   node scripts/build-archive.mjs speeches C:\path\to\speeches-folder
//   node scripts/build-archive.mjs upload   (needs GITHUB_TOKEN as well)
//
// photos:   every .jpg/.jpeg/.png/.webp in the folder (and sub-folders) is
//           shrunk to 2400px, given a 640px thumbnail, encrypted and written to
//           public/archive. Camera data (location, dates) is removed. The
//           optional photos.csv is an export of the old Supabase "photos"
//           table (or any CSV with columns file/title/year/place/caption/
//           category): it supplies titles and categories. Safe to re-run:
//           pictures already done are skipped.
// speeches: the folder holds speeches.json (see docs/photo-archive.md), the
//           text files and PDFs it names. Writes public/archive/speeches.enc.
// upload:   packs public/archive into one file, attaches it to the "archive"
//           release on GitHub and asks GitHub to rebuild the site. Needs a
//           GitHub token with "Contents" and "Actions" read and write on the
//           repository.
//
// The code never goes into the archive: a wrong code simply cannot read it.
// Must match src/lib/vault.ts.

import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync, randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SALT = 'oxfordmedics96-archive-v1'
const ROUNDS = 600_000
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'archive')

const [, , command, ...args] = process.argv
const code = (process.env.ARCHIVE_CODE ?? '').trim()

const usage = () => {
  console.error('Usage:\n  node scripts/build-archive.mjs photos <folder> [photos.csv]\n  node scripts/build-archive.mjs speeches <folder>\n  node scripts/build-archive.mjs upload')
  process.exit(1)
}
if (!['photos', 'speeches', 'upload'].includes(command)) usage()
if (command !== 'upload' && !/^\d{8}$/.test(code)) {
  console.error('Set ARCHIVE_CODE to the 8-digit class code first, e.g.   set ARCHIVE_CODE=12345678')
  process.exit(1)
}

// ---- encryption -----------------------------------------------------------

const key = command === 'upload' ? null : pbkdf2Sync(code, SALT, ROUNDS, 32, 'sha256')

function encrypt(buf) {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key, iv)
  return Buffer.concat([iv, c.update(buf), c.final(), c.getAuthTag()])
}

function decrypt(buf) {
  const d = createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12))
  d.setAuthTag(buf.subarray(buf.length - 16))
  return Buffer.concat([d.update(buf.subarray(12, buf.length - 16)), d.final()])
}

// If an archive already exists, it must have been made with the same code;
// otherwise the site would end up with files no single code can open.
async function checkSameCode() {
  for (const name of ['photos.enc', 'speeches.enc']) {
    const p = join(OUT, name)
    if (!existsSync(p)) continue
    try {
      decrypt(await readFile(p))
    } catch {
      console.error(`${name} in public/archive was made with a different code. Use the same code, or delete the public/archive folder to start again.`)
      process.exit(1)
    }
  }
}

const writeEnc = async (path, data) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, encrypt(Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data))))
}

// ---- photos ---------------------------------------------------------------

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (IMAGE_EXTS.has(extname(entry.name).toLowerCase())) out.push(p)
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
  const [header, ...body] = rows.filter((r) => r.some((f) => f.trim()))
  const cols = header.map((h) => h.trim().toLowerCase())
  return body.map((r) => Object.fromEntries(cols.map((c, i) => [c, (r[i] ?? '').trim()])))
}

const CATEGORIES = new Set(['graduation', 'tingewick', 'formal', 'social', 'sport', 'medicine', 'everyday', 'travel', 'reunions', 'other'])

const titleFromName = (file) =>
  basename(file, extname(file))
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Untitled'

async function buildPhotos(folder, csvPath) {
  if (!folder) usage()
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('The "sharp" picture library is missing. Run:   npm i -D sharp   then try again.')
    process.exit(1)
  }
  await checkSameCode()

  // Details from the CSV, found by the old storage path (import/<hash><ext>)
  // or by the file name.
  const byPath = new Map()
  const byName = new Map()
  if (csvPath) {
    for (const r of parseCsv(await readFile(csvPath, 'utf8'))) {
      if (r.storage_path) byPath.set(r.storage_path.toLowerCase(), r)
      const f = (r.file || r.filename || '').toLowerCase()
      if (f) byName.set(f, r)
    }
    console.log(`Read ${byPath.size + byName.size} rows from ${csvPath}.`)
  }

  const files = await walk(resolve(folder))
  console.log(`${files.length} pictures in ${folder}.`)
  const photos = []
  let done = 0, skipped = 0, failed = 0, duplicates = 0
  const seen = new Set()
  for (const file of files) {
    const bytes = await readFile(file)
    const ext = extname(file).toLowerCase()
    const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 16)
    const id = hash
    // The same picture twice (for example a copy in two folders) is listed once.
    if (seen.has(id)) {
      duplicates++
      continue
    }
    seen.add(id)
    const row = byPath.get(`import/${hash}${ext === '.jpeg' ? '.jpeg' : ext}`) ?? byPath.get(`import/${hash}.jpg`) ?? byName.get(basename(file).toLowerCase()) ?? {}
    const fullOut = join(OUT, 'p', `${id}.enc`)
    const thumbOut = join(OUT, 't', `${id}.enc`)
    let width, height
    try {
      if (existsSync(fullOut) && existsSync(thumbOut)) {
        skipped++
      } else {
        const img = sharp(bytes, { failOn: 'none' }).rotate()
        const full = await img.clone().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer({ resolveWithObject: true })
        const thumb = await img.clone().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
        await writeEnc(fullOut, full.data)
        await writeEnc(thumbOut, thumb)
        width = full.info.width
        height = full.info.height
        done++
      }
      if (!width) {
        const meta = await sharp(bytes, { failOn: 'none' }).rotate().metadata()
        const scale = Math.min(1, 2400 / Math.max(meta.width ?? 1, meta.height ?? 1))
        width = Math.round((meta.width ?? 0) * scale)
        height = Math.round((meta.height ?? 0) * scale)
      }
    } catch (e) {
      failed++
      console.warn(`Could not read ${relative(folder, file)}: ${e.message}`)
      continue
    }
    const category = (row.category ?? '').toLowerCase()
    photos.push({
      id,
      title: row.title?.trim() || titleFromName(file),
      year: row.year?.trim() || null,
      place: row.place?.trim() || null,
      caption: row.caption?.trim() || null,
      category: CATEGORIES.has(category) ? category : null,
      full: `p/${id}.enc`,
      thumb: `t/${id}.enc`,
      width,
      height,
    })
    if ((done + skipped) % 50 === 0) console.log(`  ${done + skipped} of ${files.length}…`)
  }
  await writeEnc(join(OUT, 'photos.enc'), { builtAt: new Date().toISOString(), photos })
  console.log(`Done: ${done} pictures made, ${skipped} already made, ${failed} could not be read${duplicates ? `, ${duplicates} exact duplicates left out` : ''}. ${photos.length} in the list.`)
  console.log(`Written to ${OUT}. Next:   node scripts/build-archive.mjs upload`)
}

// ---- speeches -------------------------------------------------------------

async function buildSpeeches(folder) {
  if (!folder) usage()
  await checkSameCode()
  const dir = resolve(folder)
  const list = JSON.parse(await readFile(join(dir, 'speeches.json'), 'utf8'))
  const speeches = []
  const quotes = []
  for (const s of list) {
    if (!s.slug || !s.title) throw new Error('Each speech needs a slug and a title')
    if (!/^[a-z0-9-]+$/.test(s.slug)) throw new Error(`Slug "${s.slug}" may only have lower-case letters, digits and dashes`)
    const body = s.text ? (await readFile(join(dir, s.text), 'utf8')).replace(/\r\n/g, '\n').trim() : null
    const pdf = s.pdf ? { name: basename(s.pdf), base64: (await readFile(join(dir, s.pdf))).toString('base64') } : null
    if (!body && !pdf) throw new Error(`"${s.title}" needs a text file or a PDF`)
    speeches.push({ id: s.slug, slug: s.slug, title: s.title, speaker: s.speaker ?? null, occasion: s.occasion ?? null, year: s.year ?? null, body, pdf })
    for (const [i, q] of (s.quotes ?? []).entries()) {
      const text = typeof q === 'string' ? q : q.text
      quotes.push({ id: `${s.slug}-${i + 1}`, text, attribution: (typeof q === 'object' && q.attribution) || s.speaker || '', speechSlug: s.slug, speechTitle: s.title })
    }
  }
  // Alternate the speakers on the banner, in the order given.
  const bySpeech = speeches.map((s) => quotes.filter((q) => q.speechSlug === s.slug))
  const ordered = []
  for (let i = 0; ordered.length < quotes.length; i++) for (const q of bySpeech) if (q[i]) ordered.push(q[i])
  await writeEnc(join(OUT, 'speeches.enc'), { speeches, quotes: ordered })
  console.log(`Written speeches.enc: ${speeches.length} speeches, ${quotes.length} quotes. Next:   node scripts/build-archive.mjs upload`)
}

// ---- upload to GitHub -----------------------------------------------------
//
// GitHub limits how many files can be added through its API in an hour, so
// the archive goes up as one file (archive.tar) attached to a release called
// "archive". The website build (.github/workflows/deploy.yml) downloads it and
// unpacks it next to the site. Then this asks GitHub to rebuild the site.

const RELEASE_TAG = 'archive'
const ASSET = 'archive.tar'

// A plain tar file: a 512-byte header per file, the file padded to 512 bytes,
// and two empty blocks at the end.
function tarOf(files) {
  const parts = []
  for (const { name, data } of files) {
    const h = Buffer.alloc(512)
    const put = (s, at, len) => h.write(s, at, Math.min(len, Buffer.byteLength(s)), 'ascii')
    const oct = (n, len) => n.toString(8).padStart(len - 1, '0') + '\0'
    if (Buffer.byteLength(name) > 100) throw new Error(`Name too long for the archive: ${name}`)
    put(name, 0, 100)
    put(oct(0o644, 8), 100, 8)
    put(oct(0, 8), 108, 8)
    put(oct(0, 8), 116, 8)
    put(oct(data.length, 12), 124, 12)
    put(oct(Math.floor(Date.now() / 1000), 12), 136, 12)
    h.fill(' ', 148, 156)
    put('0', 156, 1)
    put('ustar\0', 257, 6)
    put('00', 263, 2)
    let sum = 0
    for (const b of h) sum += b
    put(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8)
    parts.push(h, data, Buffer.alloc((512 - (data.length % 512)) % 512))
  }
  parts.push(Buffer.alloc(1024))
  return Buffer.concat(parts)
}

async function upload() {
  const token = (process.env.GITHUB_TOKEN ?? '').trim()
  const repo = process.env.GITHUB_REPO ?? 'SportsHealing/oxford-medicals-96-website'
  const branch = process.env.GITHUB_BRANCH ?? 'main'
  const apiBase = process.env.GITHUB_API ?? 'https://api.github.com'
  const uploadBase = process.env.GITHUB_UPLOADS ?? 'https://uploads.github.com'
  if (!token) {
    console.error('Set GITHUB_TOKEN first (a fine-grained token with Contents and Actions: read and write on the repository).')
    process.exit(1)
  }
  if (!existsSync(join(OUT, 'photos.enc')) && !existsSync(join(OUT, 'speeches.enc'))) {
    console.error('There is nothing in public/archive yet. Run the photos or speeches step first.')
    process.exit(1)
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  const api = async (url, init = {}, okStatuses = []) => {
    const res = await fetch(url.startsWith('http') ? url : `${apiBase}${url}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } })
    if (!res.ok && !okStatuses.includes(res.status)) {
      const text = (await res.text()).slice(0, 300)
      const hint =
        res.status === 401 ? ' The token is not valid; make a new one.'
        : res.status === 403 || res.status === 404 ? ' Check the token is for this repository and has the permissions in the guide.'
        : ''
      throw new Error(`GitHub said ${res.status} for ${init.method ?? 'GET'} ${url}.${hint} ${text}`)
    }
    return res
  }

  const files = (await walkAll(OUT)).filter((f) => f.endsWith('.enc'))
  console.log(`Packing ${files.length} files…`)
  const tar = tarOf(await Promise.all(files.map(async (f) => ({ name: relative(OUT, f).split('\\').join('/'), data: await readFile(f) }))))
  console.log(`Packed: ${(tar.length / 1024 / 1024).toFixed(0)} MB.`)

  // The release that holds the archive, made the first time.
  let res = await api(`/repos/${repo}/releases/tags/${RELEASE_TAG}`, {}, [404])
  let release = res.status === 404 ? null : await res.json()
  if (!release) {
    res = await api(`/repos/${repo}/releases`, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: RELEASE_TAG,
        target_commitish: branch,
        name: 'Photo archive (encrypted)',
        body: 'The encrypted photo and speech archive. The website build downloads archive.tar from here. Please do not delete.',
        prerelease: true,
      }),
    })
    release = await res.json()
    console.log('Made the "archive" release on GitHub.')
  }

  // Replace the previous archive.tar, if there is one.
  for (const a of release.assets ?? []) {
    if (a.name === ASSET) await api(`/repos/${repo}/releases/assets/${a.id}`, { method: 'DELETE' })
  }
  console.log('Uploading… (a few minutes on a home connection)')
  await api(`${uploadBase}/repos/${repo}/releases/${release.id}/assets?name=${ASSET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-tar', 'Content-Length': String(tar.length) },
    body: tar,
  })
  console.log('Uploaded.')

  // Ask GitHub to rebuild the site now.
  res = await api(`/repos/${repo}/actions/workflows/deploy.yml/dispatches`, { method: 'POST', body: JSON.stringify({ ref: branch }) }, [403, 404])
  if (res.ok) {
    console.log('Done. GitHub is rebuilding the site; it will be live in about 3 minutes (Actions tab shows a green tick).')
  } else {
    console.log('Done. One more click: on GitHub open the Actions tab, choose "Deploy to GitHub Pages", press "Run workflow", then the green "Run workflow" button.')
  }
}

async function walkAll(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walkAll(p)))
    else if ((await stat(p)).isFile()) out.push(p)
  }
  return out.sort()
}

// ---------------------------------------------------------------------------

try {
  if (command === 'photos') await buildPhotos(args[0], args[1])
  else if (command === 'speeches') await buildSpeeches(args[0])
  else await upload()
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
