import type { CreditCardDef } from '../../utils/finance'

interface CardArtProps {
  card: CreditCardDef
  className?: string
}

/** Luminância relativa (WCAG) de uma cor hex, para escolher texto claro ou escuro. */
function luminance(hex: string): number {
  const value = hex.replace('#', '')
  if (value.length !== 6) return 0
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** Texto escuro compensa mais que o claro sobre esta cor? (razão de contraste WCAG) */
function prefersDarkText(hex: string): boolean {
  const L = luminance(hex)
  const onBlack = (L + 0.05) / 0.05
  const onWhite = 1.05 / (L + 0.05)
  return onBlack > onWhite
}

/**
 * Arte do cartão na cor cadastrada. O container define a largura e o
 * componente mantém a proporção real de um cartão (85,6 x 54 mm).
 */
export function CardArt({ card, className = '' }: CardArtProps) {
  const onLight = prefersDarkText(card.color)
  const text = onLight ? 'text-black/80' : 'text-white'
  const textSoft = onLight ? 'text-black/55' : 'text-white/60'

  return (
    <div className={`@container ${className}`}>
      <div
        className="relative aspect-[1.586] w-full overflow-hidden rounded-xl ring-1 ring-black/10"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 55%, ${card.color}aa 100%)`,
          boxShadow: `0 8px 18px -8px ${card.color}cc`,
        }}
      >
        {/* brilho no canto superior e reflexo diagonal */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(circle at 18% -20%, rgba(255,255,255,0.42), transparent 55%),` +
              `linear-gradient(115deg, transparent 32%, rgba(255,255,255,${onLight ? 0.1 : 0.16}) 46%, transparent 62%)`,
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-[6cqw]">
          <div className="flex items-start justify-between">
            {/* chip */}
            <div
              className="relative h-[16cqw] w-[22cqw] overflow-hidden rounded-[2px]"
              style={{
                background: 'linear-gradient(135deg, #f6e6a8 0%, #d9b45a 45%, #b48c2e 100%)',
              }}
            >
              <div className="absolute inset-x-[4cqw] top-[5cqw] h-px bg-black/25" />
              <div className="absolute inset-x-[4cqw] bottom-[5cqw] h-px bg-black/25" />
              <div className="absolute inset-y-[4cqw] left-1/2 w-px -translate-x-1/2 bg-black/20" />
            </div>

            {/* aproximação (contactless) */}
            <svg
              viewBox="0 0 24 24"
              className={`h-[14cqw] w-[14cqw] ${textSoft}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M8 6a9 9 0 0 1 0 12" />
              <path d="M13 8.5a5.5 5.5 0 0 1 0 7" />
            </svg>
          </div>

          <div className="min-w-0">
            <p
              className={`uppercase tracking-[0.14em] leading-none ${textSoft}`}
              style={{ fontSize: 'clamp(6px, 7cqw, 12px)' }}
            >
              Crédito
            </p>
            <p
              className={`mt-[2cqw] truncate font-semibold leading-tight ${text}`}
              style={{ fontSize: 'clamp(10px, 10cqw, 22px)' }}
            >
              {card.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
