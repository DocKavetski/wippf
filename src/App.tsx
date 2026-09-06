import { useEffect, useMemo, useState } from 'react'
import { BlankMatrix } from './components/BlankMatrix'
import { CoupleView } from './components/CoupleView'
import { InputPanel } from './components/InputPanel'
import { WippfResult } from './components/WippfResult'
import {
  cleanDigits,
  parseWippfAnswers,
  WIPPF_DIGIT_MAX,
  WIPPF_DIGIT_MIN,
  WIPPF_LEN,
} from './lib/answers'
import { computeWippf } from './lib/wippf'
import './App.css'

const STORAGE_KEY = 'wippf-clinician-cells'
type InputMode = 'string' | 'blank'
type Workspace = 'solo' | 'couple'

function emptyCells(): Array<number | null> {
  return Array.from({ length: WIPPF_LEN }, () => null)
}

function loadCells(): Array<number | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyCells()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length !== WIPPF_LEN) return emptyCells()
    return parsed.map((n) => {
      const v = Number(n)
      if (v >= WIPPF_DIGIT_MIN && v <= WIPPF_DIGIT_MAX) return v
      return null
    })
  } catch {
    return emptyCells()
  }
}

function cellsToDraft(cells: Array<number | null>): string {
  if (cells.every((c) => c != null)) return cells.join('')
  return cells.map((c) => (c == null ? '' : String(c))).join('')
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>('solo')
  const [cells, setCells] = useState<Array<number | null>>(loadCells)
  const [draft, setDraft] = useState(() => cellsToDraft(loadCells()))
  const [mode, setMode] = useState<InputMode>('string')
  const [copied, setCopied] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [printBlankRequested, setPrintBlankRequested] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cells))
    } catch {
      /* ignore */
    }
  }, [cells])

  useEffect(() => {
    if (!printBlankRequested) return
    if (workspace !== 'solo') {
      setWorkspace('solo')
      return
    }
    if (mode !== 'blank') {
      setMode('blank')
      return
    }
    const id = window.requestAnimationFrame(() => {
      document.body.classList.add('print-blank')
      window.print()
      document.body.classList.remove('print-blank')
      setPrintBlankRequested(false)
    })
    return () => window.cancelAnimationFrame(id)
  }, [printBlankRequested, mode, workspace])

  const complete = cells.every((c) => c != null)
  const report = useMemo(() => {
    if (!complete) return null
    return computeWippf(cells as number[])
  }, [cells, complete])

  const digitsLen = cells.filter((c) => c != null).length

  function applyDigitString(raw: string) {
    setDraft(raw)
    const digits = cleanDigits(raw)
    if (digits.length === 0) {
      setCells(emptyCells())
      setDraftError(null)
      return
    }
    const parsed = parseWippfAnswers(digits)
    if (parsed.ok) {
      setCells(parsed.answers)
      setDraftError(null)
      setCopied(false)
      return
    }
    if (digits.length < WIPPF_LEN && [...digits].every((d) => d >= '1' && d <= '4')) {
      const next = emptyCells()
      for (let i = 0; i < digits.length; i++) next[i] = Number(digits[i])
      setCells(next)
      setDraftError(parsed.error)
      setCopied(false)
      return
    }
    setDraftError(parsed.error)
  }

  function handleClear() {
    setCells(emptyCells())
    setDraft('')
    setDraftError(null)
    setCopied(false)
  }

  function handleBlankChange(index: number, value: number) {
    const next = [...cells]
    next[index] = value
    setCells(next)
    setDraft(cellsToDraft(next))
    setDraftError(
      next.every((c) => c != null)
        ? null
        : `Заполнено ${next.filter((c) => c != null).length} из ${WIPPF_LEN}.`,
    )
    setCopied(false)
  }

  async function handleCopy() {
    if (!report) return
    try {
      const analysisText = report.analysis
        .map((b) => `${b.title}\n${b.lead}\n${b.body}`)
        .join('\n\n')
      const researchText = report.research
        .map((r) => `${r.topic} (${r.cite})\n${r.finding}\n→ ${r.implication}`)
        .join('\n\n')
      const recText = report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
      const full =
        `${report.summary}\n\n${report.conclusion}\n\n--- Анализ ---\n${analysisText}\n\n--- Исследования ---\n${researchText}\n\n--- Рекомендации ---\n${recText}`
      await navigator.clipboard.writeText(full)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="app">
      <header className="top no-print">
        <div>
          <p className="eyebrow">WIPPF 2.0 · клиницист</p>
          <h1>{workspace === 'couple' ? 'Сравнение пары' : 'Индивидуальный разбор'}</h1>
          <p className="lede">
            {workspace === 'couple'
              ? 'Два профиля рядом: личный фокус каждого и зоны трения пары — противоположные полюса, конфликт, ожидания.'
              : 'После 88 цифр: куда смотреть сначала, модель баланса и шкалы «от полюса к полюсу».'}
          </p>
        </div>
        <div className="top-meta">
          <span className="pill">88 · 1–4</span>
          <span className="pill">локально</span>
        </div>
      </header>

      <main className="stage">
        <div className="workspace-tabs no-print">
          <button
            type="button"
            className={workspace === 'solo' ? 'tab on' : 'tab'}
            onClick={() => setWorkspace('solo')}
          >
            Один человек
          </button>
          <button
            type="button"
            className={workspace === 'couple' ? 'tab on' : 'tab'}
            onClick={() => setWorkspace('couple')}
          >
            Пара
          </button>
        </div>

        {workspace === 'couple' ? (
          <CoupleView />
        ) : (
          <>
            <div className="mode-tabs no-print">
              <button
                type="button"
                className={mode === 'string' ? 'tab on' : 'tab'}
                onClick={() => setMode('string')}
              >
                Строка ответов
              </button>
              <button
                type="button"
                className={mode === 'blank' ? 'tab on' : 'tab'}
                onClick={() => setMode('blank')}
              >
                Бланк
              </button>
              <button
                type="button"
                className="btn ghost print-blank-btn"
                onClick={() => setPrintBlankRequested(true)}
              >
                Печать бланка
              </button>
            </div>

            {mode === 'string' ? (
              <InputPanel
                value={draft}
                digits={cleanDigits(draft)}
                error={draftError && cleanDigits(draft).length !== WIPPF_LEN ? draftError : null}
                onChange={applyDigitString}
                onClear={handleClear}
              />
            ) : (
              <section className="blank-section">
                <div className="blank-toolbar no-print">
                  <p>
                    Заполнено:{' '}
                    <strong>
                      {digitsLen}/{WIPPF_LEN}
                    </strong>
                  </p>
                  <div className="blank-toolbar-actions">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setPrintBlankRequested(true)}
                    >
                      Печать бланка
                    </button>
                    <button type="button" className="btn ghost" onClick={handleClear}>
                      Очистить бланк
                    </button>
                  </div>
                </div>
                <div className="blank-print-title print-only">
                  <h2>WIPPF 2.0 — бланк ответов</h2>
                  <p>
                    4 — да · 3 — скорее да · 2 — скорее нет · 1 — нет. Отметьте один вариант в каждой
                    строке.
                  </p>
                </div>
                <BlankMatrix answers={cells} onChange={handleBlankChange} />
              </section>
            )}

            {report ? (
              <WippfResult report={report} onCopy={handleCopy} copied={copied} />
            ) : (
              <div className="result-placeholder no-print">
                <p>
                  Чтобы увидеть профиль, введите все <strong>{WIPPF_LEN}</strong> ответа (цифры 1–4).
                </p>
                <p className="muted">Данные сохраняются только в этом браузере.</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="foot no-print">
        <p>
          Peseschkian &amp; Deidenbach, 1988; Remmers, 2009 (WIPPF 2.0). Ориентиры шкал: 3–5 слабо,
          6–9 баланс, 10–12 выражено. Не диагноз.
        </p>
      </footer>
    </div>
  )
}
