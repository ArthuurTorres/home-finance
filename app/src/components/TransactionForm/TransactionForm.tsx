import { useState, useEffect, useRef } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { parseBRL, formatBRL, getInstallmentValue, ESSENTIALITY_OPTIONS, PRIVACY_OPTIONS } from '../../utils/finance'
import type { Category, CardId, TransactionType, Member, MemberAvatar, Essentiality } from '../../utils/finance'
import { CreditCard } from '../CreditCard/CreditCard'
import { AvatarIcon } from '../AvatarIcon/AvatarIcon'

interface FormState {
  description: string
  date: string
  amount: string
  dueDay: number
  installments: number
  category: Category
  cardId: CardId
  isPaid: boolean
  isRecurring: boolean
  type: TransactionType
  memberId: string | undefined
  essentiality: Essentiality | null
  tags: string[]
  privacy: 'family' | 'personal'
}

const INITIAL_FORM: FormState = {
  description: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  dueDay: 10,
  installments: 1,
  category: '' as Category,
  cardId: 'cash' as CardId,
  isPaid: false,
  isRecurring: false,
  type: 'expense',
  memberId: undefined,
  essentiality: null,
  tags: [],
  privacy: 'family',
}

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

interface TransactionFormProps {
  onSuccess?: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const addExpense = useExpenseStore((s) => s.addExpense)
  const updateExpense = useExpenseStore((s) => s.updateExpense)
  const editingId = useExpenseStore((s) => s.editingId)
  const setEditingId = useExpenseStore((s) => s.setEditingId)
  const expenses = useExpenseStore((s) => s.expenses)
  const filters = useExpenseStore((s) => s.filters)
  const categories = useExpenseStore((s) => s.categories)
  const cards = useExpenseStore((s) => s.cards)
  const members = useExpenseStore((s) => s.members)

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const renderAvatarContent = (avatar: MemberAvatar | null | undefined, name: string) => {
    if (avatar) {
      return <AvatarIcon type={avatar} className="w-4 h-4 text-white" />
    }
    return <span className="text-white font-bold text-xs">{getInitials(name)}</span>
  }

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [tagInput, setTagInput] = useState('')
  const amountRef = useRef<HTMLInputElement>(null)

  // Preenche formulário quando editingId muda na store
  useEffect(() => {
    if (editingId) {
      const expense = expenses.find((e) => e.id === editingId)
      if (expense) {
        setForm({
          description: expense.description,
          date: expense.date,
          amount: formatBRL(expense.amount).replace('R$\u00a0', ''),
          dueDay: expense.dueDay,
          installments: expense.installments,
          category: expense.category,
          cardId: expense.cardId,
          isPaid: expense.isPaid ?? false,
          isRecurring: expense.isRecurring ?? false,
          type: expense.type ?? 'expense',
          memberId: expense.memberId,
          essentiality: expense.essentiality ?? null,
          tags: expense.tags ?? [],
          privacy: expense.privacy ?? 'family',
        })
        amountRef.current?.focus()
      }
    } else {
      setForm((f) => ({
        ...INITIAL_FORM,
        category: categories[0] ?? '',
        cardId: (filters.cardId !== 'all' ? filters.cardId : f.cardId) || (cards[0]?.id ?? ''),
        isRecurring: false,
      }))
    }
  }, [editingId, expenses, filters.cardId, cards])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (!raw) {
      setForm({ ...form, amount: '' })
      return
    }
    // Normalização pt-BR: remove pontos de milhar e converte vírgula decimal para ponto
    // Ex: "1.000,50" → "1000.50"; "1000" → "1000"; "1,5" → "1.5"
    const cleaned = raw.replace(/[^\d.,]/g, '')
    const hasComma = cleaned.includes(',')
    const hasDot = cleaned.includes('.')
    let normalized: string
    if (hasComma && hasDot) {
      // Ambos presentes: assume que o último é o separador decimal
      const lastComma = cleaned.lastIndexOf(',')
      const lastDot = cleaned.lastIndexOf('.')
      if (lastComma > lastDot) {
        // Vírgula é decimal (padrão BR): "1.000,50"
        normalized = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        // Ponto é decimal (formato US): "1,000.50"
        normalized = cleaned.replace(/,/g, '')
      }
    } else if (hasComma) {
      // Apenas vírgula: sempre decimal em pt-BR
      normalized = cleaned.replace(',', '.')
    } else {
      // Apenas ponto ou só dígitos
      normalized = cleaned
    }
    const num = parseFloat(normalized)
    if (isNaN(num) || num < 0) return
    // Limite de R$ 9.999.999,99
    if (num > 9999999.99) return
    setForm({ ...form, amount: normalized })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountCents = parseBRL(form.amount)
    if (!form.description.trim() || amountCents <= 0) return

