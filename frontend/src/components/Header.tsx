import { ChevronDown, Moon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="print-hidden flex h-16 shrink-0 items-center justify-end border-b border-border/70 bg-[#060b1f]/75 px-6 backdrop-blur">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" type="button" aria-label="Toggle theme (visual)">
          <Moon className="size-4" />
        </Button>
        <div className="ml-2 flex items-center gap-2 rounded-lg border border-border/70 bg-[#0d1738] px-2 py-1">
          <div className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-medium text-slate-200">
            AJ
          </div>
          <span className="max-w-[140px] truncate text-sm">Alex Johnson</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" type="button" aria-label="Account menu">
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  )
}
