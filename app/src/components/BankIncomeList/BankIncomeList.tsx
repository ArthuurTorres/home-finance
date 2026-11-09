import { ArrowUpRight, Landmark, CircleCheck } from 'lucide-react'
import type { Bank, BankSummary } from '../../utils/finance'
import { formatBRL } from '../../utils/finance'

interface BankIncomeListProps {
  banks: Bank[]
  summaries: BankSummary[]
  onManage?: () => void
}

export function BankIncomeList({ banks, summaries, onManage }: BankIncomeListProps) {
  const active = summaries.filter(s => s.total > 0 || s.balance !== 0)
  const totalBalance = summaries.reduce((sum, s) => sum + s.balance, 0)
  const maxAbs = Math.max(...active.map(s => Math.abs(s.balance)), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-success/15 flex items-center justify-center">
            <ArrowUpRight size={12} className="text-success" strokeWidth={2.75} />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Saldo por banco
          </span>
        </div>
        {onManage && (
          <button
            onClick={onManage}
            className="text-[9px] text-text-tertiary hover:text-accent transition-colors"
          >
            Gerenciar
          </button>
        )}
      </div>

      {banks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Landmark size={20} className="text-text-tertiary/40 mb-2" strokeWidth={1.5} />
          <p className="text-[10px] text-text-tertiary">Nenhum banco cadastrado.</p>
        </div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CircleCheck size={18} className="text-success/30 mb-1.5" strokeWidth={1.5} />
          <p className="text-[10px] text-text-tertiary">Nenhum movimento no período.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {active.map((item) => {
            const negative = item.balance < 0
            return (
            <div key={item.bank.id}>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.bank.color }}
                  />
                  <span className="text-[11px] font-medium text-text-primary truncate">
                    {item.bank.name}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-semibold tabular-nums shrink-0 ${negative ? 'text-danger' : 'text-success'}`}
                >
                  {formatBRL(item.balance)}
                </span>
              </div>
              <div className="h-[3px] bg-border/60 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max((Math.abs(item.balance) / maxAbs) * 100, 1.5)}%`,
                    backgroundColor: negative ? 'var(--color-danger)' : item.bank.color,
                  }}
                />
              </div>
              {negative && (
                <p className="text-[9px] text-danger/80 mt-1 tabular-nums">
                  entradas {formatBRL(item.total)}
                </p>
              )}
            </div>
            )
          })}
          <div className="pt-2 mt-1 flex items-baseline justify-between">
            <span className="text-[9px] uppercase tracking-wide text-text-tertiary">Saldo</span>
            <span
              className={`text-[11px] font-bold tabular-nums ${totalBalance < 0 ? 'text-danger' : 'text-success'}`}
            >
              {formatBRL(totalBalance)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}