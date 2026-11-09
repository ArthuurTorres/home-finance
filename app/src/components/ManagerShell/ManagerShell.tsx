import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ManagerShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  accent: string
  icon: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function ManagerShell({
  isOpen,
  onClose,
  title,
  subtitle,
  accent,
  icon,
  children,
  footer,
}: ManagerShellProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl bg-surface border border-border shadow-2xl animate-scale-in overflow-hidden"
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}1a`, color: accent }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-text-primary leading-tight">{title}</h2>
              <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface-hover/40">{footer}</div>
        )}
      </div>
    </div>
  )
}