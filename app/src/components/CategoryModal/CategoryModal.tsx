import { CategoryManager } from '../CategoryManager/CategoryManager'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  return <CategoryManager isOpen={isOpen} onClose={onClose} />
}