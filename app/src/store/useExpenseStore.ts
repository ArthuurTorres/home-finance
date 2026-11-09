import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Expense, Category, CardId, BudgetMap, SavingsGoal, CreditCardDef, Member, Bank } from '../utils/finance'
import { DEFAULT_CATEGORIES, DEFAULT_CARDS, DEFAULT_BANKS, DEFAULT_DASHBOARD_ORDER } from '../utils/finance'
import { validateExpenses, exportToJSON, importFromJSON, getCategorySpending, getMonthlySummary, mergeDashboardOrder } from '../utils/finance'
import type { MonthlySummary } from '../utils/finance'

// --- Tipos de Filtro e UI (Melhoria #7 + #14) ---

export interface Filters {
  cardId: CardId | 'all'
  category: Category | 'all'
  status: 'all' | 'paid' | 'pending'
  search: string
  month: string // formato YYYY-MM ou 'all'
  recurringOnly: boolean
  memberId: string | 'all'
  type: 'all' | 'income' | 'expense'
  essentiality: 'all' | 'essential' | 'necessary' | 'extra'
  tag: string | 'all'
  onlyMine: boolean
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ExpenseState {
  // Dados
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id'>) => void
  addExpenses: (expenses: Omit<Expense, 'id'>[]) => number
  updateExpense: (id: string, data: Partial<Expense>) => void
  removeExpense: (id: string) => void
  togglePaid: (id: string) => void

  // Filtros (Melhoria #7)
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  clearFilters: () => void

  // UI State (Melhoria #1 + #5)
  editingId: string | null
  setEditingId: (id: string | null) => void
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  // Orçamentos por Categoria
  budgets: BudgetMap
  setBudget: (category: Category, limit: number) => void
  getCategorySpending: (month: string) => ReturnType<typeof getCategorySpending>
  getMonthlySummary: (month: string) => MonthlySummary

  // Metas de Poupança
  goals: SavingsGoal[]
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void
  updateGoal: (id: string, data: Partial<SavingsGoal>) => void
  removeGoal: (id: string) => void
  contributeToGoal: (id: string, amount: number) => void

  // Categorias Customizáveis
  categories: string[]
  addCategory: (name: string) => void
  removeCategory: (name: string, redirectTo?: string) => void
  renameCategory: (oldName: string, newName: string) => void
  categoryIcons: Record<string, string>
  setCategoryIcon: (category: string, iconKey: string) => void

  // Cartões Customizáveis
  cards: CreditCardDef[]
  addCard: (card: Omit<CreditCardDef, 'id'>) => void
  removeCard: (id: string, redirectToId?: string) => void
  updateCard: (id: string, data: Partial<Omit<CreditCardDef, 'id'>>) => void

  // Bancos (onde as receitas entram)
  banks: Bank[]
  addBank: (bank: Omit<Bank, 'id'>) => void
  removeBank: (id: string, redirectToId?: string) => void
  updateBank: (id: string, data: Partial<Omit<Bank, 'id'>>) => void

  // Membros da Casa (Avatares)
  members: Member[]
  activeMemberId: string | null
  addMember: (member: Omit<Member, 'id'>) => void
  updateMember: (id: string, data: Partial<Member>) => void
  removeMember: (id: string, redirectToId?: string) => void
  setActiveMember: (id: string | null) => void

  // Ordem dos blocos do dashboard
  dashboardOrder: string[]
  setDashboardOrder: (order: string[]) => void

  // Backup (Melhoria #8)
  exportData: () => string
  importData: (json: string) => number
}

const DEFAULT_FILTERS: Filters = {
  cardId: 'all',
  category: 'all',
  status: 'all',
  search: '',
  month: 'all',
  recurringOnly: false,
  memberId: 'all',
  type: 'all',
  essentiality: 'all',
  tag: 'all',
  onlyMine: false,
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      filters: DEFAULT_FILTERS,
      editingId: null,
      toasts: [],
      budgets: {} as BudgetMap,
      goals: [],
      categories: [...DEFAULT_CATEGORIES],
      cards: [...DEFAULT_CARDS],
      banks: [...DEFAULT_BANKS],
      members: [],
      activeMemberId: null,
      dashboardOrder: DEFAULT_DASHBOARD_ORDER,
      categoryIcons: {},

      // --- Categorias Customizáveis ---

      addCategory: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const exists = get().categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
        if (exists) {
          get().addToast('Essa categoria já existe.', 'error')
          return
        }
        set((s) => ({ categories: [...s.categories, trimmed] }))
        get().addToast(`Categoria "${trimmed}" criada!`, 'success')
      },

