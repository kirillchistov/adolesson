import { useEffect, useRef, useState, type ReactNode } from 'react'
import { sources, type SourceCode } from './content/sources'

export function Screen({
  title,
  kicker,
  back,
  children,
}: {
  title?: string
  kicker?: string
  back?: string
  children: ReactNode
}) {
  return (
    <section className="screen">
      {back ? (
        <a className="back" href={back}>
          ← Назад
        </a>
      ) : null}
      {kicker ? <p className="kicker">{kicker}</p> : null}
      {title ? <h1>{title}</h1> : null}
      {children}
    </section>
  )
}

export function Sources({ codes }: { codes: readonly SourceCode[] }) {
  return (
    <p className="sources">
      Опора:{' '}
      {codes.map((code, index) => (
        <span key={code}>
          <a href={sources[code].url} target="_blank" rel="noreferrer">
            {sources[code].title}
          </a>
          {index < codes.length - 1 ? ', ' : ''}
        </span>
      ))}
    </p>
  )
}

export function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  multiline,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} rows={3} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
      )}
    </label>
  )
}

export function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => setLeft(seconds), [seconds])
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running])
  return left
}

const formatTime = (total: number) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`

export function TimerRing({ left, total, label }: { left: number; total: number; label?: string }) {
  const radius = 54
  const length = 2 * Math.PI * radius
  const progress = total ? left / total : 0
  return (
    <div className="timer" role="timer" aria-live="off">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="timer-track" cx="60" cy="60" r={radius} />
        <circle
          className="timer-bar"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={length}
          strokeDashoffset={length * (1 - progress)}
        />
      </svg>
      <div className="timer-text">
        <strong>{formatTime(left)}</strong>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  )
}

// Дыхание: около 5 с вдох и 5 с выдох, без задержек (U5, U7). Вибрация — только где есть Vibration API.
export function Breath({ cycles = 5 }: { cycles?: number }) {
  const [tick, setTick] = useState(0)
  const phaseSeconds = 5
  const totalTicks = cycles * phaseSeconds * 2
  const inhale = Math.floor(tick / phaseSeconds) % 2 === 0
  const done = tick >= totalTicks
  const vibrateRef = useRef(inhale)
  vibrateRef.current = inhale

  useEffect(() => {
    if (done) return
    const timer = window.setTimeout(() => setTick((value) => value + 1), 1000)
    return () => window.clearTimeout(timer)
  }, [tick, done])

  useEffect(() => {
    if (tick % phaseSeconds !== 0 || done || !('vibrate' in navigator)) return
    navigator.vibrate?.(vibrateRef.current ? 40 : [20, 60, 20])
  }, [tick, done])

  const cycle = Math.min(cycles, Math.floor(tick / (phaseSeconds * 2)) + 1)
  return (
    <div className="breath">
      <div className={done ? 'sphere' : inhale ? 'sphere in' : 'sphere out'} aria-hidden="true" />
      <p className="breath-label" aria-live="polite">
        {done ? 'Готово' : inhale ? 'Вдох' : 'Выдох'}
      </p>
      <p className="quiet">{done ? 'Можно дышать как обычно.' : `${cycle} из ${cycles}`}</p>
    </div>
  )
}
