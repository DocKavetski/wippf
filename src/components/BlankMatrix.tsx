import { WIPPF_OPTIONS, WIPPF_QUESTIONS } from '../data/wippf'
import { WIPPF_LEN } from '../lib/answers'

type Props = {
  answers: Array<number | null>
  onChange: (index: number, value: number) => void
}

export function BlankMatrix({ answers, onChange }: Props) {
  return (
    <div className="blank-wrap">
      <p className="blank-hint">
        Оцените каждое утверждение. В строке выберите один столбец. 4 — да, 1 — нет. Правильных или
        неправильных ответов нет.
      </p>
      <div className="blank-scroll">
        <table className="blank-matrix">
          <thead>
            <tr>
              <th className="blank-num">№</th>
              <th className="blank-q">Утверждение</th>
              {WIPPF_OPTIONS.map((opt) => (
                <th key={opt.value} className="blank-opt">
                  <span className="blank-opt-val">{opt.value}</span>
                  <span className="blank-opt-label">{opt.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WIPPF_QUESTIONS.map((q, idx) => (
              <tr key={idx} className={answers[idx] != null ? 'filled' : undefined}>
                <td className="blank-num">{idx + 1}</td>
                <td className="blank-q">{q}</td>
                {WIPPF_OPTIONS.map((opt) => {
                  const checked = answers[idx] === opt.value
                  return (
                    <td key={opt.value} className="blank-cell">
                      <button
                        type="button"
                        className={`blank-mark${checked ? ' on' : ''}`}
                        aria-label={`Пункт ${idx + 1}: ${opt.label}`}
                        aria-pressed={checked}
                        onClick={() => onChange(idx, opt.value)}
                      >
                        {checked ? '✕' : ''}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="blank-count">
        Заполнено:{' '}
        <strong>
          {answers.filter((a) => a != null).length}/{WIPPF_LEN}
        </strong>
      </p>
    </div>
  )
}
