import { useState } from 'react'
import type { ReactNode } from 'react'
import { DASHBOARD_BLOCK_LABELS } from '../../utils/finance'
import type { DashboardBlockId } from '../../utils/finance'

interface DashboardStackProps {
  order: string[]
  onReorder: (order: string[]) => void
  onBlockClick?: (id: string) => void
  blocks: Partial<Record<DashboardBlockId, ReactNode>>
}

/**
 * Empilha os blocos da Visão Geral na ordem salva e permite reordenar
 * arrastando pela alça à esquerda de cada bloco.
 */
export function DashboardStack({ order, onReorder, onBlockClick, blocks }: DashboardStackProps) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const known = Object.keys(blocks) as DashboardBlockId[]
  const visible = [
    ...order.filter((id): id is DashboardBlockId => known.includes(id as DashboardBlockId)),
    ...known.filter((id) => !order.includes(id)),
  ]

  function handleDrop(e: React.DragEvent, targetId: DashboardBlockId) {
    const sourceId = (e.dataTransfer.getData('text/plain') || dragging) as DashboardBlockId | null
    if (!sourceId || sourceId === targetId) {
      setDragging(null)
      setOverId(null)
      return
    }
    const next = [...visible]
    const from = next.indexOf(sourceId)
    const to = next.indexOf(targetId)
    if (from === -1 || to === -1) {
      setDragging(null)
      setOverId(null)
      return
    }
    next.splice(from, 1)
    next.splice(to, 0, sourceId)
    onReorder(next)
    setDragging(null)
    setOverId(null)
  }

  return (
    <div className="space-y-10">
      {visible.map((id) => (
        <div
          key={id}
          draggable
          onDragStart={(e) => {
            setDragging(id)
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', id)
          }}
          onDragEnd={() => {
            setDragging(null)
            setOverId(null)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (overId !== id) setOverId(id)
          }}
          onDragLeave={() => setOverId((current) => (current === id ? null : current))}
          onDrop={(e) => {
            e.preventDefault()
            handleDrop(e, id)
          }}
          className={`group/block relative transition-opacity duration-150 ${
            dragging === id ? 'opacity-40' : 'opacity-100'
          } ${
            overId === id && dragging && dragging !== id
              ? 'ring-2 ring-accent/30 rounded-xl'
              : ''
          }`}
        >
          <button
            type="button"
            aria-label={`Arrastar bloco ${DASHBOARD_BLOCK_LABELS[id]}`}
            title="Arrastar para reordenar"
            className="absolute -left-7 top-3 z-10 p-1.5 rounded-lg text-text-tertiary opacity-0 group-hover/block:opacity-100 focus:opacity-100 cursor-grab active:cursor-grabbing hover:bg-surface-hover hover:text-text-primary transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="7" cy="5" r="1.5" />
              <circle cx="13" cy="5" r="1.5" />
              <circle cx="7" cy="10" r="1.5" />
              <circle cx="13" cy="10" r="1.5" />
              <circle cx="7" cy="15" r="1.5" />
              <circle cx="13" cy="15" r="1.5" />
            </svg>
          </button>
          <div
            onClick={() => onBlockClick?.(id)}
            className={`transition-all duration-200 ${onBlockClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:border-accent/30 rounded-xl' : ''}`}
          >
            {blocks[id]}
          </div>
        </div>
      ))}
    </div>
  )
}