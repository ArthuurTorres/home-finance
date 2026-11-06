import { useExpenseStore } from '../../store/useExpenseStore'

export function ToastContainer() {
 const toasts = useExpenseStore((s) => s.toasts)
 const removeToast = useExpenseStore((s) => s.removeToast)

 if (toasts.length === 0) return null

 return (
 <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
 {toasts.map((toast) => (
 <div
 key={toast.id}
 onClick={() => removeToast(toast.id)}
 className={`pointer-events-auto px-5 py-3 rounded-xl shadow-lg border backdrop-blur-md cursor-pointer animate-slide-up max-w-sm ${
 toast.type === 'success'
 ? 'bg-green-50/90 border-green-200 text-green-800'
 : toast.type === 'error'
 ? 'bg-red-50/90 border-red-200 text-red-800'
 : 'bg-white/90 border-nude-200 text-nude-800'
 }`}
 >
 <p className="text-sm font-medium">{toast.message}</p>
 </div>
 ))}
 </div>
 )
}