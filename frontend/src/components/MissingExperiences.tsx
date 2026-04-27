import { AlertCircle, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface MissingExperiencesProps {
  missingExperiences: string[]
}

export function MissingExperiences({ missingExperiences }: MissingExperiencesProps) {
  const list = (
    <ul className="space-y-2">
      {missingExperiences.map((line) => (
        <li key={line} className="flex gap-2 text-sm text-muted-foreground">
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-red-400/90"
            aria-hidden
          />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-5 text-amber-400" />
          Missing Experiences
        </CardTitle>
      </CardHeader>
      <CardContent>
        {missingExperiences.length > 5 ? (
          <ScrollArea className="h-[220px] pr-2">{list}</ScrollArea>
        ) : (
          list
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {missingExperiences.length} experience gap
          {missingExperiences.length === 1 ? '' : 's'}
        </p>
      </CardContent>
    </Card>
  )
}
