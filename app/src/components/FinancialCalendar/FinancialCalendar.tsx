import { useMemo, useState } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getDailySpending, getMonthKey } from '../../utils/finance'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return getMonthKey(date)
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

export function FinancialCalendar() {
  const expenses = useExpenseStore((s) => s.expenses)
  const [month, setMonth] = useState(() => getMonthKey(new Date()))

  const days = useMemo(() => getDailySpending(expenses, month), [expenses, month])
  const [year, monthNumber] = month.split('-').map(Number)
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay()
  const totalDays = new Date(year, monthNumber, 0).getDate()
  const peak = Math.max(1, ...Object.values(days))
  const monthTotal = Object.values(days).reduce((sum, value) => sum + value, 0)

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-nude-800">Calendário de gastos</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="w-7 h-7 rounded-lg text-nude-500 hover:bg-nude-100 transition-colors"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="text-xs font-medium text-nude-600 capitalize min-w-[120px] text-center">
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
          const spent = days[day] ?? 0
          const intensity = spent / peak
          return (
            <div
              key={day}
              title={spent > 0 ? `${day} · ${formatBRL(spent)}` : `Dia ${day}`}
              className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium border border-transparent transition-colors"
              style={
                spent > 0
                  ? {
                      backgroundColor: `rgba(212, 96, 58, ${0.12 + intensity * 0.68})`,
                      color: intensity > 0.55 ? '#ffffff' : '#94381e',
                    }
                  : { backgroundColor: '#f9fafb', color: '#9ca3af' }
              }
            >
              {day}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-nude-500">
        Total do mês: <span className="font-semibold text-nude-700">{formatBRL(monthTotal)}</span>
      </p>
    </div>
  )
}