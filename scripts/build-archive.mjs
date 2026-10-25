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
// upload:   pushes public/archive to the main branch on GitHub in one commit,
//           which publishes the site. Needs a GitHub token with "Contents:
//           read and write" on the repository.
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
  let done = 0, skipped = 0, failed = 0
  for (const file of files) {
    const bytes = await readFile(file)
    const ext = extname(file).toLowerCase()
    const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 16)
    const id = hash
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
  console.log(`Done: ${done} pictures made, ${skipped} already made, ${failed} could not be read. ${photos.length} in the list.`)
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

async function upload() {
  const token = (process.env.GITHUB_TOKEN ?? '').trim()
  const repo = process.env.GITHUB_REPO ?? 'SportsHealing/oxford-medicals-96-website'
  const branch = process.env.GITHUB_BRANCH ?? 'main'
  if (!token) {
    console.error('Set GITHUB_TOKEN first (a fine-grained token with Contents: read and write on the repository).')
    process.exit(1)
  }
  if (!existsSync(OUT)) {
    console.error('There is no public/archive folder yet. Run the photos or speeches step first.')
    process.exit(1)
  }
  const api = async (path, init = {}) => {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(init.headers ?? {}) },
    })
    if (!res.ok) throw new Error(`GitHub ${init.method ?? 'GET'} ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`)
    return res.json()
  }

  const files = (await walkAll(OUT)).filter((f) => f.endsWith('.enc'))
  console.log(`Uploading ${files.length} files to ${repo} (${branch})…`)
  const head = await api(`/repos/${repo}/git/ref/heads/${branch}`)
  const headSha = head.object.sha
  const headCommit = await api(`/repos/${repo}/git/commits/${headSha}`)

  // Files already on GitHub with the same content are left alone.
  const remote = new Map()
  try {
    const tree = await api(`/repos/${repo}/git/trees/${headCommit.tree.sha}?recursive=1`)
    for (const t of tree.tree ?? []) if (t.type === 'blob' && t.path.startsWith('public/archive/')) remote.set(t.path, t.sha)
  } catch {
    /* a huge tree may be truncated; then everything is re-sent */
  }

  const entries = []
  let sent = 0, same = 0
  const queue = [...files]
  const worker = async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      const path = 'public/archive/' + relative(OUT, file).split('\\').join('/')
      const content = await readFile(file)
      const gitSha = createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex')
      if (remote.get(path) === gitSha) {
        same++
        entries.push({ path, mode: '100644', type: 'blob', sha: gitSha })
        continue
      }
      const blob = await api(`/repos/${repo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' }) })
      entries.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
      sent++
      if ((sent + same) % 50 === 0) console.log(`  ${sent + same} of ${files.length}…`)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  if (sent === 0) {
    console.log('Everything is already on GitHub. Nothing to do.')
    return
  }
  const tree = await api(`/repos/${repo}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries }) })
  const commit = await api(`/repos/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: `Archive: ${sent} file${sent === 1 ? '' : 's'} updated`, tree: tree.sha, parents: [headSha] }),
  })
  await api(`/repos/${repo}/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) })
  console.log(`Done: ${sent} files uploaded (${same} unchanged). The site will update in a few minutes.`)
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
