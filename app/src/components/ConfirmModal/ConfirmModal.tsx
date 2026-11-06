import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    confirmRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const dangerBtn =
    'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20'
  const defaultBtn =
    'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-sm card p-6 animate-scale-in"
      >
        <h3 id="confirm-title" className="text-base font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p id="confirm-message" className="text-sm text-text-secondary leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-hover transition-all text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all ${
              variant === 'danger' ? dangerBtn : defaultBtn
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}