import Dexie, { type Table } from 'dexie'
import type { PointId } from './content/map'

// Личный слой подростка. База живёт только в этом браузере: синхронизации нет.
export type Color = 'green' | 'yellow' | 'red'

export type CheckIn = {
  id: string
  at: string
  color: Color
  words: string
}

export type BlockRecord = {
  id: string
  plannedResult: string
  startedAt: string
  minutes: number
  got: string
  stuck: string
  next: string
}

export type HelpNote = {
  id: string
  kind: string
  text: string
  at: string
}

export type CardRecord = {
  id: 'card'
  adult: string
  backupAdult: string
  phrase: string
}

const emptyCard: CardRecord = { id: 'card', adult: '', backupAdult: '', phrase: '' }

export type BarrierRecord = {
  id: 'barrier'
  scores: Record<PointId, number>
  sleep: string
  energy: string
  fear: string
  goodWeek: string
}

class TeenDB extends Dexie {
  checkIns!: Table<CheckIn, string>
  blocks!: Table<BlockRecord, string>
  helpNotes!: Table<HelpNote, string>
  card!: Table<CardRecord, string>
  maps!: Table<BarrierRecord, string>

  constructor() {
    super('adolesson-teen')
    this.version(1).stores({
      checkIns: 'id, at',
      blocks: 'id, startedAt',
      helpNotes: 'id, at',
      card: 'id',
    })
    this.version(2).stores({ maps: 'id' })
  }
}

export const teenDb = new TeenDB()

export const readCheckIns = () => teenDb.checkIns.orderBy('at').reverse().toArray()
export const readHelpNotes = () => teenDb.helpNotes.orderBy('at').reverse().toArray()
export const readCard = async () => (await teenDb.card.get('card')) ?? emptyCard

export async function readBarrier() {
  return (await teenDb.maps.get('barrier')) ?? null
}

export async function saveBarrier(record: Omit<BarrierRecord, 'id'> & Partial<Pick<BarrierRecord, 'id'>>) {
  const current = (await readBarrier()) ?? {
    id: 'barrier' as const,
    scores: { start: 0, understand: 0, continue: 0, submit: 0, recover: 0 },
    sleep: '',
    energy: '',
    fear: '',
    goodWeek: '',
  }
  await teenDb.maps.put({ ...current, ...record, id: 'barrier' })
}

export function isToday(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
}

export async function saveCheckIn(color: Color, words: string) {
  const today = (await readCheckIns()).find((item) => isToday(item.at))
  if (today) {
    await teenDb.checkIns.update(today.id, { color, words, at: new Date().toISOString() })
    return
  }
  await teenDb.checkIns.add({ id: crypto.randomUUID(), at: new Date().toISOString(), color, words })
}

export async function saveCard(patch: Partial<Omit<CardRecord, 'id'>>) {
  const current = await readCard()
  await teenDb.card.put({ ...current, ...patch, id: 'card' })
}

export async function saveBlock(record: Omit<BlockRecord, 'id'>) {
  await teenDb.blocks.add({ ...record, id: crypto.randomUUID() })
}

export async function saveHelpNote(kind: string, text: string) {
  await teenDb.helpNotes.add({ id: crypto.randomUUID(), kind, text, at: new Date().toISOString() })
}
