import type { WippfScaleScore } from './wippf'

export interface WippfResearchInsight {
  id: string
  topic: string
  finding: string
  implication: string
  cite: string
  /** low | moderate | high — визуальный вес */
  salience: 'high' | 'moderate'
}

/**
 * Эмпирические ориентиры по WIPPF / WIPPF 2.0.
 * Источники: Serdiuk & Otenko 2021; Sinici, Sari & Maden 2014;
 * Zarek 2023; Arabadzhiev et al. 2026; Kaya Isayev 2026.
 * Это исследовательский контекст для клинициста, не нормы популяции и не диагноз.
 */
export function buildResearchInsights(
  scales: WippfScaleScore[],
  primary: WippfScaleScore[],
  secondary: WippfScaleScore[],
  _conflict: WippfScaleScore[],
  _model: WippfScaleScore[],
): WippfResearchInsight[] {
  const byId = Object.fromEntries(scales.map((s) => [s.id, s]))
  const insights: WippfResearchInsight[] = []

  const hope = byId.hope
  const polite = byId.polite
  const trust = byId.trust
  const love = byId.love
  const tenderness = byId.tenderness
  const contact = byId.contact
  const honest = byId.honest
  const contactRx = byId.contactRx
  const body = byId.body
  const work = byId.work
  const fantasy = byId.fantasy
  const iMother = byId.iMother
  const iFather = byId.iFather
  const you = byId.you
  const faithful = byId.faithful
  const obey = byId.obey

  const priLow = primary.filter((s) => s.level === 'low')
  const priMean =
    primary.reduce((s, x) => s + x.score, 0) / Math.max(1, primary.length)
  const secMean =
    secondary.reduce((s, x) => s + x.score, 0) / Math.max(1, secondary.length)

  // —— Serdiuk & Otenko 2021: well-being / hardiness / primary capacities ——
  insights.push({
    id: 'serdiuk-frame',
    topic: 'Ресурсы и благополучие',
    finding:
      'В украинской адаптации WIPPF шкалы (особенно первичные: контакты, доверие, надежда, нежность) значимо связаны с психологическим благополучием, жизнестойкостью и самодетерминацией; внутренняя согласованность шкал удовлетворительная (α≈0.73–0.86, ретест ≈0.78).',
    implication:
      'Профиль WIPPF имеет эмпирическую связь с «позитивным психическим здоровьем»: слабость первичных способностей — повод проверить ресурсную опору, а не только симптом.',
    cite: 'Serdiuk & Otenko, 2021 (The Global Psychotherapist)',
    salience: 'moderate',
  })

  const wellbeingKeys = [contact, trust, hope, tenderness, love].filter(Boolean) as WippfScaleScore[]
  const weakWellbeing = wellbeingKeys.filter((s) => s.level === 'low')
  const strongWellbeing = wellbeingKeys.filter((s) => s.level === 'high' || (s.level === 'moderate' && s.score >= 8))
  if (weakWellbeing.length) {
    insights.push({
      id: 'serdiuk-weak-primary',
      topic: 'Первичные способности и благополучие',
      finding: `В вашем профиле ослаблены: ${weakWellbeing.map((s) => `«${s.name}» (${s.score})`).join(', ')}. В исследовании Serdiuk & Otenko именно контакты, доверие, надежда и телесная близость коррелировали с благополучием и жизнестойкостью.`,
      implication:
        'Имеет смысл целенаправленно укреплять эти первичные способности (малые шаги в контакте, дозированное доверие, микро-надежда), а не только корректировать нормы/вторичные шкалы.',
      cite: 'Serdiuk & Otenko, 2021',
      salience: 'high',
    })
  } else if (strongWellbeing.length >= 3) {
    insights.push({
      id: 'serdiuk-strong-primary',
      topic: 'Первичные опоры благополучия',
      finding: `Выражены/устойчивы: ${strongWellbeing
        .slice(0, 4)
        .map((s) => `«${s.name}» (${s.score})`)
        .join(', ')} — в данных адаптации WIPPF такие шкалы чаще идут вместе с более высоким благополучием.`,
      implication: 'Это ресурсный блок: опирайтесь на него в терапии и при разборе конфликта.',
      cite: 'Serdiuk & Otenko, 2021',
      salience: 'moderate',
    })
  }

  // —— Sinici, Sari & Maden 2014: PTSD — primary < secondary, depression ↔ capacities ——
  if (priLow.length >= 2 || (priMean < secMean - 1.2 && priLow.length >= 1)) {
    insights.push({
      id: 'sinici-ptsd-pattern',
      topic: 'Первичные vs вторичные способности',
      finding: `Первичные способности в среднем слабее вторичных (≈${priMean.toFixed(1)} vs ≈${secMean.toFixed(1)}). В исследовании пациентов с ПТСР (Sinici et al.) первичные способности были менее развиты, чем вторичные, и обе группы способностей отрицательно коррелировали с депрессией.`,
      implication:
        'Паттерн «нормы держатся, а эмоциональный фундамент проседает» встречается при травматическом стрессе. Не диагноз ПТСР — но сигнал проверить травматический контекст и целенаправленно развивать первичные способности.',
      cite: 'Sinici, Sari & Maden, 2014',
      salience: 'high',
    })
  }

  // —— Arabadzhiev et al. 2026: Hope ↔ DI schema; Politeness compensatory ——
  if (hope && hope.level === 'low') {
    insights.push({
      id: 'arabadzhiev-hope',
      topic: 'Низкая надежда',
      finding:
        'В пилотном исследовании (n=59) низкая «Надежда» сильно отрицательно коррелировала со схемой Dependence/Incompetence (r≈−0.53) и отрицательно — со схемами Failure и эмоциональной отстранённостью.',
      implication:
        'Спросите о чувстве некомпетентности / «ничего не получится». Работа с надеждой (микро-цели, доказательства прогресса) может быть центральной, а не периферийной.',
      cite: 'Arabadzhiev et al., 2026 (The Global Psychotherapist)',
      salience: 'high',
    })
  }

  if (polite && polite.level === 'high' && (hope?.level === 'low' || priLow.length >= 2)) {
    insights.push({
      id: 'arabadzhiev-polite-comp',
      topic: 'Вежливость как возможная компенсация',
      finding:
        'Высокая «Вежливость» при внутреннем дефиците (низкая надежда / слабые первичные) в данных Arabadzhiev et al. коррелировала со схемами Failure и Dependence — паттерн people-pleasing: внешняя гипер-адаптивность маскирует демораллизацию.',
      implication:
        'Не усиливайте вежливость как «ресурс» автоматически. Проверьте гипотезу: это зрелая норма или компенсация страха отвержения/провала? Сначала валидируйте усилие, затем мягко исследуйте тень.',
      cite: 'Arabadzhiev et al., 2026',
      salience: 'high',
    })
  } else if (polite && polite.level === 'high') {
    insights.push({
      id: 'arabadzhiev-polite-check',
      topic: 'Высокая вежливость',
      finding:
        'Пилотные данные связывают высокую вежливость иногда с компенсаторным «хорошим поведением» при схемах неуспеха/зависимости — но это не всегда так.',
      implication:
        'Уточните: вежливость из уважения или из страха конфликта? Пезешкиан также видит в вежливости маркер ключевого конфликта (скрытая vs явная агрессия).',
      cite: 'Arabadzhiev et al., 2026; Peseschkian',
      salience: 'moderate',
    })
  }

  if (tenderness && tenderness.level === 'high' && (hope?.level === 'low' || love?.level === 'low')) {
    insights.push({
      id: 'arabadzhiev-sex-comp',
      topic: 'Нежность / сексуальность',
      finding:
        'В том же пилоте повышенная Sexuality коррелировала со схемой Abandonment — возможная компенсация страха остаться одному через телесную близость.',
      implication: 'Исследуйте, какую потребность закрывает телесный контакт: близость, подтверждение, спасение от пустоты?',
      cite: 'Arabadzhiev et al., 2026',
      salience: 'moderate',
    })
  }

  if (honest && honest.level === 'low' && love && love.level === 'low') {
    insights.push({
      id: 'arabadzhiev-honest-love',
      topic: 'Честность и любовь',
      finding:
        'Низкие Honesty и Love в пилотных данных ассоциировались с эмоциональной отстранённостью / стыдом как способом справляться с внутренним дистрессом.',
      implication: 'Безопасные «я-высказывания» и дозированная открытость могут быть мостом к принятию себя и других.',
      cite: 'Arabadzhiev et al., 2026',
      salience: 'moderate',
    })
  }

  // —— Zarek 2023: coping / attachment / social support ——
  if (contactRx && contactRx.score >= 8) {
    insights.push({
      id: 'zarek-contact-support',
      topic: 'Контакт в конфликте и совладание',
      finding:
        'У студенток психотерапии (Zarek, 2023) шкала Social Contact умеренно положительно коррелировала с поиском инструментальной и эмоциональной социальной поддержки (COPE).',
      implication:
        contactRx.level === 'high'
          ? 'Высокий уход в контакты при конфликте может быть и ресурсом поддержки, и избеганием — различите «опору» и «шум».'
          : 'Контактная сфера в рабочем диапазоне — хороший канал для привлечения поддержки при стрессе.',
      cite: 'Zarek, 2023 (The Global Psychotherapist)',
      salience: contactRx.level === 'high' ? 'high' : 'moderate',
    })
  }

  const disengage = [body, work, fantasy].filter((s) => s && s.level === 'high') as WippfScaleScore[]
  if (disengage.length >= 2) {
    insights.push({
      id: 'zarek-mental-disengage',
      topic: 'Конфликтные сферы и mental disengagement',
      finding: `Выражены: ${disengage.map((s) => `«${s.name}»`).join(', ')}. У Zarek (2023) Body, Activity и Future/Fantasy положительно коррелировали с mental disengagement (ментальным «отключением») в COPE.`,
      implication:
        'Доминантные сферы баланса могут служить способом отвлечься от переживания. Спросите: «Это восстановление или бегство от темы?»',
      cite: 'Zarek, 2023',
      salience: 'high',
    })
  }

  const attachKeys = [trust, tenderness, iMother, iFather, you].filter(
    (s) => s && s.level !== 'moderate',
  ) as WippfScaleScore[]
  if (attachKeys.length >= 2) {
    insights.push({
      id: 'zarek-attachment',
      topic: 'Привязанность и модель отношений',
      finding:
        'Zarek (2023): стили привязанности коррелировали с Trust, Sexuality/Tenderness и модельными измерениями I–mother, I–father, YOU.',
      implication: `У вас на полюсах: ${attachKeys
        .slice(0, 4)
        .map((s) => `«${s.name}» (${s.score}, ${s.flag})`)
        .join(', ')}. Имеет смысл связать текущие отношения с ранними образами фигур и стилем привязанности.`,
      cite: 'Zarek, 2023',
      salience: 'moderate',
    })
  }

  const socialSec = [byId.honest, polite, byId.order, byId.clean].filter(
    (s) => s && (s.level === 'high' || s.level === 'low'),
  ) as WippfScaleScore[]
  if (socialSec.length >= 2) {
    insights.push({
      id: 'zarek-social-skills',
      topic: 'Вторичные способности и соцкомпетентность',
      finding:
        'Умеренные связи найдены между социальными компетенциями и вторичными шкалами Openness, Politeness, Orderliness, Cleanliness (Zarek, 2023).',
      implication: `Крайние нормы (${socialSec
        .map((s) => s.name)
        .join(', ')}) могут отражаться в том, как человек читает социальные ситуации — уточните на примерах из жизни.`,
      cite: 'Zarek, 2023',
      salience: 'moderate',
    })
  }

  // —— Kaya Isayev 2026: marital satisfaction ——
  const coupleResource = [hope, obey, faithful].filter(
    (s) => s && (s.level === 'high' || (s.level === 'moderate' && s.score >= 8)),
  ) as WippfScaleScore[]
  if (coupleResource.length >= 2) {
    insights.push({
      id: 'kaya-marital-resource',
      topic: 'Пара и актуальные способности',
      finding:
        'У женатых респондентов (Kaya Isayev, 2026) надежда, послушание и верность положительно коррелировали с удовлетворённостью браком; рост тревожной/избегающей привязанности — отрицательно.',
      implication: `Ресурсные для пары шкалы у вас: ${coupleResource
        .map((s) => `«${s.name}»`)
        .join(', ')}. Можно опереться на них в парной работе.`,
      cite: 'Kaya Isayev, 2026',
      salience: 'moderate',
    })
  }

  const parentModelHigh = [iMother, iFather].filter((s) => s && s.level === 'high') as WippfScaleScore[]
  if (parentModelHigh.length >= 1) {
    insights.push({
      id: 'kaya-model-couple',
      topic: 'Родительская модель и пара',
      finding:
        'В исследовании удовлетворённости браком более сильная ориентация на родителя как модель ассоциировалась со снижением marital satisfaction — идеал фигуры может мешать принимать «несовершенного» партнёра.',
      implication: `Выражены: ${parentModelHigh
        .map((s) => `«${s.name}» (${s.score})`)
        .join(', ')}. Проверьте, не сравнивается ли партнёр с идеализированным образом матери/отца.`,
      cite: 'Kaya Isayev, 2026',
      salience: 'high',
    })
  }

  // Always keep a caveat
  insights.push({
    id: 'caveat',
    topic: 'Ограничения исследований',
    finding:
      'Выборки часто небольшие (пилот, студенты, клинические группы), часть адаптаций без локальных норм; корреляции не равны причинности. WIPPF — клинический ориентир, не скрининг-диагноз.',
    implication:
      'Используйте исследовательский контекст как гипотезы для беседы, сверяя с жалобой, анамнезом и наблюдением.',
    cite: 'методологические ограничения публикаций WIPPF',
    salience: 'moderate',
  })

  // Prefer high-salience first, cap list for UI
  const high = insights.filter((i) => i.salience === 'high' && i.id !== 'caveat')
  const mid = insights.filter((i) => i.salience === 'moderate' && i.id !== 'caveat' && i.id !== 'serdiuk-frame')
  const frame = insights.find((i) => i.id === 'serdiuk-frame')
  const caveat = insights.find((i) => i.id === 'caveat')!
  const ordered = [...(frame ? [frame] : []), ...high, ...mid.slice(0, 4), caveat]
  // dedupe by id
  const seen = new Set<string>()
  return ordered.filter((i) => {
    if (seen.has(i.id)) return false
    seen.add(i.id)
    return true
  })
}

/** Короткие фразы для встраивания в рекомендации */
export function researchRecLines(insights: WippfResearchInsight[]): string[] {
  return insights
    .filter((i) => i.salience === 'high' && i.id !== 'caveat')
    .slice(0, 3)
    .map((i) => `Исследования (${i.cite.split(',')[0]}): ${i.implication}`)
}
