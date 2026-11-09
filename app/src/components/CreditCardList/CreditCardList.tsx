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
      <div className="flex items-center justify-between mb-3">
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

      <div className="space-y-2">
        {cards.map((card) => {
          const isActive = activeCardId === card.id
          const share = total > 0 ? (card.totalSpent / total) * 100 : 0

          return (
            <button
              key={card.id}
              onClick={() => onSelect(isActive ? null : card.id)}
              className={`w-full text-left rounded-xl overflow-hidden transition-all duration-200 ${
                isActive
                  ? 'ring-2 ring-accent/40 shadow-md'
                  : 'ring-1 ring-border hover:ring-text-tertiary/40 hover:shadow-sm'
              }`}
            >
              {/* Face do cartão */}
              <div
                className="relative px-3 py-2.5 text-white"
                style={{
                  background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}cc 60%, ${card.color}99 100%)`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] opacity-70 font-medium">
                      {card.name}
                    </p>
                    <p className="text-[13px] font-semibold tabular-nums mt-0.5 leading-none">
                      {formatBRL(card.totalSpent)}
                    </p>
                  </div>
                  {/* Chip */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="w-5 h-4 rounded-[3px] bg-white/25 border border-white/30" />
                  </div>
                </div>

                {/* Barra de uso */}
                <div className="mt-2 h-[2px] rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${Math.max(share, share > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Rodapé com métricas */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-surface">
                <span className="inline-flex items-center gap-1 text-[9px] text-text-tertiary">
                  <Receipt size={9} strokeWidth={2} />
                  {card.transactionCount} lançamento{card.transactionCount !== 1 ? 's' : ''}
                </span>
                <span className="text-[9px] text-text-tertiary">
                  {card.fixedCount} fixa{card.fixedCount !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {cards.length > 0 && (
        <div className="flex items-baseline justify-between pt-2 mt-2">
          <span className="text-[9px] uppercase tracking-wide text-text-tertiary">Fatura total</span>
          <span className="text-[11px] font-bold text-text-primary tabular-nums">{formatBRL(total)}</span>
        </div>
      )}
    </div>
  )
}