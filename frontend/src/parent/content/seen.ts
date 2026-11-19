import type { SourceCode } from '../../teen/content/sources'

export const seenSources: SourceCode[] = ['U8', 'W7', 'S3']

export const seenDisclaimer =
  'Это наблюдения для разговора, не диагноз. Плохая математика не доказывает дискалькулию, рассеянность — СДВГ.'

export const seenChecks: { id: string; label: string; urgent?: boolean }[] = [
  {
    id: 'outside',
    label: 'Похожие трудности внимания или организации бывают и вне математики, и вне дома. Об этом говорят несколько взрослых.',
  },
  {
    id: 'years',
    label: 'Математика трудна уже несколько лет, хотя занятия регулярные.',
  },
  {
    id: 'tired',
    label: 'Усталость держится, хотя сна около 8–10 часов.',
  },
  {
    id: 'worse',
    label: 'Заметно хуже сон, аппетит или посещение школы, либо пропал интерес к привычному.',
  },
  {
    id: 'risk',
    label: 'Есть самоповреждение, слова о нежелании жить или непосредственная опасность.',
    urgent: true,
  },
]

export function seenSentence(label: string) {
  return `В последнем случае остановка на шаге «${label.toLowerCase()}».`
}
