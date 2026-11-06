import { useMemo, useState } from 'react'
import { subMonths, startOfMonth } from 'date-fns'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, parseBRL, getFixedExpensesTotal } from '../../utils/finance'
import type { Expense } from '../../utils/finance'

export function FixedExpensesView() {
  const expenses = useExpenseStore((s) => s.expenses)
  const cards = useExpenseStore((s) => s.cards)
  const updateExpense = useExpenseStore((s) => s.updateExpense)
  const addExpense = useExpenseStore((s) => s.addExpense)
  const addToast = useExpenseStore((s) => s.addToast)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const fixedExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.isRecurring && e.type !== 'income')
      .sort((a, b) => a.dueDay - b.dueDay)
  }, [expenses])

  const totalMonthly = useMemo(() => {
    return fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  }, [fixedExpenses])

  const getCardName = (cardId: string) => {
    if (cardId === 'cash') return 'Dinheiro / PIX / Débito'
    return cards.find((c) => c.id === cardId)?.name || cardId
  }

  const handleStartEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setEditValue(formatBRL(expense.amount).replace('R$\u00a0', ''))
  }

  const handleSaveEdit = (id: string) => {
    const cents = parseBRL(editValue)
    if (cents <= 0) {
      addToast('Valor inválido.', 'error')
      return
    }
    updateExpense(id, { amount: cents })
    setEditingId(null)
    addToast('Valor da despesa fixa atualizado!', 'success')
  }

  const handleGenerateTransaction = (template: Expense) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    // Usa o dia atual para garantir que a transação seja contabilizada no mês vigente
    const day = String(now.getDate()).padStart(2, '0')
    const date = `${year}-${month}-${day}`

    // Verifica se já existe transação idêntica neste mês para evitar duplicidade acidental
    const alreadyExists = expenses.some(
      (e) =>
        !e.isRecurring &&
        e.description === template.description &&
        e.date.startsWith(`${year}-${month}`)
    )

    if (alreadyExists) {
      addToast('Já existe uma transação com este nome neste mês.', 'info')
      return
    }

    addExpense({
      description: template.description,
      amount: template.amount,
      category: template.category,
      cardId: template.cardId,
      date,
      isPaid: false,
      isRecurring: false,
      type: 'expense',
      installments: 1,
      paidInstallments: 0,
      dueDay: Math.min(template.dueDay, 28),
    })
    addToast(`"${template.description}" lançada em ${month}/${year}!`, 'success')
  }

  if (fixedExpenses.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-border/30 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Nenhuma despesa fixa</h3>
        <p className="text-sm text-text-tertiary max-w-xs">
          Registre despesas recorrentes como aluguel, internet ou assinaturas para vê-las aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Despesas Fixas</h2>
          <p className="text-xs text-text-tertiary mt-0.5">Compromissos mensais recorrentes</p>
        </div>
        <div className="card px-4 py-2 bg-accent/5 border-accent/20">
          <p className="text-[10px] uppercase tracking-wider text-accent mb-0.5">Total Mensal</p>
          <p className="text-lg font-bold text-accent tabular-nums">{formatBRL(totalMonthly)}</p>
        </div>
      </div>

      {/* Lista de Despesas Fixas */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Dia</th>
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Descrição</th>
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold hidden md:table-cell">Categoria</th>
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold hidden sm:table-cell">Pagamento</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Valor</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {fixedExpenses.map((expense) => {
              const isEditing = editingId === expense.id
              return (
                <tr key={expense.id} className="hover:bg-surface/30 transition-colors group">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent font-bold text-xs tabular-nums">
                      {expense.dueDay}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-text-primary truncate max-w-[200px]">{expense.description}</p>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-border/30 text-text-secondary text-[10px] font-medium">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <p className="text-text-secondary text-xs truncate max-w-[120px]">{getCardName(expense.cardId)}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(expense.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          className="w-28 px-2 py-1 text-right text-sm font-semibold text-text-primary bg-surface border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 tabular-nums"
                          placeholder="0,00"
                        />
                        <button
                          onClick={() => handleSaveEdit(expense.id)}
                          className="p-1 rounded-md text-success hover:bg-success/10 transition-colors"
                          title="Salvar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-md text-text-tertiary hover:bg-border/50 transition-colors"
                          title="Cancelar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(expense)}
                        className="font-semibold text-text-primary tabular-nums hover:text-accent transition-colors cursor-pointer group/edit"
                        title="Clique para editar o valor (contas variáveis)"
                      >
                        <span className="group-hover/edit:underline decoration-accent/30 underline-offset-2">
                          {formatBRL(expense.amount)}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block ml-1.5 text-text-tertiary opacity-0 group-hover/edit:opacity-100 transition-opacity" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleGenerateTransaction(expense)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent hover:text-white transition-all active:scale-95"
                      title="Lançar esta despesa no mês atual"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="hidden sm:inline">Lançar</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Histórico Mensal com Gráfico de Tendência */}
      <FixedHistoryChart expenses={expenses} />

      {/* Dica informativa */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/5 border border-info/20">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-info shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
        <div className="text-xs text-text-secondary leading-relaxed space-y-1">
          <p>
            <strong className="text-text-primary">Editar valor:</strong> clique no valor de qualquer despesa para ajustá-lo (ideal para contas variáveis como água e luz). O novo valor será usado nas próximas projeções.
          </p>
          <p>
            <strong className="text-text-primary">Lançar:</strong> gera uma transação real no mês atual com os dados da despesa fixa, sem alterar o cadastro original.
          </p>
        </div>
      </div>
    </div>
  )
}

// --- Componente de Histórico Mensal com Gráfico de Tendência ---
function FixedHistoryChart({ expenses }: { expenses: Expense[] }) {
  const historyData = useMemo(() => {
    const months: { label: string; total: number; monthKey: string }[] = []
    const now = startOfMonth(new Date())
    // Últimos 6 meses (incluindo o atual)
    for (let i = 5; i >= 0; i--) {
      const target = subMonths(now, i)
      const monthKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(target)

      // Usa getFixedExpensesTotal que soma TODAS as despesas recorrentes ativas
      // independente de isPaid, garantindo que o gráfico sempre mostre o compromisso mensal
      const total = getFixedExpensesTotal(expenses, target)

      months.push({ label, total, monthKey })
    }
    return months
  }, [expenses])

  const maxTotal = Math.max(...historyData.map((d) => d.total), 1)
  const currentTotal = historyData[historyData.length - 1]?.total ?? 0
  const prevTotal = historyData[historyData.length - 2]?.total ?? 0
  const trend = currentTotal - prevTotal
  const trendPercent = prevTotal > 0 ? Math.round((trend / prevTotal) * 100) : 0

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Histórico de Despesas Fixas</h3>
          <p className="text-xs text-text-secondary mt-1">Evolução dos últimos 6 meses</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-text-primary">{formatBRL(currentTotal)}</div>
          <div className={`text-xs font-medium ${trend > 0 ? 'text-warning' : trend < 0 ? 'text-success' : 'text-text-secondary'}`}>
            {trend === 0 ? 'Estável' : `${trend > 0 ? '+' : ''}${trendPercent}% vs mês anterior`}
          </div>
        </div>
      </div>

      {/* Gráfico de Barras SVG */}
      <div className="relative h-40 sm:h-48 w-full flex items-end justify-between gap-2 px-2">
        {historyData.map((d, idx) => {
          const heightPercent = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0
          const isCurrent = idx === historyData.length - 1
          return (
            <div key={d.monthKey} className="flex-1 h-full flex flex-col items-center gap-1 group relative">
              {/* Tooltip no hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-text-primary text-surface text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                {formatBRL(d.total)}
              </div>
              {/* Container da barra com altura flexível */}
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${
                    isCurrent ? 'bg-accent' : 'bg-border hover:bg-accent/50'
                  }`}
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
              </div>
              {/* Label do mês */}
              <span className={`text-[10px] capitalize ${isCurrent ? 'text-accent font-semibold' : 'text-text-secondary'}`}>
                {d.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Linha de base */}
      <div className="mt-2 border-t border-border/50" />
    </div>
  )
}