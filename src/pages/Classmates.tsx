import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

export default function Classmates() {
  const { data: members, loading, error } = useLoad(() => repo.listMembers(), [])
  const [query, setQuery] = useState('')

  if (loading) return <Loading what="Fetching classmates" />
  if (error) return <LoadError message={error} />

  const q = query.trim().toLowerCase()
  const shown = (members ?? []).filter(
    (p) =>
      !q ||
      [p.name, p.knownAs, p.college, p.jobTitle, p.workplace]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q)),
  )

  return (
    <div>
      <PageHeader
        eyebrow="The directory"
        title="Classmates"
        lede="Who they were, and what they do now."
        actions={
          <input
            className="field w-72"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, college or job"
            aria-label="Search classmates"
          />
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id}>
            <Link to={`/classmates/${p.id}`} className="card card-hover flex h-full items-start gap-4 p-5 no-underline">
              <Avatar name={p.name} src={p.avatarUrl} />
              <span className="min-w-0">
                <span className="block font-serif text-xl text-navy">{p.name}</span>
                <span className="block font-sans text-sm text-muted">{p.college ?? 'College not given'}</span>
                <span className="mt-3 block font-sans text-[0.95rem] text-ink">{p.jobTitle ?? 'Profile not filled in yet'}</span>
                {p.workplace && <span className="block truncate font-sans text-sm text-muted">{p.workplace}</span>}
              </span>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="text-muted">No one matches that search.</li>}
      </ul>
    </div>
  )
}
