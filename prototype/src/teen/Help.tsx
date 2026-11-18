import { useState } from 'react'
import { requestKinds } from '../content/teen'
import { familyStore, statusLabel, uid, useStore } from '../state/store'
import { Screen, cx } from '../ui/kit'

// «Точная просьба» (support-concept.md §8 Г) → общий стол
export function Help() {
  const [family, setFamily] = useStore(familyStore)
  const [kind, setKind] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(false)

  function pick(id: string) {
    setKind(id)
    setText(requestKinds.find((item) => item.id === id)?.template ?? '')
    setPreview(false)
  }

  function send() {
    if (!kind || !text.trim()) return
    setFamily((state) => ({
      ...state,
      requests: [
        { id: uid(), kind, text: text.trim(), at: new Date().toISOString(), status: 'sent', reply: '' },
        ...state.requests,
      ],
    }))
    setKind(null)
    setText('')
    setPreview(false)
  }

  return (
    <Screen kicker="Помощь" title="Точная просьба">
      <p className="meaning">Чем точнее просьба, тем меньше лекций в ответ. Выбери, что ближе.</p>
      <div className="chips">
        {requestKinds.map((item) => (
          <button key={item.id} type="button" className={cx('chip', kind === item.id && 'on')} onClick={() => pick(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {kind ? (
        <>
          <label className="field">
            <span>Можно поправить своими словами</span>
            <textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} />
          </label>
          {preview ? (
            <article className="panel">
              <p className="kicker">Это увидят родители на общем столе</p>
              <p>«{text.trim()}»</p>
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setPreview(false)}>
                  Изменить
                </button>
                <button type="button" className="btn" onClick={send}>
                  Отправить
                </button>
              </div>
            </article>
          ) : (
            <button type="button" className="btn" disabled={!text.trim()} onClick={() => setPreview(true)}>
              Посмотреть перед отправкой
            </button>
          )}
        </>
      ) : null}

      {family.requests.length ? (
        <section className="stack">
          <h2>Мои просьбы</h2>
          {family.requests.map((request) => (
            <article key={request.id} className="feed-item">
              <p>{request.text}</p>
              <p className="quiet">
                {statusLabel[request.status]}
                {request.reply ? ` · «${request.reply}»` : ''}
              </p>
            </article>
          ))}
        </section>
      ) : null}
    </Screen>
  )
}
