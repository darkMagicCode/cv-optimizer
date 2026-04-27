import * as React from 'react'

import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number | null
    max?: number
    indicatorClassName?: string
    indicatorStyle?: React.CSSProperties
  }
>(({ className, value = 0, max = 100, indicatorClassName, indicatorStyle, ...props }, ref) => {
  const pct = Math.min(100, Math.max(0, ((value ?? 0) / max) * 100))
  return (
    <div
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-500', indicatorClassName)}
        style={{ width: `${pct}%`, ...indicatorStyle }}
      />
    </div>
  )
})
Progress.displayName = 'Progress'

export { Progress }
