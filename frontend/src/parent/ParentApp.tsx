import { useEffect } from 'react'
import { Table } from '../shared/Table'
import { Pause } from './pause/Pause'
import { Phrases } from './phrases/Phrases'
import { Talk } from './talk/Talk'
import { Week } from './week/Week'

const tabs = [
  { href: '#/parent/week', label: 'Неделя', names: ['week', 'talk'] },
  { href: '#/parent/table', label: 'Стол', names: ['table'] },
  { href: '#/parent/phrases', label: 'Фразы', names: ['phrases'] },
  { href: '#/parent/pause', label: 'Пауза', names: ['pause'] },
]

export function ParentApp({ path }: { path: string }) {
  const name = path.replace(/^\/parent\/?/, '').split('?')[0] || 'week'
  const known = ['week', 'talk', 'pause', 'phrases', 'table'].includes(name)

  useEffect(() => {
    if (!known) location.replace('#/parent/week')
  }, [known])

  if (!known) return null

  return (
    <div className="app">
      <div className="phone has-nav teen-shell parent-shell">
        <div className="moon" aria-hidden="true" />
        {name === 'week' ? <Week /> : null}
        {name === 'talk' ? <Talk /> : null}
        {name === 'pause' ? <Pause /> : null}
        {name === 'phrases' ? <Phrases /> : null}
        {name === 'table' ? <Table allowCreate /> : null}
        <nav className="nav" aria-label="Разделы родителя">
          {tabs.map((tab) => (
            <a key={tab.href} href={tab.href} className={tab.names.includes(name) ? 'active' : undefined} aria-current={tab.names.includes(name) ? 'page' : undefined}>
              {tab.label}
            </a>
          ))}
        </nav>
      </div>
      {name === 'pause' ? null : (
        <a className="fab" href="#/parent/pause" aria-label="Пауза">
          ‖
        </a>
      )}
    </div>
  )
}
