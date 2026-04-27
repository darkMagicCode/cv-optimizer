import { BarChart3 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { AnalysisResult } from '@/types'

const rows: {
  key: keyof AnalysisResult['categories']
  title: string
  color: string
}[] = [
  { key: 'technicalSkills', title: 'Technical Skills', color: '#22c55e' },
  { key: 'experience', title: 'Experience', color: '#3b82f6' },
  { key: 'presentation', title: 'Presentation', color: '#eab308' },
  { key: 'keywords', title: 'Keywords Match', color: '#22c55e' },
]

export interface CategoryBreakdownProps {
  categories: AnalysisResult['categories']
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/25">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <BarChart3 className="size-4" />
        </div>
        <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((row) => {
            const { score, note } = categories[row.key]
            return (
              <div
                key={row.key}
                className="rounded-lg border border-border/70 bg-[#111a3d] p-4"
              >
                <p className="text-sm font-medium text-slate-300">{row.title}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: row.color }}>
                  {Math.round(score)}%
                </p>
                <Progress
                  value={score}
                  className="mt-2 h-2 bg-muted/80"
                  indicatorClassName="rounded-full"
                  indicatorStyle={{ backgroundColor: row.color }}
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{note}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
