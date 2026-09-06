import type { WippfReport, WippfScaleScore } from '../lib/wippf'
import { buildPriorities, resourceScales } from '../lib/wippfPriority'
import type { CoupleCompare } from '../lib/wippfCouple'

const GROUPS: { key: WippfScaleScore['group']; title: string }[] = [
  { key: 'secondary', title: 'Вторичные (нормы)' },
  { key: 'primary', title: 'Первичные' },
  { key: 'conflict', title: 'Конфликт / баланс' },
  { key: 'model', title: 'Модель отношений' },
]

/** Компактный лист для печати индивидуального профиля */
export function PrintReport({ report, title = 'WIPPF 2.0 — краткий отчёт' }: { report: WippfReport; title?: string }) {
  const priorities = buildPriorities(report).slice(0, 5)
  const resources = resourceScales(report)
  const norms = report.agg.filter((x) => ['a', 'r', 'k'].includes(x.id))
  const relations = report.agg.filter((x) => ['e', 'w', 'i'].includes(x.id))
  const conflictTop = [...report.conflict].sort((a, b) => b.score - a.score)[0]

  return (
    <div className="print-sheet">
      <header className="print-sheet-head">
        <h1>{title}</h1>
        <p>
          {report.verdict} · крайних {report.extremes.length} (↑{report.high.length} / ↓{report.low.length})
          {conflictTop ? ` · конфликт: ${conflictTop.name} ${conflictTop.score}/12` : ''}
        </p>
      </header>

      <section className="print-block">
        <h2>Сначала сюда</h2>
        <ol>
          {priorities.map((p) => (
            <li key={p.id}>
              <strong>{p.title}</strong>
              {p.scoreLabel ? ` — ${p.scoreLabel}` : ''}. {p.detail}
            </li>
          ))}
        </ol>
      </section>

      <div className="print-two">
        <section className="print-block">
          <h2>Опоры (7–9)</h2>
          {resources.length ? (
            <ul>
              {resources.map((s) => (
                <li key={s.id}>
                  {s.name} — {s.score}/12
                </li>
              ))}
            </ul>
          ) : (
            <p>Мало шкал в зоне 7–9.</p>
          )}
        </section>
        <section className="print-block">
          <h2>Индексы</h2>
          <p>
            Нормы a/r/k: <strong>{norms.map((x) => x.value).join('/')}</strong>
          </p>
          <p>
            Отношения e/w/i: <strong>{relations.map((x) => x.value).join('/')}</strong>
          </p>
          <p className="print-muted">a — своё поведение · r — ожидания · k — идеалы · e — к себе · w — к другим · i — идеал</p>
        </section>
      </div>

      <section className="print-block">
        <h2>Модель баланса</h2>
        <div className="print-balance-row">
          {report.conflict.map((s) => (
            <div key={s.id} className={`print-chip level-${s.level}`}>
              <span>{s.name}</span>
              <strong>{s.score}</strong>
            </div>
          ))}
        </div>
      </section>

      {GROUPS.map((g) => {
        const list = report.scales.filter((s) => s.group === g.key)
        return (
          <section key={g.key} className="print-block">
            <h2>{g.title}</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Шкала</th>
                  <th>Балл</th>
                  <th>Полюс</th>
                  <th>Кратко</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className={`level-${s.level}`}>
                    <td>{s.name}</td>
                    <td className="num">
                      {s.score}/12 · {s.flag}
                    </td>
                    <td className="poles">
                      {s.level === 'low' ? s.lowPole : s.level === 'high' ? s.highPole : 'баланс'}
                    </td>
                    <td>{s.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      })}

      <section className="print-block">
        <h2>Рекомендации</h2>
        <ol>
          {report.recommendations.slice(0, 6).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      </section>

      <p className="print-foot">3–5 слабо · 6–9 баланс · 10–12 выражено. Не диагноз. WIPPF 2.0</p>
    </div>
  )
}

/** Компактная печать сравнения пары */
export function PrintCoupleReport({
  compare,
  reportA,
  reportB,
}: {
  compare: CoupleCompare
  reportA: WippfReport
  reportB: WippfReport
}) {
  return (
    <div className="print-sheet">
      <header className="print-sheet-head">
        <h1>WIPPF 2.0 — сравнение пары</h1>
        <p>{compare.pair.summary}</p>
      </header>

      <div className="print-two">
        <section className="print-block">
          <h2>{compare.partnerA.label}</h2>
          <p className="print-muted">{reportA.verdict}</p>
          <h3>Проблемы / фокус</h3>
          <ul>
            {compare.partnerA.problems.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {compare.partnerA.resources.length ? (
            <>
              <h3>Опоры</h3>
              <ul>
                {compare.partnerA.resources.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
        <section className="print-block">
          <h2>{compare.partnerB.label}</h2>
          <p className="print-muted">{reportB.verdict}</p>
          <h3>Проблемы / фокус</h3>
          <ul>
            {compare.partnerB.problems.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {compare.partnerB.resources.length ? (
            <>
              <h3>Опоры</h3>
              <ul>
                {compare.partnerB.resources.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </div>

      <section className="print-block">
        <h2>Кратко</h2>
        <p>{compare.pair.brief.a}</p>
        <p>{compare.pair.brief.b}</p>
        <p>{compare.pair.brief.pair}</p>
        {compare.pair.sharedResources.length ? (
          <p>
            <strong>Общие опоры:</strong> {compare.pair.sharedResources.join(', ')}
          </p>
        ) : null}
      </section>

      <section className="print-block">
        <h2>Итог для пары</h2>
        <ol>
          {compare.pair.bullets.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      </section>

      <section className="print-block">
        <h2>Сравнение шкал</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Шкала</th>
              <th>{compare.partnerA.label}</th>
              <th>{compare.partnerB.label}</th>
              <th>Δ</th>
            </tr>
          </thead>
          <tbody>
            {reportA.scales.map((sa) => {
              const sb = reportB.scales.find((x) => x.id === sa.id)!
              const gap = Math.abs(sa.score - sb.score)
              const hot = gap >= 3 || (sa.level !== 'moderate' && sb.level !== 'moderate' && sa.level !== sb.level)
              return (
                <tr key={sa.id} className={hot ? 'hot' : undefined}>
                  <td>{sa.name}</td>
                  <td className="num">
                    {sa.score} · {sa.flag}
                  </td>
                  <td className="num">
                    {sb.score} · {sb.flag}
                  </td>
                  <td className="num">{gap}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <p className="print-foot">Не диагноз. WIPPF 2.0 · парное сравнение</p>
    </div>
  )
}
