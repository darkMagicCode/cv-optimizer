import { AlertTriangle, Check, ListChecks, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartialSkill } from '@/types'

export interface SkillsGridProps {
  existingSkills: string[]
  missingSkills: string[]
  partialSkills: PartialSkill[]
}

export function SkillsGrid({ existingSkills, missingSkills, partialSkills }: SkillsGridProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-0.5">
          <ListChecks className="size-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Skills</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
        <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <Check className="size-4" />
              Existing Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {existingSkills.map((s) => (
                <Badge key={s} variant="success">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {existingSkills.length} skills found
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-red-300">
              <X className="size-4" />
              Missing Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((s) => (
                <Badge key={s} variant="destructive">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {missingSkills.length} skills missing
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <AlertTriangle className="size-4" />
              Partial Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {partialSkills.map((p) => (
                <li key={p.skill} className="flex flex-wrap items-start gap-2 text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="warning" className="shrink-0">
                        {p.skill}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {p.note}
                    </TooltipContent>
                  </Tooltip>
                  <span className="min-w-0 text-muted-foreground">{p.note}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {partialSkills.length} skills need improvement
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
