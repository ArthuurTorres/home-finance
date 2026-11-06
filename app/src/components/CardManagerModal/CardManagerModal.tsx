import { useState, useEffect, useRef } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { ConfirmModal } from '../ConfirmModal/ConfirmModal'
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

  // Form state
  const [name, setName] = useState('')
  const [color, setColor] = useState(CARD_COLORS[0])
  const nameRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('list')
      setEditingCard(null)
      setName('')
      setColor(CARD_COLORS[0])
    }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (mode === 'add' || mode === 'edit') {
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [mode])

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode !== 'list') setMode('list')
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, mode, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    if (mode === 'add') {
      addCard({ name: trimmed, color })
    } else if (mode === 'edit' && editingCard) {
      updateCard(editingCard.id, { name: trimmed, color })
    }
    setMode('list')
    setName('')
    setColor(CARD_COLORS[0])
    setEditingCard(null)
  }

  const startEdit = (card: CreditCardDef) => {
    setEditingCard(card)
    setName(card.name)
    setColor(card.color)
    setMode('edit')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    removeCard(deleteTarget.id)
    setDeleteTarget(null)
  }

  const getExpenseCount = (cardId: string) =>
    expenses.filter((e) => e.cardId === cardId).length

  // ── Render: Add/Edit Form ──
  if (mode === 'add' || mode === 'edit') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMode('list')}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-form-title"
          className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 animate-scale-in"
        >
          <h3 id="card-form-title" className="text-base font-semibold text-text-primary mb-5">
            {mode === 'add' ? 'Novo Cartão' : 'Editar Cartão'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Preview do cartão */}
            <div className="flex justify-center mb-2">
              <div
                className="w-48 h-28 rounded-xl shadow-lg flex items-end p-4 transition-colors duration-300"
                style={{ backgroundColor: color }}
              >
                <span className="text-white/90 text-sm font-semibold truncate w-full">
                  {name.trim() || 'Nome do Cartão'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="card-name" className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm"
              >
                {mode === 'add' ? 'Criar Cartão' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── Render: List View ──
  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-manager-title"
          className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 id="card-manager-title" className="text-base font-semibold text-text-primary">
                Gerenciar Cartões
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                {cards.length} {cards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-muted transition-all"
              aria-label="Fechar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Lista de cartões */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 hud-scroll">
            {cards.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-muted mx-auto mb-3 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary font-medium">Nenhum cartão cadastrado</p>
                <p className="text-xs text-text-tertiary mt-1">Adicione seu primeiro cartão abaixo</p>
              </div>
            ) : (
              cards.map((card) => {
                const count = getExpenseCount(card.id)
                return (
                  <div
                    key={card.id}
                    className="group flex items-center gap-3.5 p-3 rounded-xl border border-transparent hover:bg-surface-muted hover:border-border transition-all duration-200"
                  >
                    {/* Miniatura estilizada do cartão */}
                    <div
                      className="w-12 h-8 rounded-lg shadow-sm flex-shrink-0 flex items-center px-2"
                      style={{ backgroundColor: card.color }}
                      aria-hidden="true"
                    >
                      <div className="w-5 h-3.5 rounded-[2px] bg-white/30" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{card.name}</p>
                      <p className="text-[11px] text-text-tertiary tabular-nums">
                        {count} {count === 1 ? 'transação' : 'transações'}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => startEdit(card)}
                        className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
                        aria-label={`Editar ${card.name}`}
                        title="Editar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(card)}
                        className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                        aria-label={`Excluir ${card.name}`}
                        title="Excluir"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Botão adicionar */}
          <button
            onClick={() => setMode('add')}
            className="mt-4 w-full py-3 px-4 rounded-xl border border-dashed border-border text-text-secondary hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar Cartão
          </button>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Excluir Cartão"
        message={`Tem certeza que deseja excluir o cartão "${deleteTarget?.name}"? Esta ação não pode ser desfeita. As despesas vinculadas não serão excluídas, mas ficarão sem cartão associado.`}
        confirmLabel="Excluir"
        variant="danger"
      />
    </>
  )
}