      removeCategory: (name, redirectTo) => {
        const inUse = get().expenses.some((e) => e.category === name)
        if (inUse && !redirectTo) {
          get().addToast('Escolha uma categoria de destino para mover as despesas.', 'error')
          return
        }
        if (redirectTo === name) return
        set((s) => ({
          categories: s.categories.filter((c) => c !== name),
          expenses: redirectTo
            ? s.expenses.map((e) => (e.category === name ? { ...e, category: redirectTo } : e))
            : s.expenses,
          budgets: Object.fromEntries(Object.entries(s.budgets).filter(([k]) => k !== name)) as BudgetMap,
        }))
        get().addToast(
          redirectTo
            ? `Categoria "${name}" removida e lançamentos movidos para "${redirectTo}".`
            : `Categoria "${name}" removida.`,
          'info'
        )
      },

      renameCategory: (oldName, newName) => {
        const trimmed = newName.trim()
        if (!trimmed || trimmed === oldName) return
        const exists = get().categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
        if (exists) {
          get().addToast('Já existe uma categoria com esse nome.', 'error')
          return
        }
        set((s) => ({
          categories: s.categories.map((c) => (c === oldName ? trimmed : c)),
          expenses: s.expenses.map((e) => (e.category === oldName ? { ...e, category: trimmed } : e)),
          budgets: Object.fromEntries(
            Object.entries(s.budgets).map(([k, v]) => (k === oldName ? [trimmed, v] : [k, v]))
          ) as BudgetMap,
          categoryIcons: s.categoryIcons?.[oldName]
            ? Object.fromEntries(
                Object.entries(s.categoryIcons).map(([k, v]) => (k === oldName ? [trimmed, v] : [k, v]))
              )
            : s.categoryIcons,
        }))
        get().addToast(`Categoria renomeada para "${trimmed}".`, 'success')
      },

      setCategoryIcon: (category, iconKey) => {
        set((s) => ({ categoryIcons: { ...s.categoryIcons, [category]: iconKey } }))
      },

      // --- CRUD ---

      addExpense: (data) => {
        const newExpense: Expense = { ...data, id: uuidv4() }
        set((state) => ({ expenses: [newExpense, ...state.expenses] }))
        get().addToast('Despesa adicionada com sucesso!', 'success')
      },

      addExpenses: (data) => {
        if (data.length === 0) return 0
        const created = data.map((item) => ({ ...item, id: uuidv4() }))
        set((state) => ({ expenses: [...created, ...state.expenses] }))
        get().addToast(
          `${created.length} transaç${created.length === 1 ? 'ão' : 'ões'} importada${created.length === 1 ? '' : 's'}!`,
          'success'
        )
        return created.length
      },

