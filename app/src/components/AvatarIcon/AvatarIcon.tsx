import type { ReactNode } from 'react'
import type { MemberAvatar } from '../../utils/finance'

const CX = 32
const CY = 23
const R = 10.6

// --- Peças base ---------------------------------------------------------------

const shoulders = (shirt: string) => (
  <path d="M6 64c0-14.4 11.6-22.6 26-22.6S58 49.6 58 64z" fill={shirt} />
)

const neck = (skin: string) => (
  <rect x={CX - 4.8} y={29} width={9.6} height={14} rx={4.8} fill={skin} />
)

const ears = (skin: string) => (
  <>
    <circle cx={CX - R + 0.4} cy={CY + 2.2} r={2.5} fill={skin} />
    <circle cx={CX + R - 0.4} cy={CY + 2.2} r={2.5} fill={skin} />
  </>
)

const head = (skin: string) => <circle cx={CX} cy={CY} r={R} fill={skin} />

// Cabelo curto: cap que cobre o topo, desce só até as têmporas
const capHair = (color: string, hairline = 16.6, side = 21) => (
  <path
    d={
      `M${CX - 11.6} ${side}` +
      `C${CX - 13.4} ${9.6} ${CX - 7.4} ${5.4} ${CX} ${5.4}` +
      `C${CX + 7.4} ${5.4} ${CX + 13.4} ${9.6} ${CX + 11.6} ${side}` +
      `C${CX + 10.8} ${hairline - 2.6} ${CX + 6.4} ${hairline} ${CX} ${hairline}` +
      `C${CX - 6.4} ${hairline} ${CX - 10.8} ${hairline - 2.6} ${CX - 11.6} ${side}z`
    }
    fill={color}
  />
)

// Massa atrás da cabeça (cabelo longo / chanel)
const backHair = (color: string, halfWidth: number, bottom: number) => (
  <path
    d={
      `M${CX - halfWidth} ${CY + 1}` +
      `C${CX - halfWidth} ${CY - 12} ${CX - 6} ${CY - 17} ${CX} ${CY - 17}` +
      `C${CX + 6} ${CY - 17} ${CX + halfWidth} ${CY - 12} ${CX + halfWidth} ${CY + 1}` +
      `L${CX + halfWidth - 1.8} ${bottom}` +
      `L${CX - halfWidth + 1.8} ${bottom}z`
    }
    fill={color}
  />
)

// --- Componente ---------------------------------------------------------------

