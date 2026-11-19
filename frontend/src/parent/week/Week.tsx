import { useState } from 'react'
import { Screen, Sources } from '../../teen/ui'
import { weekNotWorking, weeks } from '../content'
import { readParent, writeParent } from '../local'

export function Week() {
  const [weekId, setWeekId] = useState(() => readParent().week)
  const [open, setOpen] = useState(false)
  const week = weeks.find((item) => item.id === weekId) ?? weeks[0]

  function choose(id: number) {
    setWeekId(id)
    writeParent({ week: id })
  }

  return (
    <Screen kicker={week.label} title={week.title}>
      <div className="chips scroll">
        {weeks.map((item) => (
          <button key={item.id} type="button" className={item.id === week.id ? 'chip on' : 'chip'} onClick={() => choose(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <p className="meaning">{week.goal}</p>
      <Group title="Вам" items={week.parent} />
      <Group title="Подростку — по желанию" items={week.teen} />
      <Group title="Вместе" items={week.together} />
      <article className="panel">
        <p className="kicker">Критерий недели</p>
        <p>{week.criterion}</p>
      </article>
      <div className="choices">
        <a className="choice" href="#/parent/seen">
          <strong>Что вижу</strong>
          <span>Один случай и одна фраза на стол, если сами её положите</span>
        </a>
        <a className="choice" href="#/parent/help">
          <strong>Когда нужна помощь раньше</strong>
          <span>Не диагноз. Маршрут, если состояние хуже или есть риск</span>
        </a>
        <a className="choice" href="#/parent/talk">
          <strong>Перед разговором</strong>
          <span>Проверить себя за минуту</span>
        </a>
        <a className="choice" href="#/parent/table">
          <strong>Общий стол</strong>
          <span>Договорённость, цвет дня, просьбы</span>
        </a>
      </div>
      <button type="button" className="text-btn" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        Неделя не получилась — что вернуть?
      </button>
      {open ? <p className="meaning">{weekNotWorking}</p> : null}
      <Sources codes={week.sources} />
    </Screen>
  )
}

function Group({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="stack">
      <h2>{title}</h2>
      <ul className="list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
