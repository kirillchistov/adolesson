import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type Session } from './client'

type SessionState = {
  /** `undefined` — ещё не спрашивали сервер. */
  session: Session | null | undefined
  offline: boolean
  refresh: () => Promise<void>
  setSession: (session: Session | null) => void
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [offline, setOffline] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const { data, response } = await api.GET('/api/session')
      setOffline(false)
      setSession(response.ok ? (data ?? null) : null)
    } catch {
      setOffline(true)
      setSession(null)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return <SessionContext.Provider value={{ session, offline, refresh, setSession }}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession вне SessionProvider')
  return value
}

export function apiMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return fallback
}
