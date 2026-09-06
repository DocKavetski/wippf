import type { WippfScaleScore } from '../lib/wippf'

/** Классические оси кристалла Пезешкиана */
const AXES = [
  { id: 'body', key: 'body', label: 'Тело', sub: 'ощущения', x: 0, y: -1 },
  { id: 'work', key: 'work', label: 'Деятельность', sub: 'достижения', x: 1, y: 0 },
  { id: 'contact', key: 'contactRx', label: 'Контакты', sub: 'отношения', x: 0, y: 1 },
  { id: 'fantasy', key: 'fantasy', label: 'Смыслы', sub: 'фантазия', x: -1, y: 0 },
] as const

type Props = {
  conflict: WippfScaleScore[]
}

function scoreToRadius(score: number, maxR: number): number {
  // 3 → ~18%, 7.5 → ~55%, 12 → 100%
  const t = (score - 3) / 9
  return maxR * (0.18 + t * 0.82)
}

export function BalanceDiamond({ conflict }: Props) {
  const byId = Object.fromEntries(conflict.map((s) => [s.id, s]))
  const cx = 160
  const cy = 160
  const maxR = 100
  const idealR = scoreToRadius(7.5, maxR)

  const points = AXES.map((axis) => {
    const scale = byId[axis.key]
    const score = scale?.score ?? 7.5
    const r = scoreToRadius(score, maxR)
    return {
      ...axis,
      score,
      level: scale?.level ?? 'moderate',
      flag: scale?.flag ?? 'баланс',
      name: scale?.name ?? axis.label,
      x: cx + axis.x * r,
      y: cy + axis.y * r,
      lx: cx + axis.x * (maxR + 36),
      ly: cy + axis.y * (maxR + 36),
    }
  })

  const profile = points.map((p) => `${p.x},${p.y}`).join(' ')
  const ideal = AXES.map((a) => `${cx + a.x * idealR},${cy + a.y * idealR}`).join(' ')

  const ranked = [...points].sort((a, b) => b.score - a.score)
  const top = ranked[0]
  const bot = ranked[ranked.length - 1]
  const spread = top.score - bot.score

  let insight: string
  if (spread <= 2) {
    insight = 'Ромб относительно ровный — энергия в конфликте распределена без яркой доминанты.'
  } else if (top.level === 'high') {
    insight = `Доминанта: «${top.label}» (${top.score}/12) — склонность уходить в эту сферу при напряжении.`
  } else {
    insight = `Заметнее «${top.label}» (${top.score}/12); слабее «${bot.label}» (${bot.score}/12).`
  }

  return (
    <div className="balance-diamond">
      <div className="balance-diamond-chart" aria-hidden={false}>
        <svg viewBox="0 0 320 320" role="img" aria-label="Модель баланса: ромб четырёх сфер">
          <defs>
            <linearGradient id="diamondFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* grid rings */}
          {[0.35, 0.65, 1].map((f) => (
            <polygon
              key={f}
              className="diamond-ring"
              points={AXES.map((a) => `${cx + a.x * maxR * f},${cy + a.y * maxR * f}`).join(' ')}
            />
          ))}

          {/* axes */}
          <line className="diamond-axis" x1={cx} y1={cy - maxR - 8} x2={cx} y2={cy + maxR + 8} />
          <line className="diamond-axis" x1={cx - maxR - 8} y1={cy} x2={cx + maxR + 8} y2={cy} />

          {/* ideal balance */}
          <polygon className="diamond-ideal" points={ideal} />

          {/* profile */}
          <polygon className="diamond-profile" points={profile} fill="url(#diamondFill)" />

          {/* points + labels (баллы — в карточках справа, не на ромбе) */}
          {points.map((p) => (
            <g key={p.id} className={`diamond-point level-${p.level}`}>
              <circle cx={p.x} cy={p.y} r="5.5" />
              <text
                x={p.lx}
                y={p.ly + (p.y < cy ? -2 : p.y > cy ? 12 : 4)}
                textAnchor={p.x < cx - 2 ? 'end' : p.x > cx + 2 ? 'start' : 'middle'}
                className="diamond-label"
              >
                {p.label}
              </text>
            </g>
          ))}

          <circle className="diamond-center" cx={cx} cy={cy} r="3" />
        </svg>
      </div>

      <div className="balance-diamond-meta">
        <p className="balance-diamond-insight">{insight}</p>
        <ul className="balance-diamond-legend">
          <li>
            <i className="leg-ideal" /> идеал (~баланс)
          </li>
          <li>
            <i className="leg-profile" /> ваш профиль
          </li>
          <li>
            <i className="leg-out" /> выпячивание = уход в сферу
          </li>
          <li>
            <i className="leg-in" /> сжатие = избегание сферы
          </li>
        </ul>
        <div className="balance-sphere-cards">
          {points.map((p, idx) => (
            <div
              key={p.id}
              className={`balance-sphere-card level-${p.level}`}
              style={{ animationDelay: `${120 + idx * 60}ms` }}
            >
              <span className="bsc-label">{p.label}</span>
              <strong className="bsc-score">{p.score}</strong>
              <span className="bsc-flag">{p.flag}</span>
              <span className="bsc-sub">{p.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
