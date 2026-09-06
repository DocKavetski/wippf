import { useEffect, useMemo, useState } from 'react'
import { BlankMatrix } from './components/BlankMatrix'
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
type Mode = 'string' | 'blank'

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
  const [cells, setCells] = useState<Array<number | null>>(loadCells)
  const [draft, setDraft] = useState(() => cellsToDraft(loadCells()))
  const [mode, setMode] = useState<Mode>('string')
  const [copied, setCopied] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cells))
    } catch {
      /* ignore */
    }
  }, [cells])

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
    // Частичный ввод: заполняем префикс, остальное пусто
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
      <header className="top">
        <div>
          <p className="eyebrow">Клиницист · WIPPF 2.0</p>
          <h1>Ввод → приоритеты</h1>
          <p className="lede">
            Вставьте 88 ответов — сразу увидите, куда смотреть первым, теплокарту профиля и модель
            баланса.
          </p>
        </div>
        <div className="top-meta">
          <span className="pill">88 · 1–4</span>
          <span className="pill">локально</span>
        </div>
      </header>

      <main className="stage">
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
            <div className="blank-toolbar">
              <p>
                Заполнено: <strong>{digitsLen}/{WIPPF_LEN}</strong>
              </p>
              <button type="button" className="btn ghost" onClick={handleClear}>
                Очистить бланк
              </button>
            </div>
            <BlankMatrix answers={cells} onChange={handleBlankChange} />
          </section>
        )}

        {report ? (
          <WippfResult report={report} onCopy={handleCopy} copied={copied} />
        ) : (
          <div className="result-placeholder">
            <p>
              Чтобы увидеть профиль, введите все <strong>{WIPPF_LEN}</strong> ответа (цифры 1–4).
            </p>
            <p className="muted">Данные сохраняются только в этом браузере.</p>
          </div>
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
