import { useEffect, useMemo, useState } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getDailyDetail, getMonthKey } from '../../utils/finance'
import { getCategoryIcon } from '../../utils/categoryIcons'
import type { DailyDetailItem } from '../../utils/finance'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

/** Quantos itens cabem na célula antes de resumir em "+N contas" */
const ITEMS_IN_CELL = 3

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return getMonthKey(date)
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1)
    .toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
    .replace(/^\w/, (c) => c.toUpperCase())
}

function sumItems(items: DailyDetailItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0)
}

interface DayRow extends DailyDetailItem {
  kind: 'fixed' | 'variable'
}

function toRows(fixed: DailyDetailItem[], variable: DailyDetailItem[]): DayRow[] {
  return [
    ...fixed.map((item) => ({ ...item, kind: 'fixed' as const })),
    ...variable.map((item) => ({ ...item, kind: 'variable' as const })),
  ]
}

const KIND_STYLE = {
  fixed: { short: 'F', label: 'Fixo', bg: 'rgba(212, 96, 58, 0.2)', color: '#b84a28' },
  variable: { short: 'V', label: 'Variável', bg: 'rgba(5, 150, 105, 0.18)', color: '#047857' },
} as const

function CategoryMark({
  category,
  customIcons,
  onDark = false,
}: {
  category: string
  customIcons: Record<string, string>
  onDark?: boolean
}) {
  const Icon = getCategoryIcon(category, customIcons)
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={2}
      className="w-2.5 h-2.5 shrink-0"
      style={{ color: onDark ? 'rgba(255,255,255,0.85)' : '#b84a28' }}
    />
  )
}

