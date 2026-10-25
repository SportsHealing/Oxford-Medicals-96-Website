import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Photo } from '../data/types.ts'
import { getNotes, notesEnabled, saveNotes, type Notes } from '../lib/notes.ts'

type Field = 'people' | 'place'

// "Who's in this photo" and "Place", which anyone with the class code can
// fill in or correct: Edit, type, Save.
export default function PhotoNotes({ photo }: { photo: Photo }) {
  const [notes, setNotes] = useState<{ id: string; value: Notes | null; failed: boolean } | null>(null)
  const current = notes?.id === photo.id ? notes : null

  useEffect(() => {
    if (!notesEnabled()) return
    let live = true
    getNotes(photo.id).then(
      (value) => live && setNotes({ id: photo.id, value, failed: false }),
      () => live && setNotes({ id: photo.id, value: null, failed: true }),
    )
    return () => {
      live = false
    }
  }, [photo.id])

  if (!notesEnabled()) return null

  const save = async (field: Field, value: string) => {
    const next = await saveNotes(photo.id, { [field]: value })
    setNotes({ id: photo.id, value: next, failed: false })
  }

  const loading = current === null
  return (
    <div className="space-y-4">
      <NoteField
        key={`people-${photo.id}`}
        label="Who's in this photo"
        value={current?.value?.people ?? ''}
        empty="No one named yet."
        addLabel="Add names"
        placeholder="For example: Jo Smith, Simon (back row), Alex"
        multiline
        loading={loading}
        onSave={(v) => save('people', v)}
      />
      <NoteField
        key={`place-${photo.id}`}
        label="Place"
        value={current?.value?.place || photo.place || ''}
        empty="Not known yet."
        addLabel="Add a place"
        placeholder="For example: Osler House, Oxford"
        loading={loading}
        onSave={(v) => save('place', v)}
      />
      {current?.failed && <p className="font-sans text-sm text-rose-deep">The names could not be loaded just now. Try again in a moment.</p>}
      {current?.value?.at && (
        <p className="font-sans text-xs text-muted">
          Last changed {new Date(current.value.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Anyone with the class code can add or correct these.
        </p>
      )}
    </div>
  )
}

function NoteField(props: {
  label: string
  value: string
  empty: string
  addLabel: string
  placeholder: string
  multiline?: boolean
  loading: boolean
  onSave: (value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const input = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  useEffect(() => {
    if (editing) input.current?.focus()
  }, [editing])

  const start = () => {
    setDraft(props.value)
    setProblem(null)
    setEditing(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setProblem(null)
    try {
      await props.onSave(draft)
      setEditing(false)
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    const common = {
      ref: input,
      value: draft,
      placeholder: props.placeholder,
      className: 'field mt-1',
      'aria-label': props.label,
    }
    return (
      <form onSubmit={submit} className="card border-rose/60 p-4">
        <p className="label-caps text-navy">{props.label}</p>
        {props.multiline ? (
          <textarea
            {...common}
            rows={3}
            maxLength={600}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter saves; Shift+Enter adds a new line.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
        ) : (
          <input {...common} maxLength={120} onChange={(e) => setDraft(e.target.value)} />
        )}
        {problem && <p className="mt-2 font-sans text-sm text-rose-deep">{problem}</p>}
        <div className="mt-3 flex gap-2">
          <button type="submit" className="btn-primary !py-2 text-sm" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn-quiet !py-2 text-sm" onClick={() => setEditing(false)} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <p className="label-caps text-navy">{props.label}</p>
        {!props.loading && (
          <button type="button" onClick={start} className="ml-auto rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-navy transition hover:border-navy">
            {props.value ? 'Edit' : props.addLabel}
          </button>
        )}
      </div>
      <p className={`mt-1 whitespace-pre-line ${props.value ? 'text-ink' : 'text-muted'}`}>{props.loading ? 'Loading…' : props.value || props.empty}</p>
    </div>
  )
}
