#!/usr/bin/env node
// Remove preview/thumbnail copies from a downloaded photo folder.
//
// Usage (inside the project folder):
//   npm i -D sharp
//   node scripts/dedupe-photos.mjs ./kululu-photos
//
// Compares every photo by a small visual fingerprint. When a photo looks the
// same as a bigger one and has under half its pixels (a preview copy), it is
// MOVED to a sibling folder "<folder>-duplicates". Look-alikes of similar size
// (e.g. two shots of the same group) are always kept. Photos under 800px on their long edge
// that have no larger twin are moved to "<folder>-small" for you to review.
// Nothing is deleted.

import sharp from 'sharp'
import { mkdir, readdir, rename } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'

const folder = process.argv[2]
if (!folder) {
  console.error('Usage: node scripts/dedupe-photos.mjs <folder>')
  process.exit(1)
}
const root = resolve(folder)
const dupDir = join(dirname(root), basename(root) + '-duplicates')
const smallDir = join(dirname(root), basename(root) + '-small')
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const SMALL_EDGE = 800
const MAX_DISTANCE = 5 // out of 64 bits; small = visually the same picture
const PREVIEW_RATIO = 0.5 // a copy with under half the pixels counts as a preview

const files = (await readdir(root)).filter((f) => exts.has(extname(f).toLowerCase())).sort()
console.log(`Checking ${files.length} photos…`)

// dHash: 9x8 greyscale, compare neighbours → 64-bit fingerprint (two 32-bit halves).
async function fingerprint(path) {
  const img = sharp(path, { failOn: 'none' })
  const meta = await img.metadata()
  const px = await img.clone().rotate().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer()
  let hi = 0, lo = 0
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const bit = px[y * 9 + x] > px[y * 9 + x + 1] ? 1 : 0
      const i = y * 8 + x
      if (i < 32) hi = (hi | (bit << i)) >>> 0
      else lo = (lo | (bit << (i - 32))) >>> 0
    }
  }
  return { hi, lo, pixels: (meta.width ?? 0) * (meta.height ?? 0), edge: Math.max(meta.width ?? 0, meta.height ?? 0) }
}
const pop = (n) => {
  n = n - ((n >>> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333)
  return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

const info = []
let unreadable = 0
for (const [i, f] of files.entries()) {
  try {
    info.push({ f, ...(await fingerprint(join(root, f))) })
  } catch {
    unreadable++
  }
  if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${files.length}`)
}

// Group look-alikes (simple union-find).
const parent = info.map((_, i) => i)
const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
for (let a = 0; a < info.length; a++) {
  for (let b = a + 1; b < info.length; b++) {
    const d = pop((info[a].hi ^ info[b].hi) >>> 0) + pop((info[a].lo ^ info[b].lo) >>> 0)
    if (d <= MAX_DISTANCE) parent[find(b)] = find(a)
  }
}
const groups = new Map()
info.forEach((x, i) => {
  const r = find(i)
  if (!groups.has(r)) groups.set(r, [])
  groups.get(r).push(x)
})

await mkdir(dupDir, { recursive: true })
await mkdir(smallDir, { recursive: true })
let kept = 0, moved = 0, small = 0
const edges = []
for (const g of groups.values()) {
  g.sort((a, b) => b.pixels - a.pixels)
  const [best, ...rest] = g
  const keep = [best]
  for (const r of rest) {
    if (r.pixels < best.pixels * PREVIEW_RATIO) {
      await rename(join(root, r.f), join(dupDir, r.f))
      moved++
    } else keep.push(r)
  }
  for (const k of keep) {
    if (k.edge < SMALL_EDGE) {
      await rename(join(root, k.f), join(smallDir, k.f))
      small++
    } else {
      kept++
      edges.push(k.edge)
    }
  }
}

edges.sort((a, b) => a - b)
const q = (p) => edges[Math.floor((edges.length - 1) * p)] ?? 0
console.log('')
console.log(`Kept ${kept} photos in ${root}`)
console.log(`Moved ${moved} lower-resolution copies to ${dupDir}`)
console.log(`Moved ${small} small photos with no larger copy to ${smallDir} (please look at these)`)
if (unreadable) console.log(`${unreadable} files could not be read and were left in place`)
if (edges.length) console.log(`Size of kept photos (long edge, pixels): smallest ${q(0)}, typical ${q(0.5)}, largest ${q(1)}`)
