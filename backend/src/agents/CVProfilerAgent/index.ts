import path               from 'path'
import { BaseAgent }      from '@/agents/base/BaseAgent'
import type { PipelineState } from '@/types/pipeline'
import { CVProfileSchema } from './schema'
import { logger }         from '@/utils/logger'

const OUTPUT_INSTRUCTIONS = `
You are extracting structured data from a CV. Return ONLY valid JSON matching this exact schema:

{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "summary": string,
  "skills": string[],
  "experience": [{ "role": string, "company": string, "duration": string, "highlights": string[] }],
  "education": [{ "degree": string, "institution": string, "year": string }],
  "certifications": string[],
  "projects": string[],
  "languages": string[],
  "links": { "github"?: string, "linkedin"?: string, "portfolio"?: string },
  "sections": string[],
  "totalYearsExperience": number
}

Rules:
- Only extract what is explicitly in the CV text
- Use empty strings and empty arrays for missing fields — never null
- "sections" must list every visible section heading found in the CV
- "totalYearsExperience" must be computed from the experience entries, not estimated
- Return ONLY the JSON object — no markdown, no explanation
`.trim()

export class CVProfilerAgent extends BaseAgent {
  readonly name = 'CVProfilerAgent'

  protected resolveDir(): string {
    return path.join(__dirname)
  }

  async run(state: PipelineState): Promise<PipelineState> {
    logger.info(`[${this.name}] Extracting CV profile`)

    const raw = await this.chat(
      OUTPUT_INSTRUCTIONS,
      `Extract the complete structured profile from the following CV text:\n\n${state.cvText}`,
    )

    const parsed = JSON.parse(raw)
    const result = CVProfileSchema.parse(parsed)

    logger.info(`[${this.name}] Extracted ${result.skills.length} skills, ${result.experience.length} experience entries`)
    return { ...state, cvProfile: result }
  }
}
