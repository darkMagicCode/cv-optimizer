import { Download, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CategoryBreakdown } from '@/components/CategoryBreakdown'
import { MatchScoreRing } from '@/components/MatchScoreRing'
import { MissingExperiences } from '@/components/MissingExperiences'
import { MissingSections } from '@/components/MissingSections'
import { Recommendations } from '@/components/Recommendations'
import { SkillsGrid } from '@/components/SkillsGrid'
import type { AnalysisResult } from '@/types'

export interface ResultsDashboardProps {
  analysis: AnalysisResult
  analyzedAt: Date
  onReset: () => void
}

export function ResultsDashboard({ analysis, analyzedAt, onReset }: ResultsDashboardProps) {
  return (
    <div className="pb-28">
      <div className="space-y-4">
        <MatchScoreRing
          score={analysis.matchScore}
          verdict={analysis.verdict}
          analyzedAt={analyzedAt}
        />
        <CategoryBreakdown categories={analysis.categories} />
        <SkillsGrid
          existingSkills={analysis.existingSkills}
          missingSkills={analysis.missingSkills}
          partialSkills={analysis.partialSkills}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <MissingSections missingSections={analysis.missingSections} />
          <MissingExperiences missingExperiences={analysis.missingExperiences} />
        </div>
        <Recommendations recommendations={analysis.recommendations} />
      </div>

      <div className="print-hidden pointer-events-none fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-[#070d25]/95 p-4 backdrop-blur md:left-64">
        <div className="pointer-events-auto mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-3 px-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="min-w-[200px] gap-2 border-border/80 bg-[#0f1a3f]"
          >
            <Download className="size-4" />
            Download Report (PDF)
          </Button>
          <Button
            type="button"
            onClick={onReset}
            className="min-w-[200px] gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          >
            <RefreshCw className="size-4" />
            Analyze Another CV
          </Button>
        </div>
      </div>
    </div>
  )
}
