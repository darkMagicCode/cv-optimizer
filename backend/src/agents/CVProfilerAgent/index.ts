import path               from 'path'
import { BaseAgent }      from '@/agents/base/BaseAgent'
import type { PipelineState } from '@/types/pipeline'
import { CVProfileSchema } from './schema'
import { logger }         from '@/utils/logger'

// ---------------------------------------------------------------------------
// Regex-based pre-extraction — runs before the LLM call so we hand the model
// concrete URLs rather than asking it to hunt through raw text.
// ---------------------------------------------------------------------------

const GITHUB_RE    = /(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+(?:\/[\w.-]+)*)/gi
const LINKEDIN_RE  = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w-]+)/gi
const PORTFOLIO_RE = /https?:\/\/(?!(?:www\.)?(?:github|linkedin)\.com)([\w.-]+\.(?:com|io|dev|me|app|co|net|org)(?:\/[\w./-]*)?)/gi

function preExtractLinks(text: string): { github?: string; linkedin?: string; portfolio?: string } {
  const links: { github?: string; linkedin?: string; portfolio?: string } = {}

  const gh = [...text.matchAll(GITHUB_RE)]
  if (gh.length > 0) {
    links.github = gh[0][0].replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
  }

  const li = [...text.matchAll(LINKEDIN_RE)]
  if (li.length > 0) {
    links.linkedin = li[0][0].replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
  }

  const pf = [...text.matchAll(PORTFOLIO_RE)]
  if (pf.length > 0) {
    // Strip protocol + www prefix to match github/linkedin normalisation
    links.portfolio = pf[0][0].replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
  }

  return links
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

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

Extraction rules:

LINKS — follow this carefully, it is the most failure-prone field:
- Scan the ENTIRE document: header/contact area, footer, body text, and the [DOCUMENT HYPERLINKS] block if present
- github:    any URL matching github.com/<username>
- linkedin:  any URL matching linkedin.com/in/<handle>
- portfolio: any other personal website URL (not github, not linkedin)
- If a [PRE-EXTRACTED LINKS] block is provided below, copy those values verbatim — they are ground truth
- Strip protocol (https://) and www. prefix from all link values

SKILLS — extract a complete flat list from every section of the CV:
- Include skills from: the dedicated skills/tech section, the summary paragraph, experience bullets, and project descriptions
- Each entry must be a single skill token (e.g. "RESTful APIs", "Node.js", "Docker") — not a sentence
- Extract skills verbatim as written in the CV — do NOT rename or paraphrase them
- Skills mentioned in the summary paragraph MUST appear in this array

EXPERIENCE highlights:
- Include all bullet points verbatim — do not summarise or omit any

GENERAL:
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

    // Pre-extract links via regex — gives the LLM concrete URLs to work from
    const preLinks = preExtractLinks(state.cvText)
    logger.debug(`[${this.name}] Pre-extracted links: ${JSON.stringify(preLinks)}`)

    const preLinksBlock = Object.keys(preLinks).length > 0
      ? `\n\n[PRE-EXTRACTED LINKS — copy these verbatim into the links field]\n` +
        Object.entries(preLinks).map(([k, v]) => `${k}: ${v}`).join('\n')
      : ''

    const raw = await this.chat(
      OUTPUT_INSTRUCTIONS,
      `Extract the complete structured profile from the following CV text.${preLinksBlock}\n\nCV TEXT:\n\n${state.cvText}`,
    )

    const parsed = JSON.parse(raw)
    const result = CVProfileSchema.parse(parsed)

    // Hard safety net: if the LLM still dropped a pre-extracted link, restore it
    if (preLinks.github    && !result.links.github)    result.links.github    = preLinks.github
    if (preLinks.linkedin  && !result.links.linkedin)  result.links.linkedin  = preLinks.linkedin
    if (preLinks.portfolio && !result.links.portfolio) result.links.portfolio = preLinks.portfolio

    logger.info(`[${this.name}] Extracted ${result.skills.length} skills, ${result.experience.length} experience entries, links: ${JSON.stringify(result.links)}`)
    return { ...state, cvProfile: result }
  }
}
