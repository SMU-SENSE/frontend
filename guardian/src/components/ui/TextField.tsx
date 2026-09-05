'use client'

import { Eye, EyeOff } from 'lucide-react'
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: ReactNode
  leadingIcon?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, leadingIcon, id, type = 'text', className = '', ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="field__control">
        {leadingIcon ? <span className="field__leading">{leadingIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {isPassword ? (
          <button
            className="field__password-toggle"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시하기'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {hint ? (
        <div className="field__message field__message--hint" id={hintId}>
          {hint}
        </div>
      ) : null}
      {error ? (
        <p className="field__message field__message--error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
