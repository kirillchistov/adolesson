import { useEffect, useState } from 'react'
import { PublishNote } from '../../shared/PublishNote'
import {
  answerScale,
  barrierCards,
  barrierSentence,
  diagnosticDisclaimer,
  mapSources,
  maxPerPoint,
  points,
  topPoint,
  type PointId,
} from '../content/map'
import { readBarrier, saveBarrier, type BarrierRecord } from '../db'
import { Field, Screen, Sources } from '../ui'

const emptyScores = (): Record<PointId, number> => ({
  start: 0,
  understand: 0,
  continue: 0,
  submit: 0,
  recover: 0,
})

export function BarrierMap() {
  const [record, setRecord] = useState<BarrierRecord | null | undefined>(undefined)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])

  useEffect(() => {
    let live = true
    readBarrier().then((value) => {
      if (!live) return
      setRecord(value)
      setStep(value ? barrierCards.length : 0)
    })
    return () => {
      live = false
    }
  }, [])

  function answer(score: number) {
    const next = [...answers, score]
    setAnswers(next)
    const index = next.length
    setStep(index)
    if (index < barrierCards.length) return
    const scores = emptyScores()
    barrierCards.forEach((card, cardIndex) => {
      scores[card.point] += next[cardIndex]
    })
    const nextRecord: BarrierRecord = {
      id: 'barrier',
      scores,
      sleep: record?.sleep ?? '',
      energy: record?.energy ?? '',
      fear: record?.fear ?? '',
      goodWeek: record?.goodWeek ?? '',
    }
    setRecord(nextRecord)
    void saveBarrier(nextRecord)
  }

  if (record === undefined) return null

  if (step < barrierCards.length) {
    const card = barrierCards[step]
    return (
      <Screen kicker={`Где ломается · ${step + 1} / ${barrierCards.length}`} title="Это про тебя?" back="#/teen/me">
        <article className="panel" aria-live="polite">
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

  if (!record) return null
  const saved = record
  const { flat, top } = topPoint(saved.scores)

  function keep(fields: Partial<Pick<BarrierRecord, 'sleep' | 'energy' | 'fear' | 'goodWeek'>>) {
    const next = { ...saved, ...fields }
    setRecord(next)
    void saveBarrier(next)
  }

  return (
    <Screen kicker="Карта барьеров" title={flat ? 'Явной точки трения нет' : `Точка трения — «${top.label.toLowerCase()}»`} back="#/teen/me">
      <Radar scores={saved.scores} />
      {flat ? (
        <p className="meaning">Сейчас ни одна точка не выделяется сильнее остальных. Можно вернуться к карте через пару недель.</p>
      ) : (
        <article className="panel">
          <p>{top.tip}</p>
          <p>
            <strong>{top.tool}</strong>
          </p>
          <a className="btn" href={top.href}>
            Попробовать
          </a>
        </article>
      )}
      <p className="quiet">{diagnosticDisclaimer}</p>
      <Field label="Сон, примерно часов" value={saved.sleep} onChange={(sleep) => keep({ sleep })} />
      <Field label="Энергия одним словом" value={saved.energy} onChange={(energy) => keep({ energy })} />
      <Field label="Страх ошибки или реакции взрослых" value={saved.fear} onChange={(fear) => keep({ fear })} />
      <Field label="Что было иначе на удачной неделе" value={saved.goodWeek} onChange={(goodWeek) => keep({ goodWeek })} multiline />
      <p className="quiet">Эти четыре поля остаются на устройстве. На стол уходит только фраза ниже, если сама её положишь.</p>
      <PublishNote kind="barrier" label="Барьер на стол" suggestion={barrierSentence(saved.scores)} />
      <PublishNote
        kind="factor"
        label="Что помогает"
        suggestion={saved.goodWeek.trim() || 'На удачной неделе помогло…'}
      />
      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          setAnswers([])
          setStep(0)
        }}
      >
        Пройти заново
      </button>
      <Sources codes={mapSources} />
    </Screen>
  )
}

function Radar({ scores }: { scores: Record<PointId, number> }) {
  const size = 240
  const center = size / 2
  const radius = 84
  const angle = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / points.length
  const at = (index: number, value: number) => {
    const r = (value / maxPerPoint) * radius
    return [center + r * Math.cos(angle(index)), center + r * Math.sin(angle(index))]
  }
  const shape = points.map((point, index) => at(index, scores[point.id]).join(',')).join(' ')
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Карта пяти точек: начать, понять, продолжить, сдать, восстановиться">
      {[1, 2, 3, 4].map((level) => (
        <polygon key={level} className="radar-grid" points={points.map((_, index) => at(index, level).join(',')).join(' ')} />
      ))}
      <polygon className="radar-shape" points={shape} />
      {points.map((point, index) => {
        const [x, y] = at(index, maxPerPoint + 1.35)
        return (
          <text key={point.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="radar-label">
            {point.label}
          </text>
        )
      })}
    </svg>
  )
}
