'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const lastShown = useRef<{ message: string; type: ToastType; at: number } | null>(null)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const now = Date.now()
      if (lastShown.current?.message === message && lastShown.current.type === type && now - lastShown.current.at < 1200) return
      lastShown.current = { message, type, at: now }
      const id = ++nextId.current
      setToasts((current) => [...current.slice(-2), { id, message, type }])
      window.setTimeout(() => dismiss(id), 3000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.type}`} key={toast.id}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} aria-hidden />
            ) : (
              <XCircle size={20} aria-hidden />
            )}
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="알림 닫기">
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast는 ToastProvider 내부에서 사용해야 합니다.')
  return context
}
