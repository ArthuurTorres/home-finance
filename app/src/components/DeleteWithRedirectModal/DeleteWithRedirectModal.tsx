import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export interface RedirectOption {
  id: string
  name: string
  color?: string
  detail?: string
}

interface DeleteWithRedirectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (redirectToId?: string) => void
  /** O que está sendo excluído, ex.: "o banco Nubank" */
  subject: string
  /** Rótulo do que será movido, ex.: "receitas" */
  linkedLabel: string
  /** Quantos registros dependem deste item */
  linkedCount: number
  /** Destinos possíveis para onde mover os registros */
  options: RedirectOption[]
  /** Nome do campo de destino, ex.: "banco de destino" */
  targetLabel: string
}

export function DeleteWithRedirectModal({
  isOpen,
  onClose,
  onConfirm,
  subject,
  linkedLabel,
  linkedCount,
  options,
  targetLabel,
}: DeleteWithRedirectModalProps) {
  const [target, setTarget] = useState('')

  useEffect(() => {
    if (isOpen) setTarget('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const needsRedirect = linkedCount > 0
  const canConfirm = !needsRedirect || !!target

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl animate-scale-in overflow-hidden"
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-text-primary">Excluir {subject}</h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {needsRedirect ? (
                  <>
                    Existem <strong className="text-text-primary">{linkedCount}</strong>{' '}
                    {linkedLabel} vinculadas. Escolha para onde transferir antes de excluir — nada
                    se perde.
                  </>
                ) : (
                  <>Nenhum registro está vinculado. Esta ação não pode ser desfeita.</>
                )}
              </p>
            </div>
          </div>

          {needsRedirect && (
            <div className="mt-5">
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Transferir para {targetLabel}
              </label>
              {options.length === 0 ? (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5">
                  Não há outro destino cadastrado. Crie um antes de excluir.
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto scrollbar-thin space-y-1.5">
                  {options.map((opt) => {
                    const selected = target === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTarget(opt.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          selected
                            ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                            : 'border-border hover:border-border-strong hover:bg-surface-hover'
                        }`}
                      >
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
                          style={{ backgroundColor: opt.color || '#9ca3af' }}
                        >
                          {opt.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-text-primary truncate">
                            {opt.name}
                          </span>
                          {opt.detail && (
                            <span className="block text-xs text-text-tertiary truncate">
                              {opt.detail}
                            </span>
                          )}
                        </span>
                        {selected && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-accent" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border bg-surface-hover/40">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface transition-all text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(target || undefined)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            {needsRedirect ? 'Transferir e excluir' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}