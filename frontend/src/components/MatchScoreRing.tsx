import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { formatAnalyzedOnTooltip } from '@/lib/time'

const R = 70
const C = 2 * Math.PI * R

function scoreToVisual(score: number) {
  if (score >= 80) return { stroke: '#22c55e', label: 'Strong Match' as const }
  if (score >= 60) return { stroke: '#3b82f6', label: 'Good Match' as const }
  if (score >= 40) return { stroke: '#eab308', label: 'Needs Improvement' as const }
  return { stroke: '#ef4444', label: 'Weak Match' as const }
}

const legend = [
  { name: 'Strong Match', sub: 'Green', range: '80–100', color: '#22c55e' },
  { name: 'Good Match', sub: 'Blue', range: '60–79', color: '#3b82f6' },
  { name: 'Needs Improvement', sub: 'Yellow', range: '40–59', color: '#eab308' },
  { name: 'Weak Match', sub: 'Red', range: '0–39', color: '#ef4444' },
] as const

export interface MatchScoreRingProps {
  score: number
  verdict: string
  analyzedAt: Date
}

export function MatchScoreRing({ score, verdict, analyzedAt }: MatchScoreRingProps) {
  const s = Math.min(100, Math.max(0, score))
  const { stroke, label } = scoreToVisual(s)
  const [dashOffset, setDashOffset] = useState(C)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setDashOffset(C * (1 - s / 100))
    })
    return () => cancelAnimationFrame(id)
  }, [s])

  return (
    <Card className="border-border/80 bg-card/95 shadow-lg shadow-black/25">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[minmax(0,200px)_1fr_minmax(0,220px)] md:items-center">
        <div className="relative mx-auto size-[200px] shrink-0">
          <svg
            className="size-[200px] -rotate-90"
            viewBox="0 0 160 160"
            role="img"
            aria-label={`Match score ${s} percent`}
          >
            <circle cx="80" cy="80" r={R} fill="none" className="stroke-[#26325e]" strokeWidth="10" />
            <circle
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1.5s ease-in-out, stroke 0.3s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="text-4xl font-bold tabular-nums"
              style={{ color: stroke }}
            >
              {s}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="size-5" style={{ color: stroke }} aria-hidden />
            <span className="text-lg font-bold" style={{ color: stroke }}>
              {label}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{verdict}</p>
          <p className="text-xs text-muted-foreground">{formatAnalyzedOnTooltip(analyzedAt)}</p>
        </div>

        <div className="md:border-l md:border-border/60 md:pl-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Score legend
          </p>
          <ul className="space-y-2.5 text-sm">
            {legend.map((item) => (
              <li key={item.name} className="flex items-start gap-2">
                <span
                  className="mt-0.5 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{item.name}</span>{' '}
                  <span className="text-xs text-muted-foreground/90">({item.sub})</span>
                  <span className="block text-xs text-muted-foreground">{item.range}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
