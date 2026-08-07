'use client'

import type { ReactNode } from 'react'
import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export function PageLoader({ label = '내용을 불러오는 중입니다.' }: { label?: string }) {
  return (
    <div className="async-state" role="status" aria-live="polite">
      <LoaderCircle className="async-state__spinner" size={32} aria-hidden />
      <p>{label}</p>
    </div>
  )
}

export function ErrorState({
  title = '내용을 불러오지 못했어요',
  message = '잠시 후 다시 시도해 주세요.',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="async-state async-state--error" role="alert">
      <AlertCircle size={36} aria-hidden />
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="outline" leftIcon={<RefreshCw size={17} />} onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="async-state async-state--empty">
      <Inbox size={38} aria-hidden />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
