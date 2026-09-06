import { useMemo, useState } from 'react'
import { cleanDigits, parseWippfAnswers, WIPPF_LEN } from '../lib/answers'
import { computeWippf, type WippfReport } from '../lib/wippf'
import { compareCouple } from '../lib/wippfCouple'
import { PrintCoupleReport } from './PrintReport'

type Props = {
  labelA?: string
  labelB?: string
}

function PartnerInput({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string
  value: string
  onChange: (raw: string) => void
  onClear: () => void
}) {
  const digits = cleanDigits(value)
  const lenOk = digits.length === WIPPF_LEN
  const parsed = digits.length ? parseWippfAnswers(digits) : null
  const error =
    digits.length > 0 && digits.length !== WIPPF_LEN
      ? `Нужно ${WIPPF_LEN} цифр 1–4 (сейчас ${digits.length}).`
      : parsed && !parsed.ok
        ? parsed.error
        : null

  return (
    <section className="couple-input">
      <div className="field-head">
        <label>{label}</label>
        <span className={`digit-count${lenOk ? ' ok' : ''}`}>
          {digits.length}/{WIPPF_LEN}
        </span>
      </div>
      <textarea
        className={`digit-input${error ? ' invalid' : lenOk ? ' valid' : ''}`}
        rows={2}
        spellCheck={false}
        placeholder="88 цифр 1–4"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="input-meta">
        <p className="input-legend">4 да · 3 скорее да · 2 скорее нет · 1 нет</p>
        <button type="button" className="btn ghost" onClick={onClear}>
          Очистить
        </button>
      </div>
      {error ? <p className="input-error">{error}</p> : null}
      {!error && lenOk ? <p className="input-ok">Профиль готов.</p> : null}
    </section>
  )
}

