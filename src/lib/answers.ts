export const WIPPF_LEN = 88
export const WIPPF_DIGIT_MIN = 1
export const WIPPF_DIGIT_MAX = 4

export type ParseStatus =
  | { ok: true; answers: number[]; digits: string }
  | { ok: false; digits: string; error: string }

/** Оставляет только цифры из сырой строки. */
export function cleanDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Парсит строку ответов WIPPF: ровно 88 цифр в диапазоне 1–4.
 * 4 = да … 1 = нет.
 */
export function parseWippfAnswers(raw: string): ParseStatus {
  const digits = cleanDigits(raw)
  if (digits.length === 0) {
    return { ok: false, digits, error: 'Введите строку из 88 цифр (1–4).' }
  }
  if (digits.length !== WIPPF_LEN) {
    return {
      ok: false,
      digits,
      error: `Длина строки: ${digits.length} из ${WIPPF_LEN} ответов. Нужна полная строка.`,
    }
  }
  const answers = digits.split('').map(Number)
  if (answers.some((n) => n < WIPPF_DIGIT_MIN || n > WIPPF_DIGIT_MAX || Number.isNaN(n))) {
    return {
      ok: false,
      digits,
      error: 'Допустимы только цифры 1–4 (1 = нет … 4 = да).',
    }
  }
  return { ok: true, answers, digits }
}

export function answersToString(answers: Array<number | null | undefined>): string {
  return answers.map((n) => (n == null || Number.isNaN(n) ? '' : String(n))).join('')
}

/** Синхронизация матрицы бланка со строкой: длина ровно 88, пустые = null. */
export function stringToSparseAnswers(raw: string): Array<number | null> {
  const digits = cleanDigits(raw)
  const out: Array<number | null> = Array.from({ length: WIPPF_LEN }, () => null)
  for (let i = 0; i < Math.min(digits.length, WIPPF_LEN); i++) {
    const n = Number(digits[i])
    if (n >= WIPPF_DIGIT_MIN && n <= WIPPF_DIGIT_MAX) out[i] = n
  }
  return out
}

export function sparseToDigitString(sparse: Array<number | null>): string {
  return sparse.map((n) => (n == null ? '' : String(n))).join('')
}
