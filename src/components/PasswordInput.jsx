import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

const PasswordInput = forwardRef(function PasswordInput(
  { id, onBlur, ...inputProps },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef(null)
  const selectionRef = useRef(null)

  useImperativeHandle(ref, () => ({
    hide: () => setVisible(false),
  }), [])

  useEffect(() => {
    if (!visible) return undefined

    const timeout = window.setTimeout(() => setVisible(false), 15000)
    return () => window.clearTimeout(timeout)
  }, [visible])

  useLayoutEffect(() => {
    const selection = selectionRef.current
    const input = inputRef.current
    if (!selection || !input) return

    input.setSelectionRange(selection.start, selection.end, selection.direction)
    selectionRef.current = null
  }, [visible])

  const toggleVisibility = () => {
    const input = inputRef.current
    if (input) {
      selectionRef.current = {
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection || 'none',
      }
    }
    setVisible((current) => !current)
  }

  const hideWhenFocusLeaves = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setVisible(false)
  }

  return (
    <span className="password-input-control" onBlurCapture={hideWhenFocusLeaves}>
      <input
        {...inputProps}
        id={id}
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        onBlur={onBlur}
      />
      <button
        className="password-toggle-button"
        type="button"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        aria-controls={id}
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggleVisibility}
      >
        {visible ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A11 11 0 0112 5c5 0 9 5 9 7a10 10 0 01-3.1 4.2M6.2 6.2C3.9 7.7 2 10.2 2 12c0 2 4 7 10 7a10 10 0 003.2-.5" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  )
})

export default PasswordInput
