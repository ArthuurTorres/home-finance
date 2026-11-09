import {
  Utensils, Home, Car, Heart, GraduationCap, PartyPopper, ShoppingBag, Zap,
  Shirt, Wrench, Briefcase, Plane, CreditCard, Music, Smartphone, Gift,
  PawPrint, Baby, Dumbbell, Coffee, Fuel, Landmark, Wallet, PiggyBank,
  Bike, Train, Bus, Pizza, MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Catálogo único de ícones de categoria.
 * A chave (`key`) é o que fica salvo na store (`categoryIcons`), então nunca
 * renomeie uma chave existente — só acrescente novas.
 */
export const CATEGORY_ICON_CATALOG: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'alimentacao',   label: 'Alimentação',    icon: Utensils      },
  { key: 'mercado',       label: 'Mercado',        icon: ShoppingBag   },
  { key: 'pizza',         label: 'Delivery',       icon: Pizza         },
  { key: 'cafe',          label: 'Café',           icon: Coffee        },
  { key: 'moradia',       label: 'Moradia',        icon: Home          },
  { key: 'contas',        label: 'Contas',         icon: Zap           },
  { key: 'transporte',    label: 'Transporte',     icon: Car           },
  { key: 'combustivel',   label: 'Combustível',    icon: Fuel          },
  { key: 'bike',          label: 'Bicicleta',      icon: Bike          },
  { key: 'onibus',        label: 'Transporte público', icon: Bus       },
  { key: 'trem',          label: 'Metrô/Trem',     icon: Train         },
  { key: 'saude',         label: 'Saúde',          icon: Heart         },
  { key: 'academia',      label: 'Academia',       icon: Dumbbell      },
  { key: 'educacao',      label: 'Educação',       icon: GraduationCap },
  { key: 'lazer',         label: 'Lazer',          icon: PartyPopper   },
  { key: 'musica',        label: 'Música',         icon: Music         },
  { key: 'presente',      label: 'Presentes',      icon: Gift          },
  { key: 'vestuario',     label: 'Vestuário',      icon: Shirt         },
  { key: 'servicos',      label: 'Serviços',       icon: Wrench        },
  { key: 'trabalho',      label: 'Trabalho',       icon: Briefcase     },
  { key: 'viagem',        label: 'Viagem',         icon: Plane         },
  { key: 'cartao',        label: 'Cartão',         icon: CreditCard    },
  { key: 'tecnologia',    label: 'Tecnologia',     icon: Smartphone    },
  { key: 'pet',           label: 'Pet',            icon: PawPrint      },
  { key: 'filhos',        label: 'Filhos',         icon: Baby          },
  { key: 'investimento',  label: 'Investimento',   icon: Landmark      },
  { key: 'carteira',      label: 'Carteira',       icon: Wallet        },
  { key: 'poupanca',      label: 'Poupança',       icon: PiggyBank     },
  { key: 'outros',        label: 'Outros',         icon: MoreHorizontal },
]

const BY_KEY = new Map(CATEGORY_ICON_CATALOG.map((o) => [o.key, o.icon]))

/** Ícone associado a uma chave do catálogo (fallback: "outros"). */
export function getIconByKey(key: string | undefined | null): LucideIcon {
  if (key && BY_KEY.has(key)) return BY_KEY.get(key)!
  return MoreHorizontal
}

/** Nome de exibição de uma chave do catálogo. */
export function getIconLabel(key: string | undefined | null): string {
  return CATEGORY_ICON_CATALOG.find((o) => o.key === key)?.label ?? 'Outros'
}

/** Chave padrão sugerida a partir do nome da categoria (usada ao criar). */
const NAME_TO_KEY: Record<string, string> = {
  alimentação: 'alimentacao', alimentacao: 'alimentacao',
  moradia: 'moradia', transporte: 'transporte', saúde: 'saude', saude: 'saude',
  educação: 'educacao', educacao: 'educacao', lazer: 'lazer',
  compras: 'mercado', contas: 'contas', vestuário: 'vestuario',
  vestuario: 'vestuario', serviços: 'servicos', servicos: 'servicos',
  outros: 'outros',
}

/**
 * Ícone da categoria: prioriza o ícone escolhido pelo usuário (`customIcons`),
 * depois tenta casar pelo nome e por fim cai no genérico.
 */
export function getCategoryIcon(
  category: string,
  customIcons?: Record<string, string>
): LucideIcon {
  const chosen = customIcons?.[category]
  if (chosen) return getIconByKey(chosen)

  const normalized = category.trim().toLowerCase()
  const exact = NAME_TO_KEY[normalized]
  if (exact) return getIconByKey(exact)

  const partial = Object.keys(NAME_TO_KEY).find((k) => normalized.includes(k))
  if (partial) return getIconByKey(NAME_TO_KEY[partial])

  return MoreHorizontal
}