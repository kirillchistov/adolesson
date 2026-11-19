import type { SourceCode } from './sources'

// Модуль A «Где ломается» — app-concept.md §4.2. Это профиль, не диагноз.
export type PointId = 'start' | 'understand' | 'continue' | 'submit' | 'recover'

export const points: { id: PointId; label: string; tip: string; tool: string; href: string }[] = [
  {
    id: 'start',
    label: 'Начать',
    tip: 'Самое трудное — войти в задачу.',
    tool: 'Попробуй «Только первый шаг»: 5 минут, потом решаешь сама.',
    href: '#/teen/start',
  },
  {
    id: 'understand',
    label: 'Понять',
    tip: 'Застреваешь на условии или объяснении.',
    tool: 'Попробуй «Точную просьбу»: покажи место, где перестало быть понятно.',
    href: '#/teen/help',
  },
  {
    id: 'continue',
    label: 'Продолжить',
    tip: 'Начинаешь, но внимание уплывает.',
    tool: 'Короткие блоки по 15 минут с одной строкой в конце.',
    href: '#/teen/start',
  },
  {
    id: 'submit',
    label: 'Сдать',
    tip: 'Почти готово, но до сдачи не доходит.',
    tool: 'Добавь в конец блока шаг «отправить» — отдельной строкой.',
    href: '#/teen/start',
  },
  {
    id: 'recover',
    label: 'Восстановиться',
    tip: 'После рывка несколько дней без сил.',
    tool: 'После удачного дня объём не увеличивай. Отдых — часть плана.',
    href: '#/teen/rest',
  },
]

export const barrierCards: { point: PointId; text: string }[] = [
  { point: 'start', text: 'Знаю, что делать, но открыть тетрадь — как стена' },
  { point: 'start', text: 'Сажусь за уроки, а через полчаса понимаю, что так и не начала' },
  { point: 'understand', text: 'Читаю условие и не понимаю, что от меня хотят' },
  { point: 'understand', text: 'На уроке было понятно, а дома — уже нет' },
  { point: 'continue', text: 'Начала, но через 10 минут уже в телефоне или мысли уплыли' },
  { point: 'continue', text: 'Бросаю на середине, когда попадается трудное место' },
  { point: 'submit', text: 'Сделала почти всё, но не отправила и не принесла' },
  { point: 'submit', text: 'Забываю про сроки, пока не становится поздно' },
  { point: 'recover', text: 'После рывка несколько дней ничего не могу' },
  { point: 'recover', text: 'Даже после выходных чувствую себя уставшей' },
]

export const answerScale = [
  { id: 'me', label: 'Про меня', score: 2 },
  { id: 'sometimes', label: 'Иногда', score: 1 },
  { id: 'notme', label: 'Не про меня', score: 0 },
] as const

export const maxPerPoint = 4

export const diagnosticDisclaimer =
  'Это не диагноз и не объяснение причины. Карта показывает, где проверять дальше. Баллы остаются на этом устройстве.'

export const mapSources: SourceCode[] = ['S1', 'S3', 'W7']

export function pointById(id: PointId) {
  return points.find((point) => point.id === id) ?? points[0]
}

export function topPoint(scores: Record<PointId, number>) {
  const ranked = [...points].sort((a, b) => scores[b.id] - scores[a.id])
  const top = ranked[0]
  const tied = ranked.filter((point) => scores[point.id] === scores[top.id])
  return { flat: scores[top.id] === 0 || tied.length > 1, top }
}

export function barrierSentence(scores: Record<PointId, number>) {
  const { flat, top } = topPoint(scores)
  if (flat) return 'Явной точки трения сейчас нет.'
  return `Точка трения — ${top.label.toLowerCase()}. ${top.tool}`
}
