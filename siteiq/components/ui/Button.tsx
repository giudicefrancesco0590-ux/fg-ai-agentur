import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
        {
          'bg-violet-500 text-white hover:bg-violet-400 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)]': variant === 'primary',
          'glass text-white/80 hover:text-white hover:bg-white/[0.07] active:scale-95': variant === 'secondary',
          'text-white/70 hover:text-white': variant === 'ghost',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
