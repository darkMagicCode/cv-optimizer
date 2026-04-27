import { BadgeCheck, FileStack, Folder, Link, Monitor, User, type LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { MissingSection } from '@/types'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  'GitHub Link': Link,
  Portfolio: Monitor,
  'Professional Summary': User,
  Certifications: BadgeCheck,
}

function SectionIcon({ name }: { name: string }) {
  const Icon = iconMap[name] ?? Folder
  return <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
}

export interface MissingSectionsProps {
  missingSections: MissingSection[]
}

export function MissingSections({ missingSections }: MissingSectionsProps) {
  return (
    <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/20">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <div className="flex size-8 items-center justify-center rounded-md bg-violet-600/15 text-violet-300">
          <FileStack className="size-4" />
        </div>
        <CardTitle className="text-base">Missing Sections</CardTitle>
      </CardHeader>
      <CardContent>
        {missingSections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No major gaps listed.</p>
        ) : (
          <ul className="space-y-0">
            {missingSections.map((m, i) => (
              <li key={m.section}>
                {i > 0 ? <Separator className="my-3" /> : null}
                <div className="flex gap-3">
                  <SectionIcon name={m.section} />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{m.section}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      <span className={cn('font-medium text-foreground/90')}>
                        Why it matters:{' '}
                      </span>
                      {m.reason}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {missingSections.length} section{missingSections.length === 1 ? '' : 's'} missing
        </p>
      </CardContent>
    </Card>
  )
}