    // Receita não tem cartão: sempre Dinheiro/PIX/Débito.
    // Despesa: usa o selecionado, ou o filtro ativo, ou o primeiro cartão disponível.
    const resolvedCardId =
      form.type === 'income'
        ? ('cash' as CardId)
        : form.cardId || (filters.cardId !== 'all' ? filters.cardId : '') || (cards[0]?.id ?? 'cash')

    const payload = {
      description: form.description.trim(),
      date: form.date,
      amount: amountCents,
      dueDay: form.dueDay,
      installments: form.installments,
      category: form.category,
      cardId: resolvedCardId,
      memberId: form.memberId || undefined,
      isPaid: form.isPaid,
      isRecurring: form.isRecurring,
      paidInstallments: form.isPaid ? form.installments : 0,
      type: form.type,
      essentiality: form.type === 'income' ? null : form.essentiality,
      tags: form.tags,
      privacy: form.privacy,
    }

    if (editingId) {
      updateExpense(editingId, payload)
    } else {
      addExpense(payload)
    }

    setForm({
      ...INITIAL_FORM,
      cardId: (filters.cardId !== 'all' ? filters.cardId : form.cardId) || (cards[0]?.id ?? ''),
    })
    onSuccess?.()
    if (!editingId) amountRef.current?.focus()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({
      ...INITIAL_FORM,
      cardId: (filters.cardId !== 'all' ? filters.cardId : form.cardId) || (cards[0]?.id ?? ''),
    })
    amountRef.current?.focus()
  }

  // Troca de tipo limpa os campos que não se aplicam ao novo tipo
  function changeType(next: TransactionType) {
    setForm((f) => ({
      ...f,
      type: next,
      installments: next === 'income' ? 1 : f.installments,
      isPaid: next === 'income' ? false : f.isPaid,
      isRecurring: false,
      cardId: next === 'income' ? ('cash' as CardId) : f.cardId,
      essentiality: null,
      privacy: 'family',
    }))
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,$/, '').toLowerCase()
      if (tag && !form.tags.includes(tag)) {
        setForm((f) => ({ ...f, tags: [...f.tags, tag] }))
      }
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      setForm((f) => ({ ...f, tags: f.tags.slice(0, -1) }))
    }
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
  }

  const isIncome = form.type === 'income'
  const amountCents = parseBRL(form.amount)
  const canSubmit = form.description.trim().length > 0 && amountCents > 0
  const installmentValue = form.installments > 1 ? getInstallmentValue(amountCents, form.installments) : 0
  const isCreditCard = form.cardId !== 'cash'
  const showDueDay = !isIncome && (form.installments > 1 || form.isRecurring)

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent transition-all text-sm'
  const labelClass = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5'
  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
      active
        ? 'border-accent bg-accent/10 text-accent shadow-sm'
        : 'border-border bg-surface text-text-secondary hover:border-text-tertiary/40'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo */}
      {!editingId ? (
        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-surface-muted border border-border">
          <button
            type="button"
            onClick={() => changeType('expense')}
            aria-pressed={!isIncome}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !isIncome
                ? 'bg-surface text-danger shadow-sm ring-1 ring-border'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M8 12h8" />
            </svg>
            Despesa
          </button>
          <button
            type="button"
            onClick={() => changeType('income')}
            aria-pressed={isIncome}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isIncome
                ? 'bg-surface text-success shadow-sm ring-1 ring-border'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 8v8M8 12h8" />
            </svg>
            Receita
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
            isIncome ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            {isIncome ? 'Receita' : 'Despesa'}
          </span>
          <span className="text-xs text-accent font-medium animate-pulse">Editando</span>
        </div>
      )}

      {/* Valor em destaque */}
      <div className="pt-1 pb-2 text-center">
        <label htmlFor="transaction-amount" className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          {editingId ? 'Valor' : isIncome ? 'Valor recebido' : 'Valor da despesa'}
        </label>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className={`text-xl font-semibold ${isIncome ? 'text-success' : 'text-text-tertiary'}`}>R$</span>
          <input
            id="transaction-amount"
            ref={amountRef}
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={handleAmountChange}
            placeholder="0,00"
            autoComplete="off"
            required
            className={`w-full max-w-[220px] bg-transparent border-none px-1 py-0 text-center font-display text-4xl font-bold tracking-tight placeholder:text-text-tertiary/30 focus:outline-none focus:ring-0 ${
              isIncome ? 'text-success' : 'text-text-primary'
            }`}
          />
        </div>
        <div className={`mx-auto mt-3 h-0.5 w-16 rounded-full transition-colors ${isIncome ? 'bg-success/40' : 'bg-accent/40'}`} />
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="transaction-description" className={labelClass}>Descrição</label>
        <input
          id="transaction-description"
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={isIncome ? 'Ex: Salário, freelas, aluguel recebido' : 'Ex: Compras do mês, conta de luz'}
          className={inputClass}
          required
        />
      </div>

      {/* Data + Categoria */}
      <div className="space-y-4">
        <div>
          <label htmlFor="transaction-date" className={labelClass}>{isIncome ? 'Data do recebimento' : 'Data'}</label>
          <input
            id="transaction-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Categoria</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat: string) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat as Category })}
                aria-pressed={form.category === cat}
                className={chipClass(form.category === cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Membro Responsável */}
      {members.length > 0 && (
        <div>
          <label className={labelClass}>{isIncome ? 'Quem recebeu?' : 'Quem pagou?'}</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, memberId: undefined }))}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                !form.memberId
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface text-text-tertiary hover:border-text-tertiary/30'
              }`}
            >
              Sem responsável
            </button>
            {members.map((member: Member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, memberId: member.id }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  form.memberId === member.id
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-border bg-surface hover:border-text-tertiary/30'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {renderAvatarContent(member.avatar, member.name)}
                </div>
                <span className={`text-xs font-medium truncate max-w-[100px] ${
                  form.memberId === member.id ? 'text-accent' : 'text-text-secondary'
                }`}>
                  {member.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Campos exclusivos de despesa --- */}
      {!isIncome && (
        <>
          {/* Método de Pagamento */}
          <div>
            <label className={labelClass}>Forma de pagamento</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, cardId: 'cash' as CardId }))}
                className={`w-24 h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  form.cardId === 'cash'
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-border bg-surface-muted hover:border-text-tertiary/30'
                }`}
                aria-label="Selecionar Dinheiro, PIX ou Débito"
                aria-pressed={form.cardId === 'cash'}
              >
                <svg className={`w-5 h-5 ${form.cardId === 'cash' ? 'text-accent' : 'text-text-tertiary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className={`text-[9px] font-bold uppercase tracking-tight leading-none ${form.cardId === 'cash' ? 'text-accent' : 'text-text-tertiary'}`}>
                  Dinheiro/PIX
                </span>
              </button>

              {cards.map((card) => (
                <CreditCard
                  key={card.id}
                  id={card.id}
                  name={card.name}
                  color={card.color}
                  isSelected={form.cardId === card.id}
                  onSelect={(id) => setForm((f) => ({ ...f, cardId: id as CardId }))}
                />
              ))}
            </div>
          </div>

          {/* Parcelas (só cartão de crédito) */}
          {isCreditCard && (
            <div>
              <label className={labelClass}>Parcelas</label>
              <div className="flex flex-wrap gap-1.5">
                {INSTALLMENT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, installments: n })}
                    aria-pressed={form.installments === n}
                    className={`min-w-[46px] ${chipClass(form.installments === n)}`}
                  >
                    {n === 1 ? 'À vista' : `${n}x`}
                  </button>
                ))}
              </div>
              {form.installments > 1 && amountCents > 0 && (
                <div className="mt-2 p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-xs text-accent">
                    <span className="font-semibold">{form.installments}x</span> de{' '}
                    <span className="font-display font-bold">{formatBRL(installmentValue)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Vencimento */}
          {showDueDay && (
            <div>
              <label htmlFor="expense-due-day" className={labelClass}>Dia de vencimento</label>
              <select
                id="expense-due-day"
                value={form.dueDay}
                onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) })}
                className={inputClass}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conta Paga + Despesa Fixa */}
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="isPaid" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/50 cursor-pointer transition-all bg-surface">
              <input
                id="isPaid"
                type="checkbox"
                checked={form.isPaid}
                onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
                className="w-5 h-5 rounded border-border text-accent focus:ring-accent/30"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Conta paga</p>
                <p className="text-xs text-text-secondary">Já quitada</p>
              </div>
            </label>
            {form.cardId === 'cash' ? (
              <label htmlFor="isRecurring" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/50 cursor-pointer transition-all bg-surface">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-accent focus:ring-accent/30"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">Despesa fixa</p>
                  <p className="text-xs text-text-secondary">Recorrente todo mês</p>
                </div>
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-surface-muted opacity-50 cursor-not-allowed" title="Despesas fixas não se aplicam a cartão de crédito">
                <input
                  type="checkbox"
                  disabled
                  className="w-5 h-5 rounded border-border text-text-tertiary"
                />
                <div>
                  <p className="text-sm font-medium text-text-tertiary">Despesa fixa</p>
                  <p className="text-xs text-text-tertiary">Apenas para Dinheiro/Débito</p>
                </div>
              </div>
            )}
          </div>

          {/* Essencialidade do gasto */}
          <div>
            <label className={labelClass}>Essencialidade</label>
            <div className="flex gap-2">
              {ESSENTIALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      essentiality: f.essentiality === opt.value ? null : opt.value,
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    form.essentiality === opt.value
                      ? 'border-accent bg-accent/10 text-accent shadow-sm'
                      : 'border-border bg-surface text-text-tertiary hover:border-text-tertiary/30'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags customizáveis */}
          <div>
            <label className={labelClass}>
              Tags{' '}
              <span className="font-normal normal-case tracking-normal text-text-tertiary">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2 rounded-xl border border-border bg-surface focus-within:ring-2 focus-within:ring-accent/60 focus-within:border-accent transition-all">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/15 text-accent text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-accent/60 hover:text-accent leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={form.tags.length === 0 ? 'adicionar tag + Enter' : ''}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-text-primary placeholder-text-tertiary"
              />
            </div>
            <p className="mt-1 text-xs text-text-tertiary">Enter ou vírgula para adicionar · Backspace para remover</p>
          </div>
        </>
      )}

      {/* Receita recorrente (opcional) */}
      {isIncome && (
        <label htmlFor="income-recurring" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-success/50 cursor-pointer transition-all bg-surface">
          <input
            id="income-recurring"
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            className="w-5 h-5 rounded border-border text-success focus:ring-success/30"
          />
          <div>
            <p className="text-sm font-medium text-text-primary">Recebe todo mês</p>
            <p className="text-xs text-text-secondary">Entra nas projeções como receita recorrente</p>
          </div>
        </label>
      )}

      {/* Privacidade da transação */}
      <div>
        <label className={labelClass}>Quem pode ver?</label>
        <div className="flex gap-2">
          {PRIVACY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, privacy: opt.value }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                form.privacy === opt.value
                  ? 'border-accent bg-accent/10 text-accent shadow-sm'
                  : 'border-border bg-surface text-text-tertiary hover:border-text-tertiary/30'
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex-1 py-3.5 px-6 rounded-xl text-white font-semibold active:scale-[0.98] transition-all shadow-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${
            isIncome
              ? 'bg-success hover:bg-success/90 shadow-success/25'
              : 'bg-accent hover:bg-accent/90 shadow-accent/25'
          }`}
        >
          {editingId
            ? 'Salvar Alterações'
            : isIncome
              ? 'Adicionar Receita'
              : 'Adicionar Despesa'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="px-5 py-3.5 rounded-xl border border-border text-text-secondary hover:bg-surface-hover transition-all text-sm font-medium"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}