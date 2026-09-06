import { useState, type ReactNode } from 'react'
import type { WippfAgg, WippfReport, WippfScaleScore } from '../lib/wippf'
import { BalanceDiamond } from './BalanceDiamond'
import { buildPriorities, resourceScales } from '../lib/wippfPriority'

const GROUP_META: Record<
  WippfScaleScore['group'],
  { title: string; lead: string; what: string; why: string }
> = {
  secondary: {
    title: 'Вторичные способности — нормы и правила',
    lead: 'Как вы относитесь к социальным «правилам игры».',
    what: 'Вторичные способности — это усвоенные нормы общения и труда: порядок, пунктуальность, вежливость, честность, усердие, обязательность, бережливость, послушание, справедливость, верность. Их ещё называют «вторичными», потому что они формируются позже первичных и обслуживают жизнь в обществе.',
    why: 'Крайности здесь часто звучат как «слишком строго / слишком свободно» в отношениях, на работе и в семье. Важно не «исправить» шкалу, а понять, где норма помогает, а где давит.',
  },
  primary: {
    title: 'Первичные способности — эмоции и близость',
    lead: 'Эмоциональный фундамент: терпение, доверие, любовь, смысл.',
    what: 'Первичные способности — базовые эмоциональные качества, с которых человек «начинается»: терпение, время для себя и других, контакты, доверие, надежда, нежность, любовь/принятие, вера и смысл. В позитивной психотерапии они считаются фундаментом отношений.',
    why: 'В исследованиях WIPPF именно этот блок чаще связан с ощущением благополучия и жизнестойкости. Если нормы (вторичные) высокие, а первичные проседают — человек может «правильно себя вести», но чувствовать пустоту или выгорание.',
  },
  conflict: {
    title: 'Реакции на конфликт — модель баланса',
    lead: 'Куда уходит энергия, когда тяжело.',
    what: 'Модель баланса (кристалл Пезешкиана) делит жизнь на четыре сферы: тело/ощущения, деятельность/достижения, контакты/отношения, фантазия/смысл/будущее. В WIPPF четыре шкалы показывают, в какую сферу вы чаще «убегаете» при конфликте или какую избегаете.',
    why: 'Выпячивание одной сферы — не приговор, а привычный способ справляться. Цель терапии часто в том, чтобы вернуть энергию в «забытые» сферы и сделать реакцию более гибкой.',
  },
  model: {
    title: 'Модель отношений — образы из прошлого',
    lead: 'Как вы запомнили значимых людей и семейный фон.',
    what: 'Модельные измерения — субъективные образы: Я–мать, Я–отец, другие воспитатели, союз родителей («Ты»), отношение семьи к миру («Мы») и ценностный фон («Пра-Мы»). Это не «объективная биография», а то, как отношения отпечатались внутри.',
    why: 'Отсюда часто берутся нынешние ожидания к партнёру, начальнику, себе. Сравнивая модель с актуальными шкалами, легче увидеть унаследованные сценарии.',
  },
}

const KIND_LABEL: Record<string, string> = {
  high: 'выражено',
  low: 'слабо',
  skew: 'перекос',
  conflict: 'конфликт',
  research: 'исследование',
}

const DIM_EXPLAIN: Record<string, { short: string; long: string }> = {
  a: {
    short: 'Своё поведение',
    long: 'Насколько вы сами соблюдаете нормы (порядок, пунктуальность, обещания…).',
  },
  r: {
    short: 'Ожидания к другим',
    long: 'Чего вы ждёте от окружающих по тем же нормам.',
  },
  k: {
    short: 'Идеалы',
    long: 'Какими, по-вашему, нормы «должны быть» в принципе.',
  },
  e: {
    short: 'К себе',
    long: 'Насколько первичные способности (терпение, доверие…) направлены на себя.',
  },
  w: {
    short: 'К другим',
    long: 'Насколько те же способности направлены к другим людям.',
  },
  i: {
    short: 'Как идеал',
    long: 'Насколько эти качества важны для вас как идеал отношений.',
  },
}

/** Цветная шкала: полюс ← метка → полюс */
function Spectrum({ scale }: { scale: WippfScaleScore }) {
  const pct = Math.max(0, Math.min(100, ((scale.score - 3) / 9) * 100))
  return (
    <article className={`spectrum level-${scale.level}`}>
      <header className="spectrum-head">
        <h3>{scale.name}</h3>
        <span className="spectrum-badge">
          {scale.score} из 12 · {scale.flag}
        </span>
      </header>
      <p className="spectrum-meaning">{scale.meaning}</p>
      <div className="spectrum-track-wrap">
        <div className="spectrum-track" aria-hidden>
          <div className="spectrum-gradient" />
          <div className="spectrum-zones">
            <span className="z-low">3–5</span>
            <span className="z-mid">6–9</span>
            <span className="z-high">10–12</span>
          </div>
          <div className="spectrum-marker" style={{ left: `${pct}%` }}>
            <i />
            <em>{scale.score}</em>
          </div>
        </div>
        <div className="spectrum-poles">
          <span>
            <small>Слабый полюс</small>
            {scale.lowPole}
          </span>
          <span>
            <small>Сильный полюс</small>
            {scale.highPole}
          </span>
        </div>
      </div>
      <p className="spectrum-now">
        <strong>Сейчас.</strong> {scale.interpretation}
      </p>
      <p className="spectrum-rec">
        <strong>Что можно сделать.</strong> {scale.recommendation}
      </p>
    </article>
  )
}