export function CoupleView({ labelA = 'Партнёр 1', labelB = 'Партнёр 2' }: Props) {
  const [draftA, setDraftA] = useState('')
  const [draftB, setDraftB] = useState('')
  const [nameA, setNameA] = useState(labelA)
  const [nameB, setNameB] = useState(labelB)
  const [copied, setCopied] = useState(false)

  const reportA = useMemo((): WippfReport | null => {
    const d = cleanDigits(draftA)
    if (d.length !== WIPPF_LEN) return null
    const p = parseWippfAnswers(d)
    return p.ok ? computeWippf(p.answers) : null
  }, [draftA])

  const reportB = useMemo((): WippfReport | null => {
    const d = cleanDigits(draftB)
    if (d.length !== WIPPF_LEN) return null
    const p = parseWippfAnswers(d)
    return p.ok ? computeWippf(p.answers) : null
  }, [draftB])

  const compare = useMemo(() => {
    if (!reportA || !reportB) return null
    return compareCouple(reportA, reportB, nameA.trim() || labelA, nameB.trim() || labelB)
  }, [reportA, reportB, nameA, nameB, labelA, labelB])

  async function handleCopy() {
    if (!compare) return
    const text = [
      `WIPPF · пара: ${compare.partnerA.label} / ${compare.partnerB.label}`,
      '',
      compare.pair.brief.a,
      compare.pair.brief.b,
      compare.pair.brief.pair,
      '',
      `${compare.partnerA.label}:`,
      ...compare.partnerA.problems.map((t) => `• ${t}`),
      '',
      `${compare.partnerB.label}:`,
      ...compare.partnerB.problems.map((t) => `• ${t}`),
      '',
      'Итог для пары:',
      compare.pair.summary,
      ...compare.pair.bullets.map((t, i) => `${i + 1}. ${t}`),
      ...(compare.pair.sharedResources.length
        ? ['', 'Общие опоры:', ...compare.pair.sharedResources.map((t) => `• ${t}`)]
        : []),
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function handlePrint() {
    document.body.classList.add('print-couple')
    window.print()
    document.body.classList.remove('print-couple')
  }

  return (
    <div className="couple-view">
      <section className="couple-intro no-print">
        <h2>Режим пары</h2>
        <p>
          Два профиля WIPPF рядом — как на бланке Remmers (O / X). Это не «тест совместимости», а
          гипотезы для беседы: ценности, ключевой конфликт вежливость↔честность, ожидания vs
          поведение, модель баланса, образ родительской пары.
        </p>
      </section>

      <div className="couple-names no-print">
        <label>
          Имя / ярлык 1
          <input value={nameA} onChange={(e) => setNameA(e.target.value)} maxLength={40} />
        </label>
        <label>
          Имя / ярлык 2
          <input value={nameB} onChange={(e) => setNameB(e.target.value)} maxLength={40} />
        </label>
      </div>

      <div className="couple-inputs no-print">
        <PartnerInput label={nameA || labelA} value={draftA} onChange={setDraftA} onClear={() => setDraftA('')} />
        <PartnerInput label={nameB || labelB} value={draftB} onChange={setDraftB} onClear={() => setDraftB('')} />
      </div>

      {!compare ? (
        <div className="result-placeholder no-print">
          <p>Чтобы увидеть сравнение, заполните оба профиля полностью (по {WIPPF_LEN} ответа).</p>
        </div>
      ) : (
        <>
          <div className="couple-result screen-only">
            <div className="result-topbar no-print">
              <div className="result-topbar-meta">
                <strong>Сравнение пары</strong>
                <span>{compare.pair.summary}</span>
              </div>
              <div className="result-toolbar">
                <button type="button" className="btn" onClick={handleCopy}>
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
                <button type="button" className="btn ghost" onClick={handlePrint}>
                  Печать
                </button>
              </div>
            </div>

            <div className="couple-verdict">
              <article className="couple-card">
                <h3>{compare.partnerA.label}</h3>
                <p className="couple-card-kicker">Проблемы / куда смотреть</p>
                <ul>
                  {compare.partnerA.problems.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {compare.partnerA.resources.length ? (
                  <>
                    <p className="couple-card-kicker resource">Опоры</p>
                    <ul className="resource-ul">
                      {compare.partnerA.resources.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </article>

              <article className="couple-card">
                <h3>{compare.partnerB.label}</h3>
                <p className="couple-card-kicker">Проблемы / куда смотреть</p>
                <ul>
                  {compare.partnerB.problems.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {compare.partnerB.resources.length ? (
                  <>
                    <p className="couple-card-kicker resource">Опоры</p>
                    <ul className="resource-ul">
                      {compare.partnerB.resources.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </article>
            </div>

            <section className="couple-pair-out">
              <p className="group-kicker">Итог</p>
              <h2>Кратко по трём сторонам</h2>
              <div className="couple-brief">
                <p>{compare.pair.brief.a}</p>
                <p>{compare.pair.brief.b}</p>
                <p>{compare.pair.brief.pair}</p>
              </div>
              <p className="group-lead">{compare.pair.summary}</p>
              {compare.pair.sharedResources.length ? (
                <p className="couple-shared">
                  <strong>Общие опоры пары:</strong> {compare.pair.sharedResources.join(', ')}
                </p>
              ) : null}
              <ol className="couple-clash-list">
                {compare.pair.clashes.map((c) => (
                  <li key={c.id} className={`clash kind-${c.kind}`}>
                    <div className="clash-top">
                      <strong>{c.scaleName}</strong>
                      <span>
                        {compare.partnerA.label}: {c.scoreA} · {compare.partnerB.label}: {c.scoreB}
                      </span>
                    </div>
                    <p>{c.text}</p>
                  </li>
                ))}
              </ol>
              {!compare.pair.clashes.length ? (
                <p className="muted">Явных столкновений полюсов не найдено.</p>
              ) : null}
            </section>

            <section className="couple-compare-table-wrap">
              <h2 className="scan-title">Все шкалы рядом</h2>
              <div className="couple-table-scroll">
                <table className="couple-table">
                  <thead>
                    <tr>
                      <th>Шкала</th>
                      <th>{compare.partnerA.label}</th>
                      <th>{compare.partnerB.label}</th>
                      <th>Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportA!.scales.map((sa) => {
                      const sb = reportB!.scales.find((x) => x.id === sa.id)!
                      const gap = Math.abs(sa.score - sb.score)
                      const hot =
                        gap >= 3 ||
                        (sa.level !== 'moderate' && sb.level !== 'moderate' && sa.level !== sb.level)
                      return (
                        <tr key={sa.id} className={hot ? 'hot' : undefined}>
                          <td>{sa.name}</td>
                          <td className={`num level-${sa.level}`}>
                            {sa.score} · {sa.flag}
                          </td>
                          <td className={`num level-${sb.level}`}>
                            {sb.score} · {sb.flag}
                          </td>
                          <td className="num">{gap}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <PrintCoupleReport compare={compare} reportA={reportA!} reportB={reportB!} />
        </>
      )}
    </div>
  )
}
