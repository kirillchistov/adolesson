import { useState } from 'react'
import { requestKinds } from '../content/teen'
import { readHelpNotes, saveHelpNote, type HelpNote } from '../db'
import { useAsync } from '../useAsync'
import { Screen } from '../ui'

export function Help() {
  const [notes, reload] = useAsync(readHelpNotes, [] as HelpNote[])
  const [kind, setKind] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  function pick(id: string) {
    setKind(id)
    setText(requestKinds.find((item) => item.id === id)?.template ?? '')
    setPreview(false)
    setCopied(false)
  }

  async function keep() {
    if (!kind || !text.trim()) return
    await saveHelpNote(kind, text.trim())
    setKind(null)
    setText('')
    setPreview(false)
    await reload()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text.trim())
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Screen kicker="Помощь" title="Точная просьба">
      <p className="meaning">
        Чем точнее просьба, тем меньше лекций в ответ. Семьи ещё нет: текст остаётся на этом устройстве, его можно скопировать учителю или взрослому.
      </p>
      <div className="chips">
        {requestKinds.map((item) => (
          <button key={item.id} type="button" className={kind === item.id ? 'chip on' : 'chip'} onClick={() => pick(item.id)}>
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
              <p className="kicker">Так это будет выглядеть на общем столе</p>
              <p>«{text.trim()}»</p>
              <p className="quiet">Сейчас стол ещё не подключён. Родители это не увидят.</p>
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setPreview(false)}>
                  Изменить
                </button>
                <button type="button" className="btn ghost" onClick={copy}>
                  {copied ? 'Скопировано' : 'Скопировать'}
                </button>
                <button type="button" className="btn" onClick={keep}>
                  Оставить у себя
                </button>
              </div>
            </article>
          ) : (
            <button type="button" className="btn" disabled={!text.trim()} onClick={() => setPreview(true)}>
              Посмотреть перед сохранением
            </button>
          )}
        </>
      ) : null}
      {notes.length ? (
        <section className="stack">
          <h2>Мои просьбы</h2>
          {notes.map((note) => (
            <article key={note.id} className="panel">
              <p>{note.text}</p>
              <p className="quiet">Только на этом устройстве</p>
            </article>
          ))}
        </section>
      ) : null}
    </Screen>
  )
}
