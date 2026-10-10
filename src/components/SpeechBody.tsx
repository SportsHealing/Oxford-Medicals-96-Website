import type { ReactNode } from 'react'

// Turns a speech's plain text into paragraphs. Only a few marks are understood:
//   a blank line          starts a new paragraph
//   ## Heading            a section heading
//   ![caption](data:...)  a picture stored with the speech (no outside links)
//   **bold**, *italic*    inside any paragraph
// Everything is rendered as text, never as HTML.
const IMAGE = /^!\[([^\]]*)\]\((data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+)\)$/

export default function SpeechBody({ body }: { body: string }) {
  const blocks = body
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  return (
    <div className="space-y-5 text-[1.075rem] leading-relaxed text-ink sm:text-lg">
      {blocks.map((b, i) => {
        if (b.startsWith('## ')) {
          return (
            <h2 key={i} className="!mt-10 text-2xl sm:text-3xl">
              {b.slice(3)}
            </h2>
          )
        }
        const img = IMAGE.exec(b)
        if (img) {
          return (
            <figure key={i} className="!my-8">
              <img src={img[2]} alt={img[1]} className="w-full rounded-2xl border border-line bg-white" decoding="async" />
              {img[1] && <figcaption className="mt-2 text-center font-sans text-sm text-muted">{img[1]}</figcaption>}
            </figure>
          )
        }
        return <p key={i}>{inline(b)}</p>
      })}
    </div>
  )
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}
