import type { SourceCode } from './sources'

// ЧЕРНОВИК. Тексты кризисного экрана требуют вычитки специалистом (AGENTS.md, W5, W6).
export const crisisDraft = true

export const crisisSources: SourceCode[] = ['W5', 'W6', 'R1', 'U16']

export const crisisLines = [
  { label: 'Экстренная помощь', phone: '112', note: 'Если есть непосредственная опасность' },
  { label: 'Детский телефон доверия', phone: '8-800-2000-122', note: 'Бесплатно, анонимно, для подростков и родителей' },
]

export const crisisLead =
  'Тебе сейчас очень тяжело. Ты не обязана справляться с этим одна. Здесь нет учёбы, только то, что поможет прямо сейчас.'

export const messageToAdult = 'Мне сейчас очень плохо. Можешь побыть со мной или позвонить?'
