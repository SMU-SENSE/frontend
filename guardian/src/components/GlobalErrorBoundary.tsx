'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { SystemErrorPage } from './ui/SystemErrorPage'

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
    if (process.env.NODE_ENV === 'development') {
      console.error('말모아 화면 오류', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return <SystemErrorPage variant="temporary" />
    }

    return this.props.children
  }
}
