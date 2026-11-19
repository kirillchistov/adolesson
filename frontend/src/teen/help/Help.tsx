import { useState } from 'react'
import { api, type components } from '../../api/client'
import { apiMessage, useSession } from '../../api/session'
import { requestKinds } from '../content/teen'
import { readHelpNotes, saveHelpNote, type HelpNote } from '../db'
import { useAsync } from '../useAsync'
import { Screen } from '../ui'

export function Help() {
  const { session } = useSession()
  const [notes, reload] = useAsync(readHelpNotes, [] as HelpNote[])
  const [kind, setKind] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [shareError, setShareError] = useState('')

  function pick(id: string) {
    setKind(id)
    setText(requestKinds.find((item) => item.id === id)?.template ?? '')
    setPreview(false)
    setCopied(false)
    setShared(false)
    setShareError('')
  }

  async function keep() {
    if (!kind || !text.trim()) return
    await saveHelpNote(kind, text.trim())
    setKind(null)
    setText('')
    setPreview(false)
    await reload()
  }

  async function share() {
    if (!kind || !text.trim()) return
    const result = await api.POST('/api/help-requests', {
      body: { kind: kind as components['schemas']['HelpKind'], text: text.trim() },
    })
    if (!result.response.ok) {
      setShareError(apiMessage(result.error, 'Просьба не легла на стол'))
      return
    }
    setShared(true)
    setShareError('')
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
        {session
          ? 'Чем точнее просьба, тем меньше лекций в ответ. На стол она попадает только после просмотра.'
          : 'Чем точнее просьба, тем меньше лекций в ответ. Семьи ещё нет: текст остаётся на этом устройстве, его можно скопировать учителю или взрослому.'}
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
              <p className="quiet">{session ? 'Родители увидят этот текст, если положить его на стол.' : 'Сейчас стол ещё не подключён. Родители это не увидят.'}</p>
              <div className="row wrap">
                <button type="button" className="btn ghost" onClick={() => setPreview(false)}>
                  Изменить
                </button>
                <button type="button" className="btn ghost" onClick={copy}>
                  {copied ? 'Скопировано' : 'Скопировать'}
                </button>
                <button type="button" className="btn" onClick={keep}>
                  Оставить у себя
                </button>
                {session ? (
                  <button type="button" className="btn" onClick={share} disabled={shared}>
                    {shared ? 'На столе' : 'Положить на стол'}
                  </button>
                ) : null}
              </div>
              {shareError ? <p className="quiet">{shareError}</p> : null}
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
