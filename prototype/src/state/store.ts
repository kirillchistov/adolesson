import { useSyncExternalStore } from 'react'
import type { Color, PointId } from '../content/teen'

// Прототип: оба слоя живут в localStorage одного браузера.
// В продукте личный слой подростка остаётся на её устройстве (IndexedDB),
// а общий стол — на сервере (app-concept.md §2.2, §9).

export type CheckIn = { at: string; color: Color; words: string }

export type Block = {
  id: string
  plannedResult: string
  startedAt: string
  minutes: number
  got: string
  stuck: string
  next: string
}

export type Theme = 'collage' | 'lunar'

export type TeenState = {
  checkIns: CheckIn[]
  blocks: Block[]
  barrierMap: Record<PointId, number> | null
  card: { adult: string; backupAdult: string; phrase: string }
  theme: Theme
}

export type RequestStatus = 'sent' | 'seen' | 'scheduled' | 'later' | 'done'

export const statusLabel: Record<RequestStatus, string> = {
  sent: 'отправлено',
  seen: 'видят',
  scheduled: 'договорились о времени',
  later: 'давай завтра',
  done: 'готово',
}

export type HelpRequest = {
  id: string
  kind: string
  text: string
  at: string
  status: RequestStatus
  reply: string
}

export type Agreement = {
  priority: string
  result: string
  schedule: string
  minOnHardDay: string
  parentHelp: string
  howToSayStuck: string
  parentsDont: string
  reviewAt: string
  acceptedByTeen: boolean
  acceptedByParent: boolean
}

export type FamilyState = {
  signal: { color: Color; at: string } | null
  requests: HelpRequest[]
  agreement: Agreement
  week: number
}

type Store<T> = {
  get: () => T
  set: (patch: (current: T) => T) => void
  subscribe: (listener: () => void) => () => void
  reset: () => void
}

function createStore<T>(key: string, initial: () => T): Store<T> {
  const listeners = new Set<() => void>()

  function read(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return { ...initial(), ...(JSON.parse(raw) as Partial<T>) }
    } catch {
      // Приватный режим или повреждённые данные — начинаем с чистого состояния
    }
    return initial()
  }

  let state = read()
  const emit = () => listeners.forEach((listener) => listener())

  // Другая вкладка (например, родитель) изменила общий стол
  window.addEventListener('storage', (event) => {
    if (event.key !== key) return
    state = read()
    emit()
  })

  return {
    get: () => state,
    set: (patch) => {
      state = patch(state)
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch {
        // Без сохранения прототип всё равно работает в пределах вкладки
      }
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    reset: () => {
      state = initial()
      try {
        localStorage.removeItem(key)
      } catch {
        // ignore
      }
      emit()
    },
  }
}

export const teenStore = createStore<TeenState>('adolesson.proto.teen', () => ({
  checkIns: [],
  blocks: [],
  barrierMap: null,
  card: { adult: '', backupAdult: '', phrase: '' },
  theme: 'collage',
}))

export const emptyAgreement = (): Agreement => ({
  priority: '',
  result: '',
  schedule: '',
  minOnHardDay: '',
  parentHelp: '',
  howToSayStuck: '',
  parentsDont: '',
  reviewAt: '',
  acceptedByTeen: false,
  acceptedByParent: false,
})

export const familyStore = createStore<FamilyState>('adolesson.proto.family', () => ({
  signal: null,
  requests: [],
  agreement: emptyAgreement(),
  week: 0,
}))

export function useStore<T>(store: Store<T>): [T, Store<T>['set']] {
  const state = useSyncExternalStore(store.subscribe, store.get)
  return [state, store.set]
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function todayCheckIn(state: TeenState): CheckIn | undefined {
  const last = state.checkIns[0]
  if (!last) return undefined
  return new Date(last.at).toDateString() === new Date().toDateString() ? last : undefined
}
