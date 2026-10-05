#!/usr/bin/env node
// Save every photo from a Kululu album to a local folder.
//
// Usage (run on your own computer, inside the project folder):
//   npm i -D playwright && npx playwright install chromium
//   node scripts/download-kululu.mjs https://app.kululu.com/oxfordmedics30years ./kululu-photos
//
// A browser window opens. If the album asks for a name or password, enter it
// there; the script waits until photos are visible, scrolls to load them all,
// then downloads the largest version of each image it can find.
//
// If it finds nothing, it saves the page HTML to ./kululu-page.html so the
// script can be adjusted for the album's exact layout.

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const [, , albumUrl, outDir = './kululu-photos'] = process.argv
if (!albumUrl) {
  console.error('Usage: node scripts/download-kululu.mjs <album url> [output folder]')
  process.exit(1)
}
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })

// Collect every image response the page fetches, keeping the largest per URL stem.
const seen = new Map() // key: url without query/size suffix → { url, bytes }
page.on('response', async (res) => {
  const type = res.headers()['content-type'] ?? ''
  if (!type.startsWith('image/')) return
  const url = res.url()
  if (/avatar|icon|logo|emoji|\.svg/i.test(url)) return
  try {
    const bytes = await res.body()
    if (bytes.length < 20_000) return // thumbnails and UI images
    const key = url.replace(/[?#].*$/, '').replace(/[-_](w|h|s|size|thumb)?\d{2,4}(x\d{2,4})?(?=\.\w+$)/i, '')
    const prev = seen.get(key)
    if (!prev || bytes.length > prev.bytes.length) seen.set(key, { url, bytes, type })
  } catch {
    /* response body gone, ignore */
  }
})

console.log('Opening album. If it asks for a name or password, fill it in in the browser window.')
await page.goto(albumUrl, { waitUntil: 'domcontentloaded' })

// Wait for the user to get past any welcome screen: poll until real images appear.
console.log('Waiting for photos to appear…')
await page.waitForFunction(() => document.querySelectorAll('img').length > 5, null, { timeout: 10 * 60 * 1000 })

// Scroll to the bottom repeatedly until no new images load.
let lastCount = -1
for (let i = 0; i < 400; i++) {
  await page.mouse.wheel(0, 4000)
  await page.waitForTimeout(700)
  const count = await page.evaluate(() => document.querySelectorAll('img').length)
  if (count === lastCount && i > 5) {
    await page.waitForTimeout(2500)
    const again = await page.evaluate(() => document.querySelectorAll('img').length)
    if (again === count) break
  }
  lastCount = count
  if (i % 10 === 0) console.log(`  ${count} images on page so far…`)
}

// Try to open each photo in its full-size view so the original is fetched.
const thumbs = await page.$$('img')
console.log(`Opening ${thumbs.length} photos to fetch full-size versions. This takes a while.`)
for (let i = 0; i < thumbs.length; i++) {
  try {
    await thumbs[i].scrollIntoViewIfNeeded()
    await thumbs[i].click({ timeout: 2000 })
    await page.waitForTimeout(900)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  } catch {
    /* not clickable, skip */
  }
  if (i % 25 === 0 && i > 0) console.log(`  ${i}/${thumbs.length}`)
}

if (seen.size === 0) {
  await writeFile('./kululu-page.html', await page.content())
  console.log('No images captured. Saved the page as kululu-page.html; send that file to Claude.')
} else {
  let n = 0
  for (const { url, bytes, type } of seen.values()) {
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg'
    const name = `${String(++n).padStart(4, '0')}-${url.split('/').pop().replace(/[?#].*$/, '').replace(/[^\w.-]/g, '_').slice(0, 60)}`
    await writeFile(join(outDir, name.endsWith(`.${ext}`) ? name : `${name}.${ext}`), bytes)
  }
  console.log(`Saved ${n} photos to ${outDir}.`)
}
await browser.close()
