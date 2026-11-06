import { useState, useMemo } from 'react'
import { useAuth } from './contexts/AuthContext'
import { LoginScreen } from './components/LoginScreen/LoginScreen'
import { useExpenseStore } from './store/useExpenseStore'
import { TransactionList } from './components/TransactionList/TransactionList'
import { SmartInsights } from './components/SmartInsights/SmartInsights'
import { Projections } from './components/Projections/Projections'
import { BudgetManager } from './components/BudgetManager/BudgetManager'
import { CategoryChart } from './components/CategoryChart/CategoryChart'
import { SavingsGoals } from './components/SavingsGoals/SavingsGoals'
import { FinancialSummary } from './components/FinancialSummary/FinancialSummary'
import { ToastContainer } from './components/Toast/Toast'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import { TransactionModal } from './components/TransactionModal/TransactionModal'
import { CategoryModal } from './components/CategoryModal/CategoryModal'
import { CardManagerModal } from './components/CardManagerModal/CardManagerModal'
import { MemberManager } from './components/MemberManager/MemberManager'
import { MemberBalance } from './components/MemberBalance/MemberBalance'
import { CardDashboard } from './components/CardDashboard/CardDashboard'
import { FixedExpensesView } from './components/FixedExpensesView/FixedExpensesView'
import { BudgetAlerts } from './components/BudgetAlerts/BudgetAlerts'
import { FinancialCalendar } from './components/FinancialCalendar/FinancialCalendar'
import { InstallmentMap } from './components/InstallmentMap/InstallmentMap'
import { ImportModal } from './components/ImportModal/ImportModal'
import { DashboardStack } from './components/DashboardStack/DashboardStack'
import { formatBRL, type DashboardBlockId } from './utils/finance'

