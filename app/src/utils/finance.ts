import { addMonths, startOfMonth, isEqual } from 'date-fns'
import { z } from 'zod'

// --- Schema & Tipos Globais (Melhoria #11 + #4) ---

// Categorias padrão (podem ser estendidas pelo usuário)
export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Serviços',
  'Outros',
] as const

// Schema flexível: aceita qualquer string não vazia como categoria
export const CategorySchema = z.string().min(1)
export type Category = z.infer<typeof CategorySchema>

// CardId flexível: aceita qualquer string não vazia (permite cartões customizáveis)
export const CardIdSchema = z.string().min(1)
export type CardId = z.infer<typeof CardIdSchema>

// --- Membros da Casa (Avatares) ---
export const MEMBER_COLORS = [
  '#f97316', // terracota (padrão)
  '#0ea5e9', // azul
  '#8b5cf6', // roxo
  '#ec4899', // rosa
  '#10b981', // verde
  '#f59e0b', // âmbar
  '#6366f1', // índigo
  '#64748b', // slate
] as const

// Avatares SVG disponíveis para membros
export const MALE_AVATARS = ['male-1', 'male-2', 'male-3', 'male-4', 'male-5'] as const
export const FEMALE_AVATARS = [
  'female-1',
  'female-2',
  'female-3',
  'female-4',
  'female-5',
] as const
export const MEMBER_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS] as const
export type MemberAvatar = typeof MEMBER_AVATARS[number] | null

export const MemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().min(1),
  avatar: z.enum(MEMBER_AVATARS).nullable().optional(),
})
export type Member = z.infer<typeof MemberSchema>

// Interface para cartão customizável
export interface CreditCardDef {
  id: string
  name: string
  color: string
}

// Interface para banco/conta onde a receita é depositada
export interface Bank {
  id: string
  name: string
  color: string
}

export const TransactionTypeSchema = z.enum(['income', 'expense']).default('expense')
export type TransactionType = z.infer<typeof TransactionTypeSchema>

// --- Essencialidade do Gasto ---
export const ESSENTIALITY_OPTIONS = [
  { value: 'essential', label: 'Essencial', emoji: '🛒' },
  { value: 'necessary', label: 'Necessária', emoji: '📋' },
  { value: 'extra', label: 'Extra', emoji: '✨' },
] as const

export type Essentiality = typeof ESSENTIALITY_OPTIONS[number]['value']

// --- Privacidade da Transação ---
export const PRIVACY_OPTIONS = [
  { value: 'family', label: 'Visível para todos', emoji: '👥' },
  { value: 'personal', label: 'Só eu vejo', emoji: '🔒' },
] as const

export type Privacy = typeof PRIVACY_OPTIONS[number]['value']

export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(val), {
    message: 'Data inválida',
  }).transform((val) => val.length === 10 ? `${val}T00:00:00.000Z` : val),
  amount: z.number().int().nonnegative(), // centavos
  dueDay: z.number().int().min(1).max(31),
  installments: z.number().int().positive(),
  paidInstallments: z.number().int().nonnegative(),
  isPaid: z.boolean(),
  isRecurring: z.boolean().default(false),
  category: CategorySchema,
  cardId: CardIdSchema,
  bankId: z.string().min(1).optional(),
  type: TransactionTypeSchema,
  memberId: z.string().uuid().optional(),
  essentiality: z.enum(['essential', 'necessary', 'extra']).nullable().optional(),
  tags: z.array(z.string()).optional(),
  privacy: z.enum(['family', 'personal']).optional(),
})
export type Expense = z.infer<typeof ExpenseSchema>

export interface MonthlyProjection {
  month: string // YYYY-MM
  label: string // "Nov 2026"
  total: number // centavos (só despesas)
  income: number // centavos (só receitas)
  expenses: Expense[]
}

// --- Orçamento por Categoria ---

export const BudgetSchema = z.record(z.string(), z.number().int().nonnegative())
export type BudgetMap = z.infer<typeof BudgetSchema>

export interface CategorySpending {
  category: Category
  spent: number // centavos
  limit: number // centavos (0 = sem limite)
  percentage: number // 0-100+
  over: boolean
}

// --- Metas de Poupança ---

export const SavingsGoalSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  targetAmount: z.number().int().positive(),
  currentAmount: z.number().int().nonnegative(),
  deadline: z.string().optional(), // ISO date
  color: z.string().optional(),
})
export type SavingsGoal = z.infer<typeof SavingsGoalSchema>

// --- Constantes ---

