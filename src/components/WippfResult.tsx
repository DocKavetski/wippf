import { useState } from 'react'
import type { WippfAgg, WippfReport, WippfScaleScore } from '../lib/wippf'
import { BalanceDiamond } from './BalanceDiamond'

const GROUP_META: Record<
  WippfScaleScore['group'],
  { title: string; desc: string }
> = {
  secondary: {
    title: 'Вторичные способности (нормы)',
    desc: 'Социальные «правила игры»: порядок, вежливость, усердие, справедливость. Каждая шкала: a / r / k.',
  },
  primary: {
    title: 'Первичные способности (эмоции / отношения)',
    desc: 'Эмоциональный фундамент: терпение, время, доверие, любовь, смысл. Измерения e / w / i.',
  },
  conflict: {
    title: 'Реакции на конфликт',
    desc: 'Модель баланса: тело, деятельность, контакты, фантазия/смысл.',
  },
  model: {
    title: 'Модель отношений',
    desc: 'Образы значимых фигур и семейного фона.',
  },
}

function skewHint(agg: WippfAgg[]): string | null {
  if (agg.length < 2) return null
  const sorted = [...agg].sort((a, b) => b.value - a.value)
  const spread = sorted[0].value - sorted[sorted.length - 1].value
  const threshold = agg[0].id === 'a' || agg[0].id === 'r' || agg[0].id === 'k' ? 6 : 5
  if (spread < threshold) return null
  return `${sorted[0].name.split(' ')[0]} выше (${sorted[0].value}), чем ${sorted[sorted.length - 1].name.split(' ')[0]} (${sorted[sorted.length - 1].value})`
}

