import { useState } from 'react'
import { Link } from 'react-router-dom'
import { answerScale, barrierCards, diagnosticDisclaimer, diagnosticSources, points, type PointId } from '../content/teen'
import { teenStore, useStore } from '../state/store'
import { Screen, Sources } from '../ui/kit'

const maxPerPoint = 4 // две карточки × 2 балла

// Мини-диагностика, модуль A «Где ломается» (app-concept.md §4.2)
export function BarrierMap() {
  const [teen, setTeen] = useStore(teenStore)
  const [index, setIndex] = useState(teen.barrierMap ? barrierCards.length : 0)
  const [scores, setScores] = useState<number[]>([])

  function answer(score: number) {
    const next = [...scores, score]
    setScores(next)
    setIndex(index + 1)
    if (next.length === barrierCards.length) {
      const map = Object.fromEntries(points.map((point) => [point.id, 0])) as Record<PointId, number>
      barrierCards.forEach((card, cardIndex) => {
        map[card.point] += next[cardIndex]
      })
      setTeen((state) => ({ ...state, barrierMap: map }))
    }
  }

  if (index < barrierCards.length) {
    const card = barrierCards[index]
    return (
      <Screen kicker={`Где ломается · ${index + 1} / ${barrierCards.length}`} title="Это про тебя?" back="/teen/me">
        <article className="panel big-card" aria-live="polite">
          <p>{card.text}</p>
        </article>
        <div className="answer-row">
          {answerScale.map((option) => (
            <button key={option.id} type="button" className="btn ghost" onClick={() => answer(option.score)}>
              {option.label}
            </button>
          ))}
        </div>
        <p className="quiet">Можно бросить в любой момент. Правильных ответов нет.</p>
      </Screen>
    )
  }

  const map = teen.barrierMap
  if (!map) return null
  const top = [...points].sort((a, b) => map[b.id] - map[a.id])[0]
  const flat = Object.values(map).every((value) => value === 0)

  return (
    <Screen kicker="Карта барьеров" title={flat ? 'Явной точки трения нет' : `Точка трения — «${top.label.toLowerCase()}»`} back="/teen/me">
      <Radar map={map} />
      {flat ? (
        <p className="meaning">Похоже, сейчас ни одна точка не выделяется. Можно вернуться к карте через пару недель.</p>
      ) : (
        <article className="panel">
          <p>{top.tip}</p>
          <p>
            <strong>{top.tool}</strong>
          </p>
        </article>
      )}
      <p className="quiet">{diagnosticDisclaimer}</p>
      <div className="row">
        <Link className="btn" to="/teen/start">
          Попробовать
        </Link>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setScores([])
            setIndex(0)
          }}
        >
          Пройти заново
        </button>
      </div>
      <Sources codes={diagnosticSources} />
    </Screen>
  )
}

function Radar({ map }: { map: Record<PointId, number> }) {
  const size = 240
  const center = size / 2
  const radius = 84
  const angle = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / points.length
  const at = (index: number, value: number) => {
    const r = (value / maxPerPoint) * radius
    return [center + r * Math.cos(angle(index)), center + r * Math.sin(angle(index))]
  }
  const shape = points.map((point, index) => at(index, map[point.id]).join(',')).join(' ')
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Карта пяти точек: начать, понять, продолжить, сдать, восстановиться">
      {[1, 2, 3, 4].map((level) => (
        <polygon key={level} className="radar-grid" points={points.map((_, index) => at(index, level).join(',')).join(' ')} />
      ))}
      <polygon className="radar-shape" points={shape} />
      {points.map((point, index) => {
        const [x, y] = at(index, maxPerPoint + 1.4)
        return (
          <text key={point.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="radar-label">
            {point.label}
          </text>
        )
      })}
    </svg>
  )
}
