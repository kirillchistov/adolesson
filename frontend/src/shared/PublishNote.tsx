import { useEffect, useState } from 'react'
import { api, type TableNoteKind } from '../api/client'
import { apiMessage, useSession } from '../api/session'

export function PublishNote({
  kind,
  suggestion,
  label,
}: {
  kind: TableNoteKind
  suggestion: string
  label: string
}) {
  const { session } = useSession()
  const [text, setText] = useState(suggestion)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!preview) setText(suggestion)
  }, [suggestion, preview])

  if (!session) {
    return <p className="quiet">Семьи на этом устройстве нет. Фраза останется здесь, пока не войдёте.</p>
  }

  async function publish() {
    const result = await api.PUT('/api/table-notes/me', { body: { kind, text: text.trim() } })
    if (!result.response.ok) {
      setError(apiMessage(result.error, 'На стол не легло'))
      return
    }
    setPreview(false)
    setSaved(true)
  }

  return (
    <section className="stack">
      <h2>{label}</h2>
      {preview ? (
        <>
          <p className="meaning">На стол ляжет только эта фраза.</p>
          <article className="panel">
            <p>«{text.trim()}»</p>
          </article>
          <div className="row wrap">
            <button type="button" className="btn ghost" onClick={() => setPreview(false)}>
              Изменить
            </button>
            <button type="button" className="btn" onClick={() => void publish()}>
              Положить на стол
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="field">
            <span>Фраза для стола</span>
            <textarea
              value={text}
              maxLength={500}
              rows={3}
              onChange={(event) => {
                setText(event.target.value)
                setSaved(false)
              }}
            />
          </label>
          <button type="button" className="btn ghost" disabled={!text.trim()} onClick={() => setPreview(true)}>
            Посмотреть перед сохранением
          </button>
        </>
      )}
      {saved ? <p className="quiet">Фраза на столе.</p> : null}
      {error ? <p className="quiet">{error}</p> : null}
    </section>
  )
}
