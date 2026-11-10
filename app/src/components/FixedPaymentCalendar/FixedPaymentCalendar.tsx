/**
 * Calendário de pagamentos fixos — aparece na sidebar da aba "Fixas".
 * Grade mensal espaçada com o dia de vencimento de cada despesa recorrente,
 * ícone da categoria e total previsto no mês.
 */
import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { getCategoryIcon } from '../../utils/categoryIcons'
import { formatBRL } from '../../utils/finance'

interface PaymentDay {
  description: string
  amount: number
  category: string
  expenseId: string
}

interface DayCell {
  dueDay: number
  payments: PaymentDay[]
  total: number
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MAX_DOTS = 3

export function FixedPaymentCalendar() {
  const expenses = useExpenseStore((s) => s.expenses)
  const categoryIcons = useExpenseStore((s) => s.categoryIcons)

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayDay = today.getDate()

  const grid = useMemo<DayCell[]>(() => {
    const totalDays = new Date(year, month + 1, 0).getDate()
    const cells: DayCell[] = Array.from({ length: totalDays }, (_, i) => ({
      dueDay: i + 1,
      payments: [],
      total: 0,
    }))

    expenses
      .filter((e) => e.isRecurring && e.type !== 'income')
      .forEach((expense) => {
        const dueDay = expense.dueDay
        if (dueDay < 1 || dueDay > totalDays) return
        const cell = cells[dueDay - 1]!
        cell.payments.push({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          expenseId: expense.id,
        })
        cell.total += expense.amount
      })

    return cells
  }, [expenses, year, month])

  const totalExpected = grid.reduce((sum, d) => sum + d.total, 0)
  const withPayment = grid.filter((d) => d.payments.length > 0)
  const nextPayment = withPayment.find((d) => d.dueDay >= todayDay) ?? withPayment[0]
  const firstDayOffset = new Date(year, month, 1).getDay()

  if (withPayment.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface-muted/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Pagamentos fixos
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-text-tertiary">
          Nenhuma despesa fixa cadastrada ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-surface-muted/40 p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            Pagamentos fixos
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold capitalize text-text-primary">
            {MONTHS[month]}/{year}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[9px] uppercase tracking-wider text-text-tertiary">Previsto</p>
          <p className="text-[13px] font-bold leading-tight text-accent">{formatBRL(totalExpected)}</p>
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-semibold uppercase text-text-tertiary"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="h-11" />
        ))}

        {grid.map((day) => {
          const isToday = day.dueDay === todayDay
          const hasPayments = day.payments.length > 0

          return (
            <div
              key={day.dueDay}
              title={
                hasPayments
                  ? `${day.dueDay}/${month + 1}\n${day.payments
                      .map((p) => `${p.description}: ${formatBRL(p.amount)}`)
                      .join('\n')}`
                  : `${day.dueDay}/${month + 1}`
              }
              className={`flex h-11 flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
                isToday
                  ? 'bg-accent/10 ring-1 ring-accent/50'
                  : hasPayments
                    ? 'bg-surface shadow-sm'
                    : ''
              }`}
            >
              <span
                className={`text-[11px] leading-none tabular-nums ${
                  isToday
                    ? 'font-bold text-accent'
                    : hasPayments
                      ? 'font-semibold text-text-primary'
                      : 'text-text-tertiary'
                }`}
              >
                {day.dueDay}
              </span>

              {hasPayments && (
                <div className="flex items-center gap-[3px]">
                  {day.payments.slice(0, MAX_DOTS).map((p) => {
                    const Icon = getCategoryIcon(p.category, categoryIcons)
                    return (
                      <span
                        key={p.expenseId}
                        className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-accent/15 text-accent"
                      >
                        <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                      </span>
                    )
                  })}
                  {day.payments.length > MAX_DOTS && (
                    <span className="text-[9px] font-semibold leading-none text-text-tertiary">
                      +{day.payments.length - MAX_DOTS}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {nextPayment && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-2 py-1.5">
          {(() => {
            const Icon = getCategoryIcon(nextPayment.payments[0]!.category, categoryIcons)
            return (
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                <Icon className="h-3 w-3" aria-hidden="true" />
              </span>
            )
          })()}
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[10px] font-semibold text-text-primary">
              {nextPayment.payments[0]!.description}
            </p>
            <p className="text-[9px] text-text-tertiary">
              Dia {nextPayment.dueDay} · {formatBRL(nextPayment.total)}
            </p>
          </div>
          <span className="flex-shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-accent">
            {nextPayment.dueDay === todayDay ? 'Hoje' : `em ${nextPayment.dueDay - todayDay}d`}
          </span>
        </div>
      )}
    </div>
  )
}
