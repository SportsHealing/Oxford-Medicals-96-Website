export type Photo = {
  id: string
  title: string
  year?: string | null
  place?: string | null
  caption?: string | null
  /** One of PHOTO_CATEGORIES, or null when not sorted. */
  category?: string | null
  /** Archive paths of the encrypted full-size picture and its thumbnail. */
  full: string
  thumb: string
  width?: number
  height?: number
  /** True when the title was given by a person (not taken from the file name). */
  named?: boolean
}

export type Speech = {
  id: string
  slug: string
  title: string
  speaker: string | null
  occasion: string | null
  year: number | null
  /** Paragraphs separated by a blank line (see SpeechBody), or null for a PDF-only speech. */
  body: string | null
  /** The PDF, if there is one. */
  pdf?: { name: string; base64: string } | null
}

export type SpeechQuote = {
  id: string
  text: string
  /** Who said it: the speaker, or someone they quoted. */
  attribution: string
  speechSlug: string
  speechTitle: string
}

/** What speeches.enc holds once decrypted. */
export type SpeechesFile = { speeches: Speech[]; quotes: SpeechQuote[] }

/** What photos.enc holds once decrypted. */
export type PhotosFile = { photos: Photo[]; builtAt?: string }