function AttentionBoard({ report }: { report: WippfReport }) {
  const problems = [...report.extremes].sort((a, b) => {
    const da = Math.max(a.score - 9, 5 - a.score)
    const db = Math.max(b.score - 9, 5 - b.score)
    return db - da
  })
  const resources = report.scales
    .filter((s) => s.level === 'moderate' && s.score >= 7 && s.score <= 9)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  const norms = report.agg.filter((x) => ['a', 'r', 'k'].includes(x.id))
  const relations = report.agg.filter((x) => ['e', 'w', 'i'].includes(x.id))
  const skews = [skewHint(norms), skewHint(relations)].filter(Boolean) as string[]

  return (
    <section className="attention-board">
      <div className="attention-col attention-problems">
        <div className="attention-head">
          <span className="attention-badge problem">Внимание</span>
          <h2>Куда смотреть</h2>
          <p>Крайние полюса и перекосы — точки входа в беседу.</p>
        </div>
        {problems.length === 0 && skews.length === 0 ? (
          <p className="attention-empty">Ярких крайностей мало — профиль относительно ровный.</p>
        ) : (
          <ul className="attention-list">
            {problems.slice(0, 6).map((s, idx) => (
              <li
                key={s.id}
                className={`attention-chip level-${s.level}`}
                style={{ animationDelay: `${80 + idx * 45}ms` }}
              >
                <span className="ac-code">{s.code}</span>
                <span className="ac-name">{s.name}</span>
                <span className="ac-meta">
                  {s.score}/12 · {s.flag}
                </span>
              </li>
            ))}
            {skews.map((t, idx) => (
              <li
                key={t}
                className="attention-chip skew"
                style={{ animationDelay: `${80 + (problems.length + idx) * 45}ms` }}
              >
                <span className="ac-code">↔</span>
                <span className="ac-name">{t}</span>
                <span className="ac-meta">перекос индексов</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="attention-col attention-resources">
        <div className="attention-head">
          <span className="attention-badge resource">Ресурсы</span>
          <h2>На что опереться</h2>
          <p>Сбалансированные шкалы в зоне 7–9 — опоры для работы.</p>
        </div>
        {resources.length === 0 ? (
          <p className="attention-empty">
            Мало «средних сильных» шкал — опирайтесь на умеренные зоны и модель баланса.
          </p>
        ) : (
          <ul className="attention-list">
            {resources.map((s, idx) => (
              <li
                key={s.id}
                className="attention-chip resource"
                style={{ animationDelay: `${100 + idx * 45}ms` }}
              >
                <span className="ac-code">{s.code}</span>
                <span className="ac-name">{s.name}</span>
                <span className="ac-meta">
                  {s.score}/12 · {s.flag}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function DimCompare({
  title,
  hint,
  items,
}: {
  title: string
  hint: string
  items: WippfAgg[]
}) {
  const skew = skewHint(items)
  return (
    <div className={`dim-block${skew ? ' skewed' : ''}`}>
      <div className="dim-block-head">
        <h3>{title}</h3>
        <p>{hint}</p>
        {skew ? <p className="dim-skew-flag">Перекос: {skew}</p> : <p className="dim-ok-flag">Без резкого перекоса</p>}
      </div>
      <div className="dim-bars">
        {items.map((a, idx) => {
          const pct = Math.round(((a.value - a.min) / (a.max - a.min)) * 100)
          return (
            <div key={a.id} className="dim-row" style={{ animationDelay: `${idx * 70}ms` }}>
              <div className="dim-row-top">
                <span className="dim-id">{a.id.toUpperCase()}</span>
                <span className="dim-name">{a.name}</span>
                <span className="dim-val">
                  {a.value}
                  <small>/{a.max}</small>
                </span>
              </div>
              <div className="dim-track" aria-hidden>
                <i style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
              </div>
              <p className="dim-hint">{a.hint}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResearchPanel({ report }: { report: WippfReport }) {
  if (!report.research?.length) return null
  return (
    <section className="research-panel">
      <div className="section-kicker">Эмпирика</div>
      <h2 className="section-title">Исследовательский контекст</h2>
      <p className="section-lede">
        Гипотезы из публикаций по WIPPF / WIPPF 2.0, подобранные под ваш профиль. Не нормы популяции и не
        диагноз — ориентир для клинической беседы.
      </p>
      <div className="research-grid">
        {report.research.map((item, idx) => (
          <article
            key={item.id}
            className={`research-card salience-${item.salience}`}
            style={{ animationDelay: `${idx * 45}ms` }}
          >
            <header>
              <h3>{item.topic}</h3>
              <cite>{item.cite}</cite>
            </header>
            <p className="research-finding">{item.finding}</p>
            <p className="research-impl">
              <span>Для разбора.</span> {item.implication}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function AnalysisPanel({ report }: { report: WippfReport }) {
  return (
    <section className="analysis-panel">
      <div className="section-kicker">Клинический разбор</div>
      <h2 className="section-title">Анализ профиля</h2>
      <p className="section-lede">
        Целостное чтение: нормы, отношения, конфликт и модель фигур — картина для беседы.
      </p>
      <div className="analysis-grid">
        {report.analysis.map((block, idx) => (
          <article key={block.id} className="analysis-card" style={{ animationDelay: `${idx * 50}ms` }}>
            <header>
              <span className="analysis-num">{String(idx + 1).padStart(2, '0')}</span>
              <div>
                <h3>{block.title}</h3>
                <p className="analysis-lead">{block.lead}</p>
              </div>
            </header>
            <p className="analysis-body">{block.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function FocusScales({ report }: { report: WippfReport }) {
  const focus = report.extremes.length
    ? report.extremes
    : report.scales.filter((s) => s.group === 'conflict')
  const list = focus.slice(0, 8)
  if (!list.length) return null
  return (
    <section className="focus-panel">
      <div className="section-kicker">Точки входа</div>
      <h2 className="section-title">
        {report.extremes.length ? 'Крайние шкалы — описания' : 'Конфликтные реакции — описания'}
      </h2>
      <div className="wippf-interp-list">
        {list.map((s, idx) => (
          <article
            key={s.id}
            className={`wippf-interp-card level-${s.level}`}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <header>
              <strong>
                {s.code} · {s.name}
              </strong>
              <span>
                {s.score}/12 · {s.flag}
              </span>
            </header>
            <p className="wippf-interp-poles">
              <span>↓ {s.lowPole}</span>
              <span>↑ {s.highPole}</span>
            </p>
            <p className="wippf-interp-meaning">{s.meaning}</p>
            <p className="wippf-interp-text">{s.interpretation}</p>
            <p className="wippf-interp-rec">
              <span>Рекомендация.</span> {s.recommendation}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Recommendations({ report }: { report: WippfReport }) {
  if (!report.recommendations.length) return null
  return (
    <section className="wippf-recs">
      <div className="section-kicker">Практика</div>
      <h2 className="section-title">Рекомендации по профилю</h2>
      <ol className="wippf-recs-list">
        {report.recommendations.map((r, idx) => (
          <li key={idx}>{r}</li>
        ))}
      </ol>
    </section>
  )
}

function ScaleAtlas({ report }: { report: WippfReport }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const groups: WippfScaleScore['group'][] = ['secondary', 'primary', 'conflict', 'model']

  return (
    <section className="atlas-panel">
      <div className="section-kicker">Атлас</div>
      <h2 className="section-title">Все шкалы с описаниями</h2>
      <p className="section-lede">Нажмите шкалу — смысл, полюса и интерпретация балла.</p>
      <div className="wippf-groups">
        {groups.map((g) => {
          const meta = GROUP_META[g]
          const list = report.scales.filter((s) => s.group === g)
          return (
            <div key={g} className="wippf-group">
              <div className="group-head">
                <div className="visual-scales-label">{meta.title}</div>
                <p className="group-desc">{meta.desc}</p>
              </div>
              <div className="atlas-list">
                {list.map((s) => {
                  const open = openId === s.id
                  const pct = Math.round(((s.score - 3) / 9) * 100)
                  return (
                    <div key={s.id} className={`atlas-item level-${s.level}${open ? ' open' : ''}`}>
                      <button
                        type="button"
                        className="atlas-toggle"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : s.id)}
                      >
                        <span className="atlas-code">{s.code}</span>
                        <span className="atlas-name">{s.name}</span>
                        <span className="atlas-score">
                          {s.score}/12 · {s.flag}
                        </span>
                        <span className="atlas-chevron" aria-hidden>
                          {open ? '−' : '+'}
                        </span>
                      </button>
                      <div className="atlas-mini-track" aria-hidden>
                        <i style={{ width: `${pct}%` }} />
                      </div>
                      {open ? (
                        <div className="atlas-detail">
                          <p className="wippf-interp-poles">
                            <span>↓ {s.lowPole}</span>
                            <span>↑ {s.highPole}</span>
                          </p>
                          <p className="wippf-interp-meaning">{s.meaning}</p>
                          <p className="wippf-interp-text">{s.interpretation}</p>
                          <p className="wippf-interp-rec">
                            <span>Рекомендация.</span> {s.recommendation}
                          </p>
                          <p className="atlas-dims">Пункты: {s.dims.join(' · ')}</p>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

type Props = {
  report: WippfReport
  onCopy: () => void
  copied: boolean
}

export function WippfResult({ report, onCopy, copied }: Props) {
  const conflictTop = [...report.conflict].sort((a, b) => b.score - a.score)[0]
  const norms = report.agg.filter((x) => ['a', 'r', 'k'].includes(x.id))
  const relations = report.agg.filter((x) => ['e', 'w', 'i'].includes(x.id))

  return (
    <div className={`result-area visual-result level-${report.level}`}>
      <div className="result-toolbar no-print">
        <button type="button" className="btn" onClick={onCopy}>
          {copied ? 'Скопировано' : 'Копировать сводку'}
        </button>
        <button type="button" className="btn ghost" onClick={() => window.print()}>
          Печать отчёта
        </button>
      </div>

      <div className={`visual-verdict visual-verdict-${report.level}`}>
        <div className="visual-verdict-label">Клинический вывод</div>
        <div className="visual-verdict-title">{report.verdict}</div>
        <p className="visual-verdict-text">{report.conclusion}</p>
        <div className="verdict-pills">
          <span className="vpill">
            Крайние <strong>{report.extremes.length}</strong>
            <small>
              ↑{report.high.length} / ↓{report.low.length}
            </small>
          </span>
          <span className="vpill">
            Конфликт{' '}
            <strong>{conflictTop ? `${conflictTop.code} ${conflictTop.score}` : '—'}</strong>
            <small>{conflictTop?.name}</small>
          </span>
          <span className="vpill">
            a/r/k <strong>{norms.map((x) => x.value).join('/')}</strong>
          </span>
          <span className="vpill">
            e/w/i <strong>{relations.map((x) => x.value).join('/')}</strong>
          </span>
        </div>
      </div>

      <AttentionBoard report={report} />

      <section className="balance-panel">
        <div className="section-kicker">Кристалл Пезешкиана</div>
        <h2 className="section-title">Модель баланса</h2>
        <p className="section-lede">
          Классический ромб четырёх сфер: тело ↑, деятельность →, контакты ↓, смыслы ←. Пунктир —
          ориентир баланса (~7–8). Выпячивание = уход в сферу при конфликте.
        </p>
        <BalanceDiamond conflict={report.conflict} />
      </section>

      <section className="dims-panel">
        <div className="section-kicker">Измерения</div>
        <h2 className="section-title">Сравнение обобщённых индексов</h2>
        <div className="dims-grid">
          <DimCompare
            title="Нормы · a / r / k"
            hint="Своё поведение, ожидания к другим, идеалы."
            items={norms}
          />
          <DimCompare
            title="Отношения · e / w / i"
            hint="К себе, к другим, как идеал."
            items={relations}
          />
        </div>
      </section>

      <AnalysisPanel report={report} />
      <ResearchPanel report={report} />
      <FocusScales report={report} />
      <Recommendations report={report} />
      <ScaleAtlas report={report} />

      <p className="visual-footnote">
        3–5 — слабо; 6–9 — баланс; 10–12 — выражено. Полюса — не «плохо/хорошо». Не диагноз.
      </p>
    </div>
  )
}
