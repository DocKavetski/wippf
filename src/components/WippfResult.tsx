import { useState, type ReactNode } from 'react'
import type { WippfAgg, WippfReport, WippfScaleScore } from '../lib/wippf'
import { BalanceDiamond } from './BalanceDiamond'
import { buildPriorities, resourceScales } from '../lib/wippfPriority'

const GROUP_ORDER: WippfScaleScore['group'][] = ['secondary', 'primary', 'conflict', 'model']
const GROUP_SHORT: Record<WippfScaleScore['group'], string> = {
  secondary: 'Нормы',
  primary: 'Первичные',
  conflict: 'Конфликт',
  model: 'Модель',
}

const KIND_LABEL: Record<string, string> = {
  high: 'выражено',
  low: 'слабо',
  skew: 'перекос',
  conflict: 'конфликт',
  research: 'эмпирика',
}

function CompactDims({ title, items }: { title: string; items: WippfAgg[] }) {
  const maxSpread = Math.max(...items.map((x) => x.max - x.min))
  return (
    <div className="compact-dims">
      <div className="compact-dims-title">{title}</div>
      {items.map((a) => {
        const pct = ((a.value - a.min) / (a.max - a.min)) * 100
        return (
          <div key={a.id} className="cd-row">
            <span className="cd-id">{a.id.toUpperCase()}</span>
            <div className="cd-track">
              <i style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} />
            </div>
            <span className="cd-val">{a.value}</span>
          </div>
        )
      })}
      <p className="cd-hint">
        {items.map((x) => x.id).join('/')} · размах {maxSpread ? `${items[0].min}–${items[0].max}` : ''}
      </p>
    </div>
  )
}

