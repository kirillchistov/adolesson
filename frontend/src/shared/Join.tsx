import { useEffect, useState, type FormEvent } from 'react'
import { api, type InvitationPreview, type Session } from '../api/client'
import { apiMessage, useSession } from '../api/session'

type Pronouns = 'f' | 'm' | 'neutral'

const pronounOptions: { id: Pronouns; label: string }[] = [
  { id: 'f', label: 'она' },
  { id: 'm', label: 'он' },
  { id: 'neutral', label: 'без указания' },
]

export function Join({ token }: { token: string }) {
  const { setSession } = useSession()
  const [preview, setPreview] = useState<InvitationPreview | null | undefined>(undefined)
  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState<Pronouns>('neutral')
  const [login, setLogin] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    api.GET('/api/invitations/{token}', { params: { path: { token } } }).then((result) => {
      if (!live) return
      setPreview(result.response.ok ? (result.data ?? null) : null)
    })
    return () => {
      live = false
    }
  }, [token])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = await api.POST('/api/invitations/{token}/accept', {
      params: { path: { token } },
      body: { displayName: displayName.trim(), pronouns, login: login.trim(), secret },
    })
    if (!result.response.ok || !result.data) {
      setError(apiMessage(result.error, 'Приглашение не принято'))
      return
    }
    enter(result.data, setSession)
  }

  return (
    <div className="app">
      <div className="phone">
        <div className="moon" aria-hidden="true" />
        <section className="screen">
          <p className="kicker">Приглашение</p>
          <h1>{preview ? preview.familyName : preview === null ? 'Ссылка не действует' : '…'}</h1>
          {preview ? (
            <form className="stack" onSubmit={submit}>
              <p className="meaning">
                {preview.role === 'teen' ? 'Вход подростка в эту семью.' : 'Вход ещё одного взрослого в эту семью.'} Свой логин и свой секрет.
              </p>
              <label className="field">
                <span>Имя на столе</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <div className="chips" role="radiogroup" aria-label="Как о вас говорить">
                {pronounOptions.map((item) => (
                  <button key={item.id} type="button" className={pronouns === item.id ? 'chip on' : 'chip'} onClick={() => setPronouns(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Логин — латиница, цифры, дефис</span>
                <input value={login} autoComplete="username" onChange={(event) => setLogin(event.target.value.toLowerCase())} />
              </label>
              <label className="field">
                <span>Пароль или PIN, от 4 символов</span>
                <input type="password" value={secret} autoComplete="new-password" onChange={(event) => setSecret(event.target.value)} />
              </label>
              {error ? <p className="quiet">{error}</p> : null}
              <button type="submit" className="btn" disabled={!displayName.trim() || secret.length < 4}>
                Войти в семью
              </button>
            </form>
          ) : preview === null ? (
            <a className="btn ghost" href="#/">
              На вход
            </a>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export function enter(session: Session, setSession: (session: Session | null) => void) {
  setSession(session)
  location.hash = session.member.role === 'parent' ? '#/parent/table' : '#/teen/now'
}
