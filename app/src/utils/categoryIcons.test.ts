import { describe, it, expect } from 'vitest'
import { getCategoryIcon } from './categoryIcons'
import { MoreHorizontal, Utensils, Car, Shirt } from 'lucide-react'
import { DEFAULT_CATEGORIES } from './finance'

describe('getCategoryIcon', () => {
  it('mapeia as categorias padrão para ícones específicos', () => {
    expect(getCategoryIcon('Alimentação')).toBe(Utensils)
    expect(getCategoryIcon('Transporte')).toBe(Car)
    expect(getCategoryIcon('Vestuário')).toBe(Shirt)
  })

  it('casa por trecho, sem diferenciar maiúsculas', () => {
    expect(getCategoryIcon('alimentação')).toBe(Utensils)
    expect(getCategoryIcon('Transporte escolar')).toBe(Car)
  })

  it('usa o fallback para categoria criada pelo usuário', () => {
    expect(getCategoryIcon('Categoria Nova')).toBe(MoreHorizontal)
  })

  it('só "Outros" usa o ícone genérico entre as categorias padrão', () => {
    const semIcone = DEFAULT_CATEGORIES.filter((c) => getCategoryIcon(c) === MoreHorizontal)
    expect(semIcone).toEqual(['Outros'])
  })
})