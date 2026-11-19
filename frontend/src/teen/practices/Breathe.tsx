import { useState } from 'react'
import { Breath, Screen, Sources } from '../ui'

export function Breathe() {
  const [run, setRun] = useState(0)
  return (
    <Screen kicker="Практика" title="Спокойное дыхание" back="#/teen/now">
      <p className="meaning">Медленно и удобно, без задержек и усилия. Если неприятно или кружится голова — остановись и дыши как обычно.</p>
      <Breath key={run} cycles={5} />
      <div className="row">
        <a className="btn ghost" href="#/teen/now">
          Стоп
        </a>
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
          <a className="text-btn" href="#/teen/rest">
            Отдых
          </a>
          <a className="text-btn" href="#/teen/start">
            Маленький шаг
          </a>
          <a className="text-btn" href="#/teen/help">
            Просьба
          </a>
        </div>
      </article>
      <p className="quiet">Дыхательные упражнения могут помогать со стрессом, но не заменяют помощь.</p>
      <Sources codes={['U5', 'U7', 'W4']} />
    </Screen>
  )
}