export const CATEGORIES = [...DEFAULT_CATEGORIES]
export const DEFAULT_BANKS: Bank[] = [
  { id: 'nubank', name: 'Nubank', color: '#820ad1' },
  { id: 'itau', name: 'Itaú', color: '#003c7e' },
  { id: 'bb', name: 'Banco do Brasil', color: '#f5e000' },
  { id: 'inter', name: 'Inter', color: '#ff7a00' },
  { id: 'caixa', name: 'Caixa', color: '#0f6fb8' },
]

export const DEFAULT_CARDS: CreditCardDef[] = [
  { id: 'nubank', name: 'Nubank', color: '#820ad1' },
  { id: 'inter', name: 'Inter', color: '#ff7a00' },
  { id: 'itau', name: 'Itaú', color: '#003c7e' },
  { id: 'bb', name: 'Banco do Brasil', color: '#f5e000' },
  { id: 'cash', name: 'Dinheiro/Pix', color: '#6b5847' },
]

// Compatibilidade retroativa: CARDS agora é mutável via store
export const CARDS = [...DEFAULT_CARDS]

// --- Blocos reordenáveis da Visão Geral ---
export const DASHBOARD_BLOCKS = [
  'insights',
  'members',
  'projections',
  'calendar',
  'categoryChart',
  'goals',
  'budget',
  'installments',
  'transactions',
] as const

export type DashboardBlockId = (typeof DASHBOARD_BLOCKS)[number]

export const DASHBOARD_BLOCK_LABELS: Record<DashboardBlockId, string> = {
  insights: 'Insights',
  members: 'Balança por Membro',
  projections: 'Projeções',
  calendar: 'Calendário de Gastos',
  categoryChart: 'Gastos por Categoria',
  goals: 'Metas de Poupança',
  budget: 'Orçamento por Categoria',
  installments: 'Mapa de Parcelas',
  transactions: 'Histórico de Transações',
}

export const DEFAULT_DASHBOARD_ORDER: string[] = [...DASHBOARD_BLOCKS]

/**
 * Mescla a ordem salva (que pode não ter os blocos novos) com a ordem padrão.
 * Cada bloco novo entra logo depois do bloco anterior a ele na ordem padrão,
 * preservando a ordem que o usuário montou. Ids desconhecidos são descartados.
 */
export function mergeDashboardOrder(savedOrder: string[], defaults: string[]): string[] {
  const result = savedOrder.filter((id) => defaults.includes(id))
  for (const id of defaults) {
    if (result.includes(id)) continue
    let anchor: string | null = null
    for (let i = defaults.indexOf(id) - 1; i >= 0; i--) {
      if (result.includes(defaults[i])) {
        anchor = defaults[i]
        break
      }
    }
    if (anchor) result.splice(result.indexOf(anchor) + 1, 0, id)
    else result.unshift(id)
  }
  return result
}

// --- Utilitários Financeiros ---

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function parseBRL(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.round(num * 100)
}

/**
 * Calcula valor da parcela com correção de centavos na última (Melhoria #3).
 * As N-1 primeiras parcelas são iguais; a última absorve a diferença.
 */
export function getInstallmentValue(totalCents: number, installments: number): number {
  if (installments <= 1) return totalCents
  return Math.floor(totalCents / installments)
}

/**
 * Retorna o valor exato da i-ésima parcela (0-indexed).
 * A última parcela recebe o resto para fechar o total.
 */
export function getInstallmentAt(totalCents: number, installments: number, index: number): number {
  if (installments <= 1) return totalCents
  const base = Math.floor(totalCents / installments)
  if (index === installments - 1) {
    return totalCents - base * (installments - 1)
  }
  return base
}

/**
 * Valida array de despesas ao carregar do storage (Melhoria #4).
 * Descarta registros inválidos em vez de quebrar a app.
 */
export function validateExpenses(data: unknown): Expense[] {
  if (!Array.isArray(data)) return []
  const result: Expense[] = []
  for (const item of data) {
    const parsed = ExpenseSchema.safeParse(item)
    if (parsed.success) {
      result.push(parsed.data)
    } else {
      console.warn('Despesa inválida descartada:', item, parsed.error.issues)
    }
  }
  return result
}

/**
 * Calcula em quais meses futuros uma despesa ainda terá parcelas a pagar.
 * Usa getInstallmentAt para valores precisos por mês.
 */
