import { useEffect } from 'react'
import { Table } from '../shared/Table'
import { Breathe } from './practices/Breathe'
import { Help } from './help/Help'
import { Now, Rest } from './now/Now'
import { Me, Sos } from './profile/Me'
import { BarrierMap } from './map/Map'
import { Start } from './start/Start'

const tabs = [
  { href: '#/teen/now', label: 'Сейчас', names: ['now', 'rest', 'breathe'] },
  { href: '#/teen/start', label: 'Старт', names: ['start'] },
  { href: '#/teen/moe/now', label: 'Моё', names: [] },
  { href: '#/teen/me', label: 'Я', names: ['me', 'map'] },
]

export function TeenApp({ path }: { path: string }) {
  const [pathname, query = ''] = path.split('?')
  const name = pathname.replace(/^\/teen\/?/, '') || 'now'
  const minimum = new URLSearchParams(query).get('min') === '1'
  const known = ['now', 'rest', 'start', 'help', 'breathe', 'me', 'sos', 'table', 'map'].includes(name)

  useEffect(() => {
    if (!known) location.replace('#/teen/now')
  }, [known])

  if (!known) return null

  return (
    <div className="app">
      <div className="phone has-nav teen-shell">
        <div className="moon" aria-hidden="true" />
        {name === 'now' ? <Now /> : null}
        {name === 'rest' ? <Rest /> : null}
        {name === 'start' ? <Start minimum={minimum} /> : null}
        {name === 'help' ? <Help /> : null}
        {name === 'breathe' ? <Breathe /> : null}
        {name === 'me' ? <Me /> : null}
        {name === 'map' ? <BarrierMap /> : null}
        {name === 'sos' ? <Sos /> : null}
        {name === 'table' ? <Table allowCreate={false} back="#/teen/now" /> : null}
        <nav className="nav" aria-label="Разделы">
          {tabs.map((tab) => (
            <a key={tab.href} href={tab.href} className={tab.names.includes(name) ? 'active' : undefined} aria-current={tab.names.includes(name) ? 'page' : undefined}>
              {tab.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
