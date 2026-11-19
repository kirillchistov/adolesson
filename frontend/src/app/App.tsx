import { useEffect, useState } from 'react'
import { ParentApp } from '../parent/ParentApp'
import { MoeApp } from '../teen/moe/MoeApp'
import { StoreProvider, useStore } from '../teen/moe/state/context'
import { TeenApp } from '../teen/TeenApp'

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const { state } = useStore()
  const [hash, setHash] = useState(() => location.hash)

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    document.documentElement.style.colorScheme = state.theme === 'collage' ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.theme === 'collage' ? '#0c0b0f' : '#efe8ff')
  }, [state.theme])

  useEffect(() => {
    const sync = () => setHash(location.hash)
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const path = hash.replace(/^#/, '') || '/'
  const zone = path.startsWith('/teen/moe') ? 'moe' : path.startsWith('/teen') ? 'teen' : path.startsWith('/parent') ? 'parent' : 'entry'
  const showHelp = zone === 'teen' && !path.startsWith('/teen/help') && !path.startsWith('/teen/sos')

  return (
    <>
      {zone === 'moe' ? <MoeApp /> : null}
      {zone === 'teen' ? <TeenApp path={path} /> : null}
      {zone === 'parent' ? <ParentApp path={path} /> : null}
      {zone === 'entry' ? <Entry /> : null}
      {showHelp ? (
        <a className="fab" href="#/teen/help" aria-label="Попросить помощь">
          ?
        </a>
      ) : null}
    </>
  )
}

function Entry() {
  return (
    <div className="app">
      <div className="phone">
        <div className="moon" aria-hidden="true" />
        <section className="screen">
          <p className="kicker">Без семьи</p>
          <h1>Ровно</h1>
          <p className="meaning">Можно начать одной. Чек-ины, блоки и карточка остаются на этом устройстве, пока сама не решишь ими поделиться.</p>
          <div className="choices">
            <a className="choice" href="#/teen/now">
              <strong>Я подросток</strong>
              <span>Состояние, первый шаг, точная просьба, своё</span>
            </a>
            <a className="choice" href="#/parent/week">
              <strong>Я родитель</strong>
              <span>Недели 0–4: разговор, пауза, фразы. Записи остаются на этом устройстве.</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
