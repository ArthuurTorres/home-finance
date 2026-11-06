import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useExpenseStore } from '../../store/useExpenseStore'
import { getCategorySpending, formatBRL } from '../../utils/finance'

// Paleta harmoniosa com o tema do projeto
const COLORS = [
  '#f97316', // orange-500 (accent)
  '#38bdf8', // sky-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
  '#a78bfa', // violet-400
  '#fb7185', // rose-400
  '#2dd4bf', // teal-400
  '#818cf8', // indigo-400
]

export function CategoryChart() {
  const expenses = useExpenseStore((s) => s.expenses)
  const filters = useExpenseStore((s) => s.filters)
  const budgets = useExpenseStore((s) => s.budgets)
  const categories = useExpenseStore((s) => s.categories)

  const data = useMemo(() => {
    const month = filters.month && filters.month !== 'all' 
      ? filters.month 
      : new Date().toISOString().slice(0, 7)
    const spending = getCategorySpending(expenses, month, budgets, categories)
    return spending
      .filter((item) => item.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .map((item) => ({
        name: item.category,
        value: item.spent,
      }))
  }, [expenses, filters.month, budgets, categories])

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  if (data.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-text-tertiary">Sem despesas neste mês</p>
      </div>
    )
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Gastos por Categoria
      </h3>

      {/* Gráfico Centralizado + Total */}
      <div className="flex flex-col items-center py-2">
        <div className="w-40 h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
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
          
          {/* Total centralizado no donut */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-wider text-text-tertiary mb-0.5">Total</p>
              <p className="text-base font-bold text-text-primary leading-tight">{formatBRL(total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda Estruturada com Barra de Progresso */}
      <div className="space-y-2.5 mt-1">
        {data.slice(0, 6).map((entry, index) => {
          const percent = total > 0 ? (entry.value / total) * 100 : 0
          const color = COLORS[index % COLORS.length]
          return (
            <div key={entry.name} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-text-primary truncate">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-text-tertiary text-[10px] tabular-nums">{percent.toFixed(0)}%</span>
                  <span className="text-text-primary font-medium tabular-nums">{formatBRL(entry.value)}</span>
                </div>
              </div>
              {/* Barra de progresso visual */}
              <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
        
        {/* Indicador de mais categorias se houver */}
        {data.length > 6 && (
          <p className="text-[10px] text-text-tertiary text-center pt-1">
            +{data.length - 6} outras categorias
          </p>
        )}
      </div>
    </div>
  )
}