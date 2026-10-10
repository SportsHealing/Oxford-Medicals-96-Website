import { useRef, useState } from 'react'
import { repo } from '../data/repo.ts'
import { PHOTO_CATEGORIES } from '../lib/photoCategories.ts'

// Asks the AI sorter, a few photos at a time, to suggest a category for every
// photo that has none. Runs while this page stays open; Stop pauses it, and
// pressing the button again carries on where it left off.
export function AiSortPanel({ unsorted, onProgress, onPickUnsorted }: { unsorted: number; onProgress: () => void; onPickUnsorted: () => void }) {
  const [run, setRun] = useState<{ done: number; total: number; failed: string[] } | null>(null)
  const [running, setRunning] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const stop = useRef(false)

  const start = async () => {
    setProblem(null)
    setRunning(true)
    stop.current = false
    let done = 0
    let failed: string[] = []
    const total = unsorted
    setRun({ done, total, failed })
    try {
      for (let batch = 1; !stop.current; batch++) {
        const r = await repo.sortPhotosWithAi(failed)
        done += r.sorted
        failed = [...failed, ...r.failed]
        setRun({ done, total: Math.max(total, done + failed.length + r.remaining), failed })
        if (r.remaining === 0 || (r.sorted === 0 && r.failed.length === 0)) break
        // Refresh the grid now and then, not after every few photos.
        if (batch % 6 === 0) onProgress()
      }
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'The AI sorter stopped.')
    } finally {
      setRunning(false)
      onProgress()
    }
  }

  if (unsorted === 0 && !run) return null
  const pct = run && run.total > 0 ? Math.round(((run.done + run.failed.length) / run.total) * 100) : 0

  return (
    <div className="card mb-6 space-y-3 border-navy/20 bg-mist/40 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-ink">
          {unsorted > 0 ? (
            <>
              <button type="button" className="font-semibold text-navy underline-offset-4 hover:underline" onClick={onPickUnsorted}>
                {unsorted} {unsorted === 1 ? 'photo has' : 'photos have'} no category yet.
              </button>{' '}
              Sort them by hand below, or let the AI suggest a category for each. You can change any of them afterwards.
            </>
          ) : (
            'Every photo has a category.'
          )}
        </p>
        {running ? (
          <button type="button" className="btn-outline !py-2 text-sm" onClick={() => (stop.current = true)}>
            Stop
          </button>
        ) : (
          unsorted > 0 && (
            <button type="button" className="btn-dark !py-2 text-sm" onClick={() => void start()}>
              {run ? 'Carry on with AI' : 'Suggest categories with AI'}
            </button>
          )
        )}
      </div>
      {run && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-rose transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 font-sans text-sm text-muted" aria-live="polite">
            {running ? 'Sorting… keep this page open. ' : ''}
            {run.done} sorted{run.failed.length > 0 ? `, ${run.failed.length} could not be read (sort those by hand)` : ''}.
          </p>
        </div>
      )}
      {problem && <p className="font-sans text-sm text-rose-deep">{problem}</p>}
    </div>
  )
}

// The bar along the bottom of the screen while photos are selected.
export function MoveBar({
  count,
  onSelectAll,
  onClear,
  onMove,
}: {
  count: number
  onSelectAll: () => void
  onClear: () => void
  onMove: (category: string | null) => Promise<void>
}) {
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const move = async () => {
    if (!target) return
    setBusy(true)
    setProblem(null)
    try {
      await onMove(target === 'none' ? null : target)
      setTarget('')
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Could not move the photos')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 shadow-pop backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 font-sans text-sm sm:px-5">
        <span className="font-semibold text-navy">{count} selected</span>
        <button type="button" className="text-muted hover:text-navy" onClick={onSelectAll}>
          Select all shown
        </button>
        <button type="button" className="text-muted hover:text-navy" onClick={onClear}>
          Clear
        </button>
        <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
          <select className="field !py-2 sm:w-60" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Move to">
            <option value="">Move to…</option>
            {PHOTO_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            <option value="none">Not sorted yet</option>
          </select>
          <button type="button" className="btn-primary !py-2" disabled={!target || busy} onClick={() => void move()}>
            {busy ? 'Moving…' : 'Move'}
          </button>
        </div>
        {problem && <p className="w-full text-rose-deep">{problem}</p>}
      </div>
    </div>
  )
}
