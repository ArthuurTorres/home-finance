import { useMemo } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL } from '../../utils/finance'

interface Insight {
  id: string
  type: 'warning' | 'success' | 'info' | 'action'
  title: string
  message: string
  value?: number
}

export function SmartInsights() {
  const expenses = useExpenseStore((s) => s.expenses)
  const cards = useExpenseStore((s) => s.cards)

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = []
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = (() => {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })()

    // Filtra despesas dos últimos 2 meses
    const currentExpenses = expenses.filter(e => e.date.startsWith(currentMonth) && e.type === 'expense')
    const lastExpenses = expenses.filter(e => e.date.startsWith(lastMonth) && e.type === 'expense')

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0)
    const lastTotal = lastExpenses.reduce((sum, e) => sum + e.amount, 0)

    // 1. Tendência de gastos (comparação mensal)
    if (lastTotal > 0) {
      const variation = ((currentTotal - lastTotal) / lastTotal) * 100
      if (variation > 15) {
        result.push({
          id: 'trend-up',
          type: 'warning',
          title: 'Gastos em alta',
          message: `Seus gastos aumentaram ${variation.toFixed(0)}% em relação ao mês passado. Considere revisar as categorias com maior crescimento.`,
          value: currentTotal,
        })
      } else if (variation < -10) {
        result.push({
          id: 'trend-down',
          type: 'success',
          title: 'Boa economia!',
          message: `Você reduziu ${Math.abs(variation).toFixed(0)}% dos gastos em relação ao mês passado. Continue assim!`,
          value: currentTotal,
        })
      }
    }

    // 2. Categoria dominante (agregação direta para evitar dependência de budgets/month)
    const spendingByCategory: Record<string, number> = {}
    for (const e of currentExpenses) {
      spendingByCategory[e.category] = (spendingByCategory[e.category] || 0) + e.amount
    }
    const sortedCategories = Object.entries(spendingByCategory).sort((a, b) => b[1] - a[1])
    if (sortedCategories.length > 0) {
      const [topName, topAmount] = sortedCategories[0]
      const topPct = currentTotal > 0 ? (topAmount / currentTotal) * 100 : 0
      if (topPct > 40) {
        result.push({
          id: 'top-category',
          type: 'info',
          title: `Maior gasto: ${topName}`,
          message: `Esta categoria representa ${topPct.toFixed(0)}% do seu orçamento este mês (${formatBRL(topAmount)}).`,
          value: topAmount,
        })
      }
    }

    // 3. Cartão mais utilizado
    if (cards.length > 1) {
      const cardUsage = cards.map(card => ({
        name: card.name,
        total: currentExpenses.filter(e => e.cardId === card.id).reduce((sum, e) => sum + e.amount, 0),
      })).sort((a, b) => b.total - a.total)

      if (cardUsage[0].total > 0 && cardUsage[0].total > (cardUsage[1]?.total ?? 0) * 1.5) {
        result.push({
          id: 'card-concentration',
          type: 'action',
          title: `Concentração no ${cardUsage[0].name}`,
          message: `${formatBRL(cardUsage[0].total)} concentrados em um único cartão. Diversificar pode ajudar no controle de limites.`,
          value: cardUsage[0].total,
        })
      }
    }

    // 4. Despesas parceladas pendentes
    const pendingInstallments = currentExpenses.filter(e => 
      e.installments > 1 && (e.paidInstallments ?? 0) < e.installments
    )
    if (pendingInstallments.length >= 3) {
      const pendingTotal = pendingInstallments.reduce((sum, e) => {
        const remaining = e.installments - (e.paidInstallments ?? 0)
        const installmentValue = e.amount / e.installments
        return sum + (remaining * installmentValue)
      }, 0)
      result.push({
        id: 'installments-alert',
        type: 'warning',
        title: 'Parcelas acumulando',
        message: `Você tem ${pendingInstallments.length} compras parceladas ativas. Total futuro comprometido: ${formatBRL(pendingTotal)}.`,
        value: pendingTotal,
      })
    }

    // 5. Dica geral quando não há alertas críticos
    if (result.length === 0) {
      result.push({
        id: 'healthy',
        type: 'success',
        title: 'Finanças saudáveis',
        message: 'Seus gastos estão estáveis e bem distribuídos. Continue acompanhando para manter o controle.',
      })
    }

    return result.slice(0, 4) // Máximo de 4 insights para não poluir
  }, [expenses, cards])

  const iconMap = {
    warning: (
      <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    action: (
      <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  }

  const bgMap = {
    warning: 'bg-warning/5 border-warning/20',
    success: 'bg-success/5 border-success/20',
    info: 'bg-accent/5 border-accent/20',
    action: 'bg-surface-muted border-border',
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Insights Inteligentes
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${bgMap[insight.type]}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {iconMap[insight.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary leading-tight">
                  {insight.title}
                </p>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}