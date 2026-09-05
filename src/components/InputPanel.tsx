import { WIPPF_LEN } from '../lib/answers'

type Props = {
  value: string
  digits: string
  error: string | null
  onChange: (raw: string) => void
  onClear: () => void
}

export function InputPanel({ value, digits, error, onChange, onClear }: Props) {
  const lenOk = digits.length === WIPPF_LEN
  return (
    <section className="input-panel">
      <div className="field-head">
        <label htmlFor="wippf-digits">Строка ответов</label>
        <span className={`digit-count${lenOk ? ' ok' : ''}`}>
          {digits.length}/{WIPPF_LEN}
        </span>
      </div>
      <textarea
        id="wippf-digits"
        className={`digit-input${error ? ' invalid' : lenOk ? ' valid' : ''}`}
        rows={3}
        spellCheck={false}
        autoComplete="off"
        placeholder="Вставьте 88 цифр 1–4 без пробелов (можно с пробелами — лишнее отфильтруется)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="input-meta">
        <p className="input-legend">
          <strong>4</strong> да · <strong>3</strong> скорее да · <strong>2</strong> скорее нет ·{' '}
          <strong>1</strong> нет
        </p>
        <button type="button" className="btn ghost" onClick={onClear}>
          Очистить
        </button>
      </div>
      {error ? <p className="input-error">{error}</p> : null}
      {!error && lenOk ? <p className="input-ok">Строка полная — профиль ниже.</p> : null}
    </section>
  )
}
