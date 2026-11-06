import { useEffect, useState } from 'react'
import { TransactionForm } from '../TransactionForm/TransactionForm'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => setAnimating(true))
    } else {
      setAnimating(false)
      const timer = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Fecha com ESC
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col transition-all duration-300 ease-out ${
            animating
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Header do Modal */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted/30">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Nova Transação
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-surface-muted text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Formulário com Scroll */}
          <div className="overflow-y-auto hud-scroll p-6">
            <TransactionForm onSuccess={onClose} />
          </div>
        </div>
      </div>
    </>
  )
}