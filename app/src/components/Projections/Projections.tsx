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
  getCurrentMonthTotal,
  getTotalDebt,
  getMonthlySummary,
  formatBRL,
} from '../../utils/finance'

/* ── Tooltip escuro e minimalista ── */
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const cents = payload[0].payload.cents
  const isCurrentMonth = payload[0].payload.name?.includes('Atual') || label?.includes('Atual')

  return (
    <div className="bg-text-primary text-surface rounded-xl px-4 py-3 shadow-xl border border-border-strong">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">{label}</p>
      <p className="text-lg font-display font-semibold text-surface">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
      </p>
      {cents > 0 && (
        <p className="text-[10px] text-text-tertiary mt-0.5">
          {isCurrentMonth ? 'Mês atual' : 'Projeção'}
        </p>
      )}
    </div>
  )
}

export function Projections() {
  const expenses = useExpenseStore((s) => s.expenses)

  const projections = useMemo(() => generateProjections(expenses, 6), [expenses])
  const currentTotal = useMemo(() => getCurrentMonthTotal(expenses), [expenses])
  const totalDebt = useMemo(() => getTotalDebt(expenses), [expenses])
  const nextMonthTotal = projections[1]?.total ?? 0

  const chartData = projections.map((p) => ({
    name: p.label,
    value: p.total / 100,
    cents: p.total,
  }))

  return (
    <div className="space-y-6">
      {/* ── Métricas principais com hierarquia refinada ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Contas do Mês */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
          <p className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-3">
            Contas do Mês
          </p>
          <p className="text-2xl font-display font-bold text-text-primary leading-none">
            {formatBRL(currentTotal)}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1.5">Total deste mês</p>
        </div>

        {/* Contas Próximo Mês */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
          <p className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-3">
            Contas Próx. Mês
          </p>
          <p className="text-2xl font-display font-bold text-accent leading-none">
            {formatBRL(nextMonthTotal)}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1.5">Previsão total</p>
        </div>

        {/* Dívida Total */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-text-tertiary to-transparent opacity-40" />
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
            Dívida Total
          </p>
          <p className="text-2xl font-display font-bold text-text-primary leading-none">
            {formatBRL(totalDebt)}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1.5">
            {totalDebt > 0 ? 'Em aberto' : 'Sem dívidas'}
          </p>
        </div>
      </div>

      {/* ── Gráfico de projeção com tooltip escuro ── */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm">
        <div className="flex items-baseline gap-2 mb-6">
          <h3 className="text-lg font-display font-semibold text-text-primary">
            Projeção dos Próximos 6 Meses
          </h3>
          <span className="text-[10px] text-text-tertiary font-medium">
            Valores estimados
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
                {chartData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#d4603a' : '#9ca3af'}
                    fillOpacity={index === 0 ? 1 : 0.55 + 0.45 * (1 - index / chartData.length)}
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
          const isPositive = summary.balance >= 0
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
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger'
                }`}>
                  {isPositive ? '+' : ''}{formatBRL(summary.balance)}
                </span>
              </div>

              {/* Barra de confronto */}
              <div className="flex h-3 rounded-full overflow-hidden bg-border/30">
                {/* Receita (verde, cresce da esquerda) */}
                <div
                  className="h-full bg-success transition-all duration-700 ease-out relative group"
                  style={{ width: `${incomePct}%` }}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
                </div>
                {/* Despesa (vermelho, cresce da direita) */}
                <div
                  className="h-full bg-warning transition-all duration-700 ease-out relative group"
                  style={{ width: `${expensePct}%` }}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
                </div>
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
                  <span className="w-2 h-2 rounded-full bg-warning" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