export function getFutureInstallments(expense: Expense): { month: Date; amount: number }[] {
  const result: { month: Date; amount: number }[] = []
  if (expense.installments <= 1) return result

  const startDate = startOfMonth(new Date(expense.date))

  for (let i = expense.paidInstallments; i < expense.installments; i++) {
    const monthDate = addMonths(startDate, i)
    const amount = getInstallmentAt(expense.amount, expense.installments, i)
    result.push({ month: monthDate, amount })
  }

  return result
}

/**
 * Gera projeção dos próximos N meses considerando todas as despesas ativas.
 */
export function generateProjections(
  expenses: Expense[],
  monthsAhead: number = 6
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = []
  const now = startOfMonth(new Date())

  for (let i = 0; i < monthsAhead; i++) {
    const targetMonth = addMonths(now, i)
    const monthKey = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric',
    }).format(targetMonth)

    const monthExpenses: Expense[] = []
    let total = 0
    let income = 0

    for (const expense of expenses) {
      const isIncome = expense.type === 'income'
      const futureInstallments = getFutureInstallments(expense)
      const match = futureInstallments.find(
        (fi) => fi.month.getTime() === targetMonth.getTime()
      )

      if (match) {
        if (isIncome) {
          income += match.amount
        } else {
          monthExpenses.push(expense)
          total += match.amount
        }
      } else if (expense.installments <= 1 && !expense.isRecurring) {
        const expenseMonth = startOfMonth(new Date(expense.date))
        if (isEqual(expenseMonth, targetMonth)) {
          if (isIncome) {
            income += expense.amount
          } else {
            monthExpenses.push(expense)
            total += expense.amount
          }
        }
      }
    }

    // Adiciona projeções de recorrentes não pagas — cada tipo no seu lado
    const recurring = getRecurringProjections(expenses, targetMonth)
    for (const r of recurring) {
      if (r.type === 'income') {
        income += r.amount
      } else {
        monthExpenses.push(r)
        total += r.amount
      }
    }

    projections.push({ month: monthKey, label, total, income, expenses: monthExpenses })
  }

  return projections
}

export function getTotalDebt(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => {
    if (e.type !== 'expense') return sum
    if (e.isPaid) return sum
    const remaining = e.installments - e.paidInstallments
    if (remaining <= 0) return sum
    // Soma precisa das parcelas restantes individuais
    let debt = 0
    for (let i = e.paidInstallments; i < e.installments; i++) {
      debt += getInstallmentAt(e.amount, e.installments, i)
    }
    return sum + debt
  }, 0)
}

export function getCurrentMonthTotal(expenses: Expense[]): number {
  return getMonthEntries(expenses, getMonthKey())
    .filter(({ expense }) => expense.type !== 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)
}

// --- Projeção de Despesas Fixas (Recorrentes) ---
export function getRecurringProjections(
  expenses: Expense[],
  targetMonth: Date
): Expense[] {
  const target = startOfMonth(targetMonth)
  return expenses
    .filter((e) => e.isRecurring && !e.isPaid)
    .map((e) => {
      const originDate = new Date(e.date)
      if (isNaN(originDate.getTime())) return null
      const origin = startOfMonth(originDate)
      // Só projeta se o mês alvo for >= mês de origem
      if (target.getTime() < origin.getTime()) return null
      // Protege contra dueDay inválido (undefined, 0 ou >31)
      const day = Number.isFinite(e.dueDay) && e.dueDay >= 1 && e.dueDay <= 31 ? e.dueDay : 1
      const virtualDate = new Date(target.getFullYear(), target.getMonth(), day)
      if (isNaN(virtualDate.getTime())) return null
      // Cria uma despesa virtual para o mês alvo
      return {
        ...e,
        id: `${e.id}__recur__${target.toISOString().slice(0, 7)}`,
        date: virtualDate.toISOString(),
      } as Expense
    })
    .filter((e): e is Expense => e !== null)
}

/**
 * Calcula o total de despesas fixas ativas para um mês específico.
 * Diferente de getRecurringProjections, NÃO filtra por isPaid,
 * pois o gráfico de histórico precisa mostrar o compromisso mensal
 * total independente de a parcela já ter sido paga ou não.
 */
export function getFixedExpensesTotal(expenses: Expense[], _targetMonth: Date): number {
  // Espelha exatamente a tabela de despesas fixas ativas: soma TODAS as recorrentes
  // independente da data de origem, para que o gráfico sempre mostre o compromisso
  // mensal total e permita comparação visual direta entre meses.
  return expenses
    .filter((e) => e.isRecurring && e.type !== 'income')
    .reduce((sum, e) => sum + e.amount, 0)
}

// --- Cálculo de Gasto por Categoria no Mês ---

