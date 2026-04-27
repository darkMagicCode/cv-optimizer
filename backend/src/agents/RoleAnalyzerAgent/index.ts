import path                from 'path'
import { BaseAgent }       from '@/agents/base/BaseAgent'
import type { PipelineState } from '@/types/pipeline'
import { RoleProfileSchema } from './schema'
import { logger }          from '@/utils/logger'

const OUTPUT_INSTRUCTIONS = `
You are profiling a job role to build the ideal candidate profile. Return ONLY valid JSON:

{
  "jobTitle": string,
  "seniority": "junior" | "mid" | "senior" | "principal",
  "requiredSkills": string[],
  "niceToHaveSkills": string[],
  "requiredExperienceYears": number,
  "requiredSections": string[],
  "requiredExperiences": string[],
  "keywords": string[],
  "industryContext": string
}

Rules:
- requiredSkills: skills that are genuinely non-negotiable for the role
- niceToHaveSkills: skills that improve candidacy but are not blockers
- requiredSections: CV sections the market expects for this role (e.g. "Work Experience", "Certifications")
- requiredExperiences: types of work history needed (e.g. "patient-facing clinical work", "courtroom experience")
- keywords: ATS-relevant terms for the role
- industryContext: brief sentence on the industry and what hiring managers care about most
- Work from the actual job title — do not assume tech unless the role is clearly technical
- Return ONLY the JSON object — no markdown, no explanation
`.trim()

export class RoleAnalyzerAgent extends BaseAgent {
  readonly name = 'RoleAnalyzerAgent'

  protected resolveDir(): string {
    return path.join(__dirname)
  }

  async run(state: PipelineState): Promise<PipelineState> {
    logger.info(`[${this.name}] Profiling role: ${state.jobTitle}`)

    const ragContext = state.ragContext['RoleAnalyzerAgent'] ?? ''
    const ragBlock   = ragContext
      ? `\n\n### Market Data from Knowledge Base\n\n${ragContext}`
      : ''

    const raw = await this.chat(
      OUTPUT_INSTRUCTIONS,
      `Profile the following job role and build the ideal candidate requirements.${ragBlock}\n\nJob Title: ${state.jobTitle}`,
    )

    const parsed = JSON.parse(raw)
    const result = RoleProfileSchema.parse(parsed)

    logger.info(`[${this.name}] Role profiled — ${result.requiredSkills.length} required skills, seniority: ${result.seniority}`)
    return { ...state, roleProfile: result }
  }
}
