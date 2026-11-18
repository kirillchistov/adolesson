import { useState } from 'react'
import { Link } from 'react-router-dom'
import { weekNotWorking, weeks } from '../content/route'
import { familyStore, useStore } from '../state/store'
import { Screen, Sources, cx } from '../ui/kit'

// «Неделя» — главный экран родителя (app-concept.md §3.1)
export function Week() {
  const [family, setFamily] = useStore(familyStore)
  const [open, setOpen] = useState(false)
  const week = weeks.find((item) => item.id === family.week) ?? weeks[0]

  return (
    <Screen kicker={week.label} title={week.title}>
      <div className="chips scroll">
        {weeks.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx('chip', item.id === week.id && 'on')}
            onClick={() => setFamily((state) => ({ ...state, week: item.id }))}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="meaning">{week.goal}</p>

      <Group title="Вам" items={week.parent} />
      <Group title="Ей — по желанию" items={week.teen} />
      <Group title="Вместе" items={week.together} />

      <article className="panel">
        <p className="kicker">Критерий недели</p>
        <p>{week.criterion}</p>
      </article>

      <div className="choices">
        <Link className="choice" to="/parent/talk">
          <strong>Перед разговором</strong>
          <span>Проверить себя за минуту</span>
        </Link>
        <Link className="choice" to="/parent/table">
          <strong>Общий стол</strong>
          <span>Договорённость, цвет дня, просьбы</span>
        </Link>
      </div>

      <button type="button" className="text-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
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
