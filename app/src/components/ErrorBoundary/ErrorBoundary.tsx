import { Component, type ReactNode } from 'react'

interface Props {
 children: ReactNode
}

interface State {
 hasError: boolean
 error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props)
 this.state = { hasError: false, error: null }
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error }
 }

 componentDidCatch(error: Error, info: React.ErrorInfo) {
 console.error('ErrorBoundary capturou:', error, info.componentStack)
 }

 render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-nude-50 p-8">
 <div className="max-w-md text-center space-y-4">
 <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
 <span className="text-3xl">⚠️</span>
 </div>
 <h1 className="text-2xl font-display font-bold text-nude-900">
 Algo deu errado
 </h1>
 <p className="text-nude-600 text-sm">
 {this.state.error?.message || 'Erro inesperado na aplicação'}
 </p>
 <button
 onClick={() => window.location.reload()}
 className="px-6 py-3 rounded-xl bg-terracotta-500 text-white font-semibold hover:bg-terracotta-600 transition-all"
 >
 Recarregar Página
 </button>
 </div>
 </div>
 )
 }

 return this.props.children
 }
}