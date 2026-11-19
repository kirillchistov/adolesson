import { useState } from 'react'
import { firstStepExamples, startSources } from '../content/teen'
import { saveBlock } from '../db'
import { Field, Screen, Sources, TimerRing, useCountdown } from '../ui'

type Phase = 'plan' | 'first' | 'decide' | 'block' | 'end' | 'saved'
type EndLine = { got: string; stuck: string; next: string }

type Draft = {
  phase: Exclude<Phase, 'saved'>
  result: string
  blockMinutes: number
  startedAt: string
  end: EndLine
}

let draft: Draft | null = null

export function Start({ minimum }: { minimum: boolean }) {
  const [phase, setPhase] = useState<Phase>(draft?.phase ?? 'plan')
  const [result, setResult] = useState(draft?.result ?? '')
  const [blockMinutes, setBlockMinutes] = useState(draft?.blockMinutes ?? 15)
  const [startedAt, setStartedAt] = useState(draft?.startedAt ?? '')
  const [end, setEnd] = useState<EndLine>(draft?.end ?? { got: '', stuck: '', next: '' })

  const firstLeft = useCountdown(5 * 60, phase === 'first')
  const blockLeft = useCountdown(blockMinutes * 60, phase === 'block')

  function remember(next: Partial<Draft> & { phase?: Draft['phase'] }) {
    const current: Draft = {
      phase: next.phase ?? (phase === 'saved' ? 'plan' : phase),
      result,
      blockMinutes,
      startedAt,
      end,
      ...next,
    }
    draft = current
  }

  function begin() {
    const at = new Date().toISOString()
    setStartedAt(at)
    setPhase('first')
    remember({ phase: 'first', result, startedAt: at })
  }

  async function save() {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000))
    await saveBlock({ plannedResult: result, startedAt, minutes, ...end })
    draft = null
    setPhase('saved')
  }

  if (phase === 'plan') {
    return (
      <Screen kicker={minimum ? 'Минимум на трудный день' : 'Старт'} title="Что будет результатом?">
        <p className="meaning">Не «заниматься математикой», а то, что можно увидеть в конце. Конкретный план помогает начать.</p>
        {minimum ? <p className="quiet">Объём на трудный день ещё не записан в договорённости. Напиши посильный результат сама.</p> : null}
        <Field label="Результат блока" value={result} onChange={setResult} placeholder="Разобрать пример и попробовать два похожих" />
        <div className="chips">
          {firstStepExamples.map((example) => (
            <button key={example} type="button" className="chip" onClick={() => setResult(example)}>
              {example}
            </button>
          ))}
        </div>
        <button type="button" className="btn" disabled={!result.trim()} onClick={begin}>
          Только первые 5 минут
        </button>
        <p className="quiet">Через 5 минут решишь сама: продолжать или хватит. Оба варианта — нормальный исход.</p>
        <Sources codes={startSources} />
      </Screen>
    )
  }

  if (phase === 'first') {
    return (
      <Screen kicker="Первый шаг" title={result}>
        <TimerRing left={firstLeft} total={300} label="только начать" />
        <p className="meaning center">Открыть, записать условие, попробовать первую строку. Больше ничего не нужно.</p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setPhase('decide')
            remember({ phase: 'decide' })
          }}
        >
          {firstLeft === 0 ? 'Пять минут прошли' : 'Уже можно решать'}
        </button>
      </Screen>
    )
  }

  if (phase === 'decide') {
    return (
      <Screen kicker="Решаешь ты" title="Продолжаем?">
        <div className="choices">
          {[15, 20].map((minutes) => (
            <button
              key={minutes}
              type="button"
              className="choice"
              onClick={() => {
                setBlockMinutes(minutes)
                setPhase('block')
                remember({ phase: 'block', blockMinutes: minutes })
              }}
            >
              <strong>Ещё {minutes} минут</strong>
              <span>С остановкой по таймеру, даже если идёт хорошо</span>
            </button>
          ))}
          <button
            type="button"
            className="choice"
            onClick={() => {
              setPhase('end')
              remember({ phase: 'end' })
            }}
          >
            <strong>Хватит на сегодня</strong>
            <span>Первый шаг сделан — это уже результат</span>
          </button>
        </div>
      </Screen>
    )
  }

  if (phase === 'block') {
    return (
      <Screen kicker="Блок" title={result}>
        <TimerRing left={blockLeft} total={blockMinutes * 60} />
        <p className="meaning center">Можно остановиться на непонятном шаге и попросить помощь — это часть блока.</p>
        <div className="row">
          <a className="btn ghost" href="#/teen/help">
            Попросить помощь
          </a>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setPhase('end')
              remember({ phase: 'end' })
            }}
          >
            Закончить
          </button>
        </div>
      </Screen>
    )
  }

  if (phase === 'end') {
    return (
      <Screen kicker="Одна строка" title="Что было?">
        <p className="meaning">Пустые строки можно оставить. Это не оценка тебя целиком.</p>
        <Field
          label="Получилось…"
          value={end.got}
          onChange={(got) => {
            const next = { ...end, got }
            setEnd(next)
            remember({ phase: 'end', end: next })
          }}
        />
        <Field
          label="Застряла на…"
          value={end.stuck}
          onChange={(stuck) => {
            const next = { ...end, stuck }
            setEnd(next)
            remember({ phase: 'end', end: next })
          }}
        />
        <Field
          label="Следующий шаг…"
          value={end.next}
          onChange={(nextStep) => {
            const next = { ...end, next: nextStep }
            setEnd(next)
            remember({ phase: 'end', end: next })
          }}
        />
        <button type="button" className="btn" onClick={save}>
          Сохранить у себя
        </button>
      </Screen>
    )
  }

  return (
    <Screen kicker="Готово" title="Блок сохранён">
      <p className="meaning">Сохранено только на этом устройстве. Хороший день не создаёт долг — не нужно добавлять ещё.</p>
      <a className="btn" href="#/teen/now">
        На главную
      </a>
      <button
        type="button"
        className="text-btn"
        onClick={() => {
          draft = null
          setResult('')
          setEnd({ got: '', stuck: '', next: '' })
          setPhase('plan')
        }}
      >
        Ещё один блок — если правда хочется
      </button>
    </Screen>
  )
}
