import type { Route } from '../teen/moe/router'

const links: { name: Route['name']; href: string; label: string }[] = [
  { name: 'now', href: '#/teen/moe/now', label: 'Моё' },
  { name: 'zine', href: '#/teen/moe/zine', label: 'Затея' },
  { name: 'things', href: '#/teen/moe/things', label: 'Мои затеи' },
  { name: 'mantras', href: '#/teen/moe/mantras', label: 'Мантры' },
]

export function Nav({ current }: { current: Route['name'] }) {
  return (
    <nav className="nav" aria-label="Разделы">
      {links.map((link) => (
        <a key={link.href} href={link.href} className={current === link.name ? 'active' : undefined} aria-current={current === link.name ? 'page' : undefined}>
          {link.label}
        </a>
      ))}
    </nav>
  )
}
