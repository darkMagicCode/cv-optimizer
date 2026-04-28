import path             from 'path'
import { BaseAgent }    from '@/agents/base/BaseAgent'
import type { PipelineState } from '@/types/pipeline'
import { GapDataSchema } from './schema'
import { logger }       from '@/utils/logger'
import { reconcileMissingSkills } from '@/utils/skillMatcher'

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
- existingSkills: skills clearly evidenced in job descriptions, projects, summary, OR practical context
- missingSkills: skills with ZERO presence anywhere in the CV (skills list, summary, experience, projects) — check aliases first
- partialSkills: skills mentioned but without practical/contextual evidence; "note" must explain exactly what evidence is missing
- missingSections: required CV sections absent from the candidate's document; "reason" must explain why that section matters for this specific role
- experienceGaps: types of work history the role requires that the CV lacks entirely

IMPORTANT:
- Search the FULL CV context: skills list, summary paragraph, experience highlights, AND project descriptions
- A skill mentioned in the summary paragraph counts as contextual evidence — do NOT classify it as partial or missing
- A skill listed in the skills section AND confirmed in experience/projects/summary is "existing"
- A skill listed only in a bare skills section with no corroborating evidence elsewhere is "partial"
- Never classify the same skill in two categories
- Never penalise a candidate for using equivalent terminology (e.g. "K8s" = "Kubernetes", "REST" = "RESTful APIs")
- For missingSections: check the CV links object — if a github/linkedin/portfolio URL is present in the links, do NOT flag it as a missing section or missing link
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

    const presentLinks = Object.entries(state.cvProfile.links)
      .filter(([, v]) => v && v.trim() !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')

    const userMessage = `
Classify the required skills by comparing the CV profile against the role profile.${ragBlock}

### CV Summary (counts as contextual evidence for skills)
${state.cvProfile.summary}

### CV Skills (from Aria's extraction)
${JSON.stringify(state.cvProfile.skills, null, 2)}

### CV Experience (highlights per role)
${state.cvProfile.experience.map(e => `${e.role} at ${e.company}: ${e.highlights.join('; ')}`).join('\n')}

### CV Links Already Present (do NOT flag these as missing)
${presentLinks || 'none'}

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

    // ------------------------------------------------------------------
    // Deterministic post-validation: the LLM can hallucinate or normalise
    // skill names differently and produce false negatives.  We check every
    // skill in missingSkills against the raw CV text (+ alias table) in
    // code.  Any skill found in the text is moved to existingSkills.
    // ------------------------------------------------------------------
    const { recovered, confirmed } = reconcileMissingSkills(result.missingSkills, state.cvText)

    if (recovered.length > 0) {
      logger.warn(`[${this.name}] Deterministic check recovered ${recovered.length} false-negative(s) from missingSkills: ${recovered.join(', ')}`)
    }

    const finalGapData = {
      ...result,
      missingSkills:  confirmed,
      existingSkills: [...new Set([...result.existingSkills, ...recovered])],
    }

    logger.info(`[${this.name}] Gap analysis: ${finalGapData.existingSkills.length} existing, ${finalGapData.missingSkills.length} missing, ${finalGapData.partialSkills.length} partial`)
    return { ...state, gapData: finalGapData }
  }
}
