import type { WippfReport, WippfScaleScore } from '../lib/wippf'

const GROUP_LABEL: Record<WippfScaleScore['group'], string> = {
  secondary: 'Вторичные способности (нормы)',
  primary: 'Первичные способности (эмоции / отношения)',
  conflict: 'Реакции на конфликт',
  model: 'Модель отношений',
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

function WippfInterpCards({ report }: { report: WippfReport }) {
  const focus = report.extremes.length
    ? report.extremes
    : report.scales.filter((s) => s.group === 'conflict')
  const list = focus.slice(0, 8)
  if (!list.length) return null
  return (
    <div className="wippf-interp">
      <div className="visual-scales-label">
        {report.extremes.length ? 'Интерпретация крайних шкал' : 'Интерпретация конфликтных реакций'}
      </div>
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
            <p className="wippf-interp-meaning">{s.meaning}</p>
            <p className="wippf-interp-text">{s.interpretation}</p>
            <p className="wippf-interp-rec">
              <span>Рекомендация.</span> {s.recommendation}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

function WippfRecommendations({ report }: { report: WippfReport }) {
  if (!report.recommendations.length) return null
  return (
    <div className="wippf-recs">
      <div className="visual-scales-label">Рекомендации по профилю</div>
      <ol className="wippf-recs-list">
        {report.recommendations.map((r, idx) => (
          <li key={idx}>{r}</li>
        ))}
      </ol>
    </div>
  )
}

function WippfGroups({ report }: { report: WippfReport }) {
  const groups: WippfScaleScore['group'][] = ['secondary', 'primary', 'conflict', 'model']
  return (
    <div className="wippf-groups">
      {groups.map((g) => {
        const list = report.scales.filter((s) => s.group === g)
        return (
          <div key={g} className="wippf-group">
            <div className="visual-scales-label">{GROUP_LABEL[g]}</div>
            <div className="visual-scale-grid wippf-scale-grid">
              {list.map((s) => (
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
          </div>
        )
      })}
      <div className="wippf-group">
        <div className="visual-scales-label">Обобщённые измерения</div>
        <div className="visual-scale-grid wippf-agg-grid">
          {report.agg.map((a) => (
            <ScaleBar
              key={a.id}
              item={{
                label: a.id.toUpperCase(),
                value: `${a.value}/${a.max}`,
                hint: `${a.name} · ${a.hint}`,
                ratio: (a.value - a.min) / (a.max - a.min),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type Props = {
  report: WippfReport
  onCopy: () => void
  copied: boolean
}

export function WippfResult({ report, onCopy, copied }: Props) {
  const conflictTop = [...report.conflict].sort((a, b) => b.score - a.score)[0]
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
      value: report.agg
        .filter((x) => ['a', 'r', 'k'].includes(x.id))
        .map((x) => x.value)
        .join('/'),
      hint: 'нормы: поведение / ожидания / идеалы',
    },
    {
      name: 'e / w / i',
      value: report.agg
        .filter((x) => ['e', 'w', 'i'].includes(x.id))
        .map((x) => x.value)
        .join('/'),
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
          Печать
        </button>
      </div>

      <div className={`visual-verdict visual-verdict-${report.level}`}>
        <div className="visual-verdict-label">Вывод</div>
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

      <WippfRecommendations report={report} />
      <WippfInterpCards report={report} />
      <WippfGroups report={report} />

      <p className="visual-footnote">
        3–5 — слабо; 6–9 — баланс; 10–12 — выражено. Низкий/высокий балл — полюса, не «плохо/хорошо». Не
        заменяет клинический разбор.
      </p>
    </div>
  )
}
