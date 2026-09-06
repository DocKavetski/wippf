import type { WippfAgg, WippfReport, WippfScaleScore } from '../lib/wippf'

export type PriorityItem = {
  id: string
  rank: number
  title: string
  detail: string
  kind: 'high' | 'low' | 'skew' | 'conflict' | 'research'
  scoreLabel?: string
}

function plainSkew(
  items: WippfAgg[],
  threshold: number,
  family: 'norms' | 'relations',
): { title: string; detail: string } | null {
  if (items.length < 2) return null
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const top = sorted[0]
  const bot = sorted[sorted.length - 1]
  if (top.value - bot.value < threshold) return null

  if (family === 'norms') {
    const map: Record<string, string> = {
      a: 'как вы сами соблюдаете правила',
      r: 'чего вы ждёте от других',
      k: 'ваши идеалы и принципы',
    }
    return {
      title: `Нормы: сильнее «${top.name}», слабее «${bot.name}»`,
      detail: `Перекос: ${map[top.id] ?? top.name} (${top.value}) заметно выше, чем ${map[bot.id] ?? bot.name} (${bot.value}). Это частый источник внутреннего напряжения или претензий.`,
    }
  }

  const map: Record<string, string> = {
    e: 'отношение к себе',
    w: 'отношение к другим',
    i: 'идеал отношений',
  }
  return {
    title: `Отношения: сильнее «${top.name}», слабее «${bot.name}»`,
    detail: `Перекос: ${map[top.id] ?? top.name} (${top.value}) выше, чем ${map[bot.id] ?? bot.name} (${bot.value}). Имеет смысл спросить, где не хватает тепла или границ.`,
  }
}

/** Ранжированный список понятным языком */
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

  if (conflictTop && (conflictTop.level === 'high' || conflictTop.level === 'low')) {
    items.push({
      id: `cf-${conflictTop.id}`,
      title: `В конфликте уходите в «${conflictTop.name}»`,
      detail: conflictTop.interpretation,
      kind: 'conflict',
      scoreLabel: `${conflictTop.score} из 12`,
    })
  }

  for (const s of extremes.slice(0, 4)) {
    if (items.some((i) => i.id === `cf-${s.id}` || i.id === `ex-${s.id}`)) continue
    items.push({
      id: `ex-${s.id}`,
      title: s.level === 'high' ? `Сильно выражено: ${s.name}` : `Слабо выражено: ${s.name}`,
      detail: `${s.meaning} Сейчас: ${s.interpretation}`,
      kind: s.level === 'high' ? 'high' : 'low',
      scoreLabel: `${s.score} из 12`,
    })
  }

  const skN = plainSkew(norms, 6, 'norms')
  if (skN) {
    items.push({ id: 'skew-ark', title: skN.title, detail: skN.detail, kind: 'skew' })
  }
  const skE = plainSkew(relations, 5, 'relations')
  if (skE) {
    items.push({ id: 'skew-ewi', title: skE.title, detail: skE.detail, kind: 'skew' })
  }

  const researchHit = report.research.find((r) => r.salience === 'high' && r.id !== 'caveat')
  if (researchHit && items.length < 5) {
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
      title: 'Профиль относительно ровный',
      detail: 'Ярких крайностей мало. Смотрите модель баланса и шкалы ниже — там всё равно есть нюансы для беседы.',
      kind: 'skew',
    })
  }

  return items.slice(0, 5).map((item, i) => ({ ...item, rank: i + 1 }))
}

export function resourceScales(report: WippfReport): WippfScaleScore[] {
  return report.scales
    .filter((s) => s.level === 'moderate' && s.score >= 7 && s.score <= 9)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
