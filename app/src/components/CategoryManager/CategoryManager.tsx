import { useState, useRef, useEffect } from 'react'
import { Tags, Plus, Pencil, Trash2, Check, RotateCcw } from 'lucide-react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { createPortal } from 'react-dom'
import {
  CATEGORY_ICON_CATALOG,
  getCategoryIcon,
  getIconByKey,
  getIconLabel,
} from '../../utils/categoryIcons'
import { ManagerShell } from '../ManagerShell/ManagerShell'
import { DeleteWithRedirectModal } from '../DeleteWithRedirectModal/DeleteWithRedirectModal'

interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'list' | 'add' | 'edit'

type PickerTarget = { kind: 'new' } | { kind: 'cat'; cat: string }

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const {
    categories, addCategory, removeCategory, renameCategory,
    categoryIcons, setCategoryIcon, addToast, expenses,
  } = useExpenseStore()

  const [mode, setMode] = useState<Mode>('list')
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Nova categoria
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('alimentacao')

  // Edição
  const [editName, setEditName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMode('list')
      setEditingCat(null)
      setDeleteTarget(null)
      setNewName('')
      setNewIcon('alimentacao')
      setRenaming(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (mode === 'add' || mode === 'edit') {
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return

    if (mode === 'add') {
      if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        addToast('Essa categoria já existe.', 'error')
        return
      }
      addCategory(trimmed)
      setCategoryIcon(trimmed, newIcon)
      addToast(`"${trimmed}" criada.`, 'success')
      setNewName('')
      setNewIcon('alimentacao')
    } else if (editingCat) {
      if (trimmed !== editingCat) {
        if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase() && c !== editingCat)) {
          addToast('Já existe uma categoria com esse nome.', 'error')
          return
        }
        renameCategory(editingCat, trimmed)
        addToast(`"${trimmed}" atualizada.`, 'success')
      }
      setEditingCat(null)
      setRenaming(false)
    }
    setMode('list')
  }

  const startEdit = (cat: string) => {
    setEditingCat(cat)
    setEditName(cat)
    setRenaming(false)
    setNewName(cat)
    setMode('edit')
  }

  const startRename = (cat: string) => {
    setRenaming(true)
    setEditName(cat)
  }

  const cancelEdit = () => {
    setEditingCat(null)
    setRenaming(false)
    setMode('list')
  }

  const confirmDelete = (redirectToId?: string) => {
    if (!deleteTarget) return
    removeCategory(deleteTarget, redirectToId)
    setDeleteTarget(null)
  }

  const linkedCount = deleteTarget
    ? expenses.filter((e) => e.category === deleteTarget).length
    : 0

  // ── Picker de ícone em portal ──────────────────────────────────────────────
  const [picker, setPicker] = useState<PickerTarget | null>(null)
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null)
  const pickerAnchor = useRef<HTMLElement | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const placePicker = () => {
    const r = pickerAnchor.current?.getBoundingClientRect()
    if (!r) return
    setPickerPos({
      top: Math.max(8, Math.min(r.bottom + 6, window.innerHeight - 288)),
      left: Math.max(8, Math.min(r.left, window.innerWidth - 256)),
    })
  }

  useEffect(() => {
    if (!picker) { setPickerPos(null); return }
    placePicker()
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (pickerRef.current?.contains(t) || pickerAnchor.current?.contains(t)) return
      setPicker(null)
    }
    const onScroll = () => placePicker()
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [picker])

  const openPicker = (target: PickerTarget, el: HTMLElement) => {
    pickerAnchor.current = el
    setPicker(target)
  }

  const chooseIcon = (key: string) => {
    if (!picker) return
    if (picker.kind === 'new') {
      setNewIcon(key)
    } else {
      setCategoryIcon(picker.cat, key)
      addToast(`Ícone de "${picker.cat}" atualizado.`, 'success')
    }
    setPicker(null)
  }

  const pickerActive =
    picker?.kind === 'new' ? newIcon : picker ? categoryIcons[picker.cat] ?? '' : ''

  const iconPicker = picker && pickerPos
    ? createPortal(
        <div
          ref={pickerRef}
          style={{ top: pickerPos.top, left: pickerPos.left }}
          className="fixed z-[60] w-60 max-h-64 overflow-y-auto scrollbar-thin bg-surface rounded-xl shadow-xl border border-border p-2 grid grid-cols-5 gap-1"
        >
          {CATEGORY_ICON_CATALOG.map(({ key, label, icon: Icon }) => {
            const active = key === pickerActive
            return (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => chooseIcon(key)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  active
                    ? 'bg-accent text-white scale-110'
                    : 'bg-surface-muted text-text-secondary hover:bg-surface-hover hover:scale-105'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </button>
            )
          })}
        </div>,
        document.body,
      )
    : null

  // ── Formulário (add / edit) ─────────────────────────────────────────────────
  if (mode === 'add' || mode === 'edit') {
    const currentIcon = mode === 'add' ? newIcon : (editingCat ? categoryIcons[editingCat] ?? '' : '')
    const currentIconLabel = getIconLabel(currentIcon || undefined)
    const IconComp = getIconByKey(currentIcon)

    return (
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'add' ? 'Nova categoria' : 'Editar categoria'}
        subtitle="Escolha um ícone e um nome"
        accent="#e07a5f"
        icon={<Tags size={20} />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ícone clicável */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={(e) => openPicker({ kind: mode === 'add' ? 'new' : 'cat', cat: editingCat ?? '' }, e.currentTarget)}
              className="w-16 h-16 rounded-2xl bg-surface-muted border-2 border-dashed border-border flex items-center justify-center hover:border-accent transition-colors group"
              title={`Ícone: ${currentIconLabel} — clique para trocar`}
              aria-label={`Ícone: ${currentIconLabel} — clique para trocar`}
            >
              <IconComp size={28} className="text-text-tertiary group-hover:text-accent transition-colors" />
            </button>
          </div>

          <div>
            <label htmlFor="cat-name" className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Nome
            </label>
            <input
              ref={nameRef}
              id="cat-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && cancelEdit()}
              placeholder="Ex: Alimentação, Transporte..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-muted border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-tertiary"
              required
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-muted transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm"
            >
              {mode === 'add' ? 'Criar categoria' : 'Salvar'}
            </button>
          </div>
        </form>
      </ManagerShell>
    )
  }

  // ── Lista ───────────────────────────────────────────────────────────────────
  return (
    <>
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciar categorias"
        subtitle={`${categories.length} ${categories.length === 1 ? 'categoria' : 'categorias'}`}
        accent="#e07a5f"
        icon={<Tags size={20} />}
        footer={
          <button
            onClick={() => setMode('add')}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Adicionar categoria
          </button>
        }
      >
        {categories.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-muted mx-auto mb-3 flex items-center justify-center">
              <Tags size={28} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Nenhuma categoria cadastrada</p>
            <p className="text-xs text-text-tertiary mt-1">Adicione a primeira abaixo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const isEditing = editingCat === cat
              const iconKey = categoryIcons[cat] ?? ''
              const IconComp = getCategoryIcon(cat, categoryIcons)

              return (
                <div
                  key={cat}
                  className="group flex items-center gap-3.5 p-3 rounded-xl border border-border hover:bg-surface-muted transition-all duration-200"
                >
                  {/* Ícone clicável */}
                  <button
                    type="button"
                    onClick={(e) => openPicker({ kind: 'cat', cat }, e.currentTarget)}
                    aria-label={`Trocar ícone de ${cat}`}
                    title={`Ícone: ${getIconLabel(iconKey || undefined)} — clique para trocar`}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                      picker?.kind === 'cat' && picker.cat === cat
                        ? 'bg-accent text-white'
                        : 'bg-surface-muted text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <IconComp size={18} strokeWidth={picker?.kind === 'cat' && picker.cat === cat ? 2.5 : 2} />
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing && renaming ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const trimmed = editName.trim()
                            if (!trimmed) return
                            if (trimmed !== cat) renameCategory(cat, trimmed)
                            setRenaming(false)
                          }
                          if (e.key === 'Escape') { setRenaming(false); setEditName(cat) }
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-surface-muted text-text-primary text-sm border border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/50"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-text-primary truncate">{cat}</p>
                    )}
                    {isEditing && !renaming && (
                      <p className="text-[11px] text-text-tertiary">
                        Clique no ícone para trocar — use o campo abaixo para renomear
                      </p>
                    )}
                  </div>

                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => startRename(cat)}
                          title="Renomear"
                          aria-label={`Renomear ${cat}`}
                          className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            const trimmed = editName.trim()
                            if (!trimmed) return
                            if (trimmed !== cat) renameCategory(cat, trimmed)
                            setEditingCat(null)
                            setRenaming(false)
                            addToast(`"${trimmed}" atualizada.`, 'success')
                          }}
                          title="Salvar"
                          aria-label="Salvar"
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          title="Cancelar"
                          aria-label="Cancelar"
                          className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          title="Editar"
                          aria-label={`Editar ${cat}`}
                          className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          title={`Remover ${cat}`}
                          aria-label={`Remover ${cat}`}
                          className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ManagerShell>

      <DeleteWithRedirectModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        subject={`a categoria "${deleteTarget ?? ''}"`}
        linkedLabel="lançamentos"
        linkedCount={linkedCount}
        targetLabel="categoria de destino"
        options={categories.filter((c) => c !== deleteTarget).map((c) => ({
          id: c,
          name: c,
          color: '#9ca3af',
        }))}
      />
      {iconPicker}
    </>
  )
}
