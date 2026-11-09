import { useMemo, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, CARDS, ESSENTIALITY_OPTIONS, getEssentialityMeta } from '../../utils/finance'
import type { Expense } from '../../utils/finance'
import { AvatarIcon } from '../AvatarIcon/AvatarIcon'
import { BankPickerModal } from '../BankPickerModal/BankPickerModal'

export function TransactionList() {
  const expenses = useExpenseStore((s) => s.expenses)
  const members = useExpenseStore((s) => s.members)
  const activeMemberId = useExpenseStore((s) => s.activeMemberId)
  const cards = useExpenseStore((s) => s.cards)
  const filters = useExpenseStore((s) => s.filters)
  const setFilter = useExpenseStore((s) => s.setFilter)
  const removeExpense = useExpenseStore((s) => s.removeExpense)
  const setEditingId = useExpenseStore((s) => s.setEditingId)
  const togglePaid = useExpenseStore((s) => s.togglePaid)
  const updateExpense = useExpenseStore((s) => s.updateExpense)
  // Despesa sem banco: a conta é escolhida agora, no momento de pagar.
  const [pendingPayment, setPendingPayment] = useState<Expense | null>(null)

  const sorted = useMemo(() => {
    const filtered = expenses.filter((e: Expense) => {
      if (filters.cardId !== 'all' && e.cardId !== filters.cardId) return false
      if (filters.category !== 'all' && e.category !== filters.category) return false
      if (filters.status === 'paid' && !e.isPaid) return false
      if (filters.status === 'pending' && e.isPaid) return false
      if (filters.type !== 'all' && e.type !== filters.type) return false
      if (filters.memberId !== 'all' && e.memberId !== filters.memberId) return false
      if (filters.essentiality !== 'all' && e.essentiality !== filters.essentiality) return false
      if (filters.tag !== 'all' && !(e.tags ?? []).includes(filters.tag)) return false
      if (filters.onlyMine && e.memberId !== activeMemberId) return false
      // Despesas marcadas como pessoais não aparecem para os outros membros
      if (e.privacy === 'personal' && activeMemberId && e.memberId !== activeMemberId) return false
      if (
        filters.search &&
        !e.description.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false
      return true
    })
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [expenses, filters, activeMemberId])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const e of expenses) for (const t of e.tags ?? []) set.add(t)
    return [...set].sort()
  }, [expenses])

  const activeFiltersCount = [
    filters.cardId !== 'all',
    filters.category !== 'all',
    filters.status !== 'all',
    filters.type !== 'all',
    filters.memberId !== 'all',
    filters.search !== '',
    filters.essentiality !== 'all',
    filters.tag !== 'all',
    filters.onlyMine,
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Filtros Rápidos */}
      <div className="space-y-3">
        {/* Linha 1: Tipo + Status */}
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-nude-100 rounded-lg p-0.5">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter('type', t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filters.type === t
                    ? t === 'income'
                      ? 'bg-green-600 text-white shadow-sm'
                      : t === 'expense'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white text-nude-700 shadow-sm'
                    : 'text-nude-500 hover:text-nude-700'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'income' ? '↑ Entradas' : '↓ Saídas'}
              </button>
            ))}
          </div>

          <div className="flex bg-nude-100 rounded-lg p-0.5">
            {(['all', 'pending', 'paid'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter('status', s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filters.status === s
                    ? 'bg-white text-nude-700 shadow-sm'
                    : 'text-nude-500 hover:text-nude-700'
                }`}
              >
                {s === 'all' ? 'Todos' : s === 'pending' ? 'Pendentes' : 'Pagos'}
              </button>
            ))}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={() => useExpenseStore.getState().clearFilters()}
              className="px-3 py-1.5 text-xs font-medium text-nude-500 hover:text-nude-700 transition-colors"
            >
              Limpar ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Linha 2: Avatares dos membros */}
        {members.length > 0 && (
<div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-nude-400 font-medium">Membro:</span>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilter('memberId', filters.memberId === m.id ? 'all' : m.id)}
                aria-pressed={filters.memberId === m.id}
                className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
                  filters.memberId === m.id
                    ? 'ring-2 ring-terracotta-500 ring-offset-2 scale-110'
                    : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
                title={m.name}
              >
                <AvatarIcon type={m.avatar ?? null} />
              </button>
            ))}
            {filters.memberId !== 'all' && (
              <button
                onClick={() => setFilter('memberId', 'all')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-nude-400 hover:text-nude-700 bg-nude-100 hover:bg-nude-200 transition-all"
                title="Limpar filtro de membro"
                aria-label="Limpar filtro de membro"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Linha 3: Cartões */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-nude-400 font-medium">Cartão:</span>
          <button
            onClick={() => setFilter('cardId', 'all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              filters.cardId === 'all'
                ? 'bg-nude-700 text-white'
                : 'bg-nude-100 text-nude-500 hover:bg-nude-200'
            }`}
          >
            Todos
          </button>
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter('cardId', c.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
                filters.cardId === c.id
                  ? 'text-white shadow-sm'
                  : 'bg-nude-100 text-nude-500 hover:bg-nude-200'
              }`}
              style={filters.cardId === c.id ? { backgroundColor: c.color } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: filters.cardId === c.id ? '#fff' : c.color }}
              />
              {c.name}
            </button>
          ))}
        </div>

        {/* Linha 4: Essencialidade + Tags + Pessoal */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-nude-400 font-medium">Essencial:</span>
          {ESSENTIALITY_OPTIONS.map((opt) => {
            const active = filters.essentiality === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setFilter('essentiality', active ? 'all' : opt.value)}
                aria-pressed={active}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                  active ? 'text-white shadow-sm' : 'bg-nude-100 text-nude-500 hover:bg-nude-200'
                }`}
                style={active ? { backgroundColor: '#c2410c' } : undefined}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            )
          })}
          {allTags.length > 0 && (
            <>
              <span className="text-xs text-nude-400 font-medium ml-2">Tags:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilter('tag', filters.tag === tag ? 'all' : tag)}
                  aria-pressed={filters.tag === tag}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                    filters.tag === tag
                      ? 'bg-terracotta-500 text-white shadow-sm'
                      : 'bg-nude-100 text-nude-500 hover:bg-nude-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </>
          )}
          {activeMemberId && (
            <button
              onClick={() => setFilter('onlyMine', !filters.onlyMine)}
              aria-pressed={filters.onlyMine}
              className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                filters.onlyMine
                  ? 'bg-nude-700 text-white shadow-sm'
                  : 'bg-nude-100 text-nude-500 hover:bg-nude-200'
              }`}
            >
              🔒 Só minhas
            </button>
          )}
        </div>
      </div>

      {/* Lista de Transações */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-nude-400">
          <p className="text-lg font-display">Nenhuma transação encontrada</p>
          <p className="text-sm mt-2">Ajuste os filtros ou adicione uma nova transação</p>
        </div>
      ) : (
        <div className="h-[400px] pr-2">
          <Virtuoso
            data={sorted}
            overscan={5}
            itemContent={(_index, expense) => {
              const isIncome = expense.type === 'income'
              const isPaid = expense.isPaid
              const installmentValue = expense.installments > 1
 ? Math.round(expense.amount / expense.installments)
 : expense.amount
              const member = expense.memberId
                ? members.find((m) => m.id === expense.memberId)
                : null
              const card = cards.find((c) => c.id === expense.cardId) || CARDS.find((c) => c.id === expense.cardId)

              return (
                <div
                  className={`group flex items-center gap-3 p-3 rounded-xl mb-2 transition-all hover:shadow-sm ${
                    isIncome
                      ? 'bg-green-50/50 hover:bg-green-50 border border-green-100'
                      : 'bg-white hover:bg-nude-50 border border-nude-100'
                  } ${isPaid ? 'opacity-60' : ''}`}
                >
                  {/* Avatar do Membro ou Ícone de Tipo */}
                  <div className="flex-shrink-0">
                    {member ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <AvatarIcon type={member.avatar ?? null} />
                      </div>
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          isIncome
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-500'
                        }`}
                      >
                        {isIncome ? '↑' : '↓'}
                      </div>
                    )}
                  </div>

                  {/* Informações da Transação */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium truncate ${
                          isPaid ? 'line-through text-nude-400' : 'text-nude-800'
                        }`}
                      >
                        {expense.description}
                      </p>
                      {expense.installments > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-nude-100 text-nude-500 rounded font-medium">
                          {expense.paidInstallments}/{expense.installments}x
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-nude-400 mt-0.5 flex-wrap">
                      <span>{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span>{expense.category}</span>
                      {(() => {
                        const meta = getEssentialityMeta(expense.essentiality)
                        return meta ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.pill}`}>
                            {meta.emoji} {meta.label}
                          </span>
                        ) : null
                      })()}
                      {(expense.tags ?? []).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-nude-100 text-nude-500 text-[10px] font-medium">
                          #{tag}
                        </span>
                      ))}
                      {expense.privacy === 'personal' && (
                        <span className="px-1.5 py-0.5 rounded bg-nude-200 text-nude-600 text-[10px] font-semibold" title="Visível só para o responsável">
                          🔒 Pessoal
                        </span>
                      )}
                      {card && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: card.color }}
                            />
                            {card.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className={`font-bold text-sm ${
                        isIncome
                          ? 'text-green-600'
                          : isPaid
                            ? 'text-nude-400 line-through'
                            : 'text-red-500'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatBRL(installmentValue)}
                    </p>
                    {expense.installments > 1 && (
                      <p className="text-[10px] text-nude-400">
                        Total: {formatBRL(expense.amount)}
                      </p>
                    )}
                  </div>

                  {/* Ações (visíveis no hover) */}
                  <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(expense.id)}
                      className="p-1.5 text-nude-400 hover:text-nude-600 hover:bg-nude-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (!isPaid && !expense.bankId) setPendingPayment(expense)
                        else togglePaid(expense.id)
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPaid
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-green-500 hover:bg-green-50'
                      }`}
                      title={isPaid ? 'Reabrir' : 'Marcar como paga'}
                    >
                      {isPaid ? '↩️' : '✅'}
                    </button>
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="p-1.5 text-nude-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            }}
          />
        </div>
      )}

      <BankPickerModal
        isOpen={pendingPayment !== null}
        description={pendingPayment?.description ?? ''}
        amount={pendingPayment?.amount ?? 0}
        onClose={() => setPendingPayment(null)}
        onConfirm={(bankId) => {
          if (!pendingPayment) return
          updateExpense(pendingPayment.id, { bankId, isPaid: true })
          setPendingPayment(null)
        }}
      />
    </div>
  )
}