function Heatmap({ report }: { report: WippfReport }) {
  return (
    <div className="heatmap">
      {GROUP_ORDER.map((g) => {
        const list = report.scales.filter((s) => s.group === g)
        return (
          <div key={g} className="heatmap-group">
            <div className="heatmap-group-label">{GROUP_SHORT[g]}</div>
            <div className="heatmap-cells">
              {list.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`heat-cell level-${s.level}`}
                  title={`${s.name}: ${s.score}/12 (${s.flag})\n${s.interpretation}`}
                >
                  <span className="heat-code">{s.code}</span>
                  <span className="heat-score">{s.score}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
      <div className="heatmap-legend">
        <span>
          <i className="lg low" /> слабо 3–5
        </span>
        <span>
          <i className="lg mid" /> баланс 6–9
        </span>
        <span>
          <i className="lg high" /> выражено 10–12
        </span>
      </div>
    </div>
  )
}

function PriorityStrip({ report }: { report: WippfReport }) {
  const priorities = buildPriorities(report)
  const resources = resourceScales(report)
  return (
    <section className="priority-strip">
      <div className="priority-main">
        <p className="priority-kicker">Сначала сюда</p>
        <ol className="priority-list">
          {priorities.map((p) => (
            <li key={p.id} className={`priority-item kind-${p.kind}`}>
              <span className="priority-rank">{p.rank}</span>
              <div className="priority-body">
                <div className="priority-top">
                  <strong>{p.title}</strong>
                  <span className="priority-tag">{KIND_LABEL[p.kind]}</span>
                  {p.scoreLabel ? <span className="priority-score">{p.scoreLabel}</span> : null}
                </div>
                <p>{p.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <aside className="priority-side">
        <p className="priority-kicker resource">Опоры</p>
        {resources.length ? (
          <ul className="resource-mini">
            {resources.map((s) => (
              <li key={s.id}>
                <span>{s.code}</span>
                <strong>{s.name}</strong>
                <em>{s.score}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="resource-empty">Мало шкал в зоне 7–9 — опоры ищите в умеренных и в балансе.</p>
        )}
      </aside>
    </section>
  )
}

function DetailsBlock({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details
      className="details-block"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>
        <span>{title}</span>
        <span className="details-chevron">{open ? '−' : '+'}</span>
      </summary>
      <div className="details-body">{children}</div>
    </details>
  )
}

type Props = {
  report: WippfReport
  onCopy: () => void
  copied: boolean
}

export function WippfResult({ report, onCopy, copied }: Props) {
  const norms = report.agg.filter((x) => ['a', 'r', 'k'].includes(x.id))
  const relations = report.agg.filter((x) => ['e', 'w', 'i'].includes(x.id))
  const conflictTop = [...report.conflict].sort((a, b) => b.score - a.score)[0]
  const [atlasOpen, setAtlasOpen] = useState<string | null>(null)

  return (
    <div className="result-area visual-result">
      <div className="result-topbar no-print">
        <div className="result-topbar-meta">
          <strong>{report.verdict}</strong>
          <span>
            крайних {report.extremes.length} · ↑{report.high.length} ↓{report.low.length}
            {conflictTop ? ` · конфликт ${conflictTop.code} ${conflictTop.score}` : ''}
          </span>
        </div>
        <div className="result-toolbar">
          <button type="button" className="btn" onClick={onCopy}>
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button type="button" className="btn ghost" onClick={() => window.print()}>
            Печать
          </button>
        </div>
      </div>

      <PriorityStrip report={report} />

      <section className="scan-row">
        <div className="scan-block">
          <h2 className="scan-title">Профиль целиком</h2>
          <p className="scan-hint">Цвет = полюс. Наведите на ячейку — название и смысл.</p>
          <Heatmap report={report} />
        </div>
        <div className="scan-block scan-balance">
          <h2 className="scan-title">Модель баланса</h2>
          <p className="scan-hint">Ромб: тело ↑ · деятельность → · контакты ↓ · смыслы ←</p>
          <BalanceDiamond conflict={report.conflict} />
        </div>
      </section>

      <section className="dims-row">
        <CompactDims title="Нормы a / r / k" items={norms} />
        <CompactDims title="Отношения e / w / i" items={relations} />
      </section>

      <DetailsBlock title={`Рекомендации (${report.recommendations.length})`} defaultOpen>
        <ol className="plain-list">
          {report.recommendations.slice(0, 8).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      </DetailsBlock>

      <DetailsBlock title="Разбор по блокам">
        <div className="plain-stack">
          {report.analysis.map((b) => (
            <article key={b.id} className="plain-card">
              <h3>{b.title}</h3>
              <p className="muted">{b.lead}</p>
              <p>{b.body}</p>
            </article>
          ))}
        </div>
      </DetailsBlock>

      <DetailsBlock title={`Исследования (${report.research.length})`}>
        <div className="plain-stack">
          {report.research.map((r) => (
            <article key={r.id} className={`plain-card research-${r.salience}`}>
              <h3>{r.topic}</h3>
              <p className="muted">{r.cite}</p>
              <p>{r.finding}</p>
              <p>
                <strong>Для разбора.</strong> {r.implication}
              </p>
            </article>
          ))}
        </div>
      </DetailsBlock>

      <DetailsBlock title="Все шкалы — описания">
        {GROUP_ORDER.map((g) => {
          const list = report.scales.filter((s) => s.group === g)
          return (
            <div key={g} className="atlas-mini">
              <h3>{GROUP_SHORT[g]}</h3>
              {list.map((s) => {
                const open = atlasOpen === s.id
                return (
                  <div key={s.id} className={`atlas-row level-${s.level}${open ? ' open' : ''}`}>
                    <button type="button" onClick={() => setAtlasOpen(open ? null : s.id)}>
                      <span className="atlas-code">{s.code}</span>
                      <span className="atlas-name">{s.name}</span>
                      <span className="atlas-score">
                        {s.score} · {s.flag}
                      </span>
                    </button>
                    {open ? (
                      <div className="atlas-more">
                        <p className="muted">{s.meaning}</p>
                        <p>{s.interpretation}</p>
                        <p>
                          <strong>Рек.</strong> {s.recommendation}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )
        })}
      </DetailsBlock>

      <p className="visual-footnote">
        3–5 слабо · 6–9 баланс · 10–12 выражено. Полюса — не «плохо/хорошо». Не диагноз.
      </p>
    </div>
  )
}
