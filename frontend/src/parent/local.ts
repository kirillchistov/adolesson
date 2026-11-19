import { weeks } from './content'

const KEY = 'adolesson-parent'

type ParentLocal = {
  week: number
  note: string
}

const fallback: ParentLocal = { week: weeks[0].id, note: '' }

function knownWeek(id: number) {
  return weeks.some((week) => week.id === id)
}

export function readParent(): ParentLocal {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<ParentLocal>
    return {
      week: knownWeek(Number(parsed.week)) ? Number(parsed.week) : fallback.week,
      note: typeof parsed.note === 'string' ? parsed.note : '',
    }
  } catch {
    return fallback
  }
}

export function writeParent(patch: Partial<ParentLocal>) {
  const next = { ...readParent(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
