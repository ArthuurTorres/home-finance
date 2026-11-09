import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { MEMBER_COLORS, MEMBER_AVATARS, MALE_AVATARS, FEMALE_AVATARS } from '../../utils/finance'
import type { Member, MemberAvatar } from '../../utils/finance'
import { AvatarIcon } from '../AvatarIcon/AvatarIcon'
import { ManagerShell } from '../ManagerShell/ManagerShell'
import { DeleteWithRedirectModal } from '../DeleteWithRedirectModal/DeleteWithRedirectModal'

const AVATAR_LABELS: Record<(typeof MEMBER_AVATARS)[number], string> = {
  'male-1': 'Homem, cabelo curto',
  'male-2': 'Homem, barba',
  'male-3': 'Homem, boné',
  'male-4': 'Homem, cacheado',
  'male-5': 'Homem, óculos',
  'female-1': 'Mulher, cabelo longo',
  'female-2': 'Mulher, coque',
  'female-3': 'Mulher, cacheada',
  'female-4': 'Mulher, chanel',
  'female-5': 'Mulher, grisalha',
}

const AVATAR_GROUPS = [
  { label: 'Homens', avatars: MALE_AVATARS },
  { label: 'Mulheres', avatars: FEMALE_AVATARS },
] as const

interface MemberManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'list' | 'add' | 'edit'

export function MemberManager({ isOpen, onClose }: MemberManagerModalProps) {
  const members = useExpenseStore((s) => s.members)
  const addMember = useExpenseStore((s) => s.addMember)
  const updateMember = useExpenseStore((s) => s.updateMember)
  const removeMember = useExpenseStore((s) => s.removeMember)
  const expenses = useExpenseStore((s) => s.expenses)

  const [mode, setMode] = useState<Mode>('list')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)

  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(MEMBER_COLORS[0])
  const [avatar, setAvatar] = useState<MemberAvatar>(null)

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMode('list')
      setEditingMember(null)
      setName('')
      setColor(MEMBER_COLORS[members.length % MEMBER_COLORS.length])
      setAvatar(null)
    }
  }, [isOpen, members.length])

  useEffect(() => {
    if (mode === 'add' || mode === 'edit') {
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    if (mode === 'add') {
      addMember({ name: trimmed, color, avatar })
    } else if (editingMember) {
      updateMember(editingMember.id, { name: trimmed, color, avatar })
    }
    setMode('list')
    setEditingMember(null)
    setName('')
    setColor(MEMBER_COLORS[members.length % MEMBER_COLORS.length])
    setAvatar(null)
  }

  const startEdit = (member: Member) => {
    setEditingMember(member)
    setName(member.name)
    setColor(member.color)
    setAvatar(member.avatar ?? null)
    setMode('edit')
  }

  const confirmDelete = (redirectToId?: string) => {
    if (!deleteTarget) return
    removeMember(deleteTarget.id, redirectToId)
    setDeleteTarget(null)
  }

  const getMemberExpenseCount = (memberId: string) =>
    expenses.filter((e) => e.memberId === memberId).length

  const linkedCount = deleteTarget ? getMemberExpenseCount(deleteTarget.id) : 0

  // ── Formulário ──
  if (mode === 'add' || mode === 'edit') {
    return (
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'add' ? 'Novo membro' : 'Editar membro'}
        subtitle="Quem participa das finanças da casa"
        accent={color}
        icon={<Users size={20} />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar preview */}
          <div className="flex justify-center py-2">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300"
              style={{ backgroundColor: `${color}22` }}
            >
              {avatar ? (
                <AvatarIcon type={avatar} className="w-14 h-14" />
              ) : (
                <span className="text-2xl font-bold" style={{ color }}>
                  {(name.trim() || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="member-name" className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Nome
            </label>
            <input
              ref={nameRef}
              id="member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João, Maria..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-muted border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-tertiary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {MEMBER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-surface ring-text-primary scale-110'
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Avatar
            </label>
            {AVATAR_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="text-[11px] text-text-tertiary font-medium mb-1.5 uppercase tracking-wide">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      title={AVATAR_LABELS[av]}
                      className={`rounded-xl p-1 transition-all duration-200 ${
                        avatar === av
                          ? 'ring-2 ring-offset-1 ring-offset-surface ring-accent bg-accent/10'
                          : 'hover:bg-surface-hover'
                      }`}
                    >
                      <AvatarIcon type={av} className="w-9 h-9" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-muted transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm"
            >
              {mode === 'add' ? 'Criar membro' : 'Salvar'}
            </button>
          </div>
        </form>
      </ManagerShell>
    )
  }

  // ── Lista ──
  return (
    <>
      <ManagerShell
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciar membros"
        subtitle={`${members.length} ${members.length === 1 ? 'membro' : 'membros'} cadastrados`}
        accent="#a855f7"
        icon={<Users size={20} />}
        footer={
          <button
            onClick={() => setMode('add')}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/25 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Adicionar membro
          </button>
        }
      >
        {members.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-muted mx-auto mb-3 flex items-center justify-center">
              <Users size={28} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Nenhum membro cadastrado</p>
            <p className="text-xs text-text-tertiary mt-1">Adicione membros para acompanhar gastos por pessoa</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const count = getMemberExpenseCount(member.id)
              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-3.5 p-3 rounded-xl border border-border hover:bg-surface-muted transition-all duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: `${member.color}22` }}
                  >
                    {member.avatar ? (
                      <AvatarIcon type={member.avatar} className="w-9 h-9" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: member.color }}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{member.name}</p>
                    <p className="text-[11px] text-text-tertiary">
                      {count} {count === 1 ? 'transação' : 'transações'}
                    </p>
                  </div>

                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => startEdit(member)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
                      aria-label={`Editar ${member.name}`}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(member)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                      aria-label={`Excluir ${member.name}`}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {linkedCount > 0 && deleteTarget && (
          <p className="mt-4 text-[11px] text-text-tertiary flex items-start gap-1.5">
            <ArrowLeftRight size={12} className="mt-0.5 flex-shrink-0" />
            Ao excluir um membro com transações, você escolhe outro membro para recebê-las — nada fica órfão.
          </p>
        )}
      </ManagerShell>

      <DeleteWithRedirectModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        subject={`o membro "${deleteTarget?.name ?? ''}"`}
        linkedLabel="transações"
        linkedCount={linkedCount}
        targetLabel="membro de destino"
        options={members
          .filter((m) => m.id !== deleteTarget?.id)
          .map((m) => ({
            id: m.id,
            name: m.name,
            color: m.color,
          }))}
      />
    </>
  )
}
