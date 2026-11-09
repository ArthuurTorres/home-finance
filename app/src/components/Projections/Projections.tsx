import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useExpenseStore } from '../../store/useExpenseStore'
import {
  generateProjections,
  getTotalDebt,
  getMonthlySummary,
  getBalanceSeverity,
  getMonthEntries,
  getMonthKey,
  formatBRL,
  type BalanceSeverity,
} from '../../utils/finance'

const SEVERITY_STYLE: Record<BalanceSeverity, { badge: string; dot: string }> = {
  positive: { badge: 'bg-success/10 text-success', dot: 'bg-success' },
  warning: { badge: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  danger: { badge: 'bg-danger/10 text-danger', dot: 'bg-danger' },
}

/* ── Tooltip escuro e minimalista ── */
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const brl = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

  return (
    <div className="bg-text-primary text-surface rounded-xl px-4 py-3 shadow-xl border border-border-strong min-w-[190px]">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-text-tertiary">Receitas</span>
          <span className="text-sm font-display font-semibold text-green-400">{brl(row.income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-text-tertiary">Despesas</span>
          <span className="text-sm font-display font-semibold text-surface">{brl(row.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 mt-1.5 border-t border-white/10">
          <span className="text-[11px] text-text-tertiary">Saldo</span>
          <span
            className={`text-sm font-display font-bold ${
              row.severity === 'danger'
                ? 'text-red-400'
                : row.severity === 'warning'
                  ? 'text-amber-400'
                  : 'text-green-400'
            }`}
          >
            {brl(row.balance)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function Projections() {
  const expenses = useExpenseStore((s) => s.expenses)

  const projections = useMemo(() => generateProjections(expenses, 6), [expenses])
  const totalDebt = useMemo(() => getTotalDebt(expenses), [expenses])

  // Total do mês corrente vem do helper canônico (inclui recorrentes e parcelas)
  const currentTotal = useMemo(
    () =>
      getMonthEntries(expenses, getMonthKey())
        .filter(({ expense }) => expense.type !== 'income')
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )
  const nextMonthTotal = projections[1]?.total ?? 0

  const chartData = projections.map((p) => {
    const summary = getMonthlySummary(expenses, p.month)
    return {
      name: p.label,
      value: summary.expense / 100,
      income: summary.income / 100,
      balance: summary.balance,
      severity: getBalanceSeverity(summary.balance, summary.income),
    }
  })

  return (
    <div className="space-y-6">
      {/* ── Métricas principais com hierarquia refinada ── */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4">
        {/* Contas do Mês */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
          <p className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-3">
            Despesas do Mês
          </p>
          <p className="text-xl sm:text-2xl font-display font-bold text-text-primary leading-none">
            {formatBRL(currentTotal)}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1.5">Saídas previstas neste mês</p>
        </div>

        {/* Despesas Próximo Mês */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
          <p className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-3">
            Despesas Próx. Mês
          </p>
          <p className="text-xl sm:text-2xl font-display font-bold text-accent leading-none">
            {formatBRL(nextMonthTotal)}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1.5">
            {projections[1]?.income
              ? `Receitas: ${formatBRL(projections[1].income)}`
              : 'Saídas previstas'}
          </p>
        </div>

        {/* Dívida */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-danger to-transparent opacity-60" />
          <p className="text-[10px] font-semibold text-danger uppercase tracking-widest mb-3">
            Dívida Restante
          </p>
          <p className="text-xl sm:text-2xl font-display font-bold text-text-primary leading-none">
            {formatBRL(totalDebt)}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1.5">Parcelas a pagar</p>
        </div>
      </div>

      {/* ── Projeção dos Próximos 6 Meses ── */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-base font-display font-semibold text-text-primary">
            Projeção dos Próximos 6 Meses
          </h3>
          <span className="text-[10px] text-text-tertiary font-medium">
            Despesas estimadas
          </span>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$ ${v}`}
                width={64}
              />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(212, 96, 58, 0.06)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.severity === 'danger'
                        ? '#dc2626'
                        : entry.severity === 'warning'
                          ? '#d97706'
                          : index === 0
                            ? '#d4603a'
                            : '#9ca3af'
                    }
                    fillOpacity={index === 0 || entry.severity !== 'positive' ? 1 : 0.55 + 0.45 * (1 - index / chartData.length)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Batalha Financeira: Receitas vs Despesas ── */}
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-display font-semibold text-text-primary">
            Batalha Financeira
          </h3>
          <span className="text-[10px] text-text-tertiary font-medium">
            Receitas × Despesas por mês
          </span>
        </div>

        {projections.map((proj, i) => {
          const summary = getMonthlySummary(expenses, proj.month)
          const total = summary.income + summary.expense
          const hasMovement = total > 0
          const incomePct = hasMovement ? (summary.income / total) * 100 : 0
          const expensePct = hasMovement ? (summary.expense / total) * 100 : 0
          const severity = getBalanceSeverity(summary.balance, summary.income)
          const isCurrentMonth = i === 0

          return (
            <div
              key={proj.month}
              className="p-4 rounded-xl bg-surface border border-border hover:border-border-strong transition-all duration-200"
            >
              {/* Header da linha */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {proj.label}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_STYLE[severity].badge}`}>
                  {severity !== 'danger' && summary.balance > 0 ? '+' : ''}
                  {formatBRL(summary.balance)}
                </span>
              </div>

              {/* Barra de confronto */}
              <div className="flex h-3 rounded-full overflow-hidden bg-border/30">
                {/* Receita (verde, cresce da esquerda) */}
                <div
                  className="h-full bg-success transition-all duration-700 ease-out"
                  style={{ width: `${incomePct}%` }}
                />
                {/* Despesa (vermelho, cresce da direita) */}
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    severity === 'danger' ? 'bg-danger' : 'bg-warning'
                  }`}
                  style={{ width: `${expensePct}%` }}
                />
              </div>

              {/* Legenda com valores */}
              <div className="flex justify-between mt-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-text-secondary">Receitas</span>
                  <span className="font-semibold text-text-primary">{formatBRL(summary.income)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-text-primary">{formatBRL(summary.expense)}</span>
                  <span className="text-text-secondary">Despesas</span>
                  <span className={`w-2 h-2 rounded-full ${SEVERITY_STYLE[severity].dot}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}