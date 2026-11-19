import { crisisDraft, crisisLines } from '../../teen/content/crisis'
import type { SourceCode } from '../../teen/content/sources'
import { Screen, Sources } from '../../teen/ui'

const sources: SourceCode[] = ['U8', 'U10', 'U15', 'U16', 'W5', 'W6', 'W7', 'W8', 'W9', 'L1', 'R1', 'R3']

export function HelpRoute() {
  return (
    <Screen kicker="Раньше конца маршрута" title="Когда нужна помощь" back="#/parent/week">
      <p className="meaning">
        Плохая математика не доказывает дискалькулию, рассеянность — СДВГ. Диагноз ставит специалист, не этот список.
      </p>
      <section className="stack">
        <h2>Куда можно обратиться</h2>
        <ul className="list">
          <li>Школьный педагог-психолог и психолого-педагогический консилиум — с ведома подростка.</li>
          <li>Отдельная беседа со специалистом. Границы конфиденциальности и исключения при риске лучше назвать заранее.</li>
          <li>Многолетние трудности при регулярных занятиях — повод для оценки сейчас, не после восьми недель.</li>
        </ul>
      </section>
      <section className="stack">
        <h2>Сон и усталость</h2>
        <p>Ориентир для 13–18 лет — 8–10 часов сна. Устойчивая усталость при таком сне — повод к врачу, не к новым требованиям.</p>
      </section>
      <section className="stack">
        <h2>Не ждать восьмой недели</h2>
        <p>
          Если повседневной жизни мешают сон, аппетит, настроение, отношения, посещение школы или пропал интерес к привычному,
          нужна профессиональная оценка раньше.
        </p>
      </section>
      <section className="stack">
        <h2>Если есть риск для жизни</h2>
        {crisisDraft ? <p className="sticker">Черновик текста — нужна вычитка специалистом</p> : null}
        <p>
          При самоповреждении, словах о нежелании жить или намерении причинить себе вред нужна срочная помощь. При
          непосредственной опасности не оставляйте подростка в одиночестве и вызывайте местную экстренную службу. Угрозу
          жизни не обещают хранить в тайне.
        </p>
        <div className="choices">
          {crisisLines.map((line) => (
            <a key={line.phone} className="choice" href={`tel:${line.phone.replace(/-/g, '')}`}>
              <strong>{line.label}</strong>
              <span>
                {line.phone}. {line.note}
              </span>
            </a>
          ))}
        </div>
      </section>
      <Sources codes={sources} />
    </Screen>
  )
}
