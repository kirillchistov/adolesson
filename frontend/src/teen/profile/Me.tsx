import { useEffect, useState } from 'react'
import { allowedToSay } from '../content/teen'
import { useSession } from '../../api/session'
import { crisisDraft, crisisLead, crisisLines, crisisSources, messageToAdult } from '../content/crisis'
import { readCard, saveCard, type CardRecord } from '../db'
import { useStore } from '../moe/state/context'
import { Field, Screen, Sources } from '../ui'

export function Me() {
  const { state, update } = useStore()
  const { session } = useSession()
  const [card, setCard] = useState<CardRecord | null>(null)

  useEffect(() => {
    let live = true
    readCard().then((value) => {
      if (live) setCard(value)
    })
    return () => {
      live = false
    }
  }, [])

  function edit(patch: Partial<Omit<CardRecord, 'id'>>) {
    setCard((current) => (current ? { ...current, ...patch } : current))
  }

  async function keep(patch: Partial<Omit<CardRecord, 'id'>>) {
    await saveCard(patch)
  }

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
      {card ? (
        <>
          <Field label="Взрослый, которому я могу написать" value={card.adult} onChange={(adult) => edit({ adult })} onBlur={() => keep({ adult: card.adult })} />
          <Field label="Запасной взрослый" value={card.backupAdult} onChange={(backupAdult) => edit({ backupAdult })} onBlur={() => keep({ backupAdult: card.backupAdult })} />
          <Field label="Моя фраза для просьбы о помощи" value={card.phrase} onChange={(phrase) => edit({ phrase })} onBlur={() => keep({ phrase: card.phrase })} />
        </>
      ) : null}
      <a className="choice" href="#/teen/table">
        <strong>Общий стол</strong>
        <span>{session ? `${session.family.name}: договорённость, цвет, просьбы` : 'Войти или открыть приглашение'}</span>
      </a>
      <a className="choice" href="#/teen/moe/now">
        <strong>Моё</strong>
        <span>Затеи, истории и мантры — отдельно от учёбы</span>
      </a>
      <section className="stack">
        <h2>Вид</h2>
        <div className="row">
          {(['collage', 'lunar'] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              className={state.theme === theme ? 'chip on' : 'chip'}
              onClick={() => update((current) => ({ ...current, theme }))}
            >
              {theme === 'collage' ? 'Коллаж — тёмная' : 'Лунная — светлая'}
            </button>
          ))}
        </div>
        <p className="quiet">Чек-ины, блоки и карточка хранятся только на этом устройстве. Родители увидят лишь то, что ты сама позже положишь на общий стол.</p>
      </section>
      <a className="btn danger" href="#/teen/sos">
        Помощь прямо сейчас
      </a>
    </Screen>
  )
}

export function Sos() {
  const [card, setCard] = useState<CardRecord | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let live = true
    readCard().then((value) => {
      if (live) setCard(value)
    })
    return () => {
      live = false
    }
  }, [])

  const adult = card?.adult.trim() ?? ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(messageToAdult)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Screen kicker="Помощь" title="Ты не одна" back="#/teen/now">
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
        {!adult ? (
          <p className="quiet">
            Взрослого можно указать в <a href="#/teen/me">своей карточке</a>.
          </p>
        ) : null}
      </article>
      <Sources codes={crisisSources} />
    </Screen>
  )
}
