import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Breath, Screen, Sources } from '../ui/kit'

// Дыхание — support-concept.md §8 Б; «Остановиться — назвать — выбрать» — §8 А
export function Breathe() {
  const [run, setRun] = useState(0)
  return (
    <Screen kicker="Практика" title="Спокойное дыхание" back="/teen/now">
      <p className="meaning">Медленно и удобно, без задержек и усилия. Если неприятно или кружится голова — остановись и дыши как обычно.</p>
      <Breath key={run} cycles={5} />
      <div className="row">
        <Link className="btn ghost" to="/teen/now">
          Стоп
        </Link>
        <button type="button" className="btn ghost" onClick={() => setRun((value) => value + 1)}>
          Ещё раз
        </button>
      </div>
      <article className="panel">
        <p className="kicker">Остановиться — назвать — выбрать</p>
        <ol className="steps">
          <li>На минуту прерваться, почувствовать опору ног или спины.</li>
          <li>Назвать состояние: «устала», «боюсь ошибки», «не понимаю», «злюсь».</li>
          <li>Выбрать одно: короткий отдых, маленький шаг или просьба о помощи.</li>
        </ol>
        <div className="row">
          <Link className="text-btn" to="/teen/rest">
            Отдых
          </Link>
          <Link className="text-btn" to="/teen/start">
            Маленький шаг
          </Link>
          <Link className="text-btn" to="/teen/help">
            Просьба
          </Link>
        </div>
      </article>
      <p className="quiet">Дыхательные упражнения могут помогать со стрессом, но не заменяют помощь.</p>
      <Sources codes={['U5', 'U7', 'W4']} />
    </Screen>
  )
}
