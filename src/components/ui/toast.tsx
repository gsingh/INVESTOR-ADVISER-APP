import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [closingIds, setClosingIds] = React.useState<Set<string>>(new Set())
  const timeoutsRef = React.useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = String(++toastCounter)
    setToasts(prev => [...prev, { ...toast, id }])
    const timeout = setTimeout(() => {
      timeoutsRef.current.delete(timeout)
      setClosingIds(prev => new Set(prev).add(id))
      const removeTimeout = setTimeout(() => {
        setClosingIds(prev => { const next = new Set(prev); next.delete(id); return next })
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 200)
      timeoutsRef.current.add(removeTimeout)
    }, 5000)
    timeoutsRef.current.add(timeout)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setClosingIds(prev => new Set(prev).add(id))
    const timeout = setTimeout(() => {
      timeoutsRef.current.delete(timeout)
      setClosingIds(prev => { const next = new Set(prev); next.delete(id); return next })
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 200)
    timeoutsRef.current.add(timeout)
  }, [])

  const isClosing = React.useCallback((id: string) => closingIds.has(id), [closingIds])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            data-state={isClosing(toast.id) ? 'closed' : 'open'}
            className={cn(
              'pointer-events-auto flex w-96 items-start gap-3 rounded-lg border p-4 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              toast.variant === 'destructive'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-border bg-background text-foreground',
            )}
            role="alert"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-md p-1 transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
