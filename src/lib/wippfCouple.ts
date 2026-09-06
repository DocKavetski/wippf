import type { WippfReport, WippfScaleScore } from './wippf'
import { buildPriorities } from './wippfPriority'

/**
 * Парный разбор WIPPF по практике PPT / Remmers / Peseschkian:
 * 1) индивидуальные полюса каждого;
 * 2) столкновение актуальных способностей (вторичные/первичные);
 * 3) ключевой конфликт вежливость ↔ честность;
 * 4) ожидания (r) одного vs поведение (a) другого по нормам;
 * 5) разные/общие реакции модели баланса;
 * 6) модельные измерения (особенно «Ты» — союз родителей);
 * 7) общие ресурсы.
 *
 * Ориентир различий на шкале: Remmers — заметно уже ±2 балла; здесь для пары
 * «разрыв» ≥3, «противоположные полюса» = high vs low.
 */

export type CoupleClash = {
  id: string
  scaleName: string
  scoreA: number
  scoreB: number
  kind: 'opposite' | 'gap' | 'conflict' | 'norms' | 'key' | 'model' | 'primary'
  text: string
}

export type CoupleCompare = {
  partnerA: { label: string; problems: string[]; resources: string[]; verdict: string }
  partnerB: { label: string; problems: string[]; resources: string[]; verdict: string }
  pair: {
    clashes: CoupleClash[]
    sharedResources: string[]
    summary: string
    /** Короткий итог тремя абзацами */
    brief: { a: string; b: string; pair: string }
    bullets: string[]
  }
}

function topProblems(report: WippfReport, limit = 4): string[] {
  return buildPriorities(report)
    .filter((p) => p.kind !== 'research')
    .slice(0, limit)
    .map((p) => (p.scoreLabel ? `${p.title} (${p.scoreLabel})` : p.title))
}

function topResources(report: WippfReport, limit = 3): string[] {
  return report.scales
    .filter((s) => s.level === 'moderate' && s.score >= 7 && s.score <= 9)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => `${s.name} (${s.score}/12)`)
}

function conflictLabel(s: WippfScaleScore): string {
  if (s.id === 'body') return 'тело'
  if (s.id === 'work') return 'деятельность'
  if (s.id === 'contactRx') return 'контакты'
  if (s.id === 'fantasy') return 'смыслы/фантазия'
  return s.name
}

function kindRank(k: CoupleClash['kind']): number {
  switch (k) {
    case 'key':
      return 0
    case 'conflict':
      return 1
    case 'opposite':
      return 2
    case 'norms':
      return 3
    case 'primary':
      return 4
    case 'model':
      return 5
    default:
      return 6
  }
}

