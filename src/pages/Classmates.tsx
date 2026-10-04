import { useState } from 'react'
import { Link } from 'react-router-dom'
import { people } from '../data/sample.ts'

export default function Classmates() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = people.filter(
    (p) =>
      !q ||
      [p.name, p.knownAs, p.college, p.jobTitle, p.workplace]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q)),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl">Classmates</h1>
        <p className="mt-2 text-gray-700">Who they were, and what they do now.</p>
      </div>

      <label className="block max-w-md">
        <span className="font-sans font-semibold text-navy">Search by name, college or job</span>
        <input
          className="field mt-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Balliol, cardiology, Sam"
        />
      </label>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id}>
            <Link
              to={`/classmates/${p.id}`}
              className="block h-full rounded-xl border border-gray-200 p-5 no-underline transition hover:border-pink hover:shadow-md"
            >
              <h2 className="text-xl">{p.name}</h2>
              <p className="font-sans text-sm text-gray-600">{p.college}</p>
              <p className="mt-3 text-navy">{p.jobTitle}</p>
              <p className="font-sans text-sm text-gray-700">{p.workplace}</p>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="text-gray-600">No one matches that search.</li>}
      </ul>
    </div>
  )
}
