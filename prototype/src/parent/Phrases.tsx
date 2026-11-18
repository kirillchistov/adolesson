import { useState } from 'react'
import { labelWords, phraseSources, phrases } from '../content/parent'
import { Screen, Sources } from '../ui/kit'

// Тренажёр фраз (§11) и «линтер ярлыков» для наблюдений (app-concept.md §3.1)
export function Phrases() {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [note, setNote] = useState('')
  const phrase = phrases[index]
  const hints = labelWords.filter((item) => item.pattern.test(note))

  function next(step: number) {
    setIndex((index + step + phrases.length) % phrases.length)
    setFlipped(false)
  }

  return (
    <Screen kicker={`Фразы · ${index + 1} / ${phrases.length}`} title="Как сказать иначе">
      <button type="button" className="panel big-card flip" onClick={() => setFlipped(!flipped)} aria-live="polite">
        {flipped ? (
          <>
            <span className="kicker">Вместо этого</span>
            <strong>«{phrase.to}»</strong>
            <span className="quiet">{phrase.why}</span>
          </>
        ) : (
          <>
            <span className="kicker">Привычная фраза</span>
            <strong className="strike">«{phrase.from}»</strong>
            <span className="quiet">Нажмите, чтобы увидеть замену</span>
          </>
        )}
      </button>
      <div className="row">
        <button type="button" className="btn ghost" onClick={() => next(-1)}>
          Назад
        </button>
        <button type="button" className="btn" onClick={() => next(1)}>
          Дальше
        </button>
      </div>

      <section className="stack">
        <h2>Наблюдение без ярлыков</h2>
        <p className="quiet">Запишите, что произошло. Подсказка покажет слова-оценки. Видите только вы.</p>
        <textarea
          className="note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Например: во вторник села за алгебру в 19:00, через 10 минут ушла…"
        />
        {hints.length ? (
          <ul className="hints">
            {hints.map((hint) => (
              <li key={hint.hint}>{hint.hint}</li>
            ))}
          </ul>
        ) : note.trim() ? (
          <p className="quiet ok">Похоже на наблюдение, а не на оценку.</p>
        ) : null}
      </section>
      <Sources codes={phraseSources} />
    </Screen>
  )
}
