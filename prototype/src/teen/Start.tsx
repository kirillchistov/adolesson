import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { firstStepExamples, startSources } from '../content/teen'
import { familyStore, teenStore, uid, useStore } from '../state/store'
import { Field, Screen, Sources, TimerRing, useCountdown } from '../ui/kit'

type Phase = 'plan' | 'first' | 'decide' | 'block' | 'end' | 'saved'

// «Только первый шаг» + учебный блок + одна строка в конце (support-concept.md §4, §8 В, Е)
export function Start() {
  const [params] = useSearchParams()
  const minimum = params.get('min') === '1'
  const [family] = useStore(familyStore)
  const [, setTeen] = useStore(teenStore)
  const [phase, setPhase] = useState<Phase>('plan')
  const [result, setResult] = useState(minimum ? family.agreement.minOnHardDay : '')
  const [blockMinutes, setBlockMinutes] = useState(15)
  const [startedAt, setStartedAt] = useState('')
  const [end, setEnd] = useState({ got: '', stuck: '', next: '' })

  const firstLeft = useCountdown(5 * 60, phase === 'first')
  const blockLeft = useCountdown(blockMinutes * 60, phase === 'block')

  function begin() {
    setStartedAt(new Date().toISOString())
    setPhase('first')
  }

  function save(minutes: number) {
    setTeen((state) => ({
      ...state,
      blocks: [{ id: uid(), plannedResult: result, startedAt, minutes, ...end }, ...state.blocks],
    }))
    setPhase('saved')
  }

  if (phase === 'plan') {
    return (
      <Screen kicker={minimum ? 'Минимум на трудный день' : 'Старт'} title="Что будет результатом?">
        <p className="meaning">Не «заниматься математикой», а то, что можно увидеть в конце. Конкретный план помогает начать.</p>
        {family.agreement.priority ? <p className="sticker">Приоритет недели: {family.agreement.priority}</p> : null}
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
        <button type="button" className="btn" onClick={() => setPhase('decide')}>
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
              }}
            >
              <strong>Ещё {minutes} минут</strong>
              <span>С остановкой по таймеру, даже если идёт хорошо</span>
            </button>
          ))}
          <button type="button" className="choice" onClick={() => setPhase('end')}>
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
          <Link className="btn ghost" to="/teen/help">
            Попросить помощь
          </Link>
          <button type="button" className="btn" onClick={() => setPhase('end')}>
            Закончить
          </button>
        </div>
      </Screen>
    )
  }

  if (phase === 'end') {
    const spent = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
    return (
      <Screen kicker="Одна строка" title="Что было?">
        <p className="meaning">Пустые строки можно оставить. Это не оценка тебя целиком.</p>
        <Field label="Получилось…" value={end.got} onChange={(got) => setEnd({ ...end, got })} />
        <Field label="Застряла на…" value={end.stuck} onChange={(stuck) => setEnd({ ...end, stuck })} />
        <Field label="Следующий шаг…" value={end.next} onChange={(next) => setEnd({ ...end, next })} />
        <button type="button" className="btn" onClick={() => save(Math.max(1, spent))}>
          Сохранить у себя
        </button>
      </Screen>
    )
  }

  return (
    <Screen kicker="Готово" title="Блок сохранён">
      <p className="meaning">Сохранено только на этом устройстве. Хороший день не создаёт долг — не нужно добавлять ещё.</p>
      <Link className="btn" to="/teen/now">
        На главную
      </Link>
      <button type="button" className="text-btn" onClick={() => setPhase('plan')}>
        Ещё один блок — если правда хочется
      </button>
    </Screen>
  )
}
