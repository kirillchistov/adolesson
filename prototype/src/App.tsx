import { useEffect } from 'react'
import { HashRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Phrases } from './parent/Phrases'
import { Pause } from './parent/Pause'
import { Talk } from './parent/Talk'
import { Week } from './parent/Week'
import { Table } from './shared/Table'
import { familyStore, teenStore, useStore } from './state/store'
import { Help } from './teen/Help'
import { BarrierMap } from './teen/Map'
import { Me, Sos } from './teen/Me'
import { Now, Rest } from './teen/Now'
import { Breathe } from './teen/Practices'
import { Start } from './teen/Start'
import { TabBar } from './ui/kit'

export function App() {
  const [teen] = useStore(teenStore)

  useEffect(() => {
    document.documentElement.dataset.theme = teen.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', teen.theme === 'collage' ? '#0c0b0f' : '#efe8ff')
  }, [teen.theme])

  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/teen" element={<TeenLayout />}>
            <Route index element={<Navigate to="now" replace />} />
            <Route path="now" element={<Now />} />
            <Route path="rest" element={<Rest />} />
            <Route path="start" element={<Start />} />
            <Route path="help" element={<Help />} />
            <Route path="breathe" element={<Breathe />} />
            <Route path="map" element={<BarrierMap />} />
            <Route path="me" element={<Me />} />
            <Route path="sos" element={<Sos />} />
            <Route path="table" element={<Table role="teen" />} />
          </Route>
          <Route path="/parent" element={<ParentLayout />}>
            <Route index element={<Navigate to="week" replace />} />
            <Route path="week" element={<Week />} />
            <Route path="talk" element={<Talk />} />
            <Route path="pause" element={<Pause />} />
            <Route path="phrases" element={<Phrases />} />
            <Route path="table" element={<Table role="parent" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

function Entry() {
  const navigate = useNavigate()
  return (
    <section className="screen entry">
      <p className="kicker">Прототип · этап 0</p>
      <h1 className="display">Ровно</h1>
      <p className="meaning">Учёба без качелей и истерик. Два входа — две разные программы и общий стол между ними.</p>
      <div className="choices">
        <button type="button" className="choice" onClick={() => navigate('/teen/now')}>
          <strong>Я подросток</strong>
          <span>Состояние, первый шаг, точная просьба, своё</span>
        </button>
        <button type="button" className="choice" onClick={() => navigate('/parent/week')}>
          <strong>Я родитель</strong>
          <span>Маршрут недели, пауза, разговор, фразы</span>
        </button>
      </div>
      <p className="quiet">
        В прототипе обе роли живут в одном браузере. Откройте две вкладки — подростка и родителя — и общий стол будет
        обновляться между ними. Данные хранятся только в этом браузере.
      </p>
      <button
        type="button"
        className="text-btn"
        onClick={() => {
          teenStore.reset()
          familyStore.reset()
        }}
      >
        Сбросить данные прототипа
      </button>
    </section>
  )
}

function TeenLayout() {
  // Кнопка помощи — везде, кроме самой помощи и кризисного экрана
  const { pathname } = useLocation()
  const showFab = !['/teen/help', '/teen/sos'].includes(pathname)
  return (
    <div className="shell">
      <RoleBar label="Подросток" />
      <Outlet />
      {showFab ? (
        <Link className="fab" to="/teen/help" aria-label="Попросить помощь">
          ?
        </Link>
      ) : null}
      <TabBar
        items={[
          { to: '/teen/now', label: 'Сейчас' },
          { to: '/teen/start', label: 'Старт' },
          { to: '/teen/table', label: 'Стол' },
          { to: '/teen/me', label: 'Я' },
        ]}
      />
    </div>
  )
}

function ParentLayout() {
  const { pathname } = useLocation()
  return (
    <div className="shell">
      <RoleBar label="Родитель" />
      <Outlet />
      {pathname !== '/parent/pause' ? (
        <Link className="fab" to="/parent/pause" aria-label="Пауза">
          ॥
        </Link>
      ) : null}
      <TabBar
        items={[
          { to: '/parent/week', label: 'Неделя' },
          { to: '/parent/phrases', label: 'Фразы' },
          { to: '/parent/table', label: 'Стол' },
          { to: '/parent/pause', label: 'Пауза' },
        ]}
      />
    </div>
  )
}

function RoleBar({ label }: { label: string }) {
  return (
    <div className="rolebar">
      <span>{label}</span>
      <Link to="/">сменить роль</Link>
    </div>
  )
}
