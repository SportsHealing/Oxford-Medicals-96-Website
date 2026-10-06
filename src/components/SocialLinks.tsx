import type { Member } from '../data/types.ts'

// Turns whatever someone typed ("@sam", "instagram.com/sam", a full URL)
// into a link that works.
function handleUrl(value: string, base: string, hosts: RegExp): string | null {
  const v = value.trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  if (hosts.test(v)) return `https://${v.replace(/^\/+/, '')}`
  const handle = v.replace(/^@/, '').replace(/\/+$/, '')
  return handle ? `${base}${handle}` : null
}

export function websiteUrl(v?: string | null) {
  const s = v?.trim()
  if (!s) return null
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}
export const linkedinUrl = (v?: string | null) =>
  v ? handleUrl(v, 'https://www.linkedin.com/in/', /^(www\.)?linkedin\.com\//i) : null
export const instagramUrl = (v?: string | null) =>
  v ? handleUrl(v, 'https://www.instagram.com/', /^(www\.)?instagram\.com\//i) : null
export const twitterUrl = (v?: string | null) =>
  v ? handleUrl(v, 'https://x.com/', /^(www\.)?(x|twitter)\.com\//i) : null

const icons = {
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zm7 0h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z" />
  ),
  website: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4.1c.8 1.1 1.5 2.4 1.9 3.9h-3.8c.4-1.5 1.1-2.8 1.9-3.9zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h3a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6A15.7 15.7 0 0 0 8.1 8zM12 19.9c-.8-1.1-1.5-2.4-1.9-3.9h3.8c-.4 1.5-1.1 2.8-1.9 3.9zm2.3-5.9H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.2 5.6c.6-1.1 1.1-2.3 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z" />
  ),
  instagram: (
    <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2c-2.7 0-3 0-4.1.1C4.3 2.3 2.3 4.3 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.2 3.6 2.2 5.6 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.6-.2 5.6-2.2 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.2-3.6-2.2-5.6-5.8-5.8C15 2 14.7 2 12 2zm0 1.8c2.7 0 3 0 4 .1 2.6.1 3.9 1.4 4 4 .1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.6-1.4 3.9-4 4-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.6-.1-3.9-1.4-4-4-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-2.6 1.4-3.9 4-4 1-.1 1.3-.1 4-.1z" />
  ),
  twitter: (
    <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77zm-1.08 16.17h1.7L7.42 4.74H5.6z" />
  ),
}

export function SocialIcon({ kind, className = 'h-4 w-4' }: { kind: keyof typeof icons; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      {icons[kind]}
    </svg>
  )
}

// The row of link buttons on a profile.
export default function SocialLinks({ person }: { person: Member }) {
  const links = [
    { kind: 'linkedin' as const, label: 'LinkedIn', href: linkedinUrl(person.linkedin), tone: 'hover:bg-[#0a66c2] hover:text-white hover:border-[#0a66c2]' },
    { kind: 'website' as const, label: 'Website', href: websiteUrl(person.website), tone: 'hover:bg-navy hover:text-white hover:border-navy' },
    { kind: 'instagram' as const, label: 'Instagram', href: instagramUrl(person.instagram), tone: 'hover:bg-pink hover:text-navy hover:border-pink' },
    { kind: 'twitter' as const, label: 'X', href: twitterUrl(person.twitter), tone: 'hover:bg-ink hover:text-white hover:border-ink' },
  ].filter((l) => l.href)
  if (links.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.kind}
          href={l.href!}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 font-sans text-sm font-semibold text-navy no-underline transition ${l.tone}`}
        >
          <SocialIcon kind={l.kind} />
          {l.label}
        </a>
      ))}
    </div>
  )
}
