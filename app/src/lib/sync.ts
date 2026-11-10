import { supabase } from './supabase'
import {
  useExpenseStore,
  type ExpenseState,
} from '../store/useExpenseStore'
import { DEFAULT_DASHBOARD_ORDER, mergeDashboardOrder } from '../utils/finance'
import type { Expense, Bank, CreditCardDef, Member, SavingsGoal, BudgetMap } from '../utils/finance'
import type { Database } from './supabase.types'

type Tables = Database['public']['Tables']
type ExpenseRow = Tables['expenses']['Row']

/** Instantâneo completo dos dados do usuário, no formato que a store usa. */
export interface Snapshot {
  expenses: Expense[]
  banks: Bank[]
  cards: CreditCardDef[]
  members: Member[]
  goals: SavingsGoal[]
  budgets: BudgetMap
  categories: string[]
  categoryIcons: Record<string, string>
  activeMemberId: string | null
  dashboardOrder: string[]
}

// --- Mapeadores: linha do banco <-> modelo do app ---------------------------

const iso = (value: string) => new Date(value).toISOString()

const rowToExpense = (r: ExpenseRow): Expense => ({
  id: r.id,
  description: r.description,
  date: iso(r.date),
  amount: r.amount_cents,
  dueDay: r.due_day,
  installments: r.installments,
  paidInstallments: r.paid_installments,
  isPaid: r.is_paid,
  isRecurring: r.is_recurring,
  category: r.category,
  cardId: r.card_id,
  bankId: r.bank_id ?? undefined,
  type: r.type,
  memberId: r.member_id ?? undefined,
  essentiality: r.essentiality,
  tags: r.tags?.length ? r.tags : undefined,
  privacy: r.privacy ?? undefined,
})

const expenseToRow = (e: Expense, userId: string): Tables['expenses']['Insert'] => ({
  id: e.id,
  user_id: userId,
  description: e.description,
  date: iso(e.date),
  amount_cents: e.amount,
  due_day: e.dueDay,
  installments: e.installments,
  paid_installments: e.paidInstallments,
  is_paid: e.isPaid,
  is_recurring: e.isRecurring,
  category: e.category,
  card_id: e.cardId,
  bank_id: e.bankId ?? null,
  type: e.type,
  member_id: e.memberId ?? null,
  essentiality: e.essentiality ?? null,
  tags: e.tags ?? [],
  privacy: e.privacy ?? null,
})

// --- Leitura ---------------------------------------------------------------
// O Supabase devolve erro em vez de lista vazia quando falha; nesse caso
// preferimos abortar a hidratação e manter o que já está no navegador.

async function readAll<Row>(
  run: () => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>
): Promise<Row[]> {
  const { data, error } = await run()
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchSnapshot(userId: string): Promise<Snapshot> {
  const [expenses, banks, cards, members, goals, budgets, categories, prefs] = await Promise.all([
    readAll(() => supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false })),
    readAll(() => supabase.from('banks').select('*').eq('user_id', userId)),
    readAll(() => supabase.from('cards').select('*').eq('user_id', userId)),
    readAll(() => supabase.from('members').select('*').eq('user_id', userId)),
    readAll(() => supabase.from('goals').select('*').eq('user_id', userId)),
    readAll(() => supabase.from('budgets').select('*').eq('user_id', userId)),
    readAll(() => supabase.from('categories').select('*').eq('user_id', userId)),
    readAll(() => supabase.from('preferences').select('*').eq('user_id', userId)),
  ])

  const preference = (
    prefs as Tables['preferences']['Row'][]
  )[0]

  return {
    expenses: (expenses as ExpenseRow[]).map(rowToExpense),
    banks: (banks as Tables['banks']['Row'][]).map((b) => ({ id: b.id, name: b.name, color: b.color })),
    cards: (cards as Tables['cards']['Row'][]).map((c) => ({ id: c.id, name: c.name, color: c.color })),
    members: (members as Tables['members']['Row'][]).map((m) => ({
      id: m.id,
      name: m.name,
      color: m.color,
      avatar: (m.avatar as Member['avatar']) ?? undefined,
    })),
    goals: (goals as Tables['goals']['Row'][]).map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.target_cents,
      currentAmount: g.current_cents,
      deadline: g.deadline ?? undefined,
      color: g.color ?? undefined,
    })),
    budgets: Object.fromEntries(
      (budgets as Tables['budgets']['Row'][]).map((b) => [b.category, b.limit_cents])
    ) as BudgetMap,
    categories: (categories as Tables['categories']['Row'][]).map((c) => c.name),
    categoryIcons: Object.fromEntries(
      (categories as Tables['categories']['Row'][]).filter((c) => c.icon).map((c) => [c.name, c.icon as string])
    ),
    activeMemberId: preference?.active_member_id ?? null,
    dashboardOrder: preference?.dashboard_order ?? [],
  }
}

// --- Escrita ---------------------------------------------------------------

