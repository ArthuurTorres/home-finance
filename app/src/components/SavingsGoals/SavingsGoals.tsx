import { useState } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL } from '../../utils/finance'

export function SavingsGoals() {
  const goals = useExpenseStore((s) => s.goals)
  const addGoal = useExpenseStore((s) => s.addGoal)
  const removeGoal = useExpenseStore((s) => s.removeGoal)
  const contributeToGoal = useExpenseStore((s) => s.contributeToGoal)

  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [contributingId, setContributingId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')

  const completedCount = goals.filter((g) => g.currentAmount >= g.targetAmount).length
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)

  function handleAdd() {
    if (!newName.trim() || !newTarget) return
    const cents = Math.round(parseFloat(newTarget.replace(/[^\d]/g, '')) * 100) || 0
    if (cents <= 0) return
    
    addGoal({
      name: newName.trim(),
      targetAmount: cents,
      currentAmount: 0,
    })
    setNewName('')
    setNewTarget('')
    setIsAdding(false)
  }

  function handleContribute(id: string, amount: string) {
    const cents = Math.round(parseFloat(amount.replace(/[^\d]/g, '')) * 100) || 0
    if (cents > 0) contributeToGoal(id, cents)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-nude-800">Metas de Poupança</h3>
        {!isAdding && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsAdding(true)
            }}
            className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 transition-colors"
          >
            + Nova Meta
          </button>
        )}
      </div>

      {goals.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 rounded-md bg-terracotta-50 text-terracotta-700 text-[11px] font-semibold">
            🎯 {completedCount}/{goals.length} concluída(s)
          </span>
          <span className="px-2 py-1 rounded-md bg-nude-100 text-nude-600 text-[11px] font-medium">
            {formatBRL(totalSaved)} guardado de {formatBRL(totalTarget)}
          </span>
        </div>
      )}

      {isAdding && (
        <div className="p-4 rounded-xl bg-white border border-terracotta-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
          <input
            autoFocus
            placeholder="Nome da meta (ex: Viagem, Reserva)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-nude-50 border border-nude-200 rounded-lg focus:border-terracotta-400 outline-none"
          />
          <input
            placeholder="Valor alvo (R$)"
            inputMode="numeric"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-nude-50 border border-nude-200 rounded-lg focus:border-terracotta-400 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 py-2 text-xs font-bold text-white bg-terracotta-500 rounded-lg hover:bg-terracotta-600 transition-colors"
            >
              Criar Meta
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-medium text-nude-600 bg-nude-100 rounded-lg hover:bg-nude-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {goals.length === 0 && !isAdding && (
          <div className="p-6 text-center rounded-xl border border-dashed border-nude-200 text-nude-400 text-sm">
            Nenhuma meta definida. Crie sua primeira meta para acompanhar seu progresso!
          </div>
        )}

        {goals.map((goal) => {
          const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
          const isComplete = goal.currentAmount >= goal.targetAmount
          return (
            <div key={goal.id} className="p-4 rounded-xl bg-white/60 border border-nude-100 hover:border-nude-200 transition-all group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className={`font-display font-medium ${isComplete ? 'text-emerald-600' : 'text-nude-800'}`}>
                    {goal.name}
                  </h4>
                  <p className="text-xs text-nude-500 mt-0.5">
                    {formatBRL(goal.currentAmount)} de {formatBRL(goal.targetAmount)}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                  isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-nude-100 text-nude-600'
                }`}>
                  {percentage}%
                </span>
              </div>

                {isComplete && (
                  <span className="inline-block mb-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    🎉 Meta atingida!
                  </span>
                )}

              {/* Barra de Progresso */}
              <div className="relative h-2 w-full bg-nude-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${
                    isComplete ? 'bg-emerald-400' : 'bg-terracotta-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Ações */}
              {contributingId === goal.id ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <input
                    autoFocus
                    placeholder="Valor (R$)"
                    inputMode="numeric"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleContribute(goal.id, contributeAmount)
                        setContributingId(null)
                        setContributeAmount('')
                      }
                      if (e.key === 'Escape') {
                        setContributingId(null)
                        setContributeAmount('')
                      }
                    }}
                    className="flex-1 px-2 py-1.5 text-xs bg-nude-50 border border-nude-200 rounded-md focus:border-terracotta-400 outline-none"
                  />
                  <button
                    onClick={() => {
                      handleContribute(goal.id, contributeAmount)
                      setContributingId(null)
                      setContributeAmount('')
                    }}
                    className="px-3 py-1.5 text-[10px] font-bold text-white bg-terracotta-500 rounded-md hover:bg-terracotta-600 transition-colors"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => {
                      setContributingId(null)
                      setContributeAmount('')
                    }}
                    className="px-3 py-1.5 text-[10px] font-medium text-nude-600 bg-nude-100 rounded-md hover:bg-nude-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isComplete && (
                    <button
                      onClick={() => {
                        setContributingId(goal.id)
                        setContributeAmount('')
                      }}
                      className="flex-1 py-1.5 text-[10px] font-bold text-terracotta-600 bg-terracotta-50 rounded-md hover:bg-terracotta-100 transition-colors"
                    >
                      Contribuir
                    </button>
                  )}
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="px-3 py-1.5 text-[10px] font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}