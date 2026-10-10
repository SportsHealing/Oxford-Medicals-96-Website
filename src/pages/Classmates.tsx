import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../components/Avatar.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { repo } from '../data/repo.ts'
import type { Member } from '../data/types.ts'
import { foldText, specialtyGroup } from '../lib/specialties.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

// The map and its geography load only when someone opens the Map view.
const ClassmatesMap = lazy(() => import('../components/ClassmatesMap.tsx'))

const searchText = (p: Member) =>
  foldText(
    [p.name, p.knownAs, p.previousName, p.specialty, p.college, p.jobTitle, p.workplace, p.town, p.country]
      .filter(Boolean)
      .join(' '),
  )

export default function Classmates() {
  const { data: members, loading, error } = useLoad(() => repo.listMembers(), [])
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'map' ? 'map' : 'list'
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const search = useRef<HTMLInputElement>(null)

  // "/" jumps to the search box, as on many sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key === '/' && !(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const all = useMemo(() => members ?? [], [members])
  const indexed = useMemo(() => all.map((p) => ({ p, text: searchText(p), group: specialtyGroup(p.specialty ?? p.jobTitle) })), [all])
  const groups = useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of indexed) if (i.group) counts.set(i.group, (counts.get(i.group) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [indexed])

  if (loading) return <Loading what="Fetching classmates" />
  if (error) return <LoadError message={error} />

  const words = foldText(query).split(/\s+/).filter(Boolean)
  const shown = indexed
    .filter((i) => (!group || i.group === group) && words.every((w) => i.text.includes(w)))
    .map((i) => i.p)
  const setView = (v: 'list' | 'map') => setParams(v === 'map' ? { view: 'map' } : {}, { replace: true })

  return (
    <div>
      <PageHeader
        eyebrow="The directory"
        title="Classmates"
        lede="Who they were, what they do now, and where they are."
        actions={
          <div role="tablist" aria-label="View" className="grid grid-cols-2 rounded-full bg-paper p-1 font-sans text-sm font-semibold">
            {(['list', 'map'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-5 py-2 transition ${view === v ? 'bg-white text-navy shadow-card' : 'text-muted hover:text-navy'}`}
              >
                {v === 'list' ? 'List' : 'Map'}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          ref={search}
          className="field w-full sm:w-80"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, specialty, town…"
          aria-label="Search classmates"
          type="search"
        />
        {groups.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Chip active={!group} onClick={() => setGroup(null)}>
              Everyone {all.length}
            </Chip>
            {groups.map(([g, n]) => (
              <Chip key={g} active={group === g} onClick={() => setGroup(group === g ? null : g)}>
                {g} {n}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {view === 'map' ? (
        <Suspense fallback={<Loading what="Drawing the map" />}>
          <ClassmatesMap people={shown} />
        </Suspense>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id}>
              <Link to={`/classmates/${p.id}`} className="card card-hover flex h-full items-start gap-4 p-5 no-underline">
                <Avatar name={p.name} src={p.avatarUrl} />
                <span className="min-w-0">
                  <span className="block font-serif text-xl text-navy">{p.name}</span>
                  {p.previousName && <span className="block font-sans text-sm text-muted">At Oxford: {p.previousName}</span>}
                  <span className="mt-2 block font-sans text-[0.95rem] text-ink">
                    {p.specialty || p.jobTitle || 'Profile not filled in yet'}
                  </span>
                  {(p.town || p.workplace) && (
                    <span className="block truncate font-sans text-sm text-muted">{p.town || p.workplace}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
          {shown.length === 0 && <li className="text-muted">No one matches that search.</li>}
        </ul>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 font-sans text-sm font-semibold transition ${
        active ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:border-navy hover:text-navy'
      }`}
    >
      {children}
    </button>
  )
}
