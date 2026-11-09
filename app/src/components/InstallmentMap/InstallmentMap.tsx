import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getInstallmentsByCard } from '../../utils/finance'
import { CardArt } from '../CardArt/CardArt'

export function InstallmentMap() {
  const expenses = useExpenseStore((s) => s.expenses)
  const cards = useExpenseStore((s) => s.cards)

  const groups = useMemo(() => getInstallmentsByCard(expenses), [expenses])
  const totalRemaining = groups.reduce((sum, g) => sum + g.remainingCents, 0)
  const monthlyTotal = groups.reduce((sum, g) => sum + g.monthlyCents, 0)

  if (groups.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-nude-200 text-nude-400 text-sm">
        Nenhum parcelamento ativo. Compras parceladas aparecem aqui com o saldo devedor real.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-display text-nude-800">Mapa de parcelas</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-terracotta-600 bg-terracotta-50 px-2 py-1 rounded-md">
            {formatBRL(totalRemaining)} a pagar
          </span>
          <span className="text-xs font-medium text-text-secondary bg-surface-muted px-2 py-1 rounded-md">
            {formatBRL(monthlyTotal)}/mês
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const card =
            cards.find((c) => c.id === group.cardId) ??
            { id: group.cardId, name: group.cardId, color: '#6b5847' }

          return (
            <section
              key={group.cardId}
              className="rounded-xl border border-nude-100 bg-white overflow-hidden"
            >
              <header className="flex items-center gap-3 p-3 border-b border-nude-100">
                <CardArt card={card} className="w-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-nude-800 truncate">{card.name}</p>
                    <span className="text-sm font-semibold text-nude-700 whitespace-nowrap tabular-nums">
                      {formatBRL(group.remainingCents)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-nude-400">
                    {group.items.length} compra{group.items.length !== 1 ? 's' : ''} parcelada
                    {group.items.length !== 1 ? 's' : ''} · {formatBRL(group.monthlyCents)}/mês
                  </p>
                </div>
              </header>

              <ul className="divide-y divide-nude-100">
                {group.items.map((item) => {
                  const { expense } = item
                  const progress = Math.round((item.paid / item.total) * 100)
                  return (
                    <li key={expense.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-nude-800 truncate">
                            {expense.description}
                          </p>
                          <p className="text-[11px] text-nude-400">
                            {item.paid}/{item.total} parcelas · {formatBRL(item.perInstallment)}/mês
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-nude-700 whitespace-nowrap tabular-nums">
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
                        Faltam {item.remaining} parcela{item.remaining !== 1 ? 's' : ''}
                        {item.lastDate
                          ? ` · quitação em ${item.lastDate.toLocaleDateString('pt-BR', {
                              month: 'short',
                              year: 'numeric',
                            })}`
                          : ''}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
