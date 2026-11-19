import { useEffect, useState } from 'react'

export function useAsync<T>(read: () => Promise<T>, initial: T) {
  const [value, setValue] = useState(initial)
  const [tick, setTick] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let live = true
    read().then((next) => {
      if (!live) return
      setValue(next)
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [read, tick])

  return [value, () => setTick((count) => count + 1), ready] as const
}
