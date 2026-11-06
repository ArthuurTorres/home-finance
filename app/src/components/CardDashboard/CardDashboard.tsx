import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { addMonths, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getCategorySpending } from '../../utils/finance'
import type { CreditCardDef } from '../../utils/finance'

const COLORS = [
  '#f97316', '#38bdf8', '#4ade80', '#facc15',
  '#a78bfa', '#fb7185', '#2dd4bf', '#818cf8',
]

interface CardDashboardProps {
  card: CreditCardDef
  onBack: () => void
}

export function CardDashboard({ card, onBack }: CardDashboardProps) {
  const expenses = useExpenseStore((s) => s.expenses)
  const filters = useExpenseStore((s) => s.filters)
  const budgets = useExpenseStore((s) => s.budgets)
  const categories = useExpenseStore((s) => s.categories)

  // Filtra despesas apenas deste cartão
  const cardExpenses = useMemo(() => {
    return expenses.filter((e) => e.cardId === card.id)
  }, [expenses, card.id])

  // Resumo financeiro do cartão (mês atual ou filtro ativo)
  const summary = useMemo(() => {
    const isAllMonths = !filters.month || filters.month === 'all'
    const currentMonth = isAllMonths ? null : filters.month

    const filtered = cardExpenses.filter((e) =>
      currentMonth === null || e.date.startsWith(currentMonth)
    )

    const totalSpent = filtered.reduce((sum, e) => sum + e.amount, 0)
    const paidCount = filtered.filter((e) => e.isPaid).length
    const pendingCount = filtered.length - paidCount

    // Gasto do mês atual (independente do filtro ativo)
    const currentMonthKey = new Date().toISOString().slice(0, 7)
    const currentMonthExpenses = cardExpenses.filter((e) => e.date.startsWith(currentMonthKey))
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => {
      if (e.installments > 1) {
        const installmentValue = Math.round(e.amount / e.installments)
        return sum + installmentValue
      }
      return sum + e.amount
    }, 0)

    // Evolução dos últimos 6 meses (gasto real por mês)
    const monthlyEvolution: { month: string; label: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const pastDate = addMonths(new Date(), -i)
      const monthKey = format(pastDate, 'yyyy-MM')
      const label = format(pastDate, 'MMM', { locale: ptBR })

      const monthExpenses = cardExpenses.filter((e) => e.date.startsWith(monthKey))
      let monthTotal = 0
      monthExpenses.forEach((e) => {
        if (e.installments > 1) {
          monthTotal += Math.round(e.amount / e.installments)
        } else {
          monthTotal += e.amount
        }
      })

      monthlyEvolution.push({ month: monthKey, label, total: monthTotal })
    }

    return { totalSpent, paidCount, pendingCount, count: filtered.length, currentMonthTotal, monthlyEvolution }
  }, [cardExpenses, filters.month])

  // Gráfico por categoria (apenas despesas deste cartão)
  const categoryData = useMemo(() => {
    const month = filters.month && filters.month !== 'all'
      ? filters.month
      : new Date().toISOString().slice(0, 7)

    // Filtra despesas do cartão antes de calcular categorias
    const isAllMonths = !filters.month || filters.month === 'all'
    const currentMonth = isAllMonths ? null : filters.month
    const cardFiltered = cardExpenses.filter((e) =>
      currentMonth === null || e.date.startsWith(currentMonth)
    )

    const spending = getCategorySpending(cardFiltered, month, budgets, categories)
    return spending
      .filter((item) => item.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .map((item) => ({ name: item.category, value: item.spent }))
  }, [cardExpenses, filters.month, budgets, categories])

  const total = useMemo(() => categoryData.reduce((sum, d) => sum + d.value, 0), [categoryData])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header do Dashboard do Cartão */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-border/50 text-text-secondary transition-colors"
          aria-label="Voltar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style={{ backgroundColor: card.color }}
          >
            {card.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{card.name}</h2>
            <p className="text-xs text-text-tertiary">Dashboard detalhado do cartão</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Total Gasto</p>
          <p className="text-lg font-bold text-text-primary tabular-nums">{formatBRL(summary.totalSpent)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Transações</p>
          <p className="text-lg font-bold text-text-primary tabular-nums">{summary.count}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Pendentes</p>
          <p className="text-lg font-bold text-danger tabular-nums">{summary.pendingCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Gasto Este Mês</p>
          <p className="text-lg font-bold text-accent tabular-nums">{formatBRL(summary.currentMonthTotal)}</p>
        </div>
      </div>

      {/* Evolução de Uso do Cartão */}
      <div className="card p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
          Evolução de Uso (Últimos 6 Meses)
        </h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.monthlyEvolution} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const value = payload[0].value as number
                  return (
                    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs z-50">
                      <p className="font-medium text-text-primary capitalize mb-0.5">{label}</p>
                      <p className="text-accent font-bold tabular-nums">{formatBRL(value)}</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: 'var(--color-surface)' }}
                activeDot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: 'var(--color-surface)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Relatório de Parcelas */}
      <InstallmentsReport cardId={card.id} expenses={cardExpenses} />


      {/* Gráfico de Categorias do Cartão */}
      <div className="card p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
          Gastos por Categoria neste Cartão
        </h3>
        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-tertiary">Sem despesas neste cartão</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const { name, value } = payload[0].payload as { name: string; value: number }
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                      return (
                        <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs z-50">
                          <p className="font-medium text-text-primary">{name}</p>
                          <p className="text-text-secondary">{formatBRL(value)} ({percent}%)</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-wider text-text-tertiary mb-0.5">Total</p>
                  <p className="text-base font-bold text-text-primary leading-tight">{formatBRL(total)}</p>
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex-1 w-full space-y-2">
              {categoryData.slice(0, 8).map((entry, index) => {
                const percent = total > 0 ? (entry.value / total) * 100 : 0
                const color = COLORS[index % COLORS.length]
                return (
                  <div key={entry.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-text-primary truncate">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-text-tertiary text-[10px] tabular-nums">{percent.toFixed(0)}%</span>
                        <span className="text-text-primary font-medium tabular-nums">{formatBRL(entry.value)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
              {categoryData.length > 8 && (
                <p className="text-[10px] text-text-tertiary text-center pt-1">
                  +{categoryData.length - 8} outras categorias
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Componente de Relatório de Parcelas Expandido ---

interface InstallmentRow {
  expenseId: string
  description: string
  category: string
  installmentNumber: number
  totalInstallments: number
  dueDate: Date
  dueMonthKey: string
  value: number
  isPaid: boolean
}

function InstallmentsReport({ cardId, expenses }: { cardId: string; expenses: ReturnType<typeof useExpenseStore.getState>['expenses'] }) {
  const currentMonthKey = format(new Date(), 'yyyy-MM')
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthKey)

  // Gera todas as parcelas individuais de todas as despesas parceladas do cartão
  const allInstallments = useMemo<InstallmentRow[]>(() => {
    const rows: InstallmentRow[] = []
    const installmentsExpenses = expenses.filter((e) => e.cardId === cardId && e.installments > 1)

    for (const expense of installmentsExpenses) {
      const baseDate = parseISO(expense.date)
      const installmentValue = Math.round(expense.amount / expense.installments)
      const paidCount = expense.paidInstallments ?? 0

      for (let i = 0; i < expense.installments; i++) {
        const dueDate = addMonths(baseDate, i)
        const isPaid = i < paidCount
        rows.push({
          expenseId: expense.id,
          description: expense.description,
          category: expense.category,
          installmentNumber: i + 1,
          totalInstallments: expense.installments,
          dueDate,
          dueMonthKey: format(dueDate, 'yyyy-MM'),
          value: installmentValue,
          isPaid,
        })
      }
    }

    return rows.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }, [expenses, cardId])

  // Meses disponíveis para filtro
  const availableMonths = useMemo(() => {
    const months = new Set(allInstallments.map((r) => r.dueMonthKey))
    return Array.from(months).sort()
  }, [allInstallments])

  // Filtra pelo mês selecionado
  const filteredInstallments = useMemo(() => {
    if (monthFilter === 'all') return allInstallments
    return allInstallments.filter((r) => r.dueMonthKey === monthFilter)
  }, [allInstallments, monthFilter])

  // Resumo do filtro
  const summaryStats = useMemo(() => {
    const total = filteredInstallments.length
    const paid = filteredInstallments.filter((r) => r.isPaid).length
    const pending = total - paid
    const pendingValue = filteredInstallments.filter((r) => !r.isPaid).reduce((sum, r) => sum + r.value, 0)
    return { total, paid, pending, pendingValue }
  }, [filteredInstallments])

  const handlePayInstallment = (expenseId: string, currentPaid: number, totalInst: number) => {
    useExpenseStore.getState().updateExpense(expenseId, {
      paidInstallments: currentPaid + 1,
      isPaid: currentPaid + 1 >= totalInst,
    })
  }

  return (
    <div className="card p-6">
      {/* Header com título e filtro dinâmico */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Relatório de Parcelas
          </h3>
        </div>
        {/* Botões de filtro dinâmicos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMonthFilter(currentMonthKey)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              monthFilter === currentMonthKey
                ? 'bg-accent text-white shadow-sm'
                : 'bg-border/30 text-text-secondary hover:bg-border/50 hover:text-text-primary'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setMonthFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              monthFilter === 'all'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-border/30 text-text-secondary hover:bg-border/50 hover:text-text-primary'
            }`}
          >
            Todos
          </button>
          {availableMonths.length > 0 && (
            <div className="h-4 w-px bg-border/50 mx-1" />
          )}
          {availableMonths.map((m) => {
            const date = parseISO(`${m}-01`)
            const label = format(date, 'MMM/yy', { locale: ptBR })
            const isActive = monthFilter === m
            return (
              <button
                key={m}
                onClick={() => setMonthFilter(m)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 capitalize ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-border/30 text-text-secondary hover:bg-border/50 hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mini resumo do filtro */}
      {filteredInstallments.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-[10px] text-text-tertiary">
          <span>{summaryStats.total} parcelas</span>
          <span className="text-success">{summaryStats.paid} pagas</span>
          <span className="text-warning">{summaryStats.pending} pendentes</span>
          <span className="ml-auto font-medium text-text-secondary tabular-nums">
            Pendente: {formatBRL(summaryStats.pendingValue)}
          </span>
        </div>
      )}

      {filteredInstallments.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-text-tertiary">
            {allInstallments.length === 0
              ? 'Nenhuma despesa parcelada neste cartão'
              : 'Nenhuma parcela neste mês'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-text-tertiary">
                <th className="pb-2 pr-4 font-medium">Descrição</th>
                <th className="pb-2 pr-4 font-medium">Parcela</th>
                <th className="pb-2 pr-4 font-medium">Vencimento</th>
                <th className="pb-2 pr-4 font-medium text-right">Valor</th>
                <th className="pb-2 pr-4 font-medium text-center">Status</th>
                <th className="pb-2 font-medium text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredInstallments.map((row) => (
                <tr key={`${row.expenseId}-${row.installmentNumber}`} className="group hover:bg-border/20 transition-colors">
                  <td className="py-2.5 pr-4">
                    <p className="text-text-primary font-medium truncate max-w-[180px]">{row.description}</p>
                    <p className="text-[10px] text-text-tertiary">{row.category}</p>
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-text-secondary text-xs">
                    {row.installmentNumber}/{row.totalInstallments}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-text-secondary text-xs">
                    {format(row.dueDate, 'dd/MM/yyyy')}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-text-primary font-medium text-xs">
                    {formatBRL(row.value)}
                  </td>
                  <td className="py-2.5 pr-4 text-center">
                    {row.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        Paga
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    {!row.isPaid && (
                      <button
                        onClick={() => {
                          const expense = expenses.find((e) => e.id === row.expenseId)
                          if (expense) {
                            handlePayInstallment(row.expenseId, expense.paidInstallments ?? 0, expense.installments)
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-accent hover:text-accent/80 hover:bg-accent/10 px-2 py-1 rounded transition-colors"
                        title="Marcar parcela como paga"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}