import { cn } from '@/lib/utils/cn'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#333]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border border-[#EDE8F5] bg-white px-4 py-3 text-[#333] placeholder-[#aaa] transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent',
            'disabled:bg-[#FAF7FD] disabled:cursor-not-allowed',
            error && 'border-red-400 focus:ring-red-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
