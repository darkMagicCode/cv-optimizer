import path              from 'path'
import { BaseAgent }     from '@/agents/base/BaseAgent'
import type { PipelineState } from '@/types/pipeline'
import { ScoreDataSchema } from './schema'
import { logger }        from '@/utils/logger'

const OUTPUT_INSTRUCTIONS = `
You are computing a precise match score. Apply the weighted formula exactly. Return ONLY valid JSON:

{
  "matchScore": number (0–100, integer),
  "categoryScores": {
    "technicalSkills": number (0–100, integer),
    "experience": number (0–100, integer),
    "presentation": number (0–100, integer),
    "keywords": number (0–100, integer)
  },
  "notes": {
    "technicalSkills": string,
    "experience": string,
    "presentation": string,
    "keywords": string
  },
  "verdict": string (exactly 2 OR 3 complete English sentences; each ends with . ! or ? — invalid: one sentence, four+ sentences, or bullet-style text)
}

Scoring formulas:
- technicalSkills = (existingCount + partialCount×0.5) / requiredCount × 100
- experience = min(cvYears / requiredYears, 1.0) × 100
- presentation = (1 − missingCount / requiredSectionsCount) × 100
- keywords = matchingKeywords / totalKeywords × 100
- matchScore = (technicalSkills×0.40) + (experience×0.30) + (presentation×0.15) + (keywords×0.15)

All scores must be integers (round down). matchScore must be within 2 points of the formula result.
The verdict must be exactly 2 or 3 sentences (not one line, not a paragraph of four or more). It must match the score range in tone (80–100=Strong, 60–79=Good, 40–59=Needs Work, 0–39=Weak Match).
Return ONLY the JSON object — no markdown, no explanation.
`.trim()

export class ScoreEngineAgent extends BaseAgent {
  readonly name = 'ScoreEngineAgent'

  protected resolveDir(): string {
    return path.join(__dirname)
  }

  async run(state: PipelineState): Promise<PipelineState> {
    logger.info(`[${this.name}] Computing match score`)

    if (!state.cvProfile || !state.roleProfile || !state.gapData) {
      throw new Error(`[${this.name}] Missing cvProfile, roleProfile, or gapData`)
    }

    const { gapData, cvProfile, roleProfile } = state

    const userMessage = `
Compute the match score using the inputs below.

### Gap Analysis
- Existing skills (${gapData.existingSkills.length}): ${gapData.existingSkills.join(', ')}
- Missing skills (${gapData.missingSkills.length}): ${gapData.missingSkills.join(', ')}
- Partial skills (${gapData.partialSkills.length}): ${gapData.partialSkills.map(p => p.skill).join(', ')}
- Missing sections (${gapData.missingSections.length}): ${gapData.missingSections.map(s => s.section).join(', ')}

### Role Profile
- Required skills total: ${roleProfile.requiredSkills.length}
- Required experience years: ${roleProfile.requiredExperienceYears}
- Required sections total: ${roleProfile.requiredSections.length}
- Keywords total: ${roleProfile.keywords.length}

### Candidate Profile
- Total years experience: ${cvProfile.totalYearsExperience}
- Keywords present in CV: ${roleProfile.keywords.filter(k => state.cvText.toLowerCase().includes(k.toLowerCase())).length} of ${roleProfile.keywords.length}
`.trim()

    const raw    = await this.chat(OUTPUT_INSTRUCTIONS, userMessage)
    const parsed = JSON.parse(raw)
    const result = ScoreDataSchema.parse(parsed)

    logger.info(`[${this.name}] Match score: ${result.matchScore}/100`)
    return { ...state, scoreData: result }
  }
}
