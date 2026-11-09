import { useState, useEffect, useRef } from 'react'
import { CreditCard, Plus, Pencil, Trash2 } from 'lucide-react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { ManagerShell } from '../ManagerShell/ManagerShell'
import { DeleteWithRedirectModal } from '../DeleteWithRedirectModal/DeleteWithRedirectModal'
import type { CreditCardDef } from '../../utils/finance'

interface CardManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'list' | 'add' | 'edit'

const CARD_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#475569',
]

export function CardManagerModal({ isOpen, onClose }: CardManagerModalProps) {
  const cards = useExpenseStore((s) => s.cards)
  const addCard = useExpenseStore((s) => s.addCard)
  const updateCard = useExpenseStore((s) => s.updateCard)
  const removeCard = useExpenseStore((s) => s.removeCard)
  const expenses = useExpenseStore((s) => s.expenses)

  const [mode, setMode] = useState<Mode>('list')
  const [editingCard, setEditingCard] = useState<CreditCardDef | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CreditCardDef | null>(null)

  const [name, setName] = useState('')
  const [color, setColor] = useState(CARD_COLORS[0])
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMode('list')
      setEditingCard(null)
      setName('')
      setColor(CARD_COLORS[0])
    }
  }, [isOpen])

  useEffect(() => {
    if (mode === 'add' || mode === 'edit') {
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    if (mode === 'add') {
      addCard({ name: trimmed, color })
    } else if (editingCard) {
      updateCard(editingCard.id, { name: trimmed, color })
    }
    setMode('list')
    setEditingCard(null)
    setName('')
    setColor(CARD_COLORS[0])
  }

  const startEdit = (card: CreditCardDef) => {
    setEditingCard(card)
    setName(card.name)
    setColor(card.color)
    setMode('edit')
  }

  const confirmDelete = (redirectToId?: string) => {
    if (!deleteTarget) return
    removeCard(deleteTarget.id, redirectToId)
    setDeleteTarget(null)
  }

  const getExpenseCount = (cardId: string) =>
    expenses.filter((e) => e.cardId === cardId).length

  const linkedCount = deleteTarget ? getExpenseCount(deleteTarget.id) : 0

  if (mode === 'add' || mode === 'edit') {
    return (
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'add' ? 'Novo cartão' : 'Editar cartão'}
        subtitle="Cartão de crédito usado nas despesas"
        accent={color}
        icon={<CreditCard size={20} />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center">
            <div
              className="relative w-52 h-32 rounded-2xl shadow-xl flex flex-col justify-between p-4 transition-colors duration-300"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-6 rounded-[3px] bg-white/40" aria-hidden="true" />
                <CreditCard size={18} className="text-white/60" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-white/50 mb-0.5">
                  Crédito
                </p>
                <span className="text-white text-sm font-semibold truncate block">
                  {name.trim() || 'Nome do Cartão'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="card-name"
              className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
            >
              Nome
            </label>
            <input
              ref={nameRef}
              id="card-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Itaú..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-muted border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-tertiary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-surface ring-text-primary scale-110'
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-muted transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm"
            >
              {mode === 'add' ? 'Criar cartão' : 'Salvar'}
            </button>
          </div>
        </form>
      </ManagerShell>
    )
  }

  return (
    <>
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciar cartões"
        subtitle={`${cards.length} ${cards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}`}
        accent="#6366f1"
        icon={<CreditCard size={20} />}
        footer={
          <button
            onClick={() => setMode('add')}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Adicionar cartão
          </button>
        }
      >
        {cards.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-muted mx-auto mb-3 flex items-center justify-center">
              <CreditCard size={28} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Nenhum cartão cadastrado</p>
            <p className="text-xs text-text-tertiary mt-1">Adicione seu primeiro cartão abaixo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => {
              const count = getExpenseCount(card.id)
              return (
                <div
                  key={card.id}
                  className="group flex items-center gap-3.5 p-3 rounded-xl border border-border hover:bg-surface-muted transition-all duration-200"
                >
                  <div
                    className="w-14 h-9 rounded-lg shadow-sm flex-shrink-0 flex items-center px-2"
                    style={{
                      background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)`,
                    }}
                    aria-hidden="true"
                  >
                    <div className="w-5 h-3.5 rounded-[2px] bg-white/40" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{card.name}</p>
                    <p className="text-[11px] text-text-tertiary tabular-nums">
                      {count} {count === 1 ? 'lançamento' : 'lançamentos'}
                    </p>
                  </div>

                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => startEdit(card)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
                      aria-label={`Editar ${card.name}`}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(card)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                      aria-label={`Excluir ${card.name}`}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
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
        subject={`o cartão "${deleteTarget?.name ?? ''}"`}
        linkedLabel="lançamentos"
        linkedCount={linkedCount}
        targetLabel="cartão de destino"
        options={cards
          .filter((c) => c.id !== deleteTarget?.id)
          .map((c) => ({ id: c.id, name: c.name, color: c.color }))}
      />
    </>
  )
}