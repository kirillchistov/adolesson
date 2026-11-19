import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useSession } from '../../api/session'
import { useStore } from '../moe/state/context'
import { colors, recoveryOptions } from '../content/teen'
import { isToday, readCheckIns, saveCheckIn, type CheckIn, type Color } from '../db'
import { useAsync } from '../useAsync'
import { Screen, Sources } from '../ui'

export function Now() {
  const { state } = useStore()
  const { session } = useSession()
  const [checkIns, reload, ready] = useAsync(readCheckIns, [] as CheckIn[])
  const today = checkIns.find((item) => isToday(item.at))
  const [color, setColor] = useState<Color | null>(null)
  const [words, setWords] = useState('')
  const [filled, setFilled] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shared, setShared] = useState(false)
  const [minimum, setMinimum] = useState('')

  useEffect(() => {
    if (!ready || filled) return
    setColor(today?.color ?? null)
    setWords(today?.words ?? '')
    setFilled(true)
  }, [ready, filled, today])

  async function choose(next: Color) {
    setColor(next)
    await saveCheckIn(next, words)
    await reload()
    if (next === 'red') location.hash = '#/teen/rest'
  }

  useEffect(() => {
    if (!session) return
    let live = true
    api.GET('/api/agreements/current').then((result) => {
      if (live && result.data?.minOnHardDay) setMinimum(result.data.minOnHardDay)
    })
    return () => {
      live = false
    }
  }, [session])

  async function publishColor() {
    if (!color) return
    const result = await api.PUT('/api/signals/me', { body: { color } })
    if (result.response.ok) {
      setShared(true)
      setShareOpen(false)
    }
  }

  async function keepWords() {
    if (!color) return
    await saveCheckIn(color, words)
    await reload()
  }

  const meta = colors.find((item) => item.id === color)

  return (
    <Screen kicker="Сейчас" title="Как ты?">
      <p className="meaning">
        {session
          ? 'Без оценок. Слова остаются на этом устройстве. На стол можно показать только цвет.'
          : 'Без оценок. Это видишь только ты: семьи ещё нет, цвет никуда не отправляется.'}
      </p>
      <div className="gradient-pick" role="radiogroup" aria-label="Состояние">
        {colors.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={color === item.id}
            className={color === item.id ? `swatch ${item.id} on` : `swatch ${item.id}`}
            onClick={() => choose(item.id)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <label className="field">
        <span>Своими словами — если хочется</span>
        <input
          value={words}
          onChange={(event) => setWords(event.target.value)}
          onBlur={keepWords}
          placeholder="устала, злюсь, норм…"
        />
      </label>
      {meta ? (
        <article className="panel">
          <p className="kicker">Что это значит сегодня</p>
          <p>{meta.teen}</p>
          {meta.id === 'green' ? (
            <a className="btn" href="#/teen/start">
              К первому шагу
            </a>
          ) : null}
          {meta.id === 'yellow' ? (
            <>
              <p className="quiet">
                {minimum ? `Минимум из договорённости: ${minimum}` : 'Минимальный объём ещё не договорён — его можно выбрать вместе на общем столе.'}
              </p>
              <a className="btn" href="#/teen/start?min=1">
                Только минимум
              </a>
              <p className="quiet">Или сначала — {recoveryOptions(state.interests).slice(0, 3).join(', ').toLowerCase()}.</p>
            </>
          ) : null}
          {meta.id === 'red' ? (
            <a className="btn" href="#/teen/rest">
              Восстановиться
            </a>
          ) : null}
        </article>
      ) : null}
      {session && color ? (
        shareOpen ? (
          <article className="panel">
            <p className="kicker">Так цвет будет на столе</p>
            <p>{meta?.label}. Слов из поля выше там не будет.</p>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setShareOpen(false)}>
                Оставить у себя
              </button>
              <button type="button" className="btn" onClick={publishColor}>
                Показать цвет
              </button>
            </div>
          </article>
        ) : (
          <button type="button" className="btn ghost" onClick={() => setShareOpen(true)}>
            {shared ? 'Цвет на столе. Показать другой' : 'Посмотреть цвет перед показом'}
          </button>
        )
      ) : null}
      <a className="text-btn" href="#/teen/breathe">
        Подышать 1 минуту
      </a>
      <Sources codes={['U5', 'U8']} />
    </Screen>
  )
}

export function Rest() {
  const { state } = useStore()
  return (
    <Screen kicker="Красный" title="Сегодня не про учёбу" back="#/teen/now">
      <p className="meaning">Сначала восстановиться. Возврат к задачам — позже и по договорённости, без «отработать вдвойне».</p>
      <div className="chips">
        {recoveryOptions(state.interests).map((item) => (
          <span key={item} className="chip static">
            {item}
          </span>
        ))}
      </div>
      <p className="quiet">После отдыха спроси себя: «Мне стало немного легче?» Отдых не обязан быть полезным.</p>
      <a className="btn ghost" href="#/teen/breathe">
        Подышать вместе
      </a>
      <a className="text-btn" href="#/teen/moe/now">
        Отвлечься на своё
      </a>
      <article className="panel danger">
        <p>Если совсем плохо, страшно или появляются мысли о том, чтобы навредить себе, — не оставайся с этим одна.</p>
        <a className="btn" href="#/teen/sos">
          Помощь прямо сейчас
        </a>
      </article>
    </Screen>
  )
}
