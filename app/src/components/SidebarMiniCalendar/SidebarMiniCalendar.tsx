import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getMonthKey } from '../../utils/finance'

/**
 * Mini calendário de fluxo de caixa para a sidebar.
 * Mostra receitas vs despesas dos últimos 6 meses em barras horizontais compactas.
 * Preenche a área vazia abaixo da descrição da aba ativa.
 */
export function SidebarMiniCalendar() {
  const expenses = useExpenseStore((s) => s.expenses)

  const months = useMemo(() => {
    const result: { key: string; label: string; income: number; expense: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = getMonthKey(d)
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      let income = 0
      let expense = 0
      for (const e of expenses) {
        if (e.date.startsWith(key)) {
          if (e.type === 'income') income += e.amount
          else expense += e.amount
        }
      }
      result.push({ key, label, income, expense })
    }
    return result
  }, [expenses])

  const maxVal = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)))

  return (
    <div className="mt-4 px-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">
        Fluxo dos últimos 6 meses
      </p>
      <div className="space-y-2.5">
        {months.map((m) => {
          const incPct = (m.income / maxVal) * 100
          const expPct = (m.expense / maxVal) * 100
          const isCurrent = m.key === getMonthKey(new Date())
          return (
            <div key={m.key} className={`group rounded-lg p-2 transition-colors ${isCurrent ? 'bg-accent/5 border border-accent/20' : 'hover:bg-surface-muted'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-semibold capitalize ${isCurrent ? 'text-accent' : 'text-text-secondary'}`}>
                  {m.label}
                </span>
                <span className="text-[10px] tabular-nums text-text-tertiary">
                  {formatBRL(m.income - m.expense)}
                </span>
              </div>
              {/* Barra de receita */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] text-emerald-600 w-3 shrink-0">↑</span>
                <div className="flex-1 h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${incPct}%` }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-emerald-600 w-12 text-right">{formatBRL(m.income)}</span>
              </div>
              {/* Barra de despesa */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-red-500 w-3 shrink-0">↓</span>
                <div className="flex-1 h-1.5 bg-red-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-red-500 w-12 text-right">{formatBRL(m.expense)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}