function DimGuide({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: WippfAgg[]
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const spread = sorted[0].value - sorted[sorted.length - 1].value
  const threshold = ['a', 'r', 'k'].includes(items[0].id) ? 6 : 5
  return (
    <div className="dim-guide">
      <h3>{title}</h3>
      <p className="dim-guide-sub">{subtitle}</p>
      <div className="dim-guide-list">
        {items.map((a) => {
          const meta = DIM_EXPLAIN[a.id]
          const pct = ((a.value - a.min) / (a.max - a.min)) * 100
          return (
            <div key={a.id} className="dim-guide-row">
              <div className="dim-guide-top">
                <strong>{meta?.short ?? a.name}</strong>
                <span>
                  {a.value}
                  <small>/{a.max}</small>
                </span>
              </div>
              <p>{meta?.long ?? a.hint}</p>
              <div className="dim-guide-bar">
                <i style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      {spread >= threshold ? (
        <p className="dim-guide-note warn">
          Заметный перекос: выше всего «{sorted[0].name}» ({sorted[0].value}), ниже — «
          {sorted[sorted.length - 1].name}» ({sorted[sorted.length - 1].value}).
        </p>
      ) : (
        <p className="dim-guide-note ok">Перекоса почти нет — три измерения относительно близки.</p>
      )}
    </div>
  )
}

function GroupBlock({
  group,
  scales,
}: {
  group: WippfScaleScore['group']
  scales: WippfScaleScore[]
}) {
  const meta = GROUP_META[group]
  const list = scales.filter((s) => s.group === group)
  return (
    <section className={`group-block group-${group}`}>
      <header className="group-block-head">
        <p className="group-kicker">
          {group === 'secondary'
            ? 'Блок 1'
            : group === 'primary'
              ? 'Блок 2'
              : group === 'conflict'
                ? 'Блок 3'
                : 'Блок 4'}
        </p>
        <h2>{meta.title}</h2>
        <p className="group-lead">{meta.lead}</p>
        <p className="group-what">{meta.what}</p>
        <p className="group-why">
          <strong>Зачем смотреть.</strong> {meta.why}
        </p>
      </header>
      <div className="spectrum-list">
        {list.map((s) => (
          <Spectrum key={s.id} scale={s} />
        ))}
      </div>
    </section>
  )
}

function PriorityStrip({ report }: { report: WippfReport }) {
  const priorities = buildPriorities(report)
  const resources = resourceScales(report)
  return (
    <section className="priority-strip">
      <div className="priority-main">
        <p className="priority-kicker">С чего начать разбор</p>
        <h2 className="priority-title">Главное в вашем профиле</h2>
        <ol className="priority-list">
          {priorities.map((p) => (
            <li key={p.id} className={`priority-item kind-${p.kind}`}>
              <span className="priority-rank">{p.rank}</span>
              <div className="priority-body">
                <div className="priority-top">
                  <strong>{p.title}</strong>
                  <span className="priority-tag">{KIND_LABEL[p.kind]}</span>
                  {p.scoreLabel ? <span className="priority-score">{p.scoreLabel}</span> : null}
                </div>
                <p>{p.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <aside className="priority-side">
        <p className="priority-kicker resource">Опоры</p>
        <p className="priority-side-lead">Шкалы в зоне баланса (7–9) — на что можно опереться в беседе.</p>
        {resources.length ? (
          <ul className="resource-mini">
            {resources.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong>
                <em>{s.score}/12</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="resource-empty">Мало шкал ровно в 7–9. Опоры ищите среди умеренных и в модели баланса.</p>
        )}
      </aside>
    </section>
  )
}

function DetailsBlock({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details
      className="details-block"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>
        <span>{title}</span>
        <span className="details-chevron">{open ? '−' : '+'}</span>
      </summary>
      <div className="details-body">{children}</div>
    </details>
  )
}

type Props = {
  report: WippfReport
  onCopy: () => void
  copied: boolean
}

export function WippfResult({ report, onCopy, copied }: Props) {
  const norms = report.agg.filter((x) => ['a', 'r', 'k'].includes(x.id))
  const relations = report.agg.filter((x) => ['e', 'w', 'i'].includes(x.id))

  return (
    <div className="result-area visual-result">
      <div className="result-topbar no-print">
        <div className="result-topbar-meta">
          <strong>{report.verdict}</strong>
          <span>
            Крайних шкал: {report.extremes.length} (выражено {report.high.length}, слабо {report.low.length})
          </span>
        </div>
        <div className="result-toolbar">
          <button type="button" className="btn" onClick={onCopy}>
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button type="button" className="btn ghost" onClick={() => window.print()}>
            Печать
          </button>
        </div>
      </div>

      <section className="how-to-read">
        <h2>Как читать этот отчёт</h2>
        <ol>
          <li>
            <strong>Сначала</strong> — блок «Главное»: куда смотреть в беседе.
          </li>
          <li>
            <strong>Модель баланса</strong> — ромб из четырёх сфер жизни при конфликте.
          </li>
          <li>
            <strong>Шкалы</strong> — цветная линия от одного полюса к другому; метка = ваш балл (от 3 до 12).
          </li>
          <li>
            Низкий и высокий балл — <em>не плохо и не хорошо</em>, а разные стили. Важно, помогают ли они вам сейчас.
          </li>
        </ol>
      </section>

      <section className="glossary">
        <h2>Что измеряет WIPPF — коротко о группах</h2>
        <div className="glossary-grid">
          {(
            [
              ['secondary', 'Вторичные'],
              ['primary', 'Первичные'],
              ['conflict', 'Баланс / конфликт'],
              ['model', 'Модель отношений'],
            ] as const
          ).map(([key, label]) => (
            <article key={key} className={`glossary-card g-${key}`}>
              <h3>{label}</h3>
              <p>{GROUP_META[key].what}</p>
            </article>
          ))}
        </div>
      </section>

      <PriorityStrip report={report} />

      <section className="balance-section">
        <header className="group-block-head">
          <p className="group-kicker">Визуальный центр</p>
          <h2>Модель баланса (кристалл Пезешкиана)</h2>
          <p className="group-lead">Четыре сферы, куда уходит энергия при напряжении.</p>
          <p className="group-what">
            Вверх — тело, вправо — деятельность, вниз — контакты, влево — смыслы/фантазия. Пунктир —
            ориентир «примерно поровну». Выпячивание стороны = уход в эту сферу.
          </p>
        </header>
        <BalanceDiamond conflict={report.conflict} />
      </section>

      <section className="dims-section">
        <header className="group-block-head">
          <p className="group-kicker">Сравнение установок</p>
          <h2>Три взгляда на нормы и на отношения</h2>
          <p className="group-what">
            Каждая вторичная шкала складывается из трёх вопросов: про себя (a), про ожидания к другим (r) и
            про идеалы (k). Первичные — из вопросов «к себе» (e), «к другим» (w) и «как идеал» (i). Ниже —
            суммы по всем таким вопросам.
          </p>
        </header>
        <div className="dims-guide-grid">
          <DimGuide
            title="Нормы: a · r · k"
            subtitle="Правила: своё поведение / ожидания / идеалы"
            items={norms}
          />
          <DimGuide
            title="Отношения: e · w · i"
            subtitle="Близость: к себе / к другим / идеал"
            items={relations}
          />
        </div>
      </section>

      <GroupBlock group="secondary" scales={report.scales} />
      <GroupBlock group="primary" scales={report.scales} />
      <GroupBlock group="conflict" scales={report.scales} />
      <GroupBlock group="model" scales={report.scales} />

      <DetailsBlock title={`Рекомендации (${report.recommendations.length})`} defaultOpen>
        <ol className="plain-list">
          {report.recommendations.slice(0, 10).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      </DetailsBlock>

      <DetailsBlock title={`Исследования по WIPPF (${report.research.length})`}>
        <div className="plain-stack">
          {report.research.map((r) => (
            <article key={r.id} className={`plain-card research-${r.salience}`}>
              <h3>{r.topic}</h3>
              <p className="muted">{r.cite}</p>
              <p>{r.finding}</p>
              <p>
                <strong>Для разбора.</strong> {r.implication}
              </p>
            </article>
          ))}
        </div>
      </DetailsBlock>

      <DetailsBlock title="Подробный текстовый разбор">
        <div className="plain-stack">
          {report.analysis.map((b) => (
            <article key={b.id} className="plain-card">
              <h3>{b.title}</h3>
              <p className="muted">{b.lead}</p>
              <p>{b.body}</p>
            </article>
          ))}
        </div>
      </DetailsBlock>

      <p className="visual-footnote">
        Балл шкалы: 3–5 слабо · 6–9 баланс · 10–12 выражено. Отчёт — ориентир для разговора, не диагноз.
      </p>
    </div>
  )
}
