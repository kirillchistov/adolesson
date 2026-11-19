import { weeks } from './content'
import type { PointId } from '../teen/content/map'

const KEY = 'adolesson-parent'

export type SeenLocal = {
  point: PointId | ''
  fact: string
  wellbeing: string
  loop: string
  checks: string[]
}

type ParentLocal = {
  week: number
  note: string
  seen: SeenLocal
}

const emptySeen: SeenLocal = { point: '', fact: '', wellbeing: '', loop: '', checks: [] }

const fallback: ParentLocal = { week: weeks[0].id, note: '', seen: emptySeen }

function knownWeek(id: number) {
  return weeks.some((week) => week.id === id)
}

function isPoint(value: unknown): value is PointId {
  return value === 'start' || value === 'understand' || value === 'continue' || value === 'submit' || value === 'recover'
}

export function readParent(): ParentLocal {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<ParentLocal>
    const seen = parsed.seen && typeof parsed.seen === 'object' ? parsed.seen : emptySeen
    return {
      week: knownWeek(Number(parsed.week)) ? Number(parsed.week) : fallback.week,
      note: typeof parsed.note === 'string' ? parsed.note : '',
      seen: {
        point: isPoint(seen.point) ? seen.point : '',
        fact: typeof seen.fact === 'string' ? seen.fact : '',
        wellbeing: typeof seen.wellbeing === 'string' ? seen.wellbeing : '',
        loop: typeof seen.loop === 'string' ? seen.loop : '',
        checks: Array.isArray(seen.checks) ? seen.checks.filter((item) => typeof item === 'string') : [],
      },
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

export function writeSeen(patch: Partial<SeenLocal>) {
  const current = readParent()
  return writeParent({ seen: { ...current.seen, ...patch } })
}
