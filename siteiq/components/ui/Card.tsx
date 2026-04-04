import { clsx } from 'clsx'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={clsx('glass rounded-2xl p-6 shadow-[0_4px_32px_rgba(0,0,0,0.3)]', className)}>
      {children}
    </div>
  )
}
