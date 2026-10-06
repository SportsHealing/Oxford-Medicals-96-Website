// A member's profile picture, or their initials in a soft circle if they
// have not added one.
export default function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  const sizes = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-2xl',
    xl: 'h-28 w-28 text-3xl',
  }
  if (src) {
    return <img src={src} alt="" className={`shrink-0 rounded-full bg-blush object-cover ${sizes[size]}`} />
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-blush font-serif text-navy ${sizes[size]}`}
    >
      {initials}
    </span>
  )
}
