'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 개발 환경에서는 원인을 남기되 사용자 화면에는 내부 오류 정보를 노출하지 않는다.
    if (process.env.NODE_ENV === 'development') {
      console.error('말모아 화면 오류', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <AlertTriangle size={42} aria-hidden />
          <h1>화면을 표시하지 못했어요</h1>
          <p>입력한 내용은 가능한 범위에서 보존됩니다. 화면을 새로고침해 주세요.</p>
          <Button
            leftIcon={<RefreshCw size={17} />}
            onClick={() => window.location.reload()}
          >
            새로고침
          </Button>
        </main>
      )
    }

    return this.props.children
  }
}
