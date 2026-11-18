import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pauseSources, repairPhrase } from '../content/parent'
import { Breath, Screen, Sources, TimerRing, useCountdown } from '../ui/kit'

type Step = 'say' | 'cool' | 'breathe' | 'away' | 'return'

// Протокол паузы (support-concept.md §10): тайминги UNICEF — 20 секунд, 5 вдохов, 5–10 минут (U4, U9)
export function Pause() {
  const [step, setStep] = useState<Step>('say')
  const [awayMinutes, setAwayMinutes] = useState(0)
  const [returnAt, setReturnAt] = useState('')
  const coolLeft = useCountdown(20, step === 'cool')
  const awayLeft = useCountdown(awayMinutes * 60, step === 'away' && awayMinutes > 0)

  return (
    <Screen kicker="Пауза" title={titles[step]}>
      {step === 'say' ? (
        <>
          <article className="panel big-card">
            <p>«Я раздражён(-а), беру паузу. Вернусь к разговору».</p>
          </article>
          <p className="meaning">Скажите это вслух и отойдите, если это безопасно. Не продолжайте разговор в гневе.</p>
          <button type="button" className="btn" onClick={() => setStep('cool')}>
            Сказал(-а), отхожу
          </button>
        </>
      ) : null}

      {step === 'cool' ? (
        <>
          <TimerRing left={coolLeft} total={20} label="остыть" />
          <button type="button" className="btn" onClick={() => setStep('breathe')}>
            {coolLeft === 0 ? 'Дальше — 5 вдохов' : 'Пропустить'}
          </button>
        </>
      ) : null}

      {step === 'breathe' ? (
        <>
          <Breath cycles={5} />
          <p className="meaning center">Можно ли сейчас отойти на 5–10 минут?</p>
          <div className="row">
            {[5, 10].map((minutes) => (
              <button
                key={minutes}
                type="button"
                className="btn ghost"
                onClick={() => {
                  setAwayMinutes(minutes)
                  setStep('away')
                }}
              >
                {minutes} минут
              </button>
            ))}
            <button type="button" className="btn ghost" onClick={() => setStep('return')}>
              Нет возможности
            </button>
          </div>
        </>
      ) : null}

      {step === 'away' ? (
        <>
          <TimerRing left={awayLeft} total={awayMinutes * 60} label="в другом месте" />
          <p className="meaning center">Короткая прогулка, вода, окно. Не продумывайте аргументы — просто остыньте.</p>
          <button type="button" className="btn" onClick={() => setStep('return')}>
            Дальше
          </button>
        </>
      ) : null}

      {step === 'return' ? (
        <>
          <label className="field">
            <span>Когда вернётесь к теме — обещанное время</span>
            <input type="time" value={returnAt} onChange={(event) => setReturnAt(event.target.value)} />
          </label>
          {returnAt ? <p className="sticker">Вернуться к разговору в {returnAt}</p> : null}
          <article className="panel">
            <p className="kicker">Если сорвались — восстановить контакт</p>
            <p>{repairPhrase}</p>
            <p className="quiet">Без «но ты сама…». Признать свою часть — не значит отменить договорённости.</p>
          </article>
          <Link className="btn" to="/parent/week">
            Готово
          </Link>
        </>
      ) : null}
      <Sources codes={pauseSources} />
    </Screen>
  )
}

const titles: Record<Step, string> = {
  say: 'Назовите паузу',
  cool: '20 секунд',
  breathe: 'Пять медленных вдохов',
  away: 'Немного в стороне',
  return: 'Возвращение',
}
