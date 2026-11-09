import { useEffect, useRef } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL } from '../../utils/finance'

interface BankPickerModalProps {
  isOpen: boolean
  /** Descrição e valor da despesa que está sendo paga. */
  description: string
  amount: number
  onClose: () => void
  onConfirm: (bankId: string) => void
}

/** Escolha da conta de onde saiu o dinheiro no momento de marcar a despesa como paga. */
export function BankPickerModal({
  isOpen,
  description,
  amount,
  onClose,
  onConfirm,
}: BankPickerModalProps) {
  const banks = useExpenseStore((s) => s.banks)
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    firstRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-picker-title"
        className="relative w-full max-w-sm card p-6 animate-scale-in"
      >
        <h3 id="bank-picker-title" className="text-base font-semibold text-text-primary mb-1">
          De qual conta saiu?
        </h3>
        <p className="text-sm text-text-secondary mb-5">
          {description} — <span className="font-semibold text-text-primary">{formatBRL(amount)}</span>
        </p>

        {banks.length === 0 ? (
          <p className="text-xs text-text-tertiary mb-6">
            Nenhum banco cadastrado. Cadastre um em “Gerenciar Bancos”.
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {banks.map((bank, index) => (
              <button
                key={bank.id}
                ref={index === 0 ? firstRef : undefined}
                type="button"
                onClick={() => {
                  onConfirm(bank.id)
                  onClose()
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border text-left transition-all hover:border-accent hover:bg-accent/5 active:scale-[0.99]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: bank.color }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-text-primary truncate">{bank.name}</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-hover transition-all text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
