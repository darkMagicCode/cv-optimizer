import { Flag, Lightbulb } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Priority, Recommendation } from '@/types'

const columnMeta: Record<
  Priority,
  { label: string; border: string; flagClass: string; footer: string; footerClass: string }
> = {
  High: {
    label: 'High Priority',
    border: 'border-red-500/50',
    flagClass: 'text-red-400',
    footer: 'Focus on these critical areas first.',
    footerClass: 'border-red-500/30 bg-red-950/65 text-red-200/90',
  },
  Medium: {
    label: 'Medium Priority',
    border: 'border-amber-500/50',
    flagClass: 'text-amber-300',
    footer: 'Important improvements to consider.',
    footerClass: 'border-amber-500/30 bg-amber-950/55 text-amber-100/90',
  },
  Low: {
    label: 'Low Priority',
    border: 'border-emerald-500/50',
    flagClass: 'text-emerald-400',
    footer: 'Nice to have improvements.',
    footerClass: 'border-emerald-500/30 bg-emerald-950/55 text-emerald-100/90',
  },
}

function PriorityColumn({
  priority,
  items,
}: {
  priority: Priority
  items: Recommendation[]
}) {
  const m = columnMeta[priority]
  return (
    <div className={['flex flex-col rounded-lg border-2 border-border bg-[#101a3d]/90', m.border].join(' ')}>
      <div
        className={['flex items-center gap-2 border-b px-3 py-2.5 text-sm font-semibold', m.flagClass].join(' ')}
      >
        <Flag className="size-4" />
        {m.label}
      </div>
      <div className="space-y-4 p-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items in this band.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((r, i) => (
              <li key={i} className="space-y-1">
                <p className="text-sm text-foreground">• {r.action}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
              </li>
            ))}
          </ul>
        )}
        <p
          className={['rounded-md border px-2 py-2 text-center text-xs', m.footerClass].join(' ')}
        >
          {m.footer}
        </p>
      </div>
    </div>
  )
}

export interface RecommendationsProps {
  recommendations: Recommendation[]
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  const high = recommendations.filter((r) => r.priority === 'High')
  const medium = recommendations.filter((r) => r.priority === 'Medium')
  const low = recommendations.filter((r) => r.priority === 'Low')

  return (
    <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/20">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-200">
          <Lightbulb className="size-4" />
        </div>
        <CardTitle className="text-base font-semibold">Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 lg:grid-cols-3">
          <PriorityColumn priority="High" items={high} />
          <PriorityColumn priority="Medium" items={medium} />
          <PriorityColumn priority="Low" items={low} />
        </div>
      </CardContent>
    </Card>
  )
}
