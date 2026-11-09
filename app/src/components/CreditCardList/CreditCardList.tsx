import { CreditCard as CreditCardIcon, Receipt } from 'lucide-react'
import type { CreditCardDef } from '../../utils/finance'
import { formatBRL } from '../../utils/finance'

export interface CardSummaryItem extends CreditCardDef {
  totalSpent: number
  fixedCount: number
  transactionCount: number
}

interface CreditCardListProps {
  cards: CardSummaryItem[]
  activeCardId: string | null
  onSelect: (id: string | null) => void
  onShowAll: () => void
}

export function CreditCardList({ cards, activeCardId, onSelect, onShowAll }: CreditCardListProps) {
  const total = cards.reduce((sum, c) => sum + c.totalSpent, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-accent/15 flex items-center justify-center">
            <CreditCardIcon size={12} className="text-accent" strokeWidth={2.25} />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Cartões de crédito
          </span>
        </div>
        <button
          onClick={onShowAll}
          className={`text-[9px] transition-colors ${
            activeCardId === null ? 'text-accent font-medium' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Ver todos
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <CreditCardIcon size={18} className="text-text-tertiary/40 mb-1.5" strokeWidth={1.5} />
          <p className="text-[10px] text-text-tertiary">Nenhum cartão cadastrado.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-1">
            {cards.map((card) => {
              const isActive = activeCardId === card.id
              return (
                <li key={card.id}>
                  <button
                    onClick={() => onSelect(isActive ? null : card.id)}
                    title={`${card.name} — ${card.transactionCount} lançamento${card.transactionCount !== 1 ? 's' : ''}, ${card.fixedCount} fixa${card.fixedCount !== 1 ? 's' : ''}`}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left transition-colors ${
                      isActive
                        ? 'bg-accent/10 ring-1 ring-accent/30'
                        : 'hover:bg-surface-muted'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-2.5 w-4 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: card.color }}
                      />
                      <span
                        className={`block truncate text-[10px] ${
                          isActive ? 'font-semibold text-accent' : 'text-text-secondary'
                        }`}
                      >
                        {card.name}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-text-tertiary">
                        <Receipt size={9} strokeWidth={2} />
                        {card.transactionCount}
                      </span>
                      <span className="text-[10px] font-medium text-text-primary tabular-nums">
                        {formatBRL(card.totalSpent)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-1.5 flex items-baseline justify-between border-t border-border/60 pt-1.5">
            <span className="text-[9px] uppercase tracking-wide text-text-tertiary">Fatura total</span>
            <span className="text-xs font-bold text-text-primary tabular-nums">{formatBRL(total)}</span>
          </div>
        </>
      )}
    </div>
  )
}