export function getCategorySpending(
  expenses: Expense[],
  month: string, // YYYY-MM
  budgets: BudgetMap,
  categories: string[] = CATEGORIES
): CategorySpending[] {
  const target = new Date(`${month}-01T00:00:00`)
  const spending: Record<string, number> = {}

  // Inicializa todas as categorias conhecidas
  for (const cat of categories) spending[cat] = 0

  for (const e of expenses) {
    if (e.isPaid) continue
    const eMonth = startOfMonth(new Date(e.date))
    if (!isEqual(eMonth, target)) continue

    // Garante que categorias dinâmicas (não listadas) também sejam contabilizadas
    if (!(e.category in spending)) spending[e.category] = 0

    // Para parcelados, verificar se há parcela neste mês
    if (e.installments > 1) {
      const future = getFutureInstallments(e)
      const match = future.find((fi) => fi.month.getTime() === target.getTime())
      if (match) spending[e.category] += match.amount
    } else {
      spending[e.category] += e.amount
    }
  }

  // Adicionar projeções de recorrentes
  const recurring = getRecurringProjections(expenses, target)
  for (const r of recurring) {
    if (!(r.category in spending)) spending[r.category] = 0
    spending[r.category] += r.amount
  }

  // Retorna todas as categorias com dados (incluindo as dinâmicas descobertas)
  const allCategories = Array.from(new Set([...categories, ...Object.keys(spending)]))
  return allCategories.map((cat) => {
    const spent = spending[cat] ?? 0
    const limit = budgets[cat] ?? 0
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0
    return { category: cat, spent, limit, percentage, over: limit > 0 && spent > limit }
  })
}

// --- Fluxo de Caixa ---

export interface MonthlySummary {
  income: number   // centavos
  expense: number  // centavos
  balance: number  // centavos
}

export function getMonthlySummary(expenses: Expense[], month: string): MonthlySummary {
  const target = new Date(`${month}-01T00:00:00`)
  let income = 0
  let expense = 0

  for (const e of expenses) {
    const eMonth = startOfMonth(new Date(e.date))
    if (!isEqual(eMonth, target)) continue
    if (e.type === 'income') {
      // Para receitas parceladas, soma a parcela do mês
      if (e.installments > 1) {
        const future = getFutureInstallments(e)
        const match = future.find((fi) => fi.month.getTime() === target.getTime())
        if (match) income += match.amount
      } else {
        income += e.amount
      }
    } else {
      // Para despesas parceladas, soma a parcela do mês
      if (e.installments > 1) {
        const future = getFutureInstallments(e)
        const match = future.find((fi) => fi.month.getTime() === target.getTime())
        if (match) expense += match.amount
      } else {
        expense += e.amount
      }
    }
  }

  // Receitas recorrentes
  const recurringIncome = getRecurringProjections(
    expenses.filter((e) => e.type === 'income'),
    target
  )
  for (const r of recurringIncome) income += r.amount

  // Despesas recorrentes
  const recurringExpense = getRecurringProjections(
    expenses.filter((e) => e.type !== 'income'),
    target
  )
  for (const r of recurringExpense) expense += r.amount

  return { income, expense, balance: income - expense }
}

/** Limite de "aperto": saldo positivo abaixo de 15% da receita conta como próximo do vermelho. */
export const BALANCE_WARNING_RATIO = 0.15

export type BalanceSeverity = 'positive' | 'warning' | 'danger'

/**
 * Classifica um saldo mensal em três faixas:
 * - `danger`: negativo (fecha no vermelho)
 * - `warning`: positivo, mas abaixo de `BALANCE_WARNING_RATIO` da receita (próximo do zero)
 * - `positive`: com folga
 * Sem receita no mês, qualquer saldo negativo já é `danger` e o resto é `positive`.
 */
export function getBalanceSeverity(balance: number, income: number): BalanceSeverity {
  if (balance < 0) return 'danger'
  if (income <= 0) return 'positive'
  return balance < income * BALANCE_WARNING_RATIO ? 'warning' : 'positive'
}

export interface BankSummary {
  bank: Bank
  total: number
  /** Saldo em conta: entradas menos gastos pagos direto dela (Pix/débito). */
  balance: number
  percentage: number
  transactions: number
}

/**
 * Calcula quanto cada banco recebeu de receitas e o saldo em conta (entradas
 * menos gastos pagos direto da conta — Pix/débito; fatura de cartão não debita).
 * Com `month` vazio ou `'all'`, considera todos os meses. Lançamentos sem
 * `bankId` são agrupados em "Sem banco".
 */
