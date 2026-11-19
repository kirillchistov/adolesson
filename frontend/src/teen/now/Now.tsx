import { useEffect, useState } from 'react'
import { useStore } from '../moe/state/context'
import { colors, recoveryOptions } from '../content/teen'
import { isToday, readCheckIns, saveCheckIn, type CheckIn, type Color } from '../db'
import { useAsync } from '../useAsync'
import { Screen, Sources } from '../ui'

export function Now() {
  const { state } = useStore()
  const [checkIns, reload, ready] = useAsync(readCheckIns, [] as CheckIn[])
  const today = checkIns.find((item) => isToday(item.at))
  const [color, setColor] = useState<Color | null>(null)
  const [words, setWords] = useState('')
  const [filled, setFilled] = useState(false)

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

  async function keepWords() {
    if (!color) return
    await saveCheckIn(color, words)
    await reload()
  }

  const meta = colors.find((item) => item.id === color)

  return (
    <Screen kicker="Сейчас" title="Как ты?">
      <p className="meaning">Без оценок. Это видишь только ты: семьи ещё нет, цвет никуда не отправляется.</p>
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
              <p className="quiet">Минимальный объём ещё не договорён — его можно будет выбрать вместе, когда появится общий стол.</p>
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