export default function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f4ef]">
        <div className="animate-pulse text-[#c4704b] text-lg font-medium">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isCardManagerOpen, setIsCardManagerOpen] = useState(false)
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'fixed' | 'cards'>('overview')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [focusedBlock, setFocusedBlock] = useState<DashboardBlockId | null>(null)

  const expenses = useExpenseStore((s) => s.expenses)
  const filters = useExpenseStore((s) => s.filters)
  const setFilter = useExpenseStore((s) => s.setFilter)
  const cards = useExpenseStore((s) => s.cards)
  const dashboardOrder = useExpenseStore((s) => s.dashboardOrder)
  const setDashboardOrder = useExpenseStore((s) => s.setDashboardOrder)

  // Calcula resumo por cartão para o mês selecionado
  const cardSummaries = useMemo(() => {
    const isAllMonths = !filters.month || filters.month === 'all'
    const currentMonth = isAllMonths ? null : filters.month
    
    return cards.map(card => {
      const cardExpenses = expenses.filter(e => 
        e.cardId === card.id && 
        (currentMonth === null || e.date.startsWith(currentMonth))
      )
      
      const totalSpent = cardExpenses.reduce((sum, e) => sum + e.amount, 0)
      const fixedCount = cardExpenses.filter(e => e.isRecurring).length
      
      return {
        ...card,
        totalSpent,
        fixedCount,
        transactionCount: cardExpenses.length
      }
    })
  }, [expenses, filters.month, cards])

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full bg-surface text-text-primary overflow-hidden font-sans selection:bg-accent/20">
        
        {/* Menu Lateral: Foco nos Cartões */}
        <aside className="w-80 flex-shrink-0 border-r border-border bg-surface flex flex-col z-10">
          {/* Header Compacto */}
          <header className="px-6 py-5 border-b border-border flex flex-col items-center text-center">
{/* Ilustração Narrativa - Família chegando em casa */}
              <div className="mb-4 relative w-28 h-28 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Base/Gramado Suave */}
	                  <ellipse cx="50" cy="88" rx="42" ry="6" fill="#d1fae5" />
                  
                  {/* Vegetação Traseira */}
	                  <circle cx="20" cy="75" r="8" fill="#34d399" />
	                  <circle cx="80" cy="75" r="8" fill="#34d399" />
	                  <circle cx="25" cy="70" r="6" fill="#6ee7b7" />
	                  <circle cx="75" cy="70" r="6" fill="#6ee7b7" />

                  {/* Corpo da Casa - Amarelo Mostarda Quente (ESTÁTICO) */}
	                  <rect x="25" y="45" width="50" height="40" rx="2" fill="#fbbf24" />
                  
                  {/* Telhado - Laranja Terracota Sólido */}
	                  <path d="M20 48L50 22L80 48H20Z" fill="#f97316" stroke="#ea580c" strokeWidth="2" strokeLinejoin="round" />
                  
                  {/* Interior da Porta (Escuro) */}
	                  <rect x="42" y="60" width="16" height="25" fill="#1e293b" />

                  {/* Luz Interior Animada (acende quando porta abre) */}
	                  <rect x="42" y="60" width="16" height="25" fill="#fef3c7" className="animate-light-on opacity-0" />

                  {/* Porta Animada (abre para a esquerda) */}
                  <g className="animate-door-open" style={{ transformOrigin: '42px 72px' }}>
	                    <path d="M42 85V62C42 60.8954 42.8954 60 44 60H56C57.1046 60 58 60.8954 58 62V85H42Z" fill="#475569" />
	                    <circle cx="54" cy="73" r="1.5" fill="#f59e0b" />
                  </g>
                  
                  {/* Janela Esquerda - Azul Céu com Divisória */}
	                  <rect x="30" y="52" width="10" height="10" rx="1" fill="#bae6fd" stroke="#ffffff" strokeWidth="1.5" />
	                  <line x1="35" y1="52" x2="35" y2="62" stroke="#ffffff" strokeWidth="1.5" />
	                  <line x1="30" y1="57" x2="40" y2="57" stroke="#ffffff" strokeWidth="1.5" />
                  
                  {/* Janela Direita - Azul Céu com Divisória */}
	                  <rect x="60" y="52" width="10" height="10" rx="1" fill="#bae6fd" stroke="#ffffff" strokeWidth="1.5" />
	                  <line x1="65" y1="52" x2="65" y2="62" stroke="#ffffff" strokeWidth="1.5" />
	                  <line x1="60" y1="57" x2="70" y2="57" stroke="#ffffff" strokeWidth="1.5" />

                  {/* Chaminé Minimalista */}
	                  <rect x="62" y="28" width="6" height="12" rx="1" fill="#f97316" />
                  
                  {/* Fumaça Intensificada (aparece após luz acender) */}
                  <g className="animate-smoke-strong opacity-0">
	                    <circle cx="65" cy="22" r="3" fill="#94a3b8" />
	                    <circle cx="68" cy="15" r="4" fill="#94a3b8" />
	                    <circle cx="64" cy="8" r="5" fill="#94a3b8" />
	                    <circle cx="67" cy="2" r="3.5" fill="#94a3b8" />
                  </g>

                  {/* Família e Cachorro Entrando */}
                  <g className="animate-family-enter">
                    {/* Adulto 1 */}
	                    <circle cx="10" cy="72" r="3" fill="#475569" />
	                    <rect x="8" y="75" width="4" height="10" rx="2" fill="#475569" />
	                    {/* Criança */}
	                    <circle cx="18" cy="76" r="2.5" fill="#64748b" />
	                    <rect x="16.5" y="78.5" width="3" height="7" rx="1.5" fill="#64748b" />
	                    {/* Cachorro */}
	                    <ellipse cx="26" cy="82" rx="4" ry="2.5" fill="#f59e0b" />
	                    <circle cx="29" cy="80" r="2" fill="#f59e0b" />
                  </g>
                </svg>
              </div>
            
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              Home Finance
            </h1>
            <p className="text-xs text-text-tertiary mt-0.5">Controle Financeiro Doméstico</p>

            <button
              onClick={() => { void signOut() }}
              className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-text-tertiary/70 hover:text-accent transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </header>

          {/* Abas de Navegação Lateral */}
          <nav className="px-4 py-3 border-b border-border flex gap-1 bg-surface/50">
            {[
              { id: 'overview' as const, label: 'Geral', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'fixed' as const, label: 'Fixas', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'cards' as const, label: 'Cartões', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { 
                  setActiveView(tab.id); 
                  if (tab.id === 'cards' && cards.length > 0) {
                    setSelectedCardId(cards[0].id);
                  } else {
                    setSelectedCardId(null);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  activeView === tab.id
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-tertiary hover:bg-border/30 hover:text-text-secondary'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Conteúdo da Sidebar conforme Aba Ativa */}
          <div className="flex-1 overflow-y-auto hud-scroll p-4 space-y-3">
            {activeView === 'cards' && (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                    Meus Cartões
                  </span>
              <button 
                onClick={() => setFilter('cardId', 'all')}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  filters.cardId === 'all' 
                    ? 'bg-accent/10 text-accent font-medium' 
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                Ver Todos
              </button>
            </div>

            {cardSummaries.map(card => {
              const isActive = filters.cardId === card.id
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(isActive && selectedCardId === card.id ? null : card.id)}
                  className={`w-full group relative p-3 rounded-xl border transition-all duration-200 text-left ${
                    isActive 
                      ? 'border-accent bg-accent/5 shadow-sm ring-1 ring-accent/20' 
                      : 'border-border bg-surface-muted/30 hover:border-text-tertiary/30 hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      {/* Miniatura do Cartão */}
                      <div 
                        className="w-8 h-5 rounded shadow-sm flex items-center justify-center"
                        style={{ background: card.color }}
                      >
                        <div className="w-4 h-3 bg-white/20 rounded-[1px]" />
                      </div>
                      <span className={`text-sm font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                        {card.name}
                      </span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>

                  {/* Métricas do Cartão */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-[42px]">
                    <div>
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Gasto no Mês</p>
                      <p className="text-sm font-semibold tabular-nums text-text-primary">
                        {formatBRL(card.totalSpent)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Fixas</p>
                      <p className="text-sm font-medium tabular-nums text-text-secondary">
                        {card.fixedCount} <span className="text-[10px] text-text-tertiary font-normal">/{card.transactionCount}</span>
                      </p>
                    </div>
                  </div>
</button>
              )
            })}
              </>
            )}

            {/* Visão de Despesas Fixas */}
            {activeView === 'fixed' && (
              <div className="px-1 py-2">
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Visualize todas as suas despesas recorrentes no painel principal.
                </p>
              </div>
            )}

            {/* Visão Geral (filtro padrão) */}
            {activeView === 'overview' && (
              <div className="px-1 py-2">
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Visão consolidada de receitas, despesas e saldo do mês.
                </p>
              </div>
            )}
          </div>

          {/* Ações da Sidebar */}
          <div className="p-4 border-t border-border bg-surface space-y-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Registrar Transação
            </button>
            
            <button
              onClick={() => setIsMemberManagerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-surface-muted text-text-secondary text-sm font-medium hover:text-text-primary hover:bg-border transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Gerenciar Membros
            </button>
            
            <button
              onClick={() => setIsCardManagerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-surface-muted text-text-secondary text-sm font-medium hover:text-text-primary hover:bg-border transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Gerenciar Cartões
            </button>
            
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-surface-muted text-text-secondary text-sm font-medium hover:text-text-primary hover:bg-border transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Gerenciar Categorias
            </button>

          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 h-full overflow-y-auto hud-scroll bg-surface-muted">
          {/* Renderização Condicional: Dashboard do Cartão, Despesas Fixas ou Visão Geral */}
          {selectedCardId ? (
            <div className="max-w-5xl mx-auto px-10 py-8">
              <CardDashboard 
                card={cards.find(c => c.id === selectedCardId)!} 
                onBack={() => setSelectedCardId(null)} 
              />
            </div>
          ) : activeView === 'fixed' ? (
            <div className="max-w-5xl mx-auto px-10 py-8">
              <FixedExpensesView />
            </div>
          ) : (
          <div className="max-w-5xl mx-auto px-10 py-8 space-y-10">
            
            {/* Header da Página */}
            <header className="space-y-1">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
                {filters.cardId !== 'all' 
                  ? `Detalhes: ${cards.find(c => c.id === filters.cardId)?.name}` 
                  : 'Visão Geral'}
              </h2>
              <p className="text-text-secondary text-sm">
                {filters.cardId !== 'all'
                  ? 'Acompanhe as transações deste cartão específico.'
                  : 'Projeções e controle financeiro consolidado.'}
              </p>
            </header>

            {/* Resumo Financeiro (Fluxo de Caixa) */}
            <FinancialSummary />

            {/* Blocos da visão geral: ordem salva, reordenável por arrastar */}
            {focusedBlock ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={() => setFocusedBlock(null)}
                  className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar à Visão Geral
                </button>
                <section className="card p-8 min-h-[500px] animate-in zoom-in-98 duration-300">
                  {focusedBlock === 'insights' && <SmartInsights />}
                  {focusedBlock === 'members' && <MemberBalance />}
                  {focusedBlock === 'projections' && <Projections />}
                  {focusedBlock === 'calendar' && <FinancialCalendar />}
                  {focusedBlock === 'categoryChart' && <CategoryChart />}
                  {focusedBlock === 'goals' && <SavingsGoals />}
                  {focusedBlock === 'budget' && (<div className="space-y-5"><BudgetAlerts /><BudgetManager /></div>)}
                  {focusedBlock === 'installments' && <InstallmentMap />}
                  {focusedBlock === 'transactions' && (<div className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Histórico de Transações</h3><ImportModal /></div><TransactionList /></div>)}
                </section>
              </div>
            ) : filters.cardId === 'all' ? (
              <DashboardStack
                order={dashboardOrder}
                onReorder={setDashboardOrder}
	                onBlockClick={(id: string) => setFocusedBlock(id as DashboardBlockId)}
                blocks={{
                  insights: <SmartInsights />,
                  members: <MemberBalance />,
                  projections: (
                    <section className="card p-6">
                      <Projections />
                    </section>
                  ),
                  calendar: (
                    <section className="card p-6">
                      <FinancialCalendar />
                    </section>
                  ),
                  categoryChart: (
                    <section className="card p-6">
                      <CategoryChart />
                    </section>
                  ),
                  goals: (
                    <section className="card p-6">
                      <SavingsGoals />
                    </section>
                  ),
                  budget: (
                    <section className="card p-6 space-y-5">
                      <BudgetAlerts />
                      <BudgetManager />
                    </section>
                  ),
                  installments: (
                    <section className="card p-6">
                      <InstallmentMap />
                    </section>
                  ),
                  transactions: (
                    <section className="card p-6 min-h-[400px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                          Histórico de Transações
                        </h3>
                        <ImportModal />
                      </div>
                      <TransactionList />
                    </section>
                  ),
                }}
              />
            ) : (
              <section className="card p-6 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                    Histórico de Transações
                  </h3>
                  <button
                    onClick={() => setFilter('cardId', 'all')}
                    className="text-xs text-accent hover:underline"
                  >
                    Limpar filtro de cartão
                  </button>
                </div>
                <TransactionList />
              </section>
            )}
</div>
          )}
        </main>
      </div>

      {/* Modais Animados */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      <CategoryModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
      />
      
      <CardManagerModal 
        isOpen={isCardManagerOpen} 
        onClose={() => setIsCardManagerOpen(false)} 
      />
      
      {isMemberManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold text-text-primary">Membros da Casa</h2>
              <button
                onClick={() => setIsMemberManagerOpen(false)}
                className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 hud-scroll">
              <MemberManager />
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </ErrorBoundary>
  )
}