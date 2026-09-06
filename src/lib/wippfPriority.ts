import type { WippfAgg, WippfReport, WippfScaleScore } from '../lib/wippf'

export type PriorityItem = {
  id: string
  rank: number
  title: string
  detail: string
  kind: 'high' | 'low' | 'skew' | 'conflict' | 'research'
  scoreLabel?: string
}

function skewOf(agg: WippfAgg[], threshold: number): { text: string; top: WippfAgg; bot: WippfAgg } | null {
  if (agg.length < 2) return null
  const sorted = [...agg].sort((a, b) => b.value - a.value)
  const top = sorted[0]
  const bot = sorted[sorted.length - 1]
  if (top.value - bot.value < threshold) return null
  return {
    top,
    bot,
    text: `${top.id.toUpperCase()} ${top.value} ≫ ${bot.id.toUpperCase()} ${bot.value}`,
  }
}

/** Ранжированный список: куда смотреть первым */
export function buildPriorities(report: WippfReport): PriorityItem[] {
  const items: Omit<PriorityItem, 'rank'>[] = []
  const norms = report.agg.filter((x) => ['a', 'r', 'k'].includes(x.id))
  const relations = report.agg.filter((x) => ['e', 'w', 'i'].includes(x.id))
  const conflictTop = [...report.conflict].sort((a, b) => b.score - a.score)[0]

  const extremes = [...report.extremes].sort((a, b) => {
    const da = Math.max(a.score - 9, 5 - a.score)
    const db = Math.max(b.score - 9, 5 - b.score)
    return db - da
  })

  for (const s of extremes.slice(0, 4)) {
    items.push({
      id: `ex-${s.id}`,
      title: s.name,
      detail: s.interpretation,
      kind: s.level === 'high' ? 'high' : 'low',
      scoreLabel: `${s.score}/12 · ${s.flag}`,
    })
  }

  if (conflictTop && (conflictTop.level === 'high' || conflictTop.level === 'low')) {
    const already = items.some((i) => i.id === `ex-${conflictTop.id}`)
    if (!already) {
      items.unshift({
        id: `cf-${conflictTop.id}`,
        title: `Конфликт → ${conflictTop.name}`,
        detail: conflictTop.interpretation,
        kind: 'conflict',
        scoreLabel: `${conflictTop.score}/12`,
      })
    } else {
      // bump conflict extreme to front conceptually by tagging
      const idx = items.findIndex((i) => i.id === `ex-${conflictTop.id}`)
      if (idx > 0) {
        const [row] = items.splice(idx, 1)
        items.unshift({ ...row, kind: 'conflict', title: `Конфликт → ${conflictTop.name}` })
      }
    }
  }

  const skN = skewOf(norms, 6)
  if (skN) {
    items.push({
      id: 'skew-ark',
      title: `Перекос норм ${skN.text}`,
      detail: `${skN.top.name} заметно выше, чем ${skN.bot.name}.`,
      kind: 'skew',
    })
  }
  const skE = skewOf(relations, 5)
  if (skE) {
    items.push({
      id: 'skew-ewi',
      title: `Перекос отношений ${skE.text}`,
      detail: `${skE.top.name} заметно выше, чем ${skE.bot.name}.`,
      kind: 'skew',
    })
  }

  const researchHit = report.research.find((r) => r.salience === 'high' && r.id !== 'caveat')
  if (researchHit && items.length < 6) {
    items.push({
      id: `rs-${researchHit.id}`,
      title: researchHit.topic,
      detail: researchHit.implication,
      kind: 'research',
    })
  }

  if (!items.length) {
    items.push({
      id: 'balanced',
      title: 'Профиль без ярких крайностей',
      detail: 'Смотрите нюансы модели баланса и сравнение a/r/k · e/w/i.',
      kind: 'skew',
    })
  }

  return items.slice(0, 6).map((item, i) => ({ ...item, rank: i + 1 }))
}

export function resourceScales(report: WippfReport): WippfScaleScore[] {
  return report.scales
    .filter((s) => s.level === 'moderate' && s.score >= 7 && s.score <= 9)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