export function AvatarIcon({ type, className }: { type: MemberAvatar; className?: string }) {
  const cls = className || 'w-full h-full'


  const frame = (children: ReactNode) => (
    <svg viewBox="0 0 64 64" className={cls} aria-hidden="true">
      {children}
    </svg>
  )

  if (!type) {
    return frame(
      <>
        {shoulders('#BDBDBD')}
        {neck('#D5D5D5')}
        {ears('#D5D5D5')}
        {head('#D5D5D5')}
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="12" fill="#757575" fontFamily="sans-serif">?</text>
      </>,
    )
  }

  switch (type) {
    // ------------------------------ Homens ------------------------------
    case 'male-1': // curto, risca lateral
      return frame(
        <>
          {neck('#F1C9A5')}
          {shoulders('#2F3A56')}
          {ears('#F1C9A5')}
          {head('#F1C9A5')}
          {capHair('#3B2A22', 16.4, 20.4)}
          <path d={`M${CX - 1} 5.8L${CX + 7.4} 13.2H${CX + 1.6}z`} fill="#241610" />
        </>,
      )
    case 'male-2': // barba cheia
      return frame(
        <>
          {neck('#B87B4E')}
          {shoulders('#356050')}
          {ears('#B87B4E')}
          {head('#B87B4E')}
          <path
            d={
              `M${CX - 10.4} ${CY - 1}` +
              `C${CX - 10.4} ${CY + 9.6} ${CX - 5.6} ${CY + 13.4} ${CX} ${CY + 13.4}` +
              `C${CX + 5.6} ${CY + 13.4} ${CX + 10.4} ${CY + 9.6} ${CX + 10.4} ${CY - 1}` +
              `C${CX + 9.6} ${CY + 4.6} ${CX + 5.4} ${CY + 7.2} ${CX} ${CY + 7.2}` +
              `C${CX - 5.4} ${CY + 7.2} ${CX - 9.6} ${CY + 4.6} ${CX - 10.4} ${CY - 1}z`
            }
            fill="#22150F"
          />
          {capHair('#22150F', 15.6, 20)}
        </>,
      )
    case 'male-3': // boné
      return frame(
        <>
          {neck('#E8B48B')}
          {shoulders('#7A3B2E')}
          {ears('#E8B48B')}
          {head('#E8B48B')}
          <path
            d={
              `M${CX - 11.4} 17.6` +
              `C${CX - 11.4} 7.6 ${CX - 6.6} 4.4 ${CX} 4.4` +
              `C${CX + 6.6} 4.4 ${CX + 11.4} 7.6 ${CX + 11.4} 17.6z`
            }
            fill="#2B5F8C"
          />
          <path d={`M${CX - 3} 17.4h19.4a2.3 2.3 0 0 1 0 4.6H${CX - 3}z`} fill="#1E4577" />
          <circle cx={CX} cy={4.2} r={1.3} fill="#1E4577" />
        </>,
      )
    case 'male-4': // cacheado volumoso
      return frame(
        <>
          <g fill="#2A1912">
            <circle cx={CX - 9.8} cy={12.4} r={5} />
            <circle cx={CX + 9.8} cy={12.4} r={5} />
            <circle cx={CX} cy={8.6} r={5.6} />
            <circle cx={CX - 5} cy={8.2} r={4.6} />
            <circle cx={CX + 5} cy={8.2} r={4.6} />
            <circle cx={CX - 12} cy={19.6} r={4} />
            <circle cx={CX + 12} cy={19.6} r={4} />
          </g>
          {neck('#8D5524')}
          {shoulders('#E0B94E')}
          {ears('#8D5524')}
          {head('#8D5524')}
        </>,
      )
    case 'male-5': // entradas + óculos
      return frame(
        <>
          {neck('#EBC8AE')}
          {shoulders('#46586E')}
          {ears('#EBC8AE')}
          {head('#EBC8AE')}
          <path
            d={
              `M${CX - 11.6} 20.6` +
              `C${CX - 13.4} 9.6 ${CX - 7.4} 5.4 ${CX} 5.4` +
              `C${CX + 7.4} 5.4 ${CX + 13.4} 9.6 ${CX + 11.6} 20.6` +
              `C${CX + 10.6} 14.6 ${CX + 7} 12.6 ${CX + 3.4} 13.4` +
              `L${CX} 17.4` +
              `L${CX - 3.4} 13.4` +
              `C${CX - 7} 12.6 ${CX - 10.6} 14.6 ${CX - 11.6} 20.6z`
            }
            fill="#B4BAC4"
          />
          <g fill="none" stroke="#3A3F4B" strokeWidth="1.3">
            <rect x={CX - 8.8} y={CY + 0.2} width={6.6} height={5} rx={2.3} />
            <rect x={CX + 2.2} y={CY + 0.2} width={6.6} height={5} rx={2.3} />
            <path d={`M${CX - 2.2} ${CY + 2.4}h4.4`} />
          </g>
        </>,
      )

    // ------------------------------ Mulheres ------------------------------
    case 'female-1': // longo liso, risca ao meio
      return frame(
        <>
          {backHair('#2E1B14', 13, 52)}
          {neck('#F6CDB2')}
          {shoulders('#C9556B')}
          {ears('#F6CDB2')}
          {head('#F6CDB2')}
          <path
            d={
              `M${CX - 11.6} 20.6` +
              `C${CX - 13.4} 9.6 ${CX - 7.4} 5.4 ${CX} 5.4` +
              `C${CX + 7.4} 5.4 ${CX + 13.4} 9.6 ${CX + 11.6} 20.6` +
              `C${CX + 10.8} 15.4 ${CX + 7.4} 13 ${CX + 2} 13` +
              `L${CX} 16.6` +
              `L${CX - 2} 13` +
              `C${CX - 7.4} 13 ${CX - 10.8} 15.4 ${CX - 11.6} 20.6z`
            }
            fill="#2E1B14"
          />
          <circle cx={CX - 11.2} cy={26.4} r={1.6} fill="#E8C766" />
          <circle cx={CX + 11.2} cy={26.4} r={1.6} fill="#E8C766" />
        </>,
      )
    case 'female-2': // coque alto
      return frame(
        <>
          <circle cx={CX} cy={7.4} r={5.2} fill="#3B2314" />
          {neck('#C68863')}
          {shoulders('#6B4E8C')}
          {ears('#C68863')}
          {head('#C68863')}
          {capHair('#3B2314', 16.4, 20.6)}
        </>,
      )
    case 'female-3': // cacheada volumosa
      return frame(
        <>
          <g fill="#1E1512">
            <circle cx={CX - 10} cy={13} r={5.2} />
            <circle cx={CX + 10} cy={13} r={5.2} />
            <circle cx={CX} cy={9.2} r={5.6} />
            <circle cx={CX - 5.2} cy={8.8} r={4.6} />
            <circle cx={CX + 5.2} cy={8.8} r={4.6} />
            <circle cx={CX - 12.4} cy={21.4} r={4.4} />
            <circle cx={CX + 12.4} cy={21.4} r={4.4} />
            <circle cx={CX - 13} cy={28.6} r={3.8} />
            <circle cx={CX + 13} cy={28.6} r={3.8} />
          </g>
          {neck('#8D5524')}
          {shoulders('#1F6F63')}
          {ears('#8D5524')}
          {head('#8D5524')}
        </>,
      )
    case 'female-4': // chanel com franja reta
      return frame(
        <>
          {backHair('#4A2C21', 13.2, 41)}
          {neck('#D9A066')}
          {shoulders('#A6483C')}
          {ears('#D9A066')}
          {head('#D9A066')}
          <path
            d={
              `M${CX - 11.6} 20.6` +
              `C${CX - 13.4} 9.6 ${CX - 7.4} 5.4 ${CX} 5.4` +
              `C${CX + 7.4} 5.4 ${CX + 13.4} 9.6 ${CX + 11.6} 20.6` +
              `C${CX + 10.6} 15.6 ${CX + 9} 13.6 ${CX + 8.4} 17.2` +
              `H${CX - 8.4}` +
              `C${CX - 9} 13.6 ${CX - 10.6} 15.6 ${CX - 11.6} 20.6z`
            }
            fill="#4A2C21"
          />
        </>,
      )
    case 'female-5': // grisalha, curto volumoso
      return frame(
        <>
          {neck('#F1C9A5')}
          {shoulders('#5A6B85')}
          <g fill="#D3D8E0">
            <circle cx={CX - 9.4} cy={12.8} r={5.4} />
            <circle cx={CX + 9.4} cy={12.8} r={5.4} />
            <circle cx={CX} cy={9} r={5.8} />
            <circle cx={CX - 4.8} cy={8.6} r={4.6} />
            <circle cx={CX + 4.8} cy={8.6} r={4.6} />
            <circle cx={CX - 11.6} cy={18.4} r={4} />
            <circle cx={CX + 11.6} cy={18.4} r={4} />
          </g>
          {ears('#F1C9A5')}
          {head('#F1C9A5')}
          <circle cx={CX - 10.6} cy={26} r={1.6} fill="#E8C766" />
          <circle cx={CX + 10.6} cy={26} r={1.6} fill="#E8C766" />
        </>,
      )

    default:
      return frame(
        <>
          <path d="M6 64c0-12 11.6-19.4 26-19.4S58 52 58 64z" fill="#D8D8D8" />
          <circle cx={CX} cy={CY} r={R} fill="#E8E8E8" />
        </>,
      )
  }
}