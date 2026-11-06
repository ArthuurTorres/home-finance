import { describe, it, expect } from 'vitest'
import {
	parseBRL,
	formatBRL,
	getInstallmentValue,
	getInstallmentAt,
	validateExpenses,
	getTotalDebt,
	getRecurringProjections,
	getCategorySpending,
	exportToJSON,
	importFromJSON,
	parseBankFile,
	guessCategory,
	getBudgetAlerts,
	getMemberSpending,
	getDailySpending,
	getActiveInstallments,
	getEssentialityMeta,
	type Expense,
} from './finance'

describe('parseBRL', () => {
	it('converte string monetária para centavos', () => {
		expect(parseBRL('R$ 10,50')).toBe(1050)
		expect(parseBRL('1234,56')).toBe(123456)
		expect(parseBRL('0,99')).toBe(99)
	})

	it('retorna 0 para valores inválidos', () => {
		expect(parseBRL('')).toBe(0)
		expect(parseBRL('abc')).toBe(0)
	})
})

describe('formatBRL', () => {
	it('formata centavos para BRL', () => {
		expect(formatBRL(1050)).toContain('10,50')
		expect(formatBRL(0)).toContain('0,00')
	})
})

describe('getInstallmentValue / getInstallmentAt', () => {
	it('calcula parcelas com correção na última', () => {
		// 100,00 em 3x = 33,33 + 33,33 + 33,34
		expect(getInstallmentValue(10000, 3)).toBe(3333)
		expect(getInstallmentAt(10000, 3, 0)).toBe(3333)
		expect(getInstallmentAt(10000, 3, 1)).toBe(3333)
		expect(getInstallmentAt(10000, 3, 2)).toBe(3334) // última absorve o resto
	})

	it('retorna total para pagamento à vista', () => {
		expect(getInstallmentValue(5000, 1)).toBe(5000)
		expect(getInstallmentAt(5000, 1, 0)).toBe(5000)
	})
})

describe('validateExpenses', () => {
	it('filtra registros inválidos sem quebrar', () => {
		const data = [
			{ id: '550e8400-e29b-41d4-a716-446655440000', description: 'Teste', date: '2026-01-01T00:00:00Z', amount: 100, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, category: 'Alimentação', cardId: 'nubank' },
			{ invalid: true },
			null,
		]
		const result = validateExpenses(data)
		expect(result).toHaveLength(1)
		expect(result[0].description).toBe('Teste')
	})

	it('retorna array vazio para entrada não-array', () => {
		expect(validateExpenses(null)).toEqual([])
		expect(validateExpenses('string')).toEqual([])
	})
})

describe('getTotalDebt', () => {
	it('soma apenas parcelas restantes de despesas não pagas', () => {
		const expenses: Expense[] = [
			{ id: '550e8400-e29b-41d4-a716-446655440001', description: 'A', date: '2026-01-01T00:00:00Z', amount: 30000, dueDay: 10, installments: 3, paidInstallments: 1, isPaid: false, isRecurring: false, category: 'Moradia', cardId: 'nubank', type: 'expense' },
			{ id: '550e8400-e29b-41d4-a716-446655440002', description: 'B', date: '2026-01-01T00:00:00Z', amount: 10000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: true, isRecurring: false, category: 'Lazer', cardId: 'cash', type: 'expense' },
		]
		expect(getTotalDebt(expenses)).toBe(20000)
	})
})

describe('getRecurringProjections', () => {
	const base: Expense = {
		id: '550e8400-e29b-41d4-a716-446655440010',
		description: 'Aluguel',
		date: '2026-01-15T00:00:00Z',
		amount: 100000,
		dueDay: 10,
		installments: 1,
		paidInstallments: 0,
		isPaid: false,
		isRecurring: true,
		category: 'Moradia',
		cardId: 'nubank',
		type: 'expense',
	}

	it('projeta despesa recorrente nos meses futuros', () => {
		const result = getRecurringProjections([base], new Date('2026-03-01'))
		expect(result).toHaveLength(1)
		expect(result[0].date.slice(0, 10)).toBe('2026-02-10') // dueDay=10; startOfMonth(2026-03-01) = março, mas projeção usa addMonths a partir da origem
	})

	it('não projeta se já está paga', () => {
		expect(getRecurringProjections([{ ...base, isPaid: true }], new Date('2026-03-01'))).toHaveLength(0)
	})

	it('não projeta se não é recorrente', () => {
		expect(getRecurringProjections([{ ...base, isRecurring: false }], new Date('2026-03-01'))).toHaveLength(0)
	})

	it('não projeta para mês anterior à data original', () => {
		expect(getRecurringProjections([base], new Date('2025-12-01'))).toHaveLength(0)
	})
})

