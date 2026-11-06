import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL } from '../../utils/finance'

export function FinancialSummary() {
  const filters = useExpenseStore((s) => s.filters)
  const getMonthlySummary = useExpenseStore((s) => s.getMonthlySummary)

  const month = filters.month === 'all'
    ? new Date().toISOString().slice(0, 7)
    : filters.month

  const summary = useMemo(() => getMonthlySummary(month), [getMonthlySummary, month])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {/* Receita */}
      <div className="group relative overflow-hidden rounded-2xl bg-white border border-border p-4 transition-all hover:border-emerald-200 hover:shadow-md">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide truncate">Receitas</p>
            <p className="text-lg font-bold text-emerald-700 tabular-nums leading-tight mt-0.5 truncate">
              {formatBRL(summary.income)}
            </p>
          </div>
        </div>
      </div>

      {/* Despesa */}
      <div className="group relative overflow-hidden rounded-2xl bg-white border border-border p-4 transition-all hover:border-red-200 hover:shadow-md">
        <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 text-red-500 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide truncate">Despesas</p>
            <p className="text-lg font-bold text-red-600 tabular-nums leading-tight mt-0.5 truncate">
              {formatBRL(summary.expense)}
            </p>
          </div>
        </div>
      </div>

      {/* Saldo */}
      <div className={`group relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-md ${
        summary.balance >= 0 
          ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100' 
          : 'bg-gradient-to-br from-red-50 to-white border-red-100'
      }`}>
        <div className="relative z-10 flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
            summary.balance >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide truncate">Saldo</p>
            <p className={`text-lg font-bold tabular-nums leading-tight mt-0.5 truncate ${
              summary.balance >= 0 ? 'text-emerald-800' : 'text-red-700'
            }`}>
              {formatBRL(summary.balance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}