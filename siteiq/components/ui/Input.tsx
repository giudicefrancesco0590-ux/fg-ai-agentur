import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-white/70">{label}</label>}
      <input
        className={clsx(
          'glass rounded-xl px-4 py-2.5 text-white',
          'placeholder:text-white/25 focus:outline-none focus:border-violet-500/50',
          'transition-all duration-200 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.3)]',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
