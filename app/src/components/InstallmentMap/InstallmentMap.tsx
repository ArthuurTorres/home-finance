import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getActiveInstallments } from '../../utils/finance'

export function InstallmentMap() {
  const expenses = useExpenseStore((s) => s.expenses)
  const cards = useExpenseStore((s) => s.cards)

  const installments = useMemo(() => getActiveInstallments(expenses), [expenses])
  const totalRemaining = installments.reduce((sum, i) => sum + i.remainingCents, 0)

  if (installments.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-nude-200 text-nude-400 text-sm">
        Nenhum parcelamento ativo. Compras parceladas aparecem aqui com o saldo devedor real.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-nude-800">Mapa de parcelas</h3>
        <span className="text-xs font-semibold text-terracotta-600 bg-terracotta-50 px-2 py-1 rounded-md">
          {formatBRL(totalRemaining)} a pagar
        </span>
      </div>

      <div className="space-y-2">
        {installments.map((item) => {
          const { expense } = item
          const progress = Math.round((item.paid / item.total) * 100)
          const card = cards.find((c) => c.id === expense.cardId)
          return (
            <div key={expense.id} className="p-3 rounded-xl bg-white border border-nude-100">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-nude-800 truncate">{expense.description}</p>
                  <p className="text-[11px] text-nude-400">
                    {card?.name ?? expense.cardId} · {item.paid}/{item.total} parcelas ·{' '}
                    {formatBRL(item.perInstallment)}/mês
                  </p>
                </div>
                <span className="text-sm font-semibold text-nude-700 whitespace-nowrap">
                  {formatBRL(item.remainingCents)}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-nude-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-terracotta-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-nude-400">
                Faltam {item.remaining} parcela(s)
                {item.lastDate ? ` · quitação em ${item.lastDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}` : ''}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}