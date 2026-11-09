import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getBalanceSeverity } from '../../utils/finance'
import type { MemberAvatar } from '../../utils/finance'
import { AvatarIcon } from '../AvatarIcon/AvatarIcon'

export function MemberBalance() {
  const members = useExpenseStore((s) => s.members)
  const expenses = useExpenseStore((s) => s.expenses)
  const filters = useExpenseStore((s) => s.filters)

  const balances = useMemo(() => {
    const isAllMonths = !filters.month || filters.month === 'all'
    const currentMonth = isAllMonths ? null : filters.month

    return members.map((member) => {
      const memberExpenses = expenses.filter(
        (e) =>
          e.memberId === member.id &&
          (currentMonth === null || e.date.startsWith(currentMonth))
      )

      const income = memberExpenses
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0)

      const expense = memberExpenses
        .filter((e) => e.type !== 'income')
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        ...member,
        income,
        expense,
        balance: income - expense,
        transactionCount: memberExpenses.length,
      }
    }).sort((a, b) => b.expense - a.expense)
  }, [members, expenses, filters.month])

  if (members.length === 0) return null

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const renderAvatarContent = (avatar: MemberAvatar | null | undefined, name: string, size = 'md') => {
    const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-9 h-9'
    if (avatar) {
      return <AvatarIcon type={avatar} className={`${sizeClass} block`} />
    }
    return (
      <span className={`${sizeClass} flex items-center justify-center rounded-full bg-surface-muted text-text-secondary font-bold ${size === 'sm' ? 'text-[8px]' : 'text-xs'}`}>
        {getInitials(name)}
      </span>
    )
  }

  const maxExpense = Math.max(...balances.map((b) => b.expense), 1)

  return (
    <section className="card p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Balança por Membro
        </h3>
        <p className="text-xs text-text-tertiary mt-1">
          Quem gastou mais, quem recebeu mais e o saldo de cada um
          {!filters.month || filters.month === 'all' ? ' (todos os meses)' : ` (${filters.month})`}
        </p>
      </div>

      <div className="space-y-3">
        {balances.map((member) => {
          const barWidth = Math.max((member.expense / maxExpense) * 100, 2)
          const severity = getBalanceSeverity(member.balance, member.income)
          const balanceTone =
            severity === 'danger' ? 'text-danger' : severity === 'warning' ? 'text-warning' : 'text-success'

          return (
            <div key={member.id} className="group">
              {/* Linha do membro */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 shrink-0">
                  {renderAvatarContent(member.avatar, member.name, 'md')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {member.name}
                  </p>
                  <p className="text-[10px] text-text-tertiary">
                    {member.transactionCount} transaç{member.transactionCount === 1 ? 'ão' : 'ões'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-bold tabular-nums ${balanceTone}`}
                  >
                    {member.balance >= 0 ? '+' : ''}
                    {formatBRL(member.balance)}
                  </p>
                  <p className="text-[10px] text-text-tertiary tabular-nums">saldo</p>
                </div>
              </div>

              {/* Barra visual de gastos */}
              <div className="pl-12 space-y-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-success font-medium w-14 shrink-0">
                    +{formatBRL(member.income)}
                  </span>
                  <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success/60 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max((member.income / Math.max(member.income + member.expense, 1)) * 100, 0)}%`,
                      }}
                    />
                  </div>
                  <span className="text-warning font-medium w-14 text-right shrink-0">
                    -{formatBRL(member.expense)}
                  </span>
                </div>

                {/* Barra de proporção de gasto vs maior gastador */}
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: member.color,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rodapé com ranking */}
      {balances.some((b) => b.expense > 0) && (
        <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Maior gastador:</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 shrink-0">
              {renderAvatarContent(balances[0].avatar, balances[0].name, 'sm')}
            </div>
            <span className="font-semibold text-text-primary">{balances[0].name}</span>
            <span className="text-text-tertiary tabular-nums">
              ({formatBRL(balances[0].expense)})
            </span>
          </div>
        </div>
      )}
    </section>
  )
}