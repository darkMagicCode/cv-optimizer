import { BarChart3, Home, LayoutTemplate, Lightbulb, Rocket, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, active: true },
  { id: 'analyses', label: 'My Analyses', icon: BarChart3, active: false },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, active: false },
  { id: 'tips', label: 'Tips', icon: Lightbulb, active: false },
  { id: 'settings', label: 'Settings', icon: Settings2, active: false },
] as const

export function Sidebar() {
  return (
    <aside className="print-hidden fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border/70 bg-[#050915] text-foreground md:flex">
      <div className="p-6">
        <div className="flex items-baseline gap-1.5">
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-2xl font-bold text-transparent">
            CV
          </span>
          <span className="text-base font-semibold text-slate-100">Optimizer</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 rounded-md px-3 text-muted-foreground hover:bg-white/5 hover:text-foreground',
                item.active &&
                  'bg-primary/25 text-foreground ring-1 ring-primary/55',
              )}
              type="button"
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-4">
        <div className="flex gap-3 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/55 to-slate-900/45 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-300">
            <Rocket className="size-5" />
          </div>
          <p className="text-sm font-medium leading-snug text-foreground/95">
            Improve your CV and get more interviews!
          </p>
        </div>
      </div>
    </aside>
  )
}
