import type { InterestId } from '../moe/state/types'
import type { Color } from '../db'
import type { SourceCode } from './sources'

export const colors: { id: Color; label: string; teen: string; parent: string }[] = [
  {
    id: 'green',
    label: 'Норм',
    teen: 'Обычный согласованный объём. Перерывы — по плану, остановиться — тоже по плану.',
    parent: 'Обычный объём. Не добавлять сверх договорённости после удачного дня.',
  },
  {
    id: 'yellow',
    label: 'Тяжеловато',
    teen: 'Минимальный объём. Одна главная задача — и хватит.',
    parent: 'Одна главная задача, без дополнительной проверки и напоминаний.',
  },
  {
    id: 'red',
    label: 'Совсем нет сил',
    teen: 'Сегодня не про учёбу. Сначала восстановиться.',
    parent: 'Сначала безопасность и отдых, без выяснения отношений. Возврат к учёбе — позже, по договорённости.',
  },
]

const recoveryByInterest: Partial<Record<InterestId, string>> = {
  drawing: '5 минут на эскиз',
  clothes: 'Примерить одну вещь',
  dance: 'Потанцевать',
  music: 'Музыка',
}

const genericRecovery = ['Прогулка', 'Музыка', 'Душ', 'Рисовать без цели', 'Написать другу', 'Потанцевать']

export function recoveryOptions(interests: InterestId[]) {
  const fromMine = interests.map((id) => recoveryByInterest[id]).filter((item): item is string => Boolean(item))
  return [...new Set([...fromMine, ...genericRecovery])]
}

export const requestKinds: { id: string; label: string; template: string }[] = [
  { id: 'understand', label: 'Не понимаю условие', template: 'Я прочитала условие, но не знаю, что обозначить за x.' },
  { id: 'signs', label: 'Теряю шаги или знаки', template: 'Я могу решить, но теряю знаки — помоги проверить шаги.' },
  { id: 'sit', label: 'Просто побудь рядом', template: 'Посиди рядом десять минут, не объясняя без просьбы.' },
  { id: 'start', label: 'Не могу начать', template: 'Не могу начать. Помоги выбрать первый маленький шаг.' },
  { id: 'big', label: 'План слишком большой', template: 'План на сегодня слишком большой. Давай уменьшим.' },
  { id: 'own', label: 'Своими словами', template: '' },
]

export const firstStepExamples = [
  'Открыть тетрадь и записать условие',
  'Разобрать один пример из учебника',
  'Решить первую строку и остановиться',
]

export const startSources: SourceCode[] = ['S1', 'S3']

export const allowedToSay = ['Я не понимаю', 'Я не согласна', 'План слишком большой', 'Я не начала', 'Мне нужна помощь']
