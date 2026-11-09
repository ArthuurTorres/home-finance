/**
 * Calendário compacto de pagamentos fixos — aparece na sidebar da aba "Fixas".
 * Grade mensal com o dia de vencimento de cada despesa recorrente,
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
      <div className="px-3 py-2">
        <span className="text-[10px] font-bold text-text-primary uppercase tracking-wide">
          Pagamentos Fixos
        </span>
        <p className="text-[10px] text-text-tertiary mt-1.5 leading-relaxed">
          Nenhuma despesa fixa cadastrada ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="px-3 py-1.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-text-primary uppercase tracking-wide">
          Pagamentos Fixos
        </span>
        <span className="text-[10px] font-semibold text-text-secondary">
          {formatBRL(totalExpected)}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[8px] font-semibold text-text-tertiary">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="h-5" />
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
              className={`h-5 rounded flex flex-col items-center justify-center relative transition-colors ${
                isToday
                  ? 'bg-accent/15 ring-1 ring-accent/50'
                  : hasPayments
                    ? 'bg-surface-muted'
                    : ''
              }`}
            >
              <span
                className={`text-[9px] leading-none ${
                  isToday ? 'text-accent font-bold' : 'text-text-tertiary'
                }`}
              >
                {day.dueDay}
              </span>

              {hasPayments && (
                <div className="flex items-center gap-px mt-0.5">
                  {day.payments.slice(0, MAX_DOTS).map((p) => {
                    const Icon = getCategoryIcon(p.category, categoryIcons)
                    return (
                      <span
                        key={p.expenseId}
                        className="w-2 h-2 rounded-full flex items-center justify-center bg-accent/25 text-accent"
                      >
                        <Icon className="w-1.5 h-1.5" aria-hidden="true" />
                      </span>
                    )
                  })}
                  {day.payments.length > MAX_DOTS && (
                    <span className="text-[7px] font-semibold text-text-tertiary">
                      +{day.payments.length - MAX_DOTS}
                    </span>
                  )}
                </div>
              )}

              {hasPayments && (
                <div className="absolute bottom-0.5 left-1 right-1 h-0.5 rounded-full bg-accent/40" />
              )}
            </div>
          )
        })}
      </div>

      {nextPayment && (
        <div className="mt-1 pt-1 border-t border-border/60 flex items-center gap-1.5">
          {(() => {
            const Icon = getCategoryIcon(nextPayment.payments[0]!.category, categoryIcons)
            return <Icon className="w-3 h-3 text-accent flex-shrink-0" aria-hidden="true" />
          })()}
          <div className="flex-1 min-w-0 text-[9px] leading-tight truncate">
            <span className="text-text-tertiary">Próximo: </span>
            <span className="font-semibold text-text-primary">{nextPayment.payments[0]!.description}</span>
            <span className="text-text-tertiary"> · Dia {nextPayment.dueDay} · {formatBRL(nextPayment.total)}</span>
          </div>
          <span className="text-[8px] font-bold text-accent flex-shrink-0">
            {nextPayment.dueDay === todayDay ? 'HOJE' : `em ${nextPayment.dueDay - todayDay}d`}
          </span>
        </div>
      )}
    </div>
  )
}