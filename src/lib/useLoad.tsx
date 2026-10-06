import { useCallback, useEffect, useState, type DependencyList } from 'react'

// Small async loader: runs `fn` on mount and whenever deps change.
export function useLoad<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let live = true
    setLoading(true)
    setError(null)
    fn().then(
      (v) => {
        if (!live) return
        setData(v)
        setLoading(false)
      },
      (e: unknown) => {
        if (!live) return
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
      },
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload }
}

export function Loading({ what = 'Loading' }: { what?: string }) {
  return <p className="py-16 text-center text-muted">{what}&hellip;</p>
}

export function LoadError({ message }: { message: string }) {
  return (
    <div className="card mx-auto max-w-md border-rose/60 p-6 text-center">
      <p className="eyebrow">Something went wrong</p>
      <p className="mt-2 text-muted">{message}</p>
    </div>
  )
}