/** Сравнение двух профилей для парной работы (WIPPF / PPT) */
export function compareCouple(
  a: WippfReport,
  b: WippfReport,
  labelA = 'Партнёр 1',
  labelB = 'Партнёр 2',
): CoupleCompare {
  const byA = Object.fromEntries(a.scales.map((s) => [s.id, s]))
  const byB = Object.fromEntries(b.scales.map((s) => [s.id, s]))
  const clashes: CoupleClash[] = []

  // —— 1. Полюса и разрывы по шкалам (актуальные способности) ——
  for (const id of Object.keys(byA)) {
    const sa = byA[id]
    const sb = byB[id]
    if (!sa || !sb) continue
    const gap = Math.abs(sa.score - sb.score)
    const isPrimary = sa.group === 'primary'
    const isSecondary = sa.group === 'secondary'

    if (
      (sa.level === 'high' && sb.level === 'low') ||
      (sa.level === 'low' && sb.level === 'high')
    ) {
      clashes.push({
        id: `opp-${id}`,
        scaleName: sa.name,
        scoreA: sa.score,
        scoreB: sb.score,
        kind: isPrimary ? 'primary' : 'opposite',
        text: isPrimary
          ? `Первичные способности: противоположные полюса по «${sa.name}» (${labelA} ${sa.score}/12 «${sa.flag}», ${labelB} ${sb.score}/12 «${sb.flag}»). В PPT именно первичные (доверие, любовь, терпение…) часто задают тон близости — расхождение здесь бьёт по чувству «нас слышат / нас любят».`
          : `Столкновение норм/ценностей по «${sa.name}»: ${labelA} — ${sa.score}/12 (${sa.flag}), ${labelB} — ${sb.score}/12 (${sb.flag}). В позитивной психотерапии конфликт пары часто есть конфликт актуальных способностей: разные «правила игры» в одном доме.`,
      })
    } else if (gap >= 3 && (isSecondary || isPrimary || sa.group === 'conflict')) {
      clashes.push({
        id: `gap-${id}`,
        scaleName: sa.name,
        scoreA: sa.score,
        scoreB: sb.score,
        kind: isPrimary ? 'primary' : 'gap',
        text: `Заметный разрыв (≥3) по «${sa.name}»: ${sa.score} vs ${sb.score}. По Remmers уже ±2 на шкале WIPPF информативно; такие расхождения обычно всплывают в бытовых претензиях, если о ценности не договариваться явно.`,
      })
    }
  }

  // —— 2. Ключевой конфликт PPT: вежливость ↔ честность ——
  const politeA = byA.polite
  const politeB = byB.polite
  const honestA = byA.honest
  const honestB = byB.honest
  if (politeA && politeB && honestA && honestB) {
    const aKey =
      (politeA.level === 'high' && honestA.level === 'low') ||
      (politeA.level === 'low' && honestA.level === 'high')
    const bKey =
      (politeB.level === 'high' && honestB.level === 'low') ||
      (politeB.level === 'low' && honestB.level === 'high')
    const cross =
      (politeA.level === 'high' && honestB.level === 'high' && Math.abs(politeA.score - honestB.score) >= 3) ||
      (honestA.level === 'high' && politeB.level === 'high' && Math.abs(honestA.score - politeB.score) >= 3) ||
      (politeA.score - honestA.score >= 4 && honestB.score - politeB.score >= 4) ||
      (honestA.score - politeA.score >= 4 && politeB.score - honestB.score >= 4)

    if (aKey || bKey || cross) {
      clashes.push({
        id: 'key-polite-honest',
        scaleName: 'Ключевой конфликт: вежливость ↔ честность',
        scoreA: politeA.score,
        scoreB: honestB.score,
        kind: 'key',
        text: `Классика Пезешкиана — ключевой конфликт «вежливость / сверхдружелюбие» vs «честность / прямота». Сейчас: ${labelA} вежливость ${politeA.score}, честность ${honestA.score}; ${labelB} вежливость ${politeB.score}, честность ${honestB.score}. В паре это часто звучит как «не могу отказать / сглаживаю» против «скажу как есть / режет». Имеет смысл отдельно проговорить правила ссоры и отказa.`,
      })
    }
  }

  // —— 3. Модель баланса ——
  const topA = [...a.conflict].sort((x, y) => y.score - x.score)[0]
  const topB = [...b.conflict].sort((x, y) => y.score - x.score)[0]
  if (topA && topB && topA.id !== topB.id) {
    clashes.push({
      id: 'conflict-diff',
      scaleName: 'Модель баланса',
      scoreA: topA.score,
      scoreB: topB.score,
      kind: 'conflict',
      text: `Разные способы переработки конфликта (модель баланса): ${labelA} уходит в «${conflictLabel(topA)}» (${topA.score}/12), ${labelB} — в «${conflictLabel(topB)}» (${topB.score}/12). Пока один «лечит» ситуацию своим каналом, второй может ощущать игнор. В парной PPT оба профиля баланса кладут рядом и ищут недостающие сферы.`,
    })
  } else if (topA && topB && topA.id === topB.id && (topA.level === 'high' || topB.level === 'high')) {
    clashes.push({
      id: 'conflict-same',
      scaleName: 'Модель баланса',
      scoreA: topA.score,
      scoreB: topB.score,
      kind: 'conflict',
      text: `Оба в конфликте усиливают одну сферу — «${conflictLabel(topA)}» (${topA.score} и ${topB.score}). Риск двойной перегрузки этой области и запустения остальных (тело / деятельность / контакты / смысл).`,
    })
  }

  // —— 4. Ожидания (r) одного vs поведение (a) другого ——
  const aR = a.agg.find((x) => x.id === 'r')?.value ?? 0
  const bA = b.agg.find((x) => x.id === 'a')?.value ?? 0
  const bR = b.agg.find((x) => x.id === 'r')?.value ?? 0
  const aA = a.agg.find((x) => x.id === 'a')?.value ?? 0
  const aK = a.agg.find((x) => x.id === 'k')?.value ?? 0
  const bK = b.agg.find((x) => x.id === 'k')?.value ?? 0

  if (aR - bA >= 5) {
    clashes.push({
      id: 'norms-ar',
      scaleName: 'Ожидания ↔ поведение (a/r)',
      scoreA: aR,
      scoreB: bA,
      kind: 'norms',
      text: `${labelA}: сумма ожиданий к другим r=${aR}, у ${labelB} своё поведение по нормам a=${bA}. Типичный микротравматический сценарий PPT: «ты должен…» vs «я и так…». Сверяйте конкретные нормы (порядок, время, обещания), а не общий тон.`,
    })
  }
  if (bR - aA >= 5) {
    clashes.push({
      id: 'norms-ra',
      scaleName: 'Ожидания ↔ поведение (a/r)',
      scoreA: aA,
      scoreB: bR,
      kind: 'norms',
      text: `${labelB}: ожидания r=${bR}, у ${labelA} поведение a=${aA}. Зеркальный сценарий разочарований. На бланке Remmers партнёров отмечают рядом (O / X) как раз чтобы увидеть такие перекосы.`,
    })
  }
  if (Math.abs(aK - bK) >= 6) {
    clashes.push({
      id: 'norms-kk',
      scaleName: 'Идеалы (k)',
      scoreA: aK,
      scoreB: bK,
      kind: 'norms',
      text: `Разные «идеалы норм» (k): ${labelA} ${aK}, ${labelB} ${bK}. Партнёры могут спорить не о фактах, а о том, «как правильно жить» — полезно назвать 2–3 идеала вслух и договориться о «достаточно хорошем» стандарте.`,
    })
  }

  // —— 5. Модельные измерения ——
  const youA = byA.you
  const youB = byB.you
  if (youA && youB && (youA.level !== 'moderate' || youB.level !== 'moderate')) {
    if (youA.level === 'high' || youB.level === 'high') {
      clashes.push({
        id: 'model-you',
        scaleName: 'Модель «Ты» (союз родителей)',
        scoreA: youA.score,
        scoreB: youB.score,
        kind: 'model',
        text: `Образ союза родителей («Ты»): ${labelA} ${youA.score}/12, ${labelB} ${youB.score}/12. В исследованиях WIPPF сильная ориентация на родительскую модель иногда связана со снижением удовлетворённости браком — идеал родителей мешает принимать «несовершенного» партнёра.`,
      })
    }
    if (
      (youA.level === 'low' && youB.level === 'high') ||
      (youA.level === 'high' && youB.level === 'low')
    ) {
      clashes.push({
        id: 'model-you-opp',
        scaleName: 'Модель «Ты»',
        scoreA: youA.score,
        scoreB: youB.score,
        kind: 'model',
        text: `Разные образы родительской пары: один видел более конфликтный/холодный союз, другой — более близкий. Это разные «чертежи» того, как «должна» выглядеть пара.`,
      })
    }
  }

  const parentModel = [
    { id: 'iMother', name: 'Я–мать' },
    { id: 'iFather', name: 'Я–отец' },
  ]
  for (const pm of parentModel) {
    const sa = byA[pm.id]
    const sb = byB[pm.id]
    if (!sa || !sb) continue
    if (
      (sa.level === 'high' && sb.level === 'low') ||
      (sa.level === 'low' && sb.level === 'high')
    ) {
      clashes.push({
        id: `model-${pm.id}`,
        scaleName: pm.name,
        scoreA: sa.score,
        scoreB: sb.score,
        kind: 'model',
        text: `Разные образы ${pm.name}: ${sa.score} vs ${sb.score}. Ожидания к партнёру часто проецируются с материнской/отцовской фигуры — стоит спросить: «Кого вы во мне ищете?»`,
      })
    }
  }

  // —— 6. Общие ресурсы ——
  const sharedResources = a.scales
    .filter((sa) => {
      const sb = byB[sa.id]
      return (
        sb &&
        sa.level === 'moderate' &&
        sb.level === 'moderate' &&
        sa.score >= 7 &&
        sb.score >= 7 &&
        Math.abs(sa.score - sb.score) <= 2
      )
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 5)
    .map((s) => `${s.name} (~${s.score}/${byB[s.id].score})`)

  clashes.sort((x, y) => {
    const dr = kindRank(x.kind) - kindRank(y.kind)
    if (dr !== 0) return dr
    return Math.abs(y.scoreA - y.scoreB) - Math.abs(x.scoreA - x.scoreB)
  })

  const topClashes = clashes.slice(0, 10)
  const problemsA = topProblems(a)
  const problemsB = topProblems(b)

  const briefA = `${labelA}: ${problemsA.length ? problemsA.slice(0, 3).join('; ') : 'ярких крайностей мало'}.`
  const briefB = `${labelB}: ${problemsB.length ? problemsB.slice(0, 3).join('; ') : 'ярких крайностей мало'}.`

  let briefPair: string
  if (!topClashes.length) {
    briefPair =
      'Итог для пары: резких столкновений полюсов мало. Опирайтесь на общие умеренные шкалы и уточняйте быт через модель баланса.'
  } else {
    const themes = [
      ...new Set(
        topClashes.slice(0, 4).map((c) => {
          if (c.kind === 'key') return 'вежливость↔честность'
          if (c.kind === 'conflict') return 'разный уход в конфликте'
          if (c.kind === 'norms') return 'ожидания vs поведение'
          if (c.kind === 'model') return 'родительские модели'
          if (c.kind === 'primary') return 'близость/первичные'
          return c.scaleName
        }),
      ),
    ]
    briefPair = `Итог для пары: зоны напряжения — ${themes.join(', ')}. Это гипотезы для беседы (не вердикт о «совместимости»).`
  }

  let summary: string
  if (!topClashes.length) {
    summary =
      'По критериям PPT/WIPPF ярких столкновений ценностей и реакций мало. Имеет смысл опираться на общие ресурсы и проверять нюансы в живом диалоге.'
  } else if (topClashes.some((c) => c.kind === 'key' || c.kind === 'opposite' || c.kind === 'conflict')) {
    summary = `Найдены типичные для PPT зоны парного напряжения (${topClashes.length}): ключевой конфликт и/или противоположные способности и/или разный баланс. Ниже — приоритет для совместного разбора.`
  } else {
    summary = `Есть расхождения профилей (${topClashes.length} зон). Они становятся содержанием ссор, если ценности и ожидания не проговорены.`
  }

  if (sharedResources.length) {
    summary += ` Общие опоры: ${sharedResources.slice(0, 3).join(', ')}.`
  }

  return {
    partnerA: {
      label: labelA,
      problems: problemsA,
      resources: topResources(a),
      verdict: a.verdict,
    },
    partnerB: {
      label: labelB,
      problems: problemsB,
      resources: topResources(b),
      verdict: b.verdict,
    },
    pair: {
      clashes: topClashes,
      sharedResources,
      summary,
      brief: { a: briefA, b: briefB, pair: briefPair },
      bullets: topClashes.map((c) => c.text),
    },
  }
}