      updateExpense: (id, data) => {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        }))
        get().setEditingId(null)
        get().addToast('Despesa atualizada!', 'success')
      },

      removeExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }))
        get().addToast('Despesa removida.', 'info')
      },

      togglePaid: (id) => {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, isPaid: !e.isPaid } : e
          ),
        }))
      },

      // --- Filtros ---

      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),

      clearFilters: () => set({ filters: DEFAULT_FILTERS }),

      // --- UI ---

      setEditingId: (id) => set({ editingId: id }),

      addToast: (message, type = 'info') => {
        const id = uuidv4()
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => get().removeToast(id), 3000)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // --- Orçamentos ---

      setBudget: (category, limit) =>
        set((state) => ({ budgets: { ...state.budgets, [category]: limit } })),

      getCategorySpending: (month) => getCategorySpending(get().expenses, month, get().budgets),

      // --- Metas ---

      addGoal: (data) => {
        const newGoal: SavingsGoal = { ...data, id: uuidv4() }
        set((state) => ({ goals: [...state.goals, newGoal] }))
        get().addToast('Meta criada!', 'success')
      },

      updateGoal: (id, data) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
        })),

      removeGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }))
        get().addToast('Meta removida.', 'info')
      },

      contributeToGoal: (id, amount) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g
          ),
        }))
        get().addToast('Contribuição registrada!', 'success')
      },

      // --- Cartões Customizáveis ---

      addCard: (data) => {
        const newCard: CreditCardDef = { ...data, id: uuidv4() }
        set((s) => ({ cards: [...s.cards, newCard] }))
        get().addToast(`Cartão "${newCard.name}" criado!`, 'success')
      },

      removeCard: (id, redirectToId) => {
        const inUse = get().expenses.some((e) => e.cardId === id)
        if (inUse && !redirectToId) {
          get().addToast('Escolha um cartão de destino para mover as despesas.', 'error')
          return
        }
        if (redirectToId === id) return
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
          filters: s.filters.cardId === id ? { ...s.filters, cardId: 'all' } : s.filters,
          expenses: redirectToId
            ? s.expenses.map((e) => (e.cardId === id ? { ...e, cardId: redirectToId } : e))
            : s.expenses,
        }))
        get().addToast(
          redirectToId ? 'Cartão removido e despesas transferidas.' : 'Cartão removido.',
          'info'
        )
      },

      updateCard: (id, data) => {
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }))
        get().addToast('Cartão atualizado!', 'success')
      },

      // --- Bancos ---

      addBank: (data) => {
        const newBank: Bank = { ...data, id: uuidv4() }
        set((s) => ({ banks: [...s.banks, newBank] }))
        get().addToast(`Banco "${newBank.name}" criado!`, 'success')
      },

      removeBank: (id, redirectToId) => {
        const inUse = get().expenses.some((e) => e.bankId === id)
        if (inUse && !redirectToId) {
          get().addToast('Escolha um banco de destino para mover os lançamentos.', 'error')
          return
        }
        if (redirectToId === id) return
        set((s) => ({
          banks: s.banks.filter((b) => b.id !== id),
          expenses: redirectToId
            ? s.expenses.map((e) => (e.bankId === id ? { ...e, bankId: redirectToId } : e))
            : s.expenses,
        }))
        get().addToast(
          redirectToId ? 'Banco removido e lançamentos transferidos.' : 'Banco removido.',
          'info'
        )
      },

      updateBank: (id, data) => {
        set((s) => ({
          banks: s.banks.map((b) => (b.id === id ? { ...b, ...data } : b)),
        }))
        get().addToast('Banco atualizado!', 'success')
      },

      // --- Membros ---

      addMember: (data) => {
        const newMember: Member = { ...data, id: uuidv4() }
        set((s) => ({ members: [...s.members, newMember] }))
        get().addToast(`Membro "${data.name}" adicionado!`, 'success')
      },

      updateMember: (id, data) => {
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...data } : m)),
        }))
      },

      removeMember: (id, redirectToId) => {
        const member = get().members.find((m) => m.id === id)
        const hasTransactions = get().expenses.some((e) => e.memberId === id)
        if (hasTransactions && !redirectToId) {
          get().addToast(`Escolha um membro de destino para as transações de "${member?.name}".`, 'error')
          return
        }
        if (redirectToId === id) return
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          activeMemberId: s.activeMemberId === id ? null : s.activeMemberId,
          expenses: redirectToId
            ? s.expenses.map((e) => (e.memberId === id ? { ...e, memberId: redirectToId } : e))
            : s.expenses,
        }))
        get().addToast(
          redirectToId
            ? `Membro "${member?.name}" removido e transações transferidas.`
            : `Membro "${member?.name}" removido.`,
          'info'
        )
      },

      setActiveMember: (id) => set({ activeMemberId: id }),

      setDashboardOrder: (order) => set({ dashboardOrder: order }),

      // --- Fluxo de Caixa ---

      getMonthlySummary: (month) => getMonthlySummary(get().expenses, month),

      // --- Backup ---

      exportData: () => exportToJSON(get().expenses),

      importData: (json) => {
        const imported = importFromJSON(json)
        if (imported.length > 0) {
          set({ expenses: imported })
          get().addToast(`${imported.length} despesas importadas!`, 'success')
        } else {
          get().addToast('Nenhuma despesa válida encontrada no arquivo.', 'error')
        }
        return imported.length
      },
    }),
    {
      name: 'casa-em-ordem-v2',
      storage: createJSONStorage(() => localStorage),
      // Validação ao carregar do storage (Melhoria #4)
      onRehydrateStorage: () => (state) => {
        if (state?.expenses) {
          state.expenses = validateExpenses(state.expenses)
        }
        if (state) {
          const merged = mergeDashboardOrder(state.dashboardOrder, DEFAULT_DASHBOARD_ORDER as string[])
          if (JSON.stringify(merged) !== JSON.stringify(state.dashboardOrder)) {
            state.dashboardOrder = merged
          }
        }
      },
      // Persistir apenas dados, não funções nem UI efêmera
      partialize: (state) => ({
        expenses: state.expenses,
        filters: state.filters,
        budgets: state.budgets,
        goals: state.goals,
        categories: state.categories,
        cards: state.cards,
        banks: state.banks,
        members: state.members,
        activeMemberId: state.activeMemberId,
        dashboardOrder: state.dashboardOrder,
        categoryIcons: state.categoryIcons,
      }),
    }
  )
)