import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getCategorySpending } from '../../utils/finance'
import type { CategorySpending } from '../../utils/finance'

interface CategoryBarProps extends CategorySpending {
  onLimitChange: (category: string, value: string) => void
}

/* ── Barra de categoria com badge de status ── */
function CategoryBar({ category, spent, limit, percentage, over, onLimitChange }: CategoryBarProps) {
  const statusColor = over
    ? 'from-red-400 to-red-500'
    : percentage > 80
    ? 'from-amber-400 to-amber-500'
    : 'from-emerald-400 to-emerald-500'

  const statusBadge = over
    ? 'bg-red-50 text-red-600 border-red-200'
    : percentage > 80
    ? 'bg-amber-50 text-amber-600 border-amber-200'
    : 'bg-emerald-50 text-emerald-600 border-emerald-200'

  const statusLabel = over ? 'Acima' : percentage > 80 ? 'Atenção' : 'Ok'

  return (
    <div className="group p-3 rounded-xl bg-white border border-border hover:border-border-strong hover:shadow-sm transition-all duration-200 w-40 shrink-0 snap-start">
      {/* ── Header: nome + badge ── */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <span className="text-[11px] font-semibold text-text-primary leading-tight truncate" title={category}>{category}</span>
        <span className={`shrink-0 text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full border ${statusBadge}`}>
          {statusLabel}
        </span>
      </div>

      {/* ── Valores: gasto / limite ── */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-sm font-display font-bold ${over ? 'text-danger' : 'text-text-primary'}`}>
          {formatBRL(spent)}
        </span>
        <span className="text-text-tertiary text-[10px]">/</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="—"
          aria-label={`Limite de orçamento para ${category}`}
          defaultValue={limit > 0 ? (limit / 100).toFixed(2) : ''}
          onBlur={(e) => onLimitChange(category, e.target.value)}
          className="w-16 text-[11px] font-mono bg-transparent border-b border-border focus:border-accent outline-none text-text-secondary placeholder:text-text-tertiary transition-colors"
        />
      </div>

      {/* ── Barra com gradiente ── */}
      <div
        className="relative h-1.5 bg-surface-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${category}: ${Math.round(percentage)}% do orçamento utilizado`}
      >
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${statusColor} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* ── Footer: % ou aviso ── */}
      <div className="mt-1.5 h-3">
        {over ? (
          <span className="text-[9px] font-semibold text-danger">+{formatBRL(spent - limit)}</span>
        ) : limit > 0 ? (
          <span className="text-[9px] text-text-tertiary">{percentage.toFixed(0)}% usado</span>
        ) : (
          <span className="text-[9px] text-text-tertiary italic">sem teto</span>
        )}
      </div>
    </div>
  )
}

export function BudgetManager() {
  const filters = useExpenseStore((s) => s.filters)
  const setBudget = useExpenseStore((s) => s.setBudget)
  const expenses = useExpenseStore((s) => s.expenses)
  const budgets = useExpenseStore((s) => s.budgets)
  const categories = useExpenseStore((s) => s.categories)

  const currentMonth = filters.month !== 'all' ? filters.month : new Date().toISOString().slice(0, 7)
  const spendingData = useMemo<CategorySpending[]>(
    () => getCategorySpending(expenses, currentMonth, budgets, categories),
    [expenses, currentMonth, budgets, categories]
  )

  function handleLimitChange(category: string, value: string) {
    const cents = Math.round(parseFloat(value.replace(/[^\d]/g, '')) * 100) || 0
    setBudget(category as any, cents)
  }

  const totalBudget = spendingData.reduce((acc, d) => acc + d.limit, 0)
  const totalSpent = spendingData.reduce((acc, d) => acc + d.spent, 0)
  const overBudgetCount = spendingData.filter((d) => d.over).length

  return (
    <div className="space-y-5">
      {/* ── Header com resumo ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold text-text-primary">Orçamento por Categoria</h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            {spendingData.length} categorias ·{' '}
            {overBudgetCount > 0 ? `${overBudgetCount} acima do limite` : 'No limite'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            {new Date(`${currentMonth}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center justify-end gap-3 mt-1">
            <div>
              <span className="text-[9px] text-text-tertiary block">Gasto</span>
              <span className="text-sm font-display font-bold text-text-primary">{formatBRL(totalSpent)}</span>
            </div>
            {totalBudget > 0 && (
              <div>
                <span className="text-[9px] text-text-tertiary block">Orçamento</span>
                <span className="text-sm font-display font-bold text-text-secondary">{formatBRL(totalBudget)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Faixa horizontal de categorias ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {spendingData.map(({ category, spent, limit, percentage, over }) => (
          <CategoryBar
            key={category}
            category={category}
            spent={spent}
            limit={limit}
            percentage={percentage}
            over={over}
            onLimitChange={handleLimitChange}
          />
        ))}
      </div>
      <p className="text-[10px] text-text-tertiary mt-1">
        Edite o limite em cada categoria e acompanhe o gasto real do mês lado a lado.
      </p>

    </div>
  )
}
