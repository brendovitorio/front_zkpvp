import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export function TypingLine({
  children,
  delayMs = 0,
  className,
}: {
  children: ReactNode
  delayMs?: number
  className?: string
}) {
  const lineRef = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const element = lineRef.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setStarted(true)
      setFinished(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true)
        observer.disconnect()
      }
    }, { threshold: 0.2 })
    observer.observe(element.parentElement ?? element)
    return () => observer.disconnect()
  }, [])

  const text = typeof children === 'string' ? children : ''
  const lineStyle = {
    '--typing-width': `${Math.ceil(text.length * 1.55)}ch`,
    '--typing-steps': Math.max(1, text.length),
    '--typing-duration': `${Math.max(550, text.length * 68)}ms`,
    '--typing-delay': `${delayMs}ms`,
  } as CSSProperties

  return (
    <span
      ref={lineRef}
      className={cn('typing-line', started && 'typing-line--started', finished && 'typing-line--finished', className)}
      style={lineStyle}
      onAnimationEnd={(event) => {
        if (event.animationName === 'typing-write') setFinished(true)
      }}
    >
      {children}
    </span>
  )
}
