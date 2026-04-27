import path             from 'path'
import { BaseAgent }    from '@/agents/base/BaseAgent'
import type { PipelineState } from '@/types/pipeline'
import { GapDataSchema } from './schema'
import { logger }       from '@/utils/logger'

const OUTPUT_INSTRUCTIONS = `
You are classifying every required skill into one of three categories based on the CV content.
Return ONLY valid JSON:

{
  "existingSkills": string[],
  "missingSkills": string[],
  "partialSkills": [{ "skill": string, "note": string }],
  "missingSections": [{ "section": string, "reason": string }],
  "experienceGaps": string[]
}

Classification rules:
- existingSkills: skills clearly evidenced in job descriptions, projects, or practical context
- missingSkills: skills with ZERO presence in the CV — check for aliases first
- partialSkills: skills mentioned but without practical/contextual evidence; "note" must explain exactly what evidence is missing
- missingSections: required CV sections absent from the candidate's document; "reason" must explain why that section matters for this specific role
- experienceGaps: types of work history the role requires that the CV lacks entirely

IMPORTANT:
- A skill listed only in a bare skills section with no job/project context is "partial", not "existing"
- Never classify the same skill in two categories
- Never penalise a candidate for using equivalent terminology (e.g. "K8s" = "Kubernetes")
- Return ONLY the JSON object — no markdown, no explanation
`.trim()

export class GapDetectorAgent extends BaseAgent {
  readonly name = 'GapDetectorAgent'

  protected resolveDir(): string {
    return path.join(__dirname)
  }

  async run(state: PipelineState): Promise<PipelineState> {
    logger.info(`[${this.name}] Running gap analysis`)

    if (!state.cvProfile || !state.roleProfile) {
      throw new Error(`[${this.name}] Missing cvProfile or roleProfile`)
    }

    const ragContext = state.ragContext['GapDetectorAgent'] ?? ''
    const ragBlock   = ragContext
      ? `\n\n### Skill Taxonomy Context\n\n${ragContext}`
      : ''

    const userMessage = `
Classify the required skills by comparing the CV profile against the role profile.${ragBlock}

### CV Skills (from Aria's extraction)
${JSON.stringify(state.cvProfile.skills, null, 2)}

### CV Experience (highlights per role)
${state.cvProfile.experience.map(e => `${e.role} at ${e.company}: ${e.highlights.join('; ')}`).join('\n')}

### CV Sections Present
${state.cvProfile.sections.join(', ')}

### Required Skills (from Marcus's role profile)
${JSON.stringify(state.roleProfile.requiredSkills, null, 2)}

### Required Sections (from Marcus's role profile)
${state.roleProfile.requiredSections.join(', ')}

### Required Experiences (from Marcus's role profile)
${state.roleProfile.requiredExperiences.join(', ')}
`.trim()

    const raw    = await this.chat(OUTPUT_INSTRUCTIONS, userMessage)
    const parsed = JSON.parse(raw)
    const result = GapDataSchema.parse(parsed)

    logger.info(`[${this.name}] Gap analysis: ${result.existingSkills.length} existing, ${result.missingSkills.length} missing, ${result.partialSkills.length} partial`)
    return { ...state, gapData: result }
  }
}