export function getBankSummary(banks: Bank[], expenses: Expense[], month: string): BankSummary[] {
  const allMonths = !month || month === 'all'
  const inMonth = (e: Expense) =>
    allMonths || isEqual(startOfMonth(new Date(e.date)), new Date(`${month}-01T00:00:00`))

  const incomes = expenses.filter((e) => e.type === 'income' && inMonth(e))
  const debits = expenses.filter((e) => e.type === 'expense' && e.cardId === 'cash' && inMonth(e))

  const total = incomes.reduce((sum, e) => sum + e.amount, 0)
  const balanceOf = (bankId?: string) =>
    incomes.filter((e) => (e.bankId ?? undefined) === bankId).reduce((s, e) => s + e.amount, 0) -
    debits.filter((e) => (e.bankId ?? undefined) === bankId).reduce((s, e) => s + e.amount, 0)

  const result: BankSummary[] = banks.map((bank) => {
    const bankTx = incomes.filter((e) => e.bankId === bank.id)
    return {
      bank,
      total: bankTx.reduce((s, e) => s + e.amount, 0),
      balance: balanceOf(bank.id),
      percentage: 0,
      transactions: bankTx.length,
    }
  })

  const unbanked = incomes.filter((e) => !e.bankId)
  const unbankedBalance = balanceOf(undefined)
  if (unbanked.length > 0 || unbankedBalance !== 0) {
    result.push({
      bank: { id: 'no-bank', name: 'Sem banco', color: '#9ca3af' },
      total: unbanked.reduce((s, e) => s + e.amount, 0),
      balance: unbankedBalance,
      percentage: 0,
      transactions: unbanked.length,
    })
  }

  if (total > 0) {
    for (const r of result) r.percentage = (r.total / total) * 100
  }

  return result.sort((a, b) => b.total - a.total)
}

// --- Exportação / Backup (Melhoria #8) ---

export function exportToJSON(expenses: Expense[]): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), expenses }, null, 2)
}

export function importFromJSON(json: string): Expense[] {
  try {
    const data = JSON.parse(json)
    const raw = Array.isArray(data) ? data : data?.expenses
    return validateExpenses(raw)
  } catch {
    console.error('Falha ao importar JSON')
    return []
  }
}

// --- Essencialidade: rótulo e estilo ---

export interface EssentialityMeta {
  label: string
  emoji: string
  pill: string
}

