import { useState, useEffect, useRef } from 'react'
import { Landmark, Plus, Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { ManagerShell } from '../ManagerShell/ManagerShell'
import { DeleteWithRedirectModal } from '../DeleteWithRedirectModal/DeleteWithRedirectModal'
import type { Bank } from '../../utils/finance'

interface BankManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'list' | 'add' | 'edit'

const BANK_COLORS = [
  '#820ad1', '#003c7e', '#f5e000', '#ff7a00', '#0f6fb8',
  '#22c55e', '#ec4899', '#f97316', '#0ea5e9', '#475569',
]

export function BankManagerModal({ isOpen, onClose }: BankManagerModalProps) {
  const banks = useExpenseStore((s) => s.banks)
  const addBank = useExpenseStore((s) => s.addBank)
  const updateBank = useExpenseStore((s) => s.updateBank)
  const removeBank = useExpenseStore((s) => s.removeBank)
  const expenses = useExpenseStore((s) => s.expenses)

  const [mode, setMode] = useState<Mode>('list')
  const [editingBank, setEditingBank] = useState<Bank | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null)

  const [name, setName] = useState('')
  const [color, setColor] = useState(BANK_COLORS[0])
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMode('list')
      setEditingBank(null)
      setName('')
      setColor(BANK_COLORS[0])
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
      addBank({ name: trimmed, color })
    } else if (editingBank) {
      updateBank(editingBank.id, { name: trimmed, color })
    }
    setMode('list')
    setEditingBank(null)
    setName('')
    setColor(BANK_COLORS[0])
  }

  const startEdit = (bank: Bank) => {
    setEditingBank(bank)
    setName(bank.name)
    setColor(bank.color)
    setMode('edit')
  }

  const confirmDelete = (redirectToId?: string) => {
    if (!deleteTarget) return
    removeBank(deleteTarget.id, redirectToId)
    setDeleteTarget(null)
  }

  const getIncomeCount = (bankId: string) =>
    expenses.filter((e) => e.type === 'income' && e.bankId === bankId).length

  const linkedCount = deleteTarget ? getIncomeCount(deleteTarget.id) : 0

  const accountBalance = (bankId: string) => {
    let total = 0
    for (const e of expenses) {
      if (e.bankId !== bankId) continue
      if (e.type === 'income') total += e.amount
      else total -= e.amount
    }
    return total
  }

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // ── Formulário ──
  if (mode === 'add' || mode === 'edit') {
    return (
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'add' ? 'Novo banco' : 'Editar banco'}
        subtitle="Onde as receitas da casa entram"
        accent={color}
        icon={<Landmark size={20} />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center">
            <div
              className="w-44 h-28 rounded-xl shadow-lg flex items-end p-4 transition-colors duration-300"
              style={{ backgroundColor: color }}
            >
              <div className="w-full">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-2 w-6 bg-white/30 rounded-sm" />
                  ))}
                </div>
                <span className="text-white/90 text-sm font-semibold truncate w-full block">
                  {name.trim() || 'Nome do Banco'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="bank-name"
              className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
            >
              Nome
            </label>
            <input
              ref={nameRef}
              id="bank-name"
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
              {BANK_COLORS.map((c) => (
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
              {mode === 'add' ? 'Criar banco' : 'Salvar'}
            </button>
          </div>
        </form>
      </ManagerShell>
    )
  }

  // ── Lista ──
  return (
    <>
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciar bancos"
        subtitle={`${banks.length} ${banks.length === 1 ? 'banco cadastrado' : 'bancos cadastrados'}`}
        accent="#0ea5e9"
        icon={<Landmark size={20} />}
        footer={
          <button
            onClick={() => setMode('add')}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Adicionar banco
          </button>
        }
      >
        {banks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-muted mx-auto mb-3 flex items-center justify-center">
              <Landmark size={28} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Nenhum banco cadastrado</p>
            <p className="text-xs text-text-tertiary mt-1">Adicione seu primeiro banco abaixo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {banks.map((bank) => {
              const count = getIncomeCount(bank.id)
              const balance = accountBalance(bank.id)
              return (
                <div
                  key={bank.id}
                  className="group flex items-center gap-3.5 p-3 rounded-xl border border-border hover:bg-surface-muted transition-all duration-200"
                >
                  <div
                    className="w-1.5 h-11 rounded-full flex-shrink-0"
                    style={{ backgroundColor: bank.color }}
                    aria-hidden="true"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{bank.name}</p>
                    <p className="text-[11px] text-text-tertiary">
                      {count} {count === 1 ? 'receita' : 'receitas'} · saldo {fmt(balance)}
                    </p>
                  </div>

                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => startEdit(bank)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
                      aria-label={`Editar ${bank.name}`}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(bank)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                      aria-label={`Excluir ${bank.name}`}
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

        {linkedCount > 0 && deleteTarget && (
          <p className="mt-4 text-[11px] text-text-tertiary flex items-start gap-1.5">
            <ArrowLeftRight size={12} className="mt-0.5 flex-shrink-0" />
            Ao excluir um banco com receitas, você escolhe outro banco para recebê-las — nada fica
            órfão.
          </p>
        )}
      </ManagerShell>

      <DeleteWithRedirectModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        subject={`o banco "${deleteTarget?.name ?? ''}"`}
        linkedLabel="receitas"
        linkedCount={linkedCount}
        targetLabel="banco de destino"
        options={banks
          .filter((b) => b.id !== deleteTarget?.id)
          .map((b) => ({ id: b.id, name: b.name, color: b.color }))}
      />
    </>
  )
}