import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { colors, recovery, type Color } from '../content/teen'
import { familyStore, teenStore, todayCheckIn, useStore } from '../state/store'
import { Screen, Sources, cx } from '../ui/kit'

// «Сейчас»: вход начинается с состояния, а не с учёбы (app-concept.md §3.2)
export function Now() {
  const [teen, setTeen] = useStore(teenStore)
  const [family, setFamily] = useStore(familyStore)
  const navigate = useNavigate()
  const today = todayCheckIn(teen)
  const [color, setColor] = useState<Color | null>(today?.color ?? null)
  const [words, setWords] = useState(today?.words ?? '')
  const [saved, setSaved] = useState(Boolean(today))
  const shared = family.signal?.color === color && saved

  function save(next: Color) {
    setColor(next)
    setSaved(true)
    setTeen((state) => ({
      ...state,
      checkIns: [{ at: new Date().toISOString(), color: next, words }, ...state.checkIns.filter((item) => item !== today)],
    }))
    if (next === 'red') navigate('/teen/rest')
  }

  function share() {
    if (!color) return
    setFamily((state) => ({ ...state, signal: { color, at: new Date().toISOString() } }))
  }

  const meta = colors.find((item) => item.id === color)
  const minVolume = family.agreement.minOnHardDay.trim()

  return (
    <Screen kicker="Сейчас" title="Как ты?">
      <p className="meaning">Без оценок. Это видишь только ты, пока сама не решишь показать цвет.</p>
      <div className="gradient-pick" role="radiogroup" aria-label="Состояние">
        {colors.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={color === item.id}
            className={cx('swatch', item.id, color === item.id && 'on')}
            onClick={() => save(item.id)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <label className="field">
        <span>Своими словами — если хочется</span>
        <input value={words} onChange={(event) => setWords(event.target.value)} placeholder="устала, злюсь, норм…" />
      </label>

      {meta && saved ? (
        <article className={cx('panel', 'accent-' + meta.id)}>
          <p className="kicker">Что это значит сегодня</p>
          <p>{meta.teen}</p>
          {meta.id === 'green' ? (
            <Link className="btn" to="/teen/start">
              К первому шагу
            </Link>
          ) : null}
          {meta.id === 'yellow' ? (
            <>
              <p className="quiet">
                {minVolume ? `Минимум из договорённости: ${minVolume}` : 'Минимальный объём ещё не договорён — выберите его на общем столе.'}
              </p>
              <Link className="btn" to="/teen/start?min=1">
                Только минимум
              </Link>
              <p className="quiet">Или сначала — {recovery.slice(0, 3).join(', ').toLowerCase()}.</p>
            </>
          ) : null}
          {meta.id === 'red' ? (
            <Link className="btn" to="/teen/rest">
              Восстановиться
            </Link>
          ) : null}
          <button type="button" className={cx('chip', shared && 'on')} onClick={share} disabled={shared}>
            {shared ? 'Цвет на общем столе' : 'Показать цвет родителям'}
          </button>
        </article>
      ) : null}

      <div className="row">
        <Link className="text-btn" to="/teen/breathe">
          Подышать 1 минуту
        </Link>
        <Link className="text-btn" to="/teen/map">
          Где у меня ломается?
        </Link>
      </div>
      <Sources codes={['U5', 'U8']} />
    </Screen>
  )
}

export function Rest() {
  return (
    <Screen kicker="Красный" title="Сегодня не про учёбу" back="/teen/now">
      <p className="meaning">Сначала восстановиться. Возврат к задачам — позже и по договорённости, без «отработать вдвойне».</p>
      <div className="chips">
        {recovery.map((item) => (
          <span key={item} className="chip static">
            {item}
          </span>
        ))}
      </div>
      <p className="quiet">После отдыха спроси себя: «Мне стало немного легче?» Отдых не обязан быть полезным.</p>
      <Link className="btn ghost" to="/teen/breathe">
        Подышать вместе
      </Link>
      <article className="panel danger">
        <p>Если совсем плохо, страшно или появляются мысли о том, чтобы навредить себе, — не оставайся с этим одна.</p>
        <Link className="btn" to="/teen/sos">
          Помощь прямо сейчас
        </Link>
      </article>
    </Screen>
  )
}