describe('getCategorySpending', () => {
	it('calcula gasto por categoria no mês filtrado', () => {
		const expenses: Expense[] = [
			{ id: '550e8400-e29b-41d4-a716-446655440020', description: 'Mercado', date: '2026-01-10', amount: 50000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Alimentação', cardId: 'nubank', type: 'expense' },
			{ id: '550e8400-e29b-41d4-a716-446655440021', description: 'Restaurante', date: '2026-01-20', amount: 30000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Alimentação', cardId: 'inter', type: 'expense' },
		]
		const result = getCategorySpending(expenses, '2026-01', {}, ['Alimentação'])
		expect(result[0].spent).toBe(80000)
	})

	it('marca over=true quando gasto excede limite', () => {
		const expenses: Expense[] = [
			{ id: '550e8400-e29b-41d4-a716-446655440030', description: 'Jantar', date: '2026-01-10', amount: 20000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Lazer', cardId: 'nubank', type: 'expense' },
		]
		const result = getCategorySpending(expenses, '2026-01', { Lazer: 10000 }, ['Lazer'])
		expect(result[0].over).toBe(true)
	})
})

describe('exportToJSON / importFromJSON', () => {
	it('exporta e importa mantendo integridade', () => {
		const expenses: Expense[] = [
			{ id: '550e8400-e29b-41d4-a716-446655440040', description: 'Teste', date: '2026-01-01T00:00:00Z', amount: 5000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Outros', cardId: 'cash', type: 'expense' },
		]
		const imported = importFromJSON(exportToJSON(expenses))
		expect(imported).toHaveLength(1)
		expect(imported[0].description).toBe('Teste')
	})

	it('retorna array vazio para JSON inválido', () => {
		expect(importFromJSON('not-json')).toEqual([])
	})
})

describe('guessCategory', () => {
	it('classifica pelo dicionário de palavras-chave', () => {
		expect(guessCategory('PADARIA SAO JOSE')).toBe('Alimentação')
		expect(guessCategory('UBER *TRIP')).toBe('Transporte')
		expect(guessCategory('NETFLIX.COM')).toBe('Lazer')
	})

	it('cai em Outros quando não reconhece', () => {
		expect(guessCategory('TRANSFERENCIA RECEBIDA')).toBe('Outros')
	})
})

describe('parseBankFile', () => {
	it('converte OFX em linhas, com sinal definindo o tipo', () => {
		const ofx = `OFXHEADER:100
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261105<TRNAMT>-150.90<MEMO>Padaria Sao Jose<FITID>1</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261103<TRNAMT>5000.00<MEMO>Salario<FITID>2</STMTTRN>`
		const rows = parseBankFile(ofx, 'extrato.ofx')
		expect(rows).toHaveLength(2)
		expect(rows[0]).toMatchObject({ date: '2026-11-05', amount: 15090, type: 'expense', category: 'Alimentação' })
		expect(rows[1]).toMatchObject({ date: '2026-11-03', amount: 500000, type: 'income' })
	})

	it('converte CSV com cabeçalho e valor BR', () => {
		const csv = 'Data;Descrição;Valor\n05/11/2026;Supermercado Extra;-1.234,56\n03/11/2026;Salário;5.000,00'
		const rows = parseBankFile(csv, 'extrato.csv')
		expect(rows).toHaveLength(2)
		expect(rows[0]).toMatchObject({ date: '2026-11-05', amount: 123456, type: 'expense' })
		expect(rows[1]).toMatchObject({ date: '2026-11-03', amount: 500000, type: 'income' })
	})

	it('ignora linhas inválidas', () => {
		expect(parseBankFile('Data,Descrição,Valor\nfoo,bar,baz', 'x.csv')).toEqual([])
	})
})

describe('getMemberSpending', () => {
	const members = [
		{ id: '550e8400-e29b-41d4-a716-446655440100', name: 'Ana', color: '#f97316', avatar: null },
		{ id: '550e8400-e29b-41d4-a716-446655440101', name: 'Bia', color: '#0ea5e9', avatar: null },
	]

	it('soma por membro e calcula percentual', () => {
		const expenses = [
			{ id: '550e8400-e29b-41d4-a716-446655440102', description: 'A', date: '2026-01-10', amount: 30000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Lazer', cardId: 'cash', type: 'expense' as const, memberId: members[0].id },
			{ id: '550e8400-e29b-41d4-a716-446655440103', description: 'B', date: '2026-01-11', amount: 10000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Lazer', cardId: 'cash', type: 'expense' as const, memberId: members[1].id },
		]
		const rows = getMemberSpending(expenses, members, '2026-01')
		expect(rows[0]).toMatchObject({ name: 'Ana', spent: 30000, percentage: 75 })
		expect(rows[1]).toMatchObject({ name: 'Bia', spent: 10000, percentage: 25 })
	})

	it('agrupa transações sem responsável', () => {
		const expenses = [
			{ id: '550e8400-e29b-41d4-a716-446655440104', description: 'C', date: '2026-01-10', amount: 5000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Outros', cardId: 'cash', type: 'expense' as const },
		]
		const rows = getMemberSpending(expenses, members, '2026-01')
		expect(rows.some((r) => r.name === 'Sem responsável' && r.spent === 5000)).toBe(true)
	})
})

describe('getDailySpending', () => {
	it('agrupa despesas por dia do mês', () => {
		const expenses = [
			{ id: '550e8400-e29b-41d4-a716-446655440110', description: 'A', date: '2026-01-10', amount: 1000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Outros', cardId: 'cash', type: 'expense' as const },
			{ id: '550e8400-e29b-41d4-a716-446655440111', description: 'B', date: '2026-01-10', amount: 2500, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Outros', cardId: 'cash', type: 'expense' as const },
		]
		expect(getDailySpending(expenses, '2026-01')[10]).toBe(3500)
	})
})

describe('getBudgetAlerts', () => {
	it('marca danger quando o gasto real já passou do limite', () => {
		const expenses = [
			{ id: '550e8400-e29b-41d4-a716-446655440120', description: 'A', date: '2026-01-10', amount: 20000, dueDay: 10, installments: 1, paidInstallments: 0, isPaid: false, isRecurring: false, category: 'Lazer', cardId: 'cash', type: 'expense' as const },
		]
		const [alert] = getBudgetAlerts(expenses, { Lazer: 10000 }, '2026-01')
		expect(alert.status).toBe('danger')
		expect(alert.spent).toBe(20000)
	})

	it('ignora categorias sem limite definido', () => {
		expect(getBudgetAlerts([], {}, '2026-01')).toHaveLength(0)
	})
})

describe('getActiveInstallments', () => {
	it('lista só parcelamentos com saldo devedor', () => {
		const expenses = [
			{ id: '550e8400-e29b-41d4-a716-446655440130', description: 'TV', date: '2026-01-01', amount: 120000, dueDay: 10, installments: 12, paidInstallments: 2, isPaid: false, isRecurring: false, category: 'Lazer', cardId: 'nubank', type: 'expense' as const },
			{ id: '550e8400-e29b-41d4-a716-446655440131', description: 'Quitado', date: '2026-01-01', amount: 10000, dueDay: 10, installments: 2, paidInstallments: 2, isPaid: true, isRecurring: false, category: 'Lazer', cardId: 'nubank', type: 'expense' as const },
		]
		const rows = getActiveInstallments(expenses)
		expect(rows).toHaveLength(1)
		expect(rows[0]).toMatchObject({ paid: 2, total: 12, remaining: 10, remainingCents: 100000 })
	})
})

describe('getEssentialityMeta', () => {
	it('devolve rótulo para cada nível e null quando vazio', () => {
		expect(getEssentialityMeta('essential')?.label).toBe('Essencial')
		expect(getEssentialityMeta('extra')?.label).toBe('Extra')
		expect(getEssentialityMeta(null)).toBeNull()
	})
})