const chunk = <T,>(list: T[], size = 200) => {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

async function upsertAll<T>(table: keyof Tables, rows: T[]) {
  for (const part of chunk(rows)) {
    const { error } = await supabase.from(table as 'expenses').upsert(part as never, {
      onConflict: table === 'categories' ? 'user_id,name' : table === 'budgets' ? 'user_id,category' : table === 'expenses' || table === 'members' || table === 'goals' ? 'id' : 'user_id,id',
    })
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

/** Remove do banco o que não existe mais no app, mantendo os dois em espelho. */
async function prune(table: 'expenses' | 'banks' | 'cards' | 'members' | 'goals', column: 'id', userId: string, ids: string[]) {
  const query = supabase.from(table).delete().eq('user_id', userId)
  const { error } = ids.length ? await query.not(column, 'in', `(${ids.map((id) => `"${id}"`).join(',')})`) : await query
  if (error) throw new Error(`${table}: ${error.message}`)
}

async function pruneByText(table: 'categories' | 'budgets', column: 'name' | 'category', userId: string, values: string[]) {
  const query = supabase.from(table).delete().eq('user_id', userId)
  const { error } = values.length
    ? await query.not(column, 'in', `(${values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',')})`)
    : await query
  if (error) throw new Error(`${table}: ${error.message}`)
}

export async function pushSnapshot(snapshot: Snapshot, userId: string): Promise<void> {
  const ids = (list: { id: string }[]) => list.map((item) => item.id)

  await upsertAll('expenses', snapshot.expenses.map((e) => expenseToRow(e, userId)))
  await upsertAll('banks', snapshot.banks.map((b) => ({ user_id: userId, id: b.id, name: b.name, color: b.color })))
  await upsertAll('cards', snapshot.cards.map((c) => ({ user_id: userId, id: c.id, name: c.name, color: c.color })))
  await upsertAll(
    'members',
    snapshot.members.map((m) => ({ id: m.id, user_id: userId, name: m.name, color: m.color, avatar: m.avatar ?? null }))
  )
  await upsertAll(
    'goals',
    snapshot.goals.map((g) => ({
      id: g.id,
      user_id: userId,
      name: g.name,
      target_cents: g.targetAmount,
      current_cents: g.currentAmount,
      deadline: g.deadline ?? null,
      color: g.color ?? null,
    }))
  )
  await upsertAll(
    'budgets',
    Object.entries(snapshot.budgets).map(([category, limit]) => ({ user_id: userId, category, limit_cents: limit }))
  )
  await upsertAll(
    'categories',
    snapshot.categories.map((name) => ({ user_id: userId, name, icon: snapshot.categoryIcons[name] ?? null }))
  )

  const { error: prefError } = await supabase.from('preferences').upsert(
    [
      {
        user_id: userId,
        dashboard_order: snapshot.dashboardOrder,
        active_member_id: snapshot.activeMemberId,
      },
    ],
    { onConflict: 'user_id' }
  )
  if (prefError) throw new Error(`preferences: ${prefError.message}`)

  // Exclusões por último: se algo falhar antes, nada é apagado.
  await prune('expenses', 'id', userId, ids(snapshot.expenses))
  await prune('banks', 'id', userId, ids(snapshot.banks))
  await prune('cards', 'id', userId, ids(snapshot.cards))
  await prune('members', 'id', userId, ids(snapshot.members))
  await prune('goals', 'id', userId, ids(snapshot.goals))
  await pruneByText('budgets', 'category', userId, Object.keys(snapshot.budgets))
  await pruneByText('categories', 'name', userId, snapshot.categories)
}

// --- Ponte com a store -----------------------------------------------------

type PersistedState = Pick<
  ExpenseState,
  | 'expenses'
  | 'banks'
  | 'cards'
  | 'members'
  | 'goals'
  | 'budgets'
  | 'categories'
  | 'categoryIcons'
  | 'activeMemberId'
  | 'dashboardOrder'
>

export const snapshotOf = (state: PersistedState): Snapshot => ({
  expenses: state.expenses,
  banks: state.banks,
  cards: state.cards,
  members: state.members,
  goals: state.goals,
  budgets: state.budgets,
  categories: state.categories,
  categoryIcons: state.categoryIcons,
  activeMemberId: state.activeMemberId,
  dashboardOrder: state.dashboardOrder,
})

export function applySnapshot(snapshot: Snapshot): void {
  useExpenseStore.setState({
    expenses: snapshot.expenses,
    banks: snapshot.banks.length ? snapshot.banks : useExpenseStore.getState().banks,
    cards: snapshot.cards.length ? snapshot.cards : useExpenseStore.getState().cards,
    members: snapshot.members,
    goals: snapshot.goals,
    budgets: snapshot.budgets,
    categories: snapshot.categories.length ? snapshot.categories : useExpenseStore.getState().categories,
    categoryIcons: snapshot.categoryIcons,
    activeMemberId: snapshot.activeMemberId,
    // A ordem remota pode vir incompleta ou repetida: normaliza para não renderizar o bloco duas vezes.
    dashboardOrder: snapshot.dashboardOrder.length
      ? mergeDashboardOrder(snapshot.dashboardOrder, DEFAULT_DASHBOARD_ORDER)
      : useExpenseStore.getState().dashboardOrder,
  })
}

const isPristine = (snapshot: Snapshot) =>
  snapshot.expenses.length === 0 &&
  snapshot.banks.length === 0 &&
  snapshot.cards.length === 0 &&
  snapshot.categories.length === 0

/**
 * Primeira ligação da conta: se o banco está vazio, sobe o que já existe no
 * navegador; se já tem dados, eles mandam (o navegador é sobrescrito).
 */
export async function bootstrapSync(userId: string): Promise<'uploaded' | 'downloaded' | 'empty'> {
  const remote = await fetchSnapshot(userId)

  if (isPristine(remote)) {
    const local = snapshotOf(useExpenseStore.getState())
    const hasLocal = local.expenses.length > 0 || local.banks.length > 0 || local.categories.length > 0
    if (!hasLocal) return 'empty'
    await pushSnapshot(local, userId)
    return 'uploaded'
  }

  applySnapshot(remote)
  return 'downloaded'
}
