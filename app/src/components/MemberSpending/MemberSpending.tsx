import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getMemberSpending, getMonthKey } from '../../utils/finance'
import { AvatarIcon } from '../AvatarIcon/AvatarIcon'

const BAR_COLORS = ['#d4603a', '#0ea5e9', '#8b5cf6', '#059669', '#d97706', '#db2777']

export function MemberSpending() {
  const expenses = useExpenseStore((s) => s.expenses)
  const members = useExpenseStore((s) => s.members)

  const month = getMonthKey(new Date())
  const rows = useMemo(
    () => getMemberSpending(expenses, members, month),
    [expenses, members, month]
  )
  const total = rows.reduce((sum, r) => sum + r.spent, 0)

  if (members.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-nude-200 text-nude-400 text-sm">
        Cadastre os membros da casa para ver quem gastou quanto neste mês.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-nude-800">Gastos por membro</h3>
        <span className="text-xs text-nude-500">
          Total <span className="font-semibold text-nude-700">{formatBRL(total)}</span>
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map((row, index) => (
          <div key={row.memberId} className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden">
              <AvatarIcon type={row.avatar} className="w-9 h-9" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-nude-700 truncate">{row.name}</span>
                <span className="text-xs font-semibold text-nude-700 whitespace-nowrap">
                  {formatBRL(row.spent)} · {row.percentage}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-nude-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${row.percentage}%`,
                    backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}