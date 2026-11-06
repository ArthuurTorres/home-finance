import { useState } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function CategoryManager() {
  const categories = useExpenseStore((s) => s.categories)
  const addCategory = useExpenseStore((s) => s.addCategory)
  const removeCategory = useExpenseStore((s) => s.removeCategory)
  const renameCategory = useExpenseStore((s) => s.renameCategory)

  const [newName, setNewName] = useState('')
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    addCategory(newName)
    setNewName('')
  }

  function startRename(name: string) {
    setEditingName(name)
    setEditValue(name)
  }

  function confirmRename(oldName: string) {
    if (editValue.trim() && editValue !== oldName) {
      renameCategory(oldName, editValue)
    }
    setEditingName(null)
    setEditValue('')
  }

  return (
    <div className="space-y-5">
      {/* Formulário de nova categoria */}
      <form onSubmit={handleAdd} className="relative group">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Adicionar nova categoria..."
          className="w-full px-4 py-3 pl-11 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm"
        />
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <button
          type="submit"
          disabled={!newName.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-0 disabled:pointer-events-none transition-all shadow-sm"
        >
          Adicionar
        </button>
      </form>

      {/* Lista de categorias */}
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto hud-scroll pr-1">
        {categories.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-tertiary">
            Nenhuma categoria cadastrada ainda.
          </div>
        ) : (
          categories.map((cat) => {
            const color = getColor(cat)
            const isEditing = editingName === cat

            return (
              <div
                key={cat}
                className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                  isEditing
                    ? 'bg-surface border-accent shadow-sm'
                    : 'bg-surface border-transparent hover:bg-surface-muted hover:border-border'
                }`}
              >
                {/* Avatar colorido */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold uppercase"
                  style={{ backgroundColor: color }}
                >
                  {cat.charAt(0)}
                </div>

                {/* Nome / Input de edição */}
                {isEditing ? (
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => confirmRename(cat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename(cat)
                      if (e.key === 'Escape') {
                        setEditingName(null)
                        setEditValue('')
                      }
                    }}
                    className="flex-1 min-w-0 px-2 py-1 text-sm bg-surface border border-accent rounded-md outline-none text-text-primary font-medium"
                  />
                ) : (
                  <span className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate cursor-pointer select-none" onDoubleClick={() => startRename(cat)}>
                    {cat}
                  </span>
                )}

                {/* Ações */}
                <div className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-200 ${isEditing ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button
                    onClick={() => startRename(cat)}
                    title="Renomear"
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeCategory(cat)}
                    title="Excluir"
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Rodapé informativo */}
      <p className="text-[11px] text-text-tertiary text-center pt-2 border-t border-border/50">
        {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'} · Clique duas vezes para renomear
      </p>
    </div>
  )
}