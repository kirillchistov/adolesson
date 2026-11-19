import { useEffect, useState } from 'react'
import { api, type Agreement, type AgreementWrite, type HelpRequest } from '../api/client'
import { apiMessage, useSession } from '../api/session'
import { colors } from '../teen/content/teen'
import type { Color } from '../teen/db'
import { Screen } from '../teen/ui'
import { acceptLabel, CreateFamilyForm, LoginForm } from './Account'
import { enter } from './Join'
import { loadTable, memberName, type TableData } from './load'

const fields: { key: keyof Omit<AgreementWrite, 'weekStart' | 'reviewAt'>; label: string; placeholder: string }[] = [
  { key: 'priority', label: 'Один учебный приоритет', placeholder: 'Алгебра: квадратные уравнения' },
  { key: 'result', label: 'Конкретный результат', placeholder: 'Решать 3 похожих задачи без подсказки' },
  { key: 'schedule', label: 'Дни и примерное время', placeholder: 'Пн, Ср, Чт — после 18:00' },
  { key: 'minOnHardDay', label: 'Минимум в трудный день', placeholder: 'Один пример, 10 минут' },
  { key: 'parentHelp', label: 'Одна помощь родителей', placeholder: 'Посидеть рядом, когда попрошу' },
  { key: 'howToSayStuck', label: 'Как сообщить «не получается»', placeholder: 'Кнопка «Точная просьба»' },
  { key: 'parentsDont', label: 'Чего родители не делают', placeholder: 'Не проверяют тетрадь без спроса' },
]

const statusLabel: Record<HelpRequest['status'], string> = {
  sent: 'Отправлена',
  seen: 'Увидена',
  scheduled: 'Договорились о времени',
  done: 'Готово',
}

function localDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function localDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${localDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function blankDraft(): AgreementWrite {
  const review = new Date()
  review.setDate(review.getDate() + ((7 - review.getDay()) % 7 || 7))
  review.setHours(17, 0, 0, 0)
  return {
    weekStart: localDate(new Date()),
    priority: '',
    result: '',
    schedule: '',
    minOnHardDay: '',
    parentHelp: '',
    howToSayStuck: '',
    parentsDont: '',
    reviewAt: review.toISOString(),
  }
}

function fromAgreement(agreement: Agreement): AgreementWrite {
  return {
    weekStart: agreement.weekStart,
    priority: agreement.priority,
    result: agreement.result,
    schedule: agreement.schedule,
    minOnHardDay: agreement.minOnHardDay,
    parentHelp: agreement.parentHelp,
    howToSayStuck: agreement.howToSayStuck,
    parentsDont: agreement.parentsDont,
    reviewAt: agreement.reviewAt,
  }
}

export function Table({ allowCreate, back }: { allowCreate: boolean; back?: string }) {
  const { session, offline, setSession } = useSession()
  const [data, setData] = useState<TableData | null>(null)
  const [error, setError] = useState('')

  async function reload() {
    try {
      setData(await loadTable())
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Стол сейчас не открывается')
    }
  }

  useEffect(() => {
    if (session) void reload()
  }, [session])

  if (offline) {
    return (
      <Screen kicker="Общий стол" title="Стол сейчас недоступен" back={back}>
        <p className="meaning">Проверьте, что API запущен. Записи подростка при этом остаются на устройстве.</p>
      </Screen>
    )
  }

  if (session === undefined) {
    return (
      <Screen kicker="Общий стол" title="То, что видим вместе" back={back}>
        <p className="quiet">Открываем стол…</p>
      </Screen>
    )
  }

  if (!session) {
    return (
      <Screen kicker="Общий стол" title="Войти в семью" back={back}>
        {allowCreate ? <CreateFamilyForm onSession={(next) => enter(next, setSession)} /> : null}
        <LoginForm onSession={(next) => enter(next, setSession)} />
        {allowCreate ? null : <p className="quiet">Приглашение приходит ссылкой от родителя. По ней создаётся свой вход.</p>}
      </Screen>
    )
  }

  return (
    <Screen kicker={session.family.name} title="То, что видим вместе" back={back}>
      <p className="quiet">
        {session.member.displayName}. На столе только то, что кто-то сам сюда положил.
      </p>
      {error ? <p className="quiet">{error}</p> : null}
      {data ? <TableBody data={data} reload={reload} /> : null}
      <Invite role={session.member.role} />
      <button
        type="button"
        className="text-btn"
        onClick={async () => {
          await api.DELETE('/api/session')
          setSession(null)
          location.hash = session.member.role === 'parent' ? '#/parent/week' : '#/teen/now'
        }}
      >
        Выйти
      </button>
    </Screen>
  )
}

function TableBody({ data, reload }: { data: TableData; reload: () => Promise<void> }) {
  const { session } = useSession()
  const me = session?.member
  if (!me) return null

  return (
    <>
      <Signals data={data} role={me.role} reload={reload} />
      <AgreementBlock data={data} reload={reload} />
      <Requests data={data} role={me.role} reload={reload} />
    </>
  )
}

function Signals({
  data,
  role,
  reload,
}: {
  data: TableData
  role: 'parent' | 'teen'
  reload: () => Promise<void>
}) {
  const [color, setColor] = useState<Color | null>(null)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')

  async function publish() {
    if (!color) return
    const result = await api.PUT('/api/signals/me', { body: { color } })
    if (!result.response.ok) {
      setError(apiMessage(result.error, 'Цвет не сохранился'))
      return
    }
    setPreview(false)
    setColor(null)
    await reload()
  }

  return (
    <section className="stack">
      <h2>Цвет дня</h2>
      {data.signals.length === 0 ? <p className="quiet">Цветов на столе пока нет.</p> : null}
      {data.signals.map((signal) => {
        const meta = colors.find((item) => item.id === signal.color)
        const author = data.members.find((member) => member.id === signal.memberId)
        const guidance = author?.role === 'teen' && role === 'parent' ? meta?.parent : meta?.teen
        return (
          <article key={signal.id} className="panel">
            <p>
              <strong>{memberName(data.members, signal.memberId)}</strong>
              <span className="quiet"> · {meta?.label ?? signal.color}</span>
              <span className="quiet"> · {new Date(signal.at).toLocaleString('ru', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </p>
            {guidance ? <p>{guidance}</p> : null}
          </article>
        )
      })}
      <p className="quiet">{role === 'teen' ? 'На стол уходит только цвет. Слова чек-ина остаются на устройстве.' : 'Свой цвет можно поставить отдельно от цвета подростка.'}</p>
      <div className="chips">
        {colors.map((item) => (
          <button key={item.id} type="button" className={color === item.id ? 'chip on' : 'chip'} onClick={() => { setColor(item.id); setPreview(false) }}>
            {item.label}
          </button>
        ))}
      </div>
      {color && preview ? (
        <article className="panel">
          <p className="kicker">Так цвет будет на столе</p>
          <p>{colors.find((item) => item.id === color)?.label}</p>
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => setPreview(false)}>
              Изменить
            </button>
            <button type="button" className="btn" onClick={publish}>
              Показать цвет
            </button>
          </div>
        </article>
      ) : color ? (
        <button type="button" className="btn ghost" onClick={() => setPreview(true)}>
          Посмотреть перед показом
        </button>
      ) : null}
      {error ? <p className="quiet">{error}</p> : null}
    </section>
  )
}

function AgreementBlock({ data, reload }: { data: TableData; reload: () => Promise<void> }) {
  const { session } = useSession()
  const me = session?.member
  const [editing, setEditing] = useState(false)
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState<AgreementWrite>(() => (data.agreement ? fromAgreement(data.agreement) : blankDraft()))
  const [error, setError] = useState('')
  const agreement = data.agreement
  const mineAccepted = Boolean(me && agreement?.acceptedBy.includes(me.id))

  function edit<K extends keyof AgreementWrite>(key: K, value: AgreementWrite[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setPreview(false)
  }

  async function publish() {
    const result = await api.PUT('/api/agreements/current', {
      body: { ...draft, reviewAt: new Date(draft.reviewAt).toISOString() },
    })
    if (!result.response.ok) {
      setError(apiMessage(result.error, 'Договорённость не сохранилась'))
      return
    }
    setEditing(false)
    setPreview(false)
    await reload()
  }

  async function accept() {
    const result = await api.POST('/api/agreements/current/accept')
    if (!result.response.ok) {
      setError(apiMessage(result.error, 'Согласие не сохранилось'))
      return
    }
    await reload()
  }

  const shown = agreement && !editing

  return (
    <section className="stack">
      <h2>Договорённость недели</h2>
      {shown ? (
        <article className="panel">
          <dl className="agreement">
            <Row label="Начало недели" value={agreement.weekStart} />
            {fields.filter((field) => agreement[field.key]).map((field) => (
              <Row key={field.key} label={field.label} value={agreement[field.key]} />
            ))}
            <Row label="Время пересмотра" value={new Date(agreement.reviewAt).toLocaleString('ru', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
          </dl>
          <p className="quiet">{agreementLine(agreement, data)}</p>
          <p className="quiet">
            Приняли: {agreement.acceptedBy.length ? agreement.acceptedBy.map((id) => memberName(data.members, id)).join(', ') : 'пока никто'}
          </p>
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => { setDraft(fromAgreement(agreement)); setEditing(true) }}>
              Изменить
            </button>
            {mineAccepted ? null : (
              <button type="button" className="btn" onClick={accept}>
                {acceptLabel(me?.pronouns)}
              </button>
            )}
          </div>
        </article>
      ) : (
        <>
          <label className="field">
            <span>Начало недели</span>
            <input type="date" value={draft.weekStart} onChange={(event) => edit('weekStart', event.target.value)} />
          </label>
          {fields.map((field) => (
            <label key={field.key} className="field">
              <span>{field.label}</span>
              <textarea rows={2} placeholder={field.placeholder} value={draft[field.key]} onChange={(event) => edit(field.key, event.target.value)} />
            </label>
          ))}
          <label className="field">
            <span>Время пересмотра</span>
            <input type="datetime-local" value={localDateTime(draft.reviewAt)} onChange={(event) => {
              if (!event.target.value) return
              edit('reviewAt', new Date(event.target.value).toISOString())
            }} />
          </label>
          {preview ? (
            <article className="panel">
              <p className="kicker">Так договорённость ляжет на стол</p>
              <p>После сохранения оба подтверждают её заново. Поле «чего родители не делают» обязательно.</p>
              <p>«{draft.parentsDont.trim()}»</p>
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setPreview(false)}>
                  Изменить
                </button>
                <button type="button" className="btn" onClick={publish}>
                  Положить на стол
                </button>
              </div>
            </article>
          ) : (
            <button type="button" className="btn" disabled={!draft.parentsDont.trim()} onClick={() => setPreview(true)}>
              Посмотреть перед сохранением
            </button>
          )}
        </>
      )}
      {error ? <p className="quiet">{error}</p> : null}
    </section>
  )
}

function agreementLine(agreement: Agreement, data: TableData) {
  if (agreement.status === 'active') return 'В силе. Это проба на неделю, а не обещание никогда не срываться.'
  const accepted = new Set(agreement.acceptedBy)
  const teenOk = data.members.some((member) => member.role === 'teen' && accepted.has(member.id))
  const parentOk = data.members.some((member) => member.role === 'parent' && accepted.has(member.id))
  const missing = [!teenOk && 'подростка', !parentOk && 'родителя'].filter(Boolean)
  return missing.length ? `Ждёт согласия: ${missing.join(' и ')}` : 'Ждёт подтверждения'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Requests({ data, role, reload }: { data: TableData; role: 'parent' | 'teen'; reload: () => Promise<void> }) {
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')

  async function update(id: string, body: { status: HelpRequest['status']; reply?: string }) {
    const result = await api.PATCH('/api/help-requests/{id}', { params: { path: { id } }, body })
    if (!result.response.ok) {
      setError(apiMessage(result.error, 'Ответ не сохранился'))
      return
    }
    setReplyFor(null)
    setReply('')
    await reload()
  }

  return (
    <section className="stack">
      <h2>Просьбы о помощи</h2>
      {data.requests.length === 0 ? <p className="quiet">Пока просьб нет.</p> : null}
      {data.requests.map((request) => (
        <article key={request.id} className="feed-item">
          <p>
            {memberName(data.members, request.fromId)}: «{request.text}»
          </p>
          <p className="quiet">
            {statusLabel[request.status]}
            {request.reply ? ` · ${request.reply}` : ''}
          </p>
          {role === 'parent' && request.status !== 'done' ? (
            replyFor === request.id ? (
              <div className="row">
                <input className="inline" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Приду в 19:00" />
                <button type="button" className="btn" disabled={!reply.trim()} onClick={() => update(request.id, { status: 'scheduled', reply: reply.trim() })}>
                  Ответить
                </button>
              </div>
            ) : (
              <div className="row wrap">
                {request.status === 'sent' ? (
                  <button type="button" className="chip" onClick={() => update(request.id, { status: 'seen' })}>
                    Вижу
                  </button>
                ) : null}
                <button type="button" className="chip" onClick={() => setReplyFor(request.id)}>
                  Назначить время
                </button>
                <button type="button" className="chip" onClick={() => update(request.id, { status: 'seen', reply: 'Давай завтра' })}>
                  Давай завтра
                </button>
                <button type="button" className="chip" onClick={() => update(request.id, { status: 'done' })}>
                  Готово
                </button>
              </div>
            )
          ) : null}
        </article>
      ))}
      {error ? <p className="quiet">{error}</p> : null}
    </section>
  )
}

function Invite({ role }: { role: 'parent' | 'teen' }) {
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  if (role !== 'parent') return null

  async function invite(invited: 'teen' | 'parent') {
    const result = await api.POST('/api/invitations', { body: { role: invited } })
    if (!result.response.ok || !result.data) {
      setError(apiMessage(result.error, 'Приглашение не создалось'))
      return
    }
    const url = `${location.origin}${location.pathname}#/join/${result.data.token}`
    setLink(url)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Ссылку всё равно показываем на экране.
    }
  }

  return (
    <section className="stack">
      <h2>Приглашение</h2>
      <div className="row wrap">
        <button type="button" className="btn ghost" onClick={() => invite('teen')}>
          Пригласить подростка
        </button>
        <button type="button" className="btn ghost" onClick={() => invite('parent')}>
          Ещё одного взрослого
        </button>
      </div>
      {link ? <p className="quiet">Ссылка для другого устройства: {link}</p> : null}
      {error ? <p className="quiet">{error}</p> : null}
    </section>
  )
}
