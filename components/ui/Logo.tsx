import { cn } from '@/lib/utils/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white font-bold shadow-sm',
          {
            'w-7 h-7 text-sm': size === 'sm',
            'w-9 h-9 text-base': size === 'md',
            'w-12 h-12 text-xl': size === 'lg',
          }
        )}
      >
        AI
      </div>
      <span
        className={cn('font-bold text-[#333]', {
          'text-base': size === 'sm',
          'text-xl': size === 'md',
          'text-2xl': size === 'lg',
        })}
      >
        サロン<span className="text-[#C9A8E2]">AI</span>
      </span>
    </div>
  )
}
