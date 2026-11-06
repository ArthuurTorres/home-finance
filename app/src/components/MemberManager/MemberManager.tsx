import { useState } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { MEMBER_COLORS, MEMBER_AVATARS, MALE_AVATARS, FEMALE_AVATARS } from '../../utils/finance'
import type { Member, MemberAvatar } from '../../utils/finance'
import { AvatarIcon } from '../AvatarIcon/AvatarIcon'

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

export function MemberManager() {
 const members = useExpenseStore((s) => s.members)
 const addMember = useExpenseStore((s) => s.addMember)
 const updateMember = useExpenseStore((s) => s.updateMember)
 const removeMember = useExpenseStore((s) => s.removeMember)
 const expenses = useExpenseStore((s) => s.expenses)

 const [newName, setNewName] = useState('')
 const [selectedAvatar, setSelectedAvatar] = useState<MemberAvatar>(null)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [editName, setEditName] = useState('')
 const [editColor, setEditColor] = useState<string>('')
 const [editAvatar, setEditAvatar] = useState<MemberAvatar>(null)

 const handleAdd = () => {
 const trimmed = newName.trim()
 if (!trimmed) return
 addMember({ name: trimmed, color: MEMBER_COLORS[members.length % MEMBER_COLORS.length], avatar: selectedAvatar })
 setNewName('')
 setSelectedAvatar(null)
 }

 const startEdit = (member: Member) => {
 setEditingId(member.id)
 setEditName(member.name)
 setEditColor(member.color)
 setEditAvatar(member.avatar ?? null)
 }

 const saveEdit = () => {
 if (!editingId || !editName.trim()) return
 updateMember(editingId, { name: editName.trim(), color: editColor, avatar: editAvatar })
 setEditingId(null)
 }

 const cancelEdit = () => {
 setEditingId(null)
 setEditName('')
 setEditColor('')
 setEditAvatar(null)
 }

 const getInitials = (name: string) => {
 const parts = name.trim().split(/\s+/)
 if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
 return name.slice(0, 2).toUpperCase()
 }

 const getTransactionCount = (memberId: string) =>
 expenses.filter((e) => e.memberId === memberId).length

 const renderAvatarContent = (avatar: MemberAvatar, name: string, size: 'sm' | 'md' | 'lg' = 'md') => {
 const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-6 h-6'
 if (avatar) {
 return <AvatarIcon type={avatar} className={`${sizeClass} block`} />
 }
 return (
 <span className={`${sizeClass} flex items-center justify-center rounded-full bg-surface-muted text-text-secondary font-bold text-sm`}>
 {getInitials(name)}
 </span>
 )
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div>
 <h2 className="text-lg font-bold text-text-primary">Membros da Casa</h2>
 <p className="text-sm text-text-secondary mt-1">
 Gerencie quem participa das finanças. Escolha um avatar ou use as iniciais.
 </p>
 </div>

 {/* Formulário de Adição */}
 <div className="card p-5 space-y-4">
 <div className="flex gap-3 items-end">
 <div className="flex-1">
 <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
 Nome do Membro
 </label>
 <input
 type="text"
 value={newName}
 onChange={(e) => setNewName(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
 placeholder="Ex: João Silva"
 className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm"
 maxLength={40}
 />
 </div>
 <button
 onClick={handleAdd}
 disabled={!newName.trim()}
 className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
 >
 Adicionar
 </button>
 </div>

 {/* Seletor de Avatar */}
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
 Avatar (opcional)
 </label>
 <div className="space-y-3">
 {AVATAR_GROUPS.map((group) => (
 <div key={group.label}>
 <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">{group.label}</p>
 <div className="flex gap-2">
 {group.avatars.map((avatar) => (
 <button
 key={avatar}
 onClick={() => setSelectedAvatar(avatar)}
 className={`w-11 h-11 rounded-full flex items-center justify-center transition-all p-0.5 ${
 selectedAvatar === avatar
 ? 'ring-2 ring-offset-2 ring-offset-surface ring-accent scale-110'
 : 'hover:scale-105'
 }`}
 title={AVATAR_LABELS[avatar]}
 aria-label={AVATAR_LABELS[avatar]}
 aria-pressed={selectedAvatar === avatar}
 >
 <AvatarIcon type={avatar} className="w-full h-full" />
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Preview do Avatar */}
 {newName.trim() && (
 <div className="flex items-center gap-3 pt-2 border-t border-border/50">
 <span className="text-xs text-text-tertiary">Preview:</span>
 <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-surface-hover">
 {renderAvatarContent(selectedAvatar, newName)}
 </div>
 <span className="text-sm font-medium text-text-primary">{newName.trim()}</span>
 </div>
 )}
 </div>

 {/* Lista de Membros */}
 <div className="space-y-2">
 {members.length === 0 ? (
 <div className="card p-8 text-center">
 <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-hover flex items-center justify-center">
 <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
 </svg>
 </div>
 <p className="text-text-secondary text-sm">Nenhum membro cadastrado ainda.</p>
 <p className="text-text-tertiary text-xs mt-1">Adicione os membros da casa para começar.</p>
 </div>
 ) : (
 members.map((member) => {
 const isEditing = editingId === member.id
 const txCount = getTransactionCount(member.id)

 if (isEditing) {
 return (
 <div key={member.id} className="card p-4 flex items-center gap-3 border-accent/30 ring-1 ring-accent/20">
 <div
 className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
 style={{ backgroundColor: editColor }}
 >
 {renderAvatarContent(editAvatar, editName || member.name)}
 </div>
 <div className="flex-1 min-w-0 space-y-2">
 <input
 type="text"
 value={editName}
 onChange={(e) => setEditName(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') saveEdit()
 if (e.key === 'Escape') cancelEdit()
 }}
 className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
 autoFocus
 />
 {/* Mini seletor de avatar na edição */}
 <div className="flex gap-1.5 flex-wrap">
 {MEMBER_AVATARS.map((av) => (
 <button
 key={av}
 onClick={() => setEditAvatar(av)}
 className={`w-7 h-7 rounded-full flex items-center justify-center p-0.5 transition-all ${
 editAvatar === av ? 'ring-1 ring-accent scale-110' : 'opacity-80 hover:opacity-100'
 }`}
 title={AVATAR_LABELS[av]}
 aria-label={AVATAR_LABELS[av]}
 aria-pressed={editAvatar === av}
 >
 <AvatarIcon type={av} className="w-full h-full" />
 </button>
 ))}
 </div>
 </div>
 <div className="flex gap-1.5 shrink-0">
 <button
 onClick={saveEdit}
 className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
 title="Salvar"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 </button>
 <button
 onClick={cancelEdit}
 className="p-2 rounded-lg bg-surface-hover text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
 title="Cancelar"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 </div>
 )
 }

 return (
<div
 key={member.id}
 className="p-4 flex items-center gap-3 group transition-all"
 >
	<div className="w-12 h-12 shrink-0 flex items-center">
	  {renderAvatarContent(member.avatar ?? null, member.name)}
	</div>
	 <div className="flex-1 min-w-0 flex flex-col justify-center">
 <p className="text-sm font-semibold text-text-primary truncate">{member.name}</p>
 <p className="text-xs text-text-tertiary">
 {txCount === 0 ? 'Sem transações' : `${txCount} transaç${txCount === 1 ? 'ão' : 'ões'}`}
 </p>
 </div>
 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
 <button
 onClick={() => startEdit(member)}
 className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-accent transition-colors"
 title="Editar"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
 </svg>
 </button>
 <button
 onClick={() => removeMember(member.id)}
 className="p-2 rounded-lg text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
 title="Remover"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
 </svg>
 </button>
 </div>
 </div>
 )
 })
 )}
 </div>

 {/* Rodapé Informativo */}
 {members.length > 0 && (
 <div className="text-center pt-2">
 <p className="text-xs text-text-tertiary">
 {members.length} membro{members.length !== 1 ? 's' : ''} • Clique no nome para editar
 </p>
 </div>
 )}
 </div>
 )
}