import { useState, type FormEvent } from 'react'
import { api, type Session } from '../api/client'
import { apiMessage } from '../api/session'

type Pronouns = 'f' | 'm' | 'neutral'

const pronounOptions: { id: Pronouns; label: string }[] = [
  { id: 'f', label: 'она' },
  { id: 'm', label: 'он' },
  { id: 'neutral', label: 'без указания' },
]

export function LoginForm({ onSession }: { onSession: (session: Session) => void }) {
  const [login, setLogin] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = await api.POST('/api/session', { body: { login: login.trim(), secret } })
    if (!result.response.ok || !result.data) {
      setError(apiMessage(result.error, 'Не получилось войти'))
      return
    }
    setSecret('')
    onSession(result.data)
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h2>Войти</h2>
      <label className="field">
        <span>Логин</span>
        <input value={login} autoComplete="username" onChange={(event) => setLogin(event.target.value)} />
      </label>
      <label className="field">
        <span>Пароль или PIN</span>
        <input type="password" value={secret} autoComplete="current-password" onChange={(event) => setSecret(event.target.value)} />
      </label>
      {error ? <p className="quiet">{error}</p> : null}
      <button type="submit" className="btn" disabled={login.trim().length < 1 || secret.length < 1}>
        Войти
      </button>
    </form>
  )
}

export function CreateFamilyForm({ onSession }: { onSession: (session: Session) => void }) {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState<Pronouns>('neutral')
  const [login, setLogin] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = await api.POST('/api/families', {
      body: { name: name.trim(), displayName: displayName.trim(), pronouns, login: login.trim(), secret },
    })
    if (!result.response.ok || !result.data) {
      setError(apiMessage(result.error, 'Не получилось создать семью'))
      return
    }
    setSecret('')
    onSession(result.data)
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h2>Новая семья</h2>
      <p className="quiet">Создаёт родитель. Подросток входит по приглашению.</p>
      <label className="field">
        <span>Как назвать семью</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="field">
        <span>Ваше имя на столе</span>
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
      <button type="submit" className="btn" disabled={!name.trim() || !displayName.trim() || secret.length < 4}>
        Создать семью
      </button>
    </form>
  )
}

export function acceptLabel(pronouns: string | undefined) {
  if (pronouns === 'f') return 'Согласна'
  if (pronouns === 'm') return 'Согласен'
  return 'Согласен(-на)'
}
