import { useEffect, useState } from 'react'
import { api, type TableNote } from '../../api/client'
import { useSession } from '../../api/session'
import { PublishNote } from '../../shared/PublishNote'
import { points, type PointId } from '../../teen/content/map'
import { Field, Screen, Sources } from '../../teen/ui'
import { seenChecks, seenDisclaimer, seenSentence, seenSources } from '../content/seen'
import { readParent, writeSeen, type SeenLocal } from '../local'

export function Seen() {
  const { session } = useSession()
  const [seen, setSeen] = useState<SeenLocal>(() => readParent().seen)
  const [shared, setShared] = useState<TableNote[]>([])

  useEffect(() => {
    if (!session) return
    let live = true
    api.GET('/api/table-notes').then((result) => {
      if (live && result.data) setShared(result.data)
    })
    return () => {
      live = false
    }
  }, [session])

  function update(patch: Partial<SeenLocal>) {
    setSeen(writeSeen(patch).seen)
  }

  function toggle(id: string) {
    const checks = seen.checks.includes(id) ? seen.checks.filter((item) => item !== id) : [...seen.checks, id]
    update({ checks })
  }

  const point = points.find((item) => item.id === seen.point)
  const teenBarrier = shared.find((note) => note.kind === 'barrier' && note.authorId !== session?.member.id)
  const help = seen.checks.some((id) => seenChecks.find((item) => item.id === id))
  const urgent = seen.checks.includes('risk')

  return (
    <Screen kicker="Модуль B" title="Что вижу" back="#/parent/week">
      <p className="meaning">Один последний случай. Факт остаётся на этом устройстве. На стол можно положить одну фразу.</p>
      <div className="row wrap">
        {points.map((item) => (
          <button
            key={item.id}
            type="button"
            className={seen.point === item.id ? 'chip on' : 'chip'}
            aria-pressed={seen.point === item.id}
            onClick={() => update({ point: seen.point === item.id ? '' : (item.id as PointId) })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Field label="Что произошло, без оценки характера" value={seen.fact} onChange={(fact) => update({ fact })} multiline />
      <Field label="Сон и самочувствие за неделю" value={seen.wellbeing} onChange={(wellbeing) => update({ wellbeing })} multiline />
      <Field label="Где в петле «давление → обещание → рывок → спад» вступили вы" value={seen.loop} onChange={(loop) => update({ loop })} multiline />
      <section className="stack">
        <h2>Можно отметить, если узнаёте</h2>
        {seenChecks.map((item) => (
          <button
            key={item.id}
            type="button"
            className={seen.checks.includes(item.id) ? 'chip block on' : 'chip block'}
            aria-pressed={seen.checks.includes(item.id)}
            onClick={() => toggle(item.id)}
          >
            {item.label}
          </button>
        ))}
      </section>
      {urgent ? (
        <a className="btn danger" href="#/parent/help">
          Срочно: когда нужна помощь
        </a>
      ) : null}
      {point ? (
        <article className="panel">
          <p>{seenSentence(point.label)}</p>
          {teenBarrier ? (
            <p>
              На столе названо: «{teenBarrier.text}». Если это другая точка, это тема разговора, не спор, кто точнее.
            </p>
          ) : (
            <p className="quiet">Сравнение появится, если подросток сам положит свою фразу на стол.</p>
          )}
          <p className="quiet">{seenDisclaimer}</p>
        </article>
      ) : (
        <p className="quiet">Точку можно не выбирать. Пустое — нормальный вариант.</p>
      )}
      {help && !urgent ? (
        <a className="choice" href="#/parent/help">
          <strong>Когда нужна помощь раньше</strong>
          <span>По отмеченному есть повод посмотреть маршрут, не дожидаясь 8-й недели.</span>
        </a>
      ) : null}
      {point ? <PublishNote kind="seen" label="Фраза на стол" suggestion={seenSentence(point.label)} /> : null}
      <Sources codes={seenSources} />
    </Screen>
  )
}
