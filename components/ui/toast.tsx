'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
    id: string
    message: string
    type: ToastType
    duration?: number
}

// Context
type ToastContextType = {
    toasts: Toast[]
    addToast: (message: string, type?: ToastType, duration?: number) => void
    removeToast: (id: string) => void
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Icon mapping
const iconMap: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
}

// Color mapping
const colorMap: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconColorMap: Record<ToastType, string> = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
}

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const toast: Toast = { id, message, type, duration }

        setToasts(prev => [...prev, toast])

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }

        return id
    }, [removeToast])

    // Convenience methods
    const success = useCallback((message: string) => addToast(message, 'success'), [addToast])
    const error = useCallback((message: string) => addToast(message, 'error', 6000), [addToast])
    const warning = useCallback((message: string) => addToast(message, 'warning'), [addToast])
    const info = useCallback((message: string) => addToast(message, 'info'), [addToast])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-start gap-3 p-4 rounded-xl border shadow-lg
                            animate-in slide-in-from-right-4 fade-in duration-300
                            ${colorMap[toast.type]}
                        `}
                    >
                        <span className={iconColorMap[toast.type]}>
                            {iconMap[toast.type]}
                        </span>
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// Hook
export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
