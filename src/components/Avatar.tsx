// A member's profile picture, or their initials in a soft circle if they
// have not added one. Initials get one of the brand tints, picked from the
// name so each person keeps the same colour everywhere.

const tints = [
  'bg-rose-soft text-rose-deep',
  'bg-mist text-navy-soft',
  'bg-stone text-stone-deep',
]

function tintFor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return tints[h % tints.length]
}

export default function Avatar({
  name,
  src,
  size = 'md',
  ring = false,
}: {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  const sizes = {
    xs: 'h-7 w-7 text-[0.65rem]',
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-2xl',
    xl: 'h-28 w-28 text-3xl',
  }
  const ringCls = ring ? 'ring-4 ring-white shadow-card' : ''
  if (src) {
    return <img src={src} alt="" className={`shrink-0 rounded-full bg-rose-soft object-cover ${sizes[size]} ${ringCls}`} />
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-serif font-semibold ${tintFor(name)} ${sizes[size]} ${ringCls}`}
    >
      {initials}
    </span>
  )
}
