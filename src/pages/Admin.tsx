import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { repo } from '../data/repo.ts'
import type { AdminMember, AllowedEmail, ImportSummary, JoinRequest, RosterPerson, UnrecognisedSignin } from '../data/types.ts'
import { parsePeople } from '../lib/parsePeople.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

type Tab = 'requests' | 'people' | 'add'

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

export default function Admin() {
  const { isAdmin, memberId } = useAuth()
  const [params, setParams] = useSearchParams()
  const { data, loading, error, reload } = useLoad(async () => {
    const [allowed, members, requests, roster, unrecognised] = await Promise.all([
      repo.listAllowedEmails(),
      repo.adminMembers(),
      // These need database update 0010; until then they are simply missing.
      repo.listJoinRequests().catch(() => null),
      repo.listRoster().catch(() => null),
      repo.unrecognisedSignins().catch(() => [] as UnrecognisedSignin[]),
    ])
    return { allowed, members, requests, roster, unrecognised }
  }, [])

  if (!isAdmin) return <Navigate to="/photos" replace />
  if (loading) return <Loading what="Loading admin tools" />
  if (error) return <LoadError message={error} />
  if (!data) return null

  const pending = (data.requests ?? []).filter((r) => r.status === 'pending')
  const waiting = pending.length + data.unrecognised.length
  const tab = (params.get('tab') as Tab | null) ?? (waiting > 0 ? 'requests' : 'people')
  const people = buildPeople(data.allowed, data.members, data.roster ?? [])
  const go = (t: Tab) => setParams({ tab: t }, { replace: true })

  const tabs: { id: Tab; label: string; count?: number; alert?: boolean }[] = [
    { id: 'requests', label: 'Requests', count: waiting, alert: waiting > 0 },
    { id: 'people', label: 'People', count: people.length },
    { id: 'add', label: 'Add people' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Organisers only"
        title="Admin"
        lede="Requests to join, everyone on the class list, and invitations."
        actions={
          <Link to="/photos/new" className="btn-outline">
            + Add photos
          </Link>
        }
      />

      {(data.requests === null || data.roster === null) && (
        <p className="card mb-6 border-rose/60 bg-rose-soft/60 p-4 font-sans text-sm text-ink">
          Join requests and the class list need the latest database update (0010). Run it in the Supabase SQL
          Editor, then reload this page.
        </p>
      )}

      <div role="tablist" aria-label="Admin sections" className="mb-8 grid grid-cols-3 border-b border-line sm:flex sm:gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => go(t.id)}
            className={`-mb-px flex shrink-0 items-center justify-center gap-1.5 border-b-[3px] px-2 py-3 font-sans text-sm font-semibold transition sm:gap-2 sm:px-4 sm:text-[0.95rem] ${
              tab === t.id ? 'border-rose text-navy' : 'border-transparent text-muted hover:text-navy'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${t.alert ? 'bg-rose text-navy' : 'bg-paper text-muted'}`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <RequestsTab requests={data.requests ?? []} unrecognised={data.unrecognised} onChange={reload} />
      )}
      {tab === 'people' && <PeopleTab people={people} me={memberId} onChange={reload} />}
      {tab === 'add' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportForm onDone={reload} />
          <InviteForm onDone={reload} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Requests

function RequestsTab({
  requests,
  unrecognised,
  onChange,
}: {
  requests: JoinRequest[]
  unrecognised: UnrecognisedSignin[]
  onChange: () => void
}) {
  const pending = requests.filter((r) => r.status === 'pending')
  const byName = requests.filter((r) => r.kind === 'name_match' && r.status === 'accepted').slice(0, 20)
  const decided = requests.filter((r) => r.kind === 'request' && r.status !== 'pending').slice(0, 20)

  return (
    <div className="space-y-10">
      <Section
        title="Waiting for a decision"
        hint="People not on the list who asked to join. They have already confirmed their email address. Your decision is emailed to them."
      >
        {pending.length === 0 ? (
          <Empty>No requests waiting. New ones appear here, and admins get an email.</Empty>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {pending.map((r) => (
              <PendingCard key={r.id} request={r} onDone={onChange} />
            ))}
          </ul>
        )}
      </Section>

      {unrecognised.length > 0 && (
        <Section
          title="Earlier sign-in attempts"
          hint="Started signing in with an address that is not on the list, but have not asked to join (some tried before the join form existed). Let them in if you recognise them."
        >
          <Rows>
            {unrecognised.map((u) => (
              <Row key={u.email} main={u.email} sub={`${u.signedIn ? 'Entered a code' : 'Asked for a code'} ${shortDate(u.firstTried)}`}>
                <ActionButton
                  primary
                  confirm={`Let ${u.email} in? They will be able to sign in straight away.`}
                  run={() => repo.addAllowedEmails([u.email], 'let in from earlier attempt')}
                  done={onChange}
                >
                  Let in
                </ActionButton>
              </Row>
            ))}
          </Rows>
        </Section>
      )}

      {byName.length > 0 && (
        <Section
          title="Joined by matching a name"
          hint="These people were not on the list by email, but their name matched one on the class list, so they got in straight away. If one looks wrong, remove their access."
        >
          <Rows>
            {byName.map((r) => (
              <Row
                key={r.id}
                main={r.fullName}
                sub={`${r.email} · matched "${r.matchedName ?? ''}" · ${shortDate(r.createdAt)}`}
              >
                <ActionButton
                  confirm={`Remove access for ${r.fullName} (${r.email})? They will no longer be able to see the site.`}
                  run={() => repo.removeAccess(r.userId)}
                  done={onChange}
                >
                  Remove access
                </ActionButton>
              </Row>
            ))}
          </Rows>
        </Section>
      )}

      {decided.length > 0 && (
        <Section title="Recently decided">
          <Rows>
            {decided.map((r) => (
              <Row key={r.id} main={r.fullName} sub={`${r.email} · ${shortDate(r.decidedAt)}`}>
                <Badge tone={r.status === 'accepted' ? 'navy' : 'stone'}>{r.status === 'accepted' ? 'Accepted' : 'Declined'}</Badge>
                {r.status === 'declined' && (
                  <ActionButton
                    quiet
                    confirm={`Delete the declined request from ${r.email}? They could then ask again.`}
                    run={() => repo.deleteJoinRequest(r.id)}
                    done={onChange}
                  >
                    Delete
                  </ActionButton>
                )}
              </Row>
            ))}
          </Rows>
        </Section>
      )}
    </div>
  )
}

function PendingCard({ request: r, onDone }: { request: JoinRequest; onDone: () => void }) {
  const [declining, setDeclining] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const decide = async (accept: boolean) => {
    setBusy(true)
    setResult(null)
    try {
      const d = await repo.decideJoinRequest(r.id, accept, message.trim() || undefined)
      const what = accept ? 'Accepted' : 'Declined'
      setResult(d.emailed ? `${what}. ${r.fullName} has been emailed.` : `${what}, but the email failed: ${d.emailError ?? 'unknown error'}`)
      setTimeout(onDone, 1200)
    } catch (e) {
      setResult(errorText(e, 'Could not save the decision'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="card space-y-3 p-5">
      <div>
        <p className="font-serif text-xl text-navy">{r.fullName}</p>
        {r.previousName && <p className="font-sans text-sm text-muted">At medical school: {r.previousName}</p>}
        <p className="font-sans text-sm text-ink">{r.email}</p>
        <p className="font-sans text-xs text-muted">Asked {shortDate(r.createdAt)}</p>
      </div>
      {declining && (
        <label className="block">
          <span className="label-caps">Message to include (optional)</span>
          <textarea className="field mt-1.5" rows={2} maxLength={800} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
      )}
      {result ? (
        <p className="font-sans text-sm text-muted">{result}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {!declining ? (
            <>
              <button type="button" className="btn-primary !py-2 text-sm" disabled={busy} onClick={() => void decide(true)}>
                {busy ? 'Saving…' : 'Accept'}
              </button>
              <button type="button" className="btn-outline !py-2 text-sm" disabled={busy} onClick={() => setDeclining(true)}>
                Decline…
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-dark !py-2 text-sm" disabled={busy} onClick={() => void decide(false)}>
                {busy ? 'Saving…' : 'Decline and email them'}
              </button>
              <button type="button" className="btn-quiet !py-2 text-sm" disabled={busy} onClick={() => setDeclining(false)}>
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------- People

type Status = 'joined' | 'invited' | 'not_invited' | 'name_only'
type Person = {
  key: string
  name: string
  email: string | null
  status: Status
  isAdmin: boolean
  memberId: string | null
  onList: boolean
  inviteSentAt: string | null
  specialty: string | null
  preclinical: boolean
}

function buildPeople(allowed: AllowedEmail[], members: AdminMember[], roster: RosterPerson[]): Person[] {
  const allowedBy = new Map(allowed.map((a) => [a.email.toLowerCase(), a]))
  const rosterByEmail = new Map(roster.filter((r) => r.email).map((r) => [r.email!.toLowerCase(), r]))
  const rosterByMember = new Map(roster.filter((r) => r.memberId).map((r) => [r.memberId!, r]))
  const seenEmail = new Set<string>()
  const seenRoster = new Set<string>()
  const out: Person[] = []

  for (const m of members) {
    const email = m.email.toLowerCase()
    const r = rosterByMember.get(m.id) ?? rosterByEmail.get(email)
    const a = allowedBy.get(email)
    out.push({
      key: email, name: m.name || r?.fullName || '', email, status: 'joined', isAdmin: m.isAdmin, memberId: m.id,
      onList: Boolean(a), inviteSentAt: a?.inviteSentAt ?? null, specialty: r?.specialty ?? null, preclinical: r?.cohort === 'preclinical',
    })
    seenEmail.add(email)
    if (r) seenRoster.add(r.id)
  }
  for (const a of allowed) {
    const email = a.email.toLowerCase()
    if (seenEmail.has(email)) continue
    const r = rosterByEmail.get(email)
    out.push({
      key: email, name: r?.fullName ?? '', email, status: a.inviteSentAt ? 'invited' : 'not_invited', isAdmin: false, memberId: null,
      onList: true, inviteSentAt: a.inviteSentAt, specialty: r?.specialty ?? null, preclinical: r?.cohort === 'preclinical',
    })
    seenEmail.add(email)
    if (r) seenRoster.add(r.id)
  }
  for (const r of roster) {
    if (seenRoster.has(r.id) || (r.email && seenEmail.has(r.email.toLowerCase()))) continue
    out.push({
      key: `r:${r.id}`, name: r.fullName, email: r.email, status: r.email ? 'not_invited' : 'name_only', isAdmin: false, memberId: null,
      onList: false, inviteSentAt: null, specialty: r.specialty, preclinical: r.cohort === 'preclinical',
    })
  }
  return out.sort((x, y) => (x.name || '~' + (x.email ?? '')).localeCompare(y.name || '~' + (y.email ?? '')))
}

const FILTERS: { id: Status | 'all' | 'admins'; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'joined', label: 'Joined' },
  { id: 'invited', label: 'Invited' },
  { id: 'not_invited', label: 'Not invited yet' },
  { id: 'name_only', label: 'Name only' },
  { id: 'admins', label: 'Admins' },
]

function PeopleTab({ people, me, onChange }: { people: Person[]; me: string | null; onChange: () => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [query, setQuery] = useState('')
  const [bulk, setBulk] = useState<string | null>(null)

  const count = (id: (typeof FILTERS)[number]['id']) =>
    id === 'all' ? people.length : id === 'admins' ? people.filter((p) => p.isAdmin).length : people.filter((p) => p.status === id).length
  const q = query.trim().toLowerCase()
  const shown = people.filter(
    (p) =>
      (filter === 'all' || (filter === 'admins' ? p.isAdmin : p.status === filter)) &&
      (!q || [p.name, p.email, p.specialty].some((s) => s?.toLowerCase().includes(q))),
  )
  const toInvite = shown.filter((p) => p.status === 'not_invited' && p.email)

  const inviteAll = async () => {
    const batch = toInvite.slice(0, 80)
    if (!confirm(`Send ${batch.length} invitation${batch.length === 1 ? '' : 's'}? (At most 80 at a time, to stay inside the daily email limit.)`)) return
    let sent = 0
    for (let i = 0; i < batch.length; i += 20) {
      setBulk(`Sending ${Math.min(i + 20, batch.length)} of ${batch.length}…`)
      try {
        const r = await repo.sendInvites({ emails: batch.slice(i, i + 20).map((p) => p.email!) })
        sent += r.sent
      } catch (e) {
        setBulk(`Stopped after ${sent}: ${errorText(e, 'could not send')}`)
        onChange()
        return
      }
    }
    setBulk(`Done. ${sent} invitation${sent === 1 ? '' : 's'} sent.`)
    onChange()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field w-full sm:w-72"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or specialty"
          aria-label="Search people"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1.5 font-sans text-sm font-semibold transition ${
                filter === f.id ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:border-navy hover:text-navy'
              }`}
            >
              {f.label} <span className="opacity-70">{count(f.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {filter === 'name_only' && (
        <p className="font-sans text-sm text-muted">
          On the class list without an email address. They can join by entering their name on the sign-in page.
        </p>
      )}
      {toInvite.length > 0 && filter === 'not_invited' && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary !py-2 text-sm" disabled={Boolean(bulk?.startsWith('Sending'))} onClick={() => void inviteAll()}>
            Invite {Math.min(toInvite.length, 80)} {toInvite.length > 80 ? `of ${toInvite.length} ` : ''}now
          </button>
          {bulk && <span className="font-sans text-sm text-muted">{bulk}</span>}
        </div>
      )}

      <Rows>
        {shown.map((p) => (
          <Row
            key={p.key}
            main={p.name || p.email || ''}
            sub={[p.name ? (p.email ?? 'No email yet') : null, p.specialty, p.preclinical ? 'Preclinical' : null].filter(Boolean).join(' · ')}
          >
            {p.isAdmin && <Badge tone="rose">Admin</Badge>}
            <StatusBadge person={p} />
            {p.email && p.status !== 'joined' && (
              <ActionButton run={() => repo.sendInvites({ emails: [p.email!] })} done={onChange}>
                {p.inviteSentAt ? 'Resend invite' : 'Invite'}
              </ActionButton>
            )}
            {p.status === 'joined' && p.memberId && p.memberId !== me && (
              <ActionButton
                confirm={p.isAdmin ? `Remove admin rights from ${p.name || p.email}?` : `Make ${p.name || p.email} an admin?`}
                run={() => repo.setAdmin(p.memberId!, !p.isAdmin)}
                done={onChange}
              >
                {p.isAdmin ? 'Remove admin' : 'Make admin'}
              </ActionButton>
            )}
            {p.status === 'joined' && p.memberId && p.memberId !== me && !p.isAdmin && (
              <ActionButton
                quiet
                confirm={`Remove access for ${p.name || p.email}? They will no longer be able to see the site.`}
                run={() => repo.removeAccess(p.memberId!)}
                done={onChange}
              >
                Remove access
              </ActionButton>
            )}
            {p.status !== 'joined' && p.onList && (
              <ActionButton quiet confirm={`Take ${p.email} off the list?`} run={() => repo.removeAllowedEmail(p.email!)} done={onChange}>
                Remove
              </ActionButton>
            )}
          </Row>
        ))}
        {shown.length === 0 && <li className="px-4 py-4 text-muted">Nobody matches.</li>}
      </Rows>
    </div>
  )
}

function StatusBadge({ person: p }: { person: Person }) {
  if (p.status === 'joined') return <Badge tone="navy">Joined</Badge>
  if (p.status === 'invited') return <Badge tone="mist">Invited {shortDate(p.inviteSentAt)}</Badge>
  if (p.status === 'name_only') return <Badge tone="outline">Name only</Badge>
  return <Badge tone="stone">Not invited</Badge>
}

// ---------------------------------------------------------------- Add people

function ImportForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rows = useMemo(() => parsePeople(text), [text])
  const withEmail = rows.filter((r) => r.email).length
  const warnings = rows.filter((r) => r.warning)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await repo.importPeople(rows.map(({ name, email, specialty, cohort }) => ({ name, email, specialty, cohort })))
      setResult(r)
      setText('')
      onDone()
    } catch (err) {
      setError(errorText(err, 'Could not import'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="card space-y-4 p-6">
      <h2 className="text-xl">Import the class list</h2>
      <p className="font-sans text-sm text-muted">
        Copy rows from Google Sheets or Excel and paste them here: the sign-up sheet (names and emails) or the class
        list (names and specialties). People already listed are matched, not duplicated. Nobody is emailed.
      </p>
      <textarea
        className="field font-mono text-sm"
        rows={8}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setResult(null)
        }}
        placeholder={'Jane Example\tjane@example.com\nSam Sample\tCardiology'}
        aria-label="Rows to import"
      />
      {rows.length > 0 && (
        <div className="space-y-2 font-sans text-sm">
          <p className="text-ink">
            {rows.length} {rows.length === 1 ? 'person' : 'people'} found: {withEmail} with an email, {rows.length - withEmail} name only.
          </p>
          <ul className="max-h-48 divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {rows.slice(0, 50).map((r, i) => (
              <li key={i} className="flex gap-3 px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate">{r.name || <em className="text-muted">no name</em>}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{r.email ?? r.specialty ?? ''}</span>
              </li>
            ))}
          </ul>
          {warnings.length > 0 && (
            <ul className="space-y-0.5 text-rose-deep">
              {warnings.slice(0, 5).map((w, i) => (
                <li key={i}>
                  {w.name || w.email}: {w.warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <p className="font-sans text-sm text-rose-deep">{error}</p>}
      {result && (
        <div className="rounded-xl bg-paper p-4 font-sans text-sm text-ink">
          <p className="font-semibold">Imported.</p>
          <p>
            {result.added} new on the class list, {result.linked} emails matched to names already there,{' '}
            {result.alreadyKnown} already known. {result.emailsAdded} new email {result.emailsAdded === 1 ? 'address' : 'addresses'} can now sign in.
          </p>
          {result.toCheck.length > 0 && <p className="mt-2 text-rose-deep">Please check: {result.toCheck.join('; ')}</p>}
          <p className="mt-2 text-muted">To send invitations, open People, then Not invited yet.</p>
        </div>
      )}
      <button type="submit" className="btn-primary" disabled={busy || rows.length === 0}>
        {busy ? 'Importing…' : rows.length ? `Import ${rows.length}` : 'Import'}
      </button>
    </form>
  )
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const emails = Array.from(
    new Set(
      text
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)),
    ),
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (emails.length === 0) return setMsg('No valid email addresses found.')
    setBusy(true)
    setMsg(null)
    try {
      const r = await repo.sendInvites({ emails, message: message.trim() || undefined })
      setText('')
      setMsg(
        r.failed.length
          ? `Added ${r.added}. Sent ${r.sent}. Could not email ${r.failed.length}: ${r.failed[0].reason}`
          : `Done. ${r.sent} invitation${r.sent === 1 ? '' : 's'} sent.`,
      )
      onDone()
    } catch (err) {
      setMsg(errorText(err, 'Could not send'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="card space-y-4 p-6">
      <h2 className="text-xl">Invite by email</h2>
      <p className="font-sans text-sm text-muted">
        Paste email addresses, one per line or separated by commas. Each person is added to the list and gets their
        own email with a button to join. Replies come back to you.
      </p>
      <textarea className="field font-mono text-sm" rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Email addresses" />
      <label className="block">
        <span className="label-caps">Personal message (optional, goes in the email)</span>
        <textarea
          className="field mt-1.5"
          rows={3}
          maxLength={1500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hope you're well. We've put all the old photos in one place..."
        />
      </label>
      {msg && <p className="font-sans text-sm text-muted">{msg}</p>}
      <button type="submit" className="btn-primary" disabled={busy || emails.length === 0}>
        {busy ? 'Sending…' : emails.length ? `Send ${emails.length} invitation${emails.length === 1 ? '' : 's'}` : 'Send invitations'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------- Shared bits

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl">{title}</h2>
      {hint && <p className="mt-1 max-w-prose font-sans text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="card p-5 font-sans text-sm text-muted">{children}</p>
}

function Rows({ children }: { children: ReactNode }) {
  return <ul className="card divide-y divide-line">{children}</ul>
}

function Row({ main, sub, children }: { main: string; sub?: string; children?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 font-sans text-sm">
      <span className="min-w-0 flex-1 basis-56">
        <span className="block truncate font-semibold text-navy">{main}</span>
        {sub && <span className="block truncate text-muted">{sub}</span>}
      </span>
      <span className="flex flex-wrap items-center gap-2">{children}</span>
    </li>
  )
}

const TONES = {
  navy: 'bg-navy text-white',
  rose: 'bg-rose text-navy',
  mist: 'bg-mist text-navy',
  stone: 'bg-stone text-ink',
  outline: 'border border-dashed border-line text-muted',
} as const

function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>{children}</span>
}

function ActionButton({
  run,
  done,
  confirm: question,
  primary,
  quiet,
  children,
}: {
  run: () => Promise<unknown>
  done: () => void
  confirm?: string
  primary?: boolean
  quiet?: boolean
  children: ReactNode
}) {
  const [busy, setBusy] = useState(false)
  const cls = primary
    ? 'bg-navy text-white hover:bg-navy/90'
    : quiet
      ? 'text-muted hover:text-rose-deep'
      : 'border border-line text-navy hover:border-navy'
  return (
    <button
      type="button"
      disabled={busy}
      className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition disabled:opacity-50 ${cls}`}
      onClick={() => {
        if (question && !confirm(question)) return
        setBusy(true)
        run().then(
          () => {
            setBusy(false)
            done()
          },
          (e: unknown) => {
            setBusy(false)
            alert(errorText(e, 'Something went wrong'))
          },
        )
      }}
    >
      {busy ? '…' : children}
    </button>
  )
}
