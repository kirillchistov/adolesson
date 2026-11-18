import { useState } from 'react'
import { colors } from '../content/teen'
import { emptyAgreement, familyStore, statusLabel, useStore, type Agreement, type RequestStatus } from '../state/store'
import { Field, Screen, cx } from '../ui/kit'

type Role = 'teen' | 'parent'

const agreementFields: { key: keyof Omit<Agreement, 'acceptedByTeen' | 'acceptedByParent'>; label: string; placeholder: string }[] = [
  { key: 'priority', label: 'Один учебный приоритет', placeholder: 'Алгебра: квадратные уравнения' },
  { key: 'result', label: 'Конкретный результат', placeholder: 'Решать 3 похожих задачи без подсказки' },
  { key: 'schedule', label: 'Дни и примерное время', placeholder: 'Пн, Ср, Чт, Сб — после 18:00' },
  { key: 'minOnHardDay', label: 'Минимум в трудный день', placeholder: 'Один пример, 10 минут' },
  { key: 'parentHelp', label: 'Одна помощь родителей', placeholder: 'Посидеть рядом, когда попрошу' },
  { key: 'howToSayStuck', label: 'Как сообщить «не получается»', placeholder: 'Кнопка «Точная просьба»' },
  { key: 'parentsDont', label: 'Чего родители не делают', placeholder: 'Не проверяют тетрадь без спроса, не напоминают чаще раза' },
  { key: 'reviewAt', label: 'Время пересмотра', placeholder: 'Воскресенье, 17:00' },
]

// Общий стол — единственное, что видят обе стороны (app-concept.md §3.3)
export function Table({ role }: { role: Role }) {
  const [family, setFamily] = useStore(familyStore)
  const [editing, setEditing] = useState(false)
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const agreement = family.agreement
  const signal = family.signal ? colors.find((item) => item.id === family.signal?.color) : undefined
  const accepted = agreement.acceptedByTeen && agreement.acceptedByParent
  const mineAccepted = role === 'teen' ? agreement.acceptedByTeen : agreement.acceptedByParent

  function edit(key: keyof Agreement, value: string) {
    // Любая правка снимает согласие обеих сторон
    setFamily((state) => ({ ...state, agreement: { ...state.agreement, [key]: value, acceptedByTeen: false, acceptedByParent: false } }))
  }

  function accept() {
    setFamily((state) => ({
      ...state,
      agreement: { ...state.agreement, [role === 'teen' ? 'acceptedByTeen' : 'acceptedByParent']: true },
    }))
  }

  function respond(id: string, status: RequestStatus, text = '') {
    setFamily((state) => ({
      ...state,
      requests: state.requests.map((item) => (item.id === id ? { ...item, status, reply: text || item.reply } : item)),
    }))
    setReplyFor(null)
    setReply('')
  }

  return (
    <Screen kicker="Общий стол" title="То, что видим вместе">
      <section className="stack">
        <h2>Цвет дня</h2>
        {signal ? (
          <article className={cx('panel', 'accent-' + signal.id)}>
            <p>
              <strong>{signal.label}</strong>
              <span className="quiet"> · {new Date(family.signal!.at).toLocaleString('ru', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </p>
            <p>{role === 'parent' ? signal.parent : signal.teen}</p>
          </article>
        ) : (
          <p className="quiet">{role === 'parent' ? 'Цвет не показан. Это нормально: показывать — её выбор.' : 'Цвет можно показать с экрана «Сейчас».'}</p>
        )}
      </section>

      <section className="stack">
        <h2>Договорённость недели</h2>
        {editing ? (
          <>
            {agreementFields.map((field) => (
              <Field key={field.key} label={field.label} placeholder={field.placeholder} value={agreement[field.key]} onChange={(value) => edit(field.key, value)} />
            ))}
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
              Готово
            </button>
          </>
        ) : agreement.priority ? (
          <article className="panel">
            <dl className="agreement">
              {agreementFields
                .filter((field) => agreement[field.key])
                .map((field) => (
                  <div key={field.key}>
                    <dt>{field.label}</dt>
                    <dd>{agreement[field.key]}</dd>
                  </div>
                ))}
            </dl>
            <p className="quiet">
              {accepted
                ? 'Согласовано обеими сторонами. Это проба на неделю, а не обещание никогда не срываться.'
                : `Ждёт согласия: ${[!agreement.acceptedByTeen && 'подростка', !agreement.acceptedByParent && 'родителя'].filter(Boolean).join(' и ')}`}
            </p>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setEditing(true)}>
                Изменить
              </button>
              {!mineAccepted ? (
                <button type="button" className="btn" onClick={accept}>
                  {role === 'teen' ? 'Согласна' : 'Согласен(-на)'}
                </button>
              ) : null}
            </div>
          </article>
        ) : (
          <button type="button" className="btn ghost" onClick={() => setEditing(true)}>
            Начать договорённость
          </button>
        )}
        {agreement.priority && role === 'parent' ? (
          <button type="button" className="text-btn" onClick={() => setFamily((state) => ({ ...state, agreement: emptyAgreement() }))}>
            Начать новую неделю с чистого листа
          </button>
        ) : null}
      </section>

      <section className="stack">
        <h2>Просьбы о помощи</h2>
        {family.requests.length === 0 ? <p className="quiet">Пока просьб нет.</p> : null}
        {family.requests.map((request) => (
          <article key={request.id} className="feed-item">
            <p>«{request.text}»</p>
            <p className="quiet">
              {statusLabel[request.status]}
              {request.reply ? ` · ${request.reply}` : ''}
            </p>
            {role === 'parent' && request.status !== 'done' ? (
              replyFor === request.id ? (
                <div className="row">
                  <input className="inline" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Приду в 19:00" />
                  <button type="button" className="btn" disabled={!reply.trim()} onClick={() => respond(request.id, 'scheduled', reply.trim())}>
                    Ответить
                  </button>
                </div>
              ) : (
                <div className="row">
                  {request.status === 'sent' ? (
                    <button type="button" className="chip" onClick={() => respond(request.id, 'seen')}>
                      Вижу
                    </button>
                  ) : null}
                  <button type="button" className="chip" onClick={() => setReplyFor(request.id)}>
                    Назначить время
                  </button>
                  <button type="button" className="chip" onClick={() => respond(request.id, 'later', 'Давай завтра')}>
                    Давай завтра
                  </button>
                  <button type="button" className="chip" onClick={() => respond(request.id, 'done')}>
                    Готово
                  </button>
                </div>
              )
            ) : null}
          </article>
        ))}
      </section>
    </Screen>
  )
}