function KindBadge({
  kind,
  size = 'sm',
  onDark = false,
}: {
  kind: DayRow['kind']
  size?: 'sm' | 'md'
  onDark?: boolean
}) {
  const style = KIND_STYLE[kind]
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-[3px] font-bold shrink-0 ${
        size === 'sm' ? 'w-3.5 h-3.5 text-[7px]' : 'w-4 h-4 text-[8px]'
      }`}
      style={{
        backgroundColor: onDark ? 'rgba(255, 255, 255, 0.92)' : style.bg,
        color: style.color,
      }}
    >
      {style.short}
    </span>
  )
}

function DayDetailModal({
  day,
  month,
  rows,
  customIcons,
  onClose,
}: {
  day: number
  month: string
  rows: DayRow[]
  customIcons: Record<string, string>
  onClose: () => void
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const [year, monthNumber] = month.split('-').map(Number)
  const dateLabel = new Date(year, monthNumber - 1, day)
    .toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .replace(/^\w/, (c) => c.toUpperCase())
  const fixed = rows.filter((r) => r.kind === 'fixed')
  const variable = rows.filter((r) => r.kind === 'variable')
  const total = sumItems(rows)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-title"
        className="relative w-full max-w-sm card p-5 animate-scale-in max-h-[80vh] flex flex-col"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 id="day-detail-title" className="text-base font-semibold text-text-primary">
              {dateLabel}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {rows.length} {rows.length === 1 ? 'conta' : 'contas'} · Total{' '}
              <span className="font-semibold text-text-primary">{formatBRL(total)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-muted text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto hud-scroll space-y-4">
          {fixed.length > 0 && (
            <section>
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-nude-500 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-accent/70" />
                Fixos ({fixed.length})
              </h4>
              <ul className="space-y-1">
                {fixed.map((item, index) => (
                  <li
                    key={`fixed-${index}`}
                    className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-surface-muted/40"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <KindBadge kind={item.kind} />
                      <CategoryMark category={item.category} customIcons={customIcons} />
                      <span className="text-sm text-text-primary truncate">{item.description}</span>
                    </span>
                    <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                      {formatBRL(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {variable.length > 0 && (
            <section>
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-nude-500 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                Variáveis ({variable.length})
              </h4>
              <ul className="space-y-1">
                {variable.map((item, index) => (
                  <li
                    key={`variable-${index}`}
                    className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-surface-muted/40"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <KindBadge kind={item.kind} />
                      <CategoryMark category={item.category} customIcons={customIcons} />
                      <span className="text-sm text-text-primary truncate">{item.description}</span>
                    </span>
                    <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                      {formatBRL(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-xs text-nude-500">
          <span>
            Fixo <span className="font-semibold text-nude-700">{formatBRL(sumItems(fixed))}</span>
          </span>
          <span>
            Variável <span className="font-semibold text-nude-700">{formatBRL(sumItems(variable))}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function FinancialCalendar() {
  const expenses = useExpenseStore((s) => s.expenses)
  const customIcons = useExpenseStore((s) => s.categoryIcons)
  const [month, setMonth] = useState(() => getMonthKey(new Date()))
  const [openDay, setOpenDay] = useState<number | null>(null)

  const days = useMemo(() => getDailyDetail(expenses, month), [expenses, month])
  const [year, monthNumber] = month.split('-').map(Number)
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay()
  const totalDays = new Date(year, monthNumber, 0).getDate()

  const totals = useMemo(() => {
    let fixed = 0
    let variable = 0
    for (const day of Object.values(days)) {
      fixed += sumItems(day.fixed)
      variable += sumItems(day.variable)
    }
    return { fixed, variable, all: fixed + variable }
  }, [days])

  const peak = Math.max(
    1,
    ...Object.values(days).map((d) => sumItems(d.fixed) + sumItems(d.variable))
  )

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  const openRows = openDay !== null && days[openDay] ? toRows(days[openDay]!.fixed, days[openDay]!.variable) : []

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-display text-nude-800">Calendário de gastos</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="w-7 h-7 rounded-lg text-nude-500 hover:bg-nude-100 transition-colors"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="text-xs font-medium text-nude-600 min-w-[104px] text-center">
            {monthLabel(month)}
          </span>
          <button
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="w-7 h-7 rounded-lg text-nude-500 hover:bg-nude-100 transition-colors"
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, index) => (
          <div key={index} className="text-center text-[10px] font-semibold text-nude-400 py-1">
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />
          const detail = days[day]
          const rows = detail ? toRows(detail.fixed, detail.variable) : []
          const spent = rows.reduce((total, item) => total + item.amount, 0)
          const intensity = spent / peak
          const hidden = rows.length - ITEMS_IN_CELL
          const textColor = intensity > 0.55 ? '#ffffff' : '#94381e'
          const counts = [
            detail?.fixed.length ? `${detail.fixed.length} ${detail.fixed.length === 1 ? 'fixa' : 'fixas'}` : null,
            detail?.variable.length
              ? `${detail.variable.length} ${detail.variable.length === 1 ? 'variável' : 'variáveis'}`
              : null,
          ].filter(Boolean)
          const ariaLabel =
            rows.length > 0
              ? `Dia ${day}: ${rows.length} ${rows.length === 1 ? 'conta' : 'contas'}${
                  counts.length > 0 ? ` (${counts.join(', ')})` : ''
                }, total ${formatBRL(spent)}`
              : `Dia ${day}, sem gastos`
          return (
            <button
              key={day}
              type="button"
              disabled={rows.length === 0}
              onClick={() => setOpenDay(day)}
              title={
                rows.length > 0
                  ? rows
                      .map(
                        (item) =>
                          `${
                            item.kind === 'fixed' ? 'Fixo' : 'Variável'
                          } · ${item.description} · ${formatBRL(item.amount)}`
                      )
                      .join('\n')
                  : `Dia ${day}`
              }
              aria-label={ariaLabel}
              className={`@container min-h-[76px] rounded-lg flex flex-col items-stretch gap-0.5 p-1 pt-0.5 border border-transparent transition-colors overflow-hidden text-left ${
                rows.length > 0 ? 'cursor-pointer hover:border-nude-300' : 'cursor-default'
              }`}
              style={
                spent > 0
                  ? {
                      backgroundColor: `rgba(212, 96, 58, ${0.12 + intensity * 0.68})`,
                      color: textColor,
                    }
                  : { backgroundColor: '#f9fafb', color: '#9ca3af' }
              }
            >
              <span className="text-[11px] font-semibold leading-none self-end">{day}</span>
              {rows.slice(0, ITEMS_IN_CELL).map((item, itemIndex) => (
                <span
                  key={itemIndex}
                  className="text-[9px] leading-tight flex items-center justify-between gap-0.5 min-w-0"
                >
                  <span className="flex items-center gap-0.5 min-w-0">
                    <CategoryMark
                      category={item.category}
                      customIcons={customIcons}
                      onDark={intensity > 0.55}
                    />
                    <span className="hidden @min-[64px]:block truncate">{item.description}</span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">{formatBRL(item.amount)}</span>
                </span>
              ))}
              {hidden > 0 && (
                <span className="text-[9px] font-semibold leading-none opacity-90">
                  +{hidden} {hidden === 1 ? 'conta' : 'contas'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-nude-500">
        <span>
          Total do mês:{' '}
          <span className="font-semibold text-nude-700">{formatBRL(totals.all)}</span>
        </span>
        <span className="flex items-center gap-1">
          <KindBadge kind="fixed" />
          Fixo <span className="font-semibold text-nude-700">{formatBRL(totals.fixed)}</span>
        </span>
        <span className="flex items-center gap-1">
          <KindBadge kind="variable" />
          Variável <span className="font-semibold text-nude-700">{formatBRL(totals.variable)}</span>
        </span>
      </div>

      {openDay !== null && openRows.length > 0 && (
        <DayDetailModal
          day={openDay}
          month={month}
          rows={openRows}
          customIcons={customIcons}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  )
}