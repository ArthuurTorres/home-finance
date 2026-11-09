import { useEffect, useMemo, useState } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, getBankSummary } from '../../utils/finance'

const PALETTE = [
  '#8B5CF6', '#F97316', '#EF4444', '#3B82F6', '#EAB308',
  '#14B8A6', '#EC4899', '#22C55E', '#06B6D4', '#A855F7',
]

export function BankOverview() {
  const banks = useExpenseStore((s) => s.banks)
  const addBank = useExpenseStore((s) => s.addBank)
  const updateBank = useExpenseStore((s) => s.updateBank)
  const removeBank = useExpenseStore((s) => s.removeBank)
  const expenses = useExpenseStore((s) => s.expenses)
  const filters = useExpenseStore((s) => s.filters)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])

  const summaries = useMemo(
    () => getBankSummary(banks, expenses, filters.month || 'all'),
    [banks, expenses, filters.month]
  )

  const total = useMemo(() => summaries.reduce((s, b) => s + b.total, 0), [summaries])

  useEffect(() => {
    if (!showAdd) setNewColor(PALETTE[0])
  }, [showAdd])

  function startEdit(id: string, name: string) {
    setEditingId(id)
    setEditName(name)
  }

  function saveEdit() {
    if (editingId && editName.trim()) updateBank(editingId, { name: editName.trim() })
    setEditingId(null)
    setEditName('')
  }

  function handleAdd() {
    if (!newName.trim()) return
    addBank({ name: newName.trim(), color: newColor })
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Bancos
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold hover:bg-accent/20 transition-colors"
        >
          + Novo
        </button>
      </div>

      {showAdd && (
        <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do banco"
            className="w-full bg-transparent text-[11px] text-text-primary placeholder-text-tertiary outline-none border-b border-border focus:border-accent transition-colors pb-1"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-tertiary uppercase tracking-wide">Cor:</span>
            <div className="flex flex-wrap gap-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  aria-label={`Cor ${c}`}
                  aria-pressed={newColor === c}
                  className={`w-4 h-4 rounded-full border-2 transition-transform ${
                    newColor === c ? 'border-text-primary scale-125' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="flex-1 text-[10px] font-bold bg-accent text-white rounded-lg py-1.5 hover:bg-accent/90 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName('') }}
              className="text-[10px] text-text-tertiary px-2 py-1.5 rounded-lg hover:bg-border/30 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {banks.length === 0 ? (
        <p className="text-center py-8 text-[10px] text-text-tertiary">
          Nenhum banco cadastrado.
          <br />
          Clique em "+ Novo" para adicionar.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {summaries.map((item) => {
            const { bank } = item
            const pct = item.percentage
            const isEditing = editingId === bank.id

            return (
              <li
                key={bank.id}
                className="bg-surface border border-border rounded-xl p-2.5 flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${bank.color}22` }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={bank.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-transparent text-[11px] text-text-primary outline-none border-b border-accent pb-0.5"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit() }}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-text-tertiary">Cor:</span>
                        <div className="flex flex-wrap gap-1">
                          {PALETTE.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => updateBank(bank.id, { color: c })}
                              aria-label={`Cor ${c}`}
                              aria-pressed={bank.color === c}
                              className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                                bank.color === c ? 'border-text-primary scale-125' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={saveEdit} className="text-[9px] font-bold bg-accent text-white rounded px-2 py-0.5">
                          Salvar
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-[9px] text-text-tertiary px-1">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-semibold text-text-primary truncate">{bank.name}</span>
                        <span className="text-[10px] font-bold text-text-secondary shrink-0">
                          {formatBRL(item.total)}
                        </span>
                      </div>
                      <div className="h-1 bg-border rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct.toFixed(0)}%`, backgroundColor: bank.color }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[9px] text-text-tertiary">
                          {item.transactions} transaç{item.transactions === 1 ? 'ão' : 'ões'}
                        </span>
                        <span className="text-[9px] text-text-tertiary font-medium">{pct.toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && bank.id !== 'no-bank' && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => startEdit(bank.id, bank.name)}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
                      aria-label={`Editar ${bank.name}`}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeBank(bank.id)}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                      aria-label={`Remover ${bank.name}`}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {banks.length > 0 && (
        <div className="mt-2 px-1 flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary uppercase tracking-wide">Total recebido</span>
          <span className="text-[11px] font-bold text-text-primary">{formatBRL(total)}</span>
        </div>
      )}
    </div>
  )
}