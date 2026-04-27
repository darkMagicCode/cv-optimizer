import path                   from 'path'
import { BaseAgent }          from '@/agents/base/BaseAgent'
import type { PipelineState }      from '@/types/pipeline'
import { RecommendationsSchema } from './schema'
import { logger }             from '@/utils/logger'

const OUTPUT_INSTRUCTIONS = `
You are generating prioritised, specific, actionable CV improvement recommendations.
Return ONLY valid JSON:

{
  "recommendations": [
    {
      "priority": "High" | "Medium" | "Low",
      "action": string (under 10 words — short scannable action),
      "detail": string (specific, references actual gaps or skills),
      "impact": string (expected effect on the match score or interview chances)
    }
  ]
}

Rules:
- Minimum 6 recommendations total (at least 2 per priority level)
- High: missing required skills or critical experience gaps
- Medium: partial skills, missing sections, weak keyword density
- Low: formatting, optional links, nice-to-have improvements
- Every detail MUST reference something specific from the gap analysis
- NEVER write generic advice like "improve your CV"
- NEVER recommend adding qualifications the candidate doesn't have
- Return ONLY the JSON object — no markdown, no explanation
`.trim()

export class RecommenderAgent extends BaseAgent {
  readonly name = 'RecommenderAgent'

  protected resolveDir(): string {
    return path.join(__dirname)
  }

  async run(state: PipelineState): Promise<PipelineState> {
    logger.info(`[${this.name}] Generating recommendations`)

    if (!state.gapData || !state.scoreData || !state.roleProfile) {
      throw new Error(`[${this.name}] Missing gapData, scoreData, or roleProfile`)
    }

    const ragContext = state.ragContext['RecommenderAgent'] ?? ''
    const ragBlock   = ragContext
      ? `\n\n### Improvement Context\n\n${ragContext}`
      : ''

    const { gapData, scoreData, roleProfile } = state

    const userMessage = `
Generate improvement recommendations for this candidate.${ragBlock}

### Match Score
Overall: ${scoreData.matchScore}/100
- Technical Skills: ${scoreData.categoryScores.technicalSkills}/100 — ${scoreData.notes.technicalSkills}
- Experience: ${scoreData.categoryScores.experience}/100 — ${scoreData.notes.experience}
- Presentation: ${scoreData.categoryScores.presentation}/100 — ${scoreData.notes.presentation}
- Keywords: ${scoreData.categoryScores.keywords}/100 — ${scoreData.notes.keywords}

### Gap Analysis
Missing skills: ${gapData.missingSkills.join(', ') || 'none'}
Partial skills: ${gapData.partialSkills.map(p => `${p.skill} (${p.note})`).join('; ') || 'none'}
Missing sections: ${gapData.missingSections.map(s => s.section).join(', ') || 'none'}
Experience gaps: ${gapData.experienceGaps.join(', ') || 'none'}

### Target Role
Job title: ${roleProfile.jobTitle}
Industry context: ${roleProfile.industryContext}
`.trim()

    const raw    = await this.chat(OUTPUT_INSTRUCTIONS, userMessage)
    const parsed = JSON.parse(raw)
    const result = RecommendationsSchema.parse(parsed)

    const highCount = result.recommendations.filter(r => r.priority === 'High').length
    logger.info(`[${this.name}] Generated ${result.recommendations.length} recommendations (${highCount} High priority)`)
    return { ...state, recommendations: result }
  }
}