export function getEssentialityMeta(value: string | null | undefined): EssentialityMeta | null {
  switch (value) {
    case 'essential':
      return { label: 'Essencial', emoji: '🛒', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'necessary':
      return { label: 'Necessária', emoji: '📋', pill: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'extra':
      return { label: 'Extra', emoji: '✨', pill: 'bg-rose-50 text-rose-700 border-rose-200' }
    default:
      return null
  }
}

// --- Entradas que caem em um mês (avulsas, parcelas e recorrentes) ---

export interface MonthEntry {
  expense: Expense
  amount: number // centavos que competem a este mês
}

/**
 * Interpreta a data como o dia que o usuário digitou.
 * `new Date('2026-01-01T00:00:00.000Z')` cai em 31/12 no fuso do Brasil;
 * por isso lemos ano/mês/dia direto da string quando ela está presente.
 */
export function parseLocalDate(value: string): Date {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return new Date(value)
}

/** Extrai o mês (YYYY-MM) de uma data sem sofrer deslocamento de fuso. */
export function monthKeyOf(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}`
  return getMonthKey(parseLocalDate(value))
}

/**
 * Retorna o que efetivamente pesa no mês pedido (YYYY-MM):
 * avulsas no mês de origem, parcela do mês nos parcelados e
 * a projeção das recorrentes. Inclui pagas e não pagas.
 */
export function getMonthEntries(expenses: Expense[], month: string): MonthEntry[] {
  const target = startOfMonth(new Date(`${month}-01T00:00:00`))
  if (isNaN(target.getTime())) return []
  const entries: MonthEntry[] = []

  for (const e of expenses) {
    if (e.isRecurring) {
      const originDate = parseLocalDate(e.date)
      if (isNaN(originDate.getTime())) continue
      if (target.getTime() < startOfMonth(originDate).getTime()) continue
      entries.push({ expense: e, amount: e.amount })
      continue
    }
    if (e.installments > 1) {
      const start = startOfMonth(parseLocalDate(e.date))
      if (isNaN(start.getTime())) continue
      const index = (target.getFullYear() - start.getFullYear()) * 12 +
        (target.getMonth() - start.getMonth())
      if (index >= e.paidInstallments && index < e.installments) {
        entries.push({ expense: e, amount: getInstallmentAt(e.amount, e.installments, index) })
      }
      continue
    }
    if (monthKeyOf(e.date) === month) {
      entries.push({ expense: e, amount: e.amount })
    }
  }

  return entries
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// --- Gasto por membro no mês ---

export interface MemberSpendingEntry {
  memberId: string
  name: string
  avatar: MemberAvatar
  color: string
  spent: number
  percentage: number // 0-100 do total gasto pelos membros
}

const UNASSIGNED_ID = '__unassigned__'

export function getMemberSpending(
  expenses: Expense[],
  members: Member[],
  month: string
): MemberSpendingEntry[] {
  const totals: Record<string, number> = {}
  for (const { expense, amount } of getMonthEntries(expenses, month)) {
    if (expense.type === 'income') continue
    const key = expense.memberId ?? UNASSIGNED_ID
    totals[key] = (totals[key] ?? 0) + amount
  }

  const rows: MemberSpendingEntry[] = members.map((m) => ({
    memberId: m.id,
    name: m.name,
    avatar: m.avatar ?? null,
    color: m.color,
    spent: totals[m.id] ?? 0,
    percentage: 0,
  }))

  if (totals[UNASSIGNED_ID]) {
    rows.push({
      memberId: UNASSIGNED_ID,
      name: 'Sem responsável',
      avatar: null,
      color: '#94a3b8',
      spent: totals[UNASSIGNED_ID],
      percentage: 0,
    })
  }

  const total = rows.reduce((sum, r) => sum + r.spent, 0)
  for (const r of rows) {
    r.percentage = total > 0 ? Math.round((r.spent / total) * 100) : 0
  }

  return rows.sort((a, b) => b.spent - a.spent)
}

// --- Gastos diários do mês (calendário) ---

export function getDailySpending(expenses: Expense[], month: string): Record<number, number> {
  const days: Record<number, number> = {}
  for (const { expense, amount } of getMonthEntries(expenses, month)) {
    if (expense.type === 'income') continue
    const day = expense.isRecurring
      ? expense.dueDay
      : parseLocalDate(expense.date).getDate()
    if (!Number.isFinite(day) || day < 1 || day > 31) continue
    days[day] = (days[day] ?? 0) + amount
  }
  return days
}

/**
 * Itens detalhados de um dia para o calendário.
 * Inclui a descrição e o valor, separados por fixo (dueDay) e variável (date).
 */
export interface DailyDetailItem {
  description: string
  amount: number // centavos
  category: string
}

export interface DailyDetail {
  fixed: DailyDetailItem[]
  variable: DailyDetailItem[]
}

/**
 * Resumo diário detalhado para o calendário: separado entre fixos (isRecurring, pelo dueDay)
 * e variáveis (não-recorrentes, pela data real). Cada item contém descrição e valor.
 */
export function getDailyDetail(
  expenses: Expense[],
  month: string
): Record<number, DailyDetail> {
  const days: Record<number, DailyDetail> = {}
  for (const { expense, amount } of getMonthEntries(expenses, month)) {
    if (expense.type === 'income') continue
    const day = expense.isRecurring
      ? expense.dueDay
      : parseLocalDate(expense.date).getDate()
    if (!Number.isFinite(day) || day < 1 || day > 31) continue
    if (!days[day]) days[day] = { fixed: [], variable: [] }
    const item: DailyDetailItem = {
      description: expense.description,
      amount,
      category: expense.category,
    }
    if (expense.isRecurring) {
      days[day]!.fixed.push(item)
    } else {
      days[day]!.variable.push(item)
    }
  }
  return days
}

/** Versão resumida (totais apenas) — usada pelo teste legado e pelo código que não precisa de detalhe. */
export function getDailySummary(
  expenses: Expense[],
  month: string
): Record<number, { fixed: number; variable: number }> {
  const detail = getDailyDetail(expenses, month)
  const result: Record<number, { fixed: number; variable: number }> = {}
  for (const [day, d] of Object.entries(detail)) {
    result[Number(day)] = {
      fixed: d.fixed.reduce((s, i) => s + i.amount, 0),
      variable: d.variable.reduce((s, i) => s + i.amount, 0),
    }
  }
  return result
}

// --- Alertas preditivos de orçamento ---

export interface BudgetAlertItem {
  category: Category
  limit: number
  spent: number
  projected: number
  percentageSpent: number
  percentageProjected: number
  status: 'ok' | 'warning' | 'danger'
}

/**
 * Projeta o fechamento do mês pelo ritmo atual de gastos.
 * Meses passados usam o gasto real; meses futuros usam o próprio gasto previsto.
 */
export function getBudgetAlerts(
  expenses: Expense[],
  budgets: BudgetMap,
  month: string
): BudgetAlertItem[] {
  const now = new Date()
  const target = new Date(`${month}-01T00:00:00`)
  if (isNaN(target.getTime())) return []

  const isCurrent = getMonthKey(now) === month
  const isPast = target.getTime() < startOfMonth(now).getTime()
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const daysElapsed = isCurrent ? Math.max(1, now.getDate()) : isPast ? daysInMonth : 1

  const spent: Record<string, number> = {}
  for (const { expense, amount } of getMonthEntries(expenses, month)) {
    if (expense.type === 'income') continue
    spent[expense.category] = (spent[expense.category] ?? 0) + amount
  }

  const alerts: BudgetAlertItem[] = []
  for (const [category, limit] of Object.entries(budgets)) {
    if (!limit || limit <= 0) continue
    const used = spent[category] ?? 0
    const projected =
      isCurrent && !isPast
        ? Math.round((used / daysElapsed) * daysInMonth)
        : used
    const percentageProjected = (projected / limit) * 100
    alerts.push({
      category,
      limit,
      spent: used,
      projected,
      percentageSpent: (used / limit) * 100,
      percentageProjected,
      status:
        percentageProjected > 100 ? 'danger' : percentageProjected >= 80 ? 'warning' : 'ok',
    })
  }

  return alerts.sort((a, b) => b.percentageProjected - a.percentageProjected)
}

// --- Parcelamentos ativos ---

export interface InstallmentSummary {
  expense: Expense
  paid: number
  total: number
  remaining: number
  remainingCents: number
  perInstallment: number
  lastDate: Date | null
}

export function getActiveInstallments(expenses: Expense[]): InstallmentSummary[] {
  return expenses
    .filter((e) => e.installments > 1 && e.type !== 'income')
    .map((e) => {
      const remaining = Math.max(0, e.installments - e.paidInstallments)
      const start = startOfMonth(parseLocalDate(e.date))
      const lastDate = isNaN(start.getTime())
        ? null
        : addMonths(start, e.installments - 1)
      return {
        expense: e,
        paid: e.paidInstallments,
        total: e.installments,
        remaining,
        remainingCents: getTotalDebt([e]),
        perInstallment: getInstallmentValue(e.amount, e.installments),
        lastDate,
      }
    })
    .filter((i) => i.remaining > 0)
    .sort((a, b) => b.remainingCents - a.remainingCents)
}

export interface CardInstallmentGroup {
  cardId: string
  items: InstallmentSummary[]
  remainingCents: number
  monthlyCents: number
}

/** Parcelamentos ativos agrupados por cartão, do maior saldo devedor para o menor. */
export function getInstallmentsByCard(expenses: Expense[]): CardInstallmentGroup[] {
  const groups = new Map<string, CardInstallmentGroup>()

  for (const item of getActiveInstallments(expenses)) {
    const cardId = item.expense.cardId
    const group =
      groups.get(cardId) ?? { cardId, items: [], remainingCents: 0, monthlyCents: 0 }
    group.items.push(item)
    group.remainingCents += item.remainingCents
    group.monthlyCents += item.perInstallment
    groups.set(cardId, group)
  }

  return [...groups.values()].sort((a, b) => b.remainingCents - a.remainingCents)
}

// --- Importação de extrato (OFX / CSV) ---

export interface ImportRow {
  description: string
  date: string // YYYY-MM-DD
  amount: number // centavos, sempre positivo
  type: TransactionType
  category: Category
  externalId?: string
}

const CATEGORY_KEYWORDS: { category: Category; words: string[] }[] = [
  { category: 'Alimentação', words: ['mercado', 'supermercado', 'padaria', 'restaurante', 'lanchonete', 'ifood', 'delivery', 'acougue', 'hortifruti', 'pizza', 'cafe'] },
  { category: 'Moradia', words: ['aluguel', 'condominio', 'energia', 'luz', 'agua', 'gas', 'internet', 'iptu', 'faxina'] },
  { category: 'Transporte', words: ['uber', '99', 'taxi', 'combustivel', 'gasolina', 'etanol', 'posto', 'estacionamento', 'onibus', 'metro', 'pedagio'] },
  { category: 'Saúde', words: ['farmacia', 'drogaria', 'medico', 'consulta', 'exame', 'dentista', 'plano de saude', 'academia'] },
  { category: 'Educação', words: ['escola', 'faculdade', 'curso', 'livraria', 'mensalidade', 'udemy', 'alura'] },
  { category: 'Lazer', words: ['cinema', 'netflix', 'spotify', 'streaming', 'bar', 'viagem', 'jogo', 'show', 'teatro'] },
  { category: 'Vestuário', words: ['roupa', 'calcado', 'sapato', 'loja', 'zara', 'renner', 'riachuelo'] },
  { category: 'Serviços', words: ['assinatura', 'telefone', 'celular', 'vivo', 'claro', 'tim', 'oi', 'seguro', 'tarifa', 'anuidade'] },
]

export function guessCategory(description: string): Category {
  const text = description.toLowerCase()
  for (const { category, words } of CATEGORY_KEYWORDS) {
    if (words.some((w) => text.includes(w))) return category
  }
  return 'Outros'
}

function normalizeDate(raw: string): string | null {
  const value = raw.trim()
  // ISO: 2026-11-05 ou 2026-11-05T00:00:00
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  // BR: 05/11/2026 ou 05-11-2026 ou 05/11/26
  const br = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (br) {
    const year = br[3].length === 2 ? `20${br[3]}` : br[3]
    return `${year}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  }
  // OFX: 20261105 ou 20261105120000
  const ofx = value.match(/^(\d{4})(\d{2})(\d{2})/)
  if (ofx) return `${ofx[1]}-${ofx[2]}-${ofx[3]}`
  return null
}

