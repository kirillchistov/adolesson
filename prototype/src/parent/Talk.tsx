import { useState } from 'react'
import { Link } from 'react-router-dom'
import { beforeTalk, talkOpening, talkQuestions } from '../content/parent'
import { Screen, Sources, cx } from '../ui/kit'

type Answer = 'yes' | 'no'

// «Перед разговором» — фильтр из чек-листа §6
export function Talk() {
  const [answers, setAnswers] = useState<(Answer | null)[]>(() => beforeTalk.map(() => null))
  const allAnswered = answers.every(Boolean)
  const notCalm = answers[0] === 'no' || answers[1] === 'no'
  const set = (index: number, value: Answer) => setAnswers(answers.map((item, i) => (i === index ? value : item)))

  return (
    <Screen kicker="Перед разговором" title="Готовы ли вы сейчас?" back="/parent/week">
      <p className="meaning">Не оценочный лист. Честный ответ «нет» — повод выбрать другое время.</p>
      <ol className="check-list">
        {beforeTalk.map((item, index) => (
          <li key={item}>
            <span>{item}</span>
            <span className="yn">
              <button type="button" className={cx('chip', answers[index] === 'yes' && 'on')} onClick={() => set(index, 'yes')}>
                Да
              </button>
              <button type="button" className={cx('chip', answers[index] === 'no' && 'on')} onClick={() => set(index, 'no')}>
                Нет
              </button>
            </span>
          </li>
        ))}
      </ol>

      {notCalm ? (
        <article className="panel accent-yellow">
          <p className="kicker">Сначала пауза</p>
          <p>Если нет спокойствия или конкретного факта, лучше договориться, когда вы вернётесь к теме.</p>
          <Link className="btn" to="/parent/pause">
            Взять паузу
          </Link>
        </article>
      ) : allAnswered ? (
        <article className="panel accent-green">
          <p className="kicker">Можно начинать. Например:</p>
          <p>{talkOpening}</p>
          <p className="kicker">Вопросы — выберите один-два</p>
          <ul className="list">
            {talkQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <p className="quiet">После ответа: «Правильно понимаю, что…?» Не спорить сразу. Ответить можно позже или письменно.</p>
        </article>
      ) : null}
      <Sources codes={['U1', 'U2', 'U9']} />
    </Screen>
  )
}
