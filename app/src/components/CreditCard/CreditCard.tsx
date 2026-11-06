interface CreditCardProps {
  id: string
  name: string
  color: string
  isSelected: boolean
  onSelect: (id: string) => void
}

export function CreditCard({
  id,
  name,
  color,
  isSelected,
  onSelect,
}: CreditCardProps) {
  return (
    <div className="perspective-1000 w-24 h-14 group">
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
          isSelected ? 'rotate-y-180' : ''
        }`}
        aria-label={`Selecionar cartão ${name}`}
        aria-pressed={isSelected}
      >
        {/* Frente do Cartão */}
        <div
          className={`absolute inset-0 backface-hidden rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${
            isSelected
              ? 'border-transparent'
              : 'border-transparent hover:border-white/30'
          }`}
          style={{ background: `linear-gradient(135deg, ${color}ee, ${color}aa)` }}
        >
          <div className="w-6 h-4 rounded-sm bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 border border-yellow-700/20 opacity-90" />
          <span className="absolute bottom-1 text-[8px] font-bold tracking-wider text-white/90 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {name.slice(0, 6)}
          </span>
        </div>

        {/* Verso do Cartão (Visível quando selecionado) */}
        <div
          className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-surface-muted border-2 border-accent flex flex-col items-center justify-center p-1"
        >
          <span className="text-[9px] font-bold text-accent uppercase tracking-tight leading-none text-center">
            {name.slice(0, 8)}
          </span>
          <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1 animate-pulse" />
        </div>
      </button>
    </div>
  )
}