function parseAmount(raw: string): number | null {
  let value = raw.trim().replace(/[R$\s]/g, '')
  if (!value) return null
  const negative = value.startsWith('-') || (value.startsWith('(') && value.endsWith(')'))
  value = value.replace(/[()-]/g, '')
  // Formato BR: 1.234,56 → remove pontos de milhar e troca vírgula por ponto
  if (/,\d{1,2}$/.test(value)) value = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(value)
  if (isNaN(num)) return null
  return Math.round(Math.abs(num) * 100) * (negative ? -1 : 1)
}

function parseOFX(text: string): ImportRow[] {
  const rows: ImportRow[] = []
  const blocks = text.split(/<STMTTRN>/i).slice(1)
  for (const block of blocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\r\n]+)`, 'i'))
      return m ? m[1].trim() : ''
    }
    const date = normalizeDate(get('DTPOSTED'))
    const amount = parseAmount(get('TRNAMT'))
    const memo = get('MEMO') || get('NAME') || get('PAYEE')
    if (!date || amount === null || amount === 0) continue
    rows.push({
      description: memo || 'Lançamento importado',
      date,
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      category: guessCategory(memo),
      externalId: get('FITID') || undefined,
    })
  }
  return rows
}

function splitCsvLine(line: string, separator: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (char === separator && !quoted) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells.map((c) => c.trim())
}

function parseCSV(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const separator = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0)
    ? ';'
    : ','

  const header = splitCsvLine(lines[0], separator).map((c) => c.toLowerCase())
  const findCol = (names: string[]) => header.findIndex((h) => names.some((n) => h.includes(n)))
  const dateCol = findCol(['data', 'date'])
  const descCol = findCol(['descri', 'hist', 'memo', 'lancamento', 'estabelec', 'title', 'name'])
  const amountCol = findCol(['valor', 'amount', 'value', 'montante'])

  const hasHeader = dateCol >= 0 && amountCol >= 0
  const startIndex = hasHeader ? 1 : 0
  const rows: ImportRow[] = []

  for (let i = startIndex; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], separator)
    // Sem cabeçalho: assume ordem data;descrição;valor
    const rawDate = cells[hasHeader ? dateCol : 0] ?? ''
    const rawDesc = cells[hasHeader ? Math.max(descCol, 0) : 1] ?? ''
    const rawAmount = cells[hasHeader ? amountCol : 2] ?? ''

    const date = normalizeDate(rawDate)
    const amount = parseAmount(rawAmount)
    if (!date || amount === null || amount === 0) continue

    const description = rawDesc.trim() || 'Lançamento importado'
    rows.push({
      description,
      date,
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      category: guessCategory(description),
    })
  }

  return rows
}

/** Detecta o formato pelo conteúdo e devolve as linhas prontas para importar. */
export function parseBankFile(text: string, fileName: string): ImportRow[] {
  const isOFX = /\.ofx$/i.test(fileName) || /<STMTTRN>/i.test(text)
  return isOFX ? parseOFX(text) : parseCSV(text)
}