import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getBudgetAlerts, getMonthKey } from '../../utils/finance'

const STATUS_STYLE = {
  ok: { bar: 'bg-emerald-400', text: 'text-emerald-600', label: 'No ritmo' },
  warning: { bar: 'bg-amber-400', text: 'text-amber-600', label: 'Atenção' },
  danger: { bar: 'bg-red-400', text: 'text-red-600', label: 'Estourando' },
} as const

export function BudgetAlerts() {
  const expenses = useExpenseStore((s) => s.expenses)
  const budgets = useExpenseStore((s) => s.budgets)

  const month = getMonthKey(new Date())
  const alerts = useMemo(
    () => getBudgetAlerts(expenses, budgets, month),
    [expenses, budgets, month]
  )

  if (alerts.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-nude-200 text-nude-400 text-sm">
        Defina limites de orçamento para receber alertas preditivos de gasto.
      </div>
    )
  }

  const totalRisk = alerts.filter((a) => a.status !== 'ok').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-display text-nude-700">Alertas preditivos</h4>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-md ${
            totalRisk > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {totalRisk > 0 ? `${totalRisk} categoria(s) em risco` : 'Tudo sob controle'}
        </span>
      </div>

      <div className="grid gap-2">
        {alerts.map((alert) => {
          const style = STATUS_STYLE[alert.status]
          return (
            <div key={alert.category} className="p-3 rounded-xl bg-white border border-nude-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-nude-700">{alert.category}</span>
                <span className={`text-[11px] font-semibold ${style.text}`}>
                  {style.label} · proj. {formatBRL(alert.projected)}
                </span>
              </div>
              <div className="relative h-1.5 w-full bg-nude-100 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${style.bar}`}
                  style={{ width: `${Math.min(100, alert.percentageProjected)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-nude-400">
                {formatBRL(alert.spent)} / {formatBRL(alert.limit)} · {Math.round(alert.percentageProjected)}% projetado
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}