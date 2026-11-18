import { useState } from 'react'
import { Link } from 'react-router-dom'
import { crisisDraft, crisisLead, crisisLines, crisisSources, messageToAdult } from '../content/crisis'
import { allowedToSay } from '../content/teen'
import { teenStore, useStore } from '../state/store'
import { Field, Screen, Sources, cx } from '../ui/kit'

// Профиль: Карточка подростка (support-concept.md §15), карта, тема, данные
export function Me() {
  const [teen, setTeen] = useStore(teenStore)
  const setCard = (patch: Partial<typeof teen.card>) => setTeen((state) => ({ ...state, card: { ...state.card, ...patch } }))

  return (
    <Screen kicker="Я" title="Моя карточка">
      <article className="panel">
        <p>Со мной не обязано быть «что-то не так», если мне трудно. Но трудность стоит исследовать.</p>
        <p className="kicker">Мне можно сказать</p>
        <div className="chips">
          {allowedToSay.map((phrase) => (
            <span key={phrase} className="chip static">
              {phrase}
            </span>
          ))}
        </div>
        <p className="quiet">Когда всё навалилось: остановиться → назвать состояние → выбрать отдых, маленький шаг или человека.</p>
      </article>

      <Field label="Взрослый, которому я могу написать" value={teen.card.adult} onChange={(adult) => setCard({ adult })} />
      <Field label="Запасной взрослый" value={teen.card.backupAdult} onChange={(backupAdult) => setCard({ backupAdult })} />
      <Field label="Моя фраза для просьбы о помощи" value={teen.card.phrase} onChange={(phrase) => setCard({ phrase })} />

      <div className="choices">
        <Link className="choice" to="/teen/map">
          <strong>Где у меня ломается</strong>
          <span>{teen.barrierMap ? 'Карта готова — посмотреть' : '10 карточек, около 2 минут'}</span>
        </Link>
        <div className="choice muted">
          <strong>Моё</strong>
          <span>Затеи из «Моего курса» появятся здесь после переноса betty-rules</span>
        </div>
      </div>

      <section className="stack">
        <h2>Вид</h2>
        <div className="row">
          {(['collage', 'lunar'] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              className={cx('chip', teen.theme === theme && 'on')}
              onClick={() => setTeen((state) => ({ ...state, theme }))}
            >
              {theme === 'collage' ? 'Коллаж — тёмная' : 'Лунная — светлая'}
            </button>
          ))}
        </div>
        <p className="quiet">
          Всё личное — чек-ины, блоки, карта — хранится только на этом устройстве. Родители видят лишь то, что ты сама
          положишь на общий стол.
        </p>
      </section>

      <Link className="btn danger-btn" to="/teen/sos">
        Помощь прямо сейчас
      </Link>
    </Screen>
  )
}

export function Sos() {
  const [teen] = useStore(teenStore)
  const [copied, setCopied] = useState(false)
  const adult = teen.card.adult.trim()

  async function copy() {
    try {
      await navigator.clipboard.writeText(messageToAdult)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Screen kicker="Помощь" title="Ты не одна" back="/teen/now">
      {crisisDraft ? <p className="sticker">Черновик текста — нужна вычитка специалистом</p> : null}
      <p className="meaning">{crisisLead}</p>
      {crisisLines.map((line) => (
        <a key={line.phone} className="call" href={`tel:${line.phone.replace(/-/g, '')}`}>
          <strong>{line.phone}</strong>
          <span>{line.label}</span>
          <span className="quiet">{line.note}</span>
        </a>
      ))}
      <article className="panel">
        <p className="kicker">Написать своему взрослому{adult ? `: ${adult}` : ''}</p>
        <p>«{messageToAdult}»</p>
        <button type="button" className="btn" onClick={copy}>
          {copied ? 'Скопировано' : 'Скопировать текст'}
        </button>
        {!adult ? <p className="quiet">Взрослого можно указать в своей карточке.</p> : null}
      </article>
      <Sources codes={crisisSources} />
    </Screen>
  )
}
