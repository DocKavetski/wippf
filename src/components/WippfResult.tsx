import { useState } from 'react'
import type { WippfAgg, WippfReport, WippfScaleScore } from '../lib/wippf'

const GROUP_META: Record<
  WippfScaleScore['group'],
  { title: string; desc: string }
> = {
  secondary: {
    title: 'Вторичные способности (нормы)',
    desc: 'Социальные «правила игры»: порядок, вежливость, усердие, справедливость. Каждая шкала складывается из a (своё поведение), r (ожидания к другим), k (идеалы).',
  },
  primary: {
    title: 'Первичные способности (эмоции / отношения)',
    desc: 'Эмоциональный фундамент: терпение, время, доверие, любовь, смысл. Измерения e (к себе), w (к другим), i (как идеал).',
  },
  conflict: {
    title: 'Реакции на конфликт',
    desc: 'Модель баланса: куда уходит энергия при напряжении — тело, деятельность, контакты или фантазия/смысл.',
  },
  model: {
    title: 'Модель отношений',
    desc: 'Усвоенные образы значимых фигур и семейного фона: Я–мать, Я–отец, другие воспитатели, союз родителей, отношение к миру и ценностям.',
  },
}

type BarItem = {
  label: string
  value: string
  hint?: string
  level?: string
  ratio: number
}

function ScaleBar({ item }: { item: BarItem }) {
  const pct = Math.max(0, Math.min(100, Math.round(item.ratio * 100)))
  return (
    <div className={`visual-scale visual-scale-bar level-${item.level || 'none'}`}>
      <span className="visual-scale-code">{item.label}</span>
      <span className="visual-scale-mean">{item.value}</span>
      {item.hint ? <span className="visual-scale-flag">{item.hint}</span> : null}
      <div className="visual-scale-track" aria-hidden>
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
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
  const max = Math.max(...items.map((x) => x.max))
  return (
    <div className="dim-block">
      <div className="dim-block-head">
        <h3>{title}</h3>
        <p>{hint}</p>
      </div>
      <div className="dim-bars">
        {items.map((a) => {
          const pct = Math.round(((a.value - a.min) / (a.max - a.min)) * 100)
          return (
            <div key={a.id} className="dim-row">
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
      <p className="dim-scale-note">Шкала сравнения: {items[0]?.min}–{max}</p>
    </div>
  )
}

function AnalysisPanel({ report }: { report: WippfReport }) {
  return (
    <section className="analysis-panel">
      <div className="section-kicker">Клинический разбор</div>
      <h2 className="section-title">Анализ профиля</h2>
      <p className="section-lede">
        Целостное чтение WIPPF: нормы, отношения, конфликтные сферы и модель значимых фигур — не список
        цифр, а картина для беседы.
      </p>
      <div className="analysis-grid">
        {report.analysis.map((block, idx) => (
          <article key={block.id} className="analysis-card" style={{ animationDelay: `${idx * 40}ms` }}>
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
      <p className="section-lede">
        Для каждой шкалы: что измеряет, как читается текущий полюс и мягкая рекомендация к разбору.
      </p>
      <div className="wippf-interp-list">
        {list.map((s) => (
          <article key={s.id} className={`wippf-interp-card level-${s.level}`}>
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
      <p className="section-lede">
        Нажмите шкалу, чтобы раскрыть смысл, полюса и интерпретацию текущего балла.
      </p>
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
                          <p className="atlas-dims">
                            Пункты (a/r/k или e/w/i): {s.dims.join(' · ')}
                          </p>
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

  const metrics = [
    {
      name: 'Крайние',
      value: String(report.extremes.length),
      hint: `↑${report.high.length} / ↓${report.low.length} из 29`,
      level: report.extremes.length >= 8 ? 'high' : report.extremes.length <= 2 ? 'low' : 'moderate',
    },
    {
      name: 'Конфликт',
      value: conflictTop ? `${conflictTop.code} ${conflictTop.score}` : '—',
      hint: conflictTop ? conflictTop.name : undefined,
      level: conflictTop?.level,
    },
    {
      name: 'a / r / k',
      value: norms.map((x) => x.value).join('/'),
      hint: 'нормы: поведение / ожидания / идеалы',
    },
    {
      name: 'e / w / i',
      value: relations.map((x) => x.value).join('/'),
      hint: 'отношения: к себе / к другим / идеал',
    },
  ]

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
      </div>

      <div
        className="visual-indices"
        style={{ gridTemplateColumns: `repeat(${Math.min(4, metrics.length)}, minmax(0, 1fr))` }}
      >
        {metrics.map((m) => (
          <div key={`${m.name}-${m.value}`} className={`visual-index${m.level ? ` level-${m.level}` : ''}`}>
            <span className="visual-index-name">{m.name}</span>
            <span className="visual-index-value">{m.value}</span>
            {m.hint ? <span className="visual-index-hint">{m.hint}</span> : null}
          </div>
        ))}
      </div>

      <section className="dims-panel">
        <div className="section-kicker">Измерения</div>
        <h2 className="section-title">Сравнение обобщённых индексов</h2>
        <div className="dims-grid">
          <DimCompare
            title="Нормы · a / r / k"
            hint="Как человек сам соблюдает правила, чего ждёт от других и каковы его идеалы."
            items={norms}
          />
          <DimCompare
            title="Отношения · e / w / i"
            hint="Насколько первичные способности направлены к себе, к другим и удерживаются как идеал."
            items={relations}
          />
        </div>
      </section>

      <section className="conflict-viz">
        <div className="section-kicker">Модель баланса</div>
        <h2 className="section-title">Четыре сферы конфликта</h2>
        <p className="section-lede">
          Высокий балл — склонность «убегать» в эту сферу; низкий — избегать её или уходить в
          противоположный полюс.
        </p>
        <div className="visual-scale-grid wippf-scale-grid conflict-grid">
          {report.conflict.map((s) => (
            <ScaleBar
              key={s.id}
              item={{
                label: s.code,
                value: `${s.score}/12`,
                hint: `${s.flag} · ${s.name}`,
                level: s.level,
                ratio: (s.score - 3) / 9,
              }}
            />
          ))}
        </div>
      </section>

      <AnalysisPanel report={report} />
      <FocusScales report={report} />
      <Recommendations report={report} />
      <ScaleAtlas report={report} />

      <p className="visual-footnote">
        3–5 — слабо; 6–9 — баланс; 10–12 — выражено. Низкий/высокий балл — полюса, не «плохо/хорошо». Не
        заменяет клинический разбор и не является диагнозом.
      </p>
    </div>
  )
}
