import type { ReactNode } from 'react'

type Props = {
  eyebrow?: string
  title: string
  lede?: string
  actions?: ReactNode
}

// Shared page heading so every page opens with the same rhythm.
export default function PageHeader({ eyebrow, title, lede, actions }: Props) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-4xl leading-tight sm:text-[2.75rem]">{title}</h1>
        <span className="mt-3 block h-[3px] w-12 rounded-full bg-rose" />
        {lede && <p className="lede mt-4">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
