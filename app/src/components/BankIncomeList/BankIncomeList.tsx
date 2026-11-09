import { ArrowUpRight, Landmark } from 'lucide-react'
import type { Bank, BankSummary } from '../../utils/finance'
import { formatBRL } from '../../utils/finance'

interface BankIncomeListProps {
  banks: Bank[]
  summaries: BankSummary[]
  onManage?: () => void
}

export function BankIncomeList({ banks, summaries, onManage }: BankIncomeListProps) {
  const totalBalance = summaries.reduce((sum, s) => sum + s.balance, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-success/15 flex items-center justify-center">
            <ArrowUpRight size={12} className="text-success" strokeWidth={2.75} />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Saldo por banco
          </span>
        </div>
        {onManage && banks.length > 0 && (
          <button
            onClick={onManage}
            className="text-[9px] text-text-tertiary hover:text-accent transition-colors"
          >
            Gerenciar
          </button>
        )}
      </div>

      {banks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <Landmark size={18} className="text-text-tertiary/40 mb-1.5" strokeWidth={1.5} />
          <p className="text-[10px] text-text-tertiary">Nenhum banco cadastrado.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-1">
            {summaries.map((item) => {
              const negative = item.balance < 0
              return (
                <li
                  key={item.bank.id}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-muted"
                  title={`${item.bank.name} — saldo ${formatBRL(item.balance)} · entrada ${formatBRL(item.total)}`}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.bank.color }}
                    />
                    <span className="block truncate text-[10px] text-text-secondary">
                      {item.bank.name}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-medium tabular-nums ${
                      negative
                        ? 'text-danger'
                        : item.balance === 0
                          ? 'text-text-tertiary'
                          : 'text-text-primary'
                    }`}
                  >
                    {formatBRL(item.balance)}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="mt-1.5 flex items-baseline justify-between border-t border-border/60 pt-1.5">
            <span className="text-[9px] uppercase tracking-wide text-text-tertiary">Total</span>
            <span
              className={`text-xs font-bold tabular-nums ${
                totalBalance < 0 ? 'text-danger' : 'text-text-primary'
              }`}
            >
              {formatBRL(totalBalance)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
