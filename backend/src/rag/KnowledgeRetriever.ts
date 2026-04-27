import { embedText }  from './Embedder'
import { vectorSearch } from './VectorStore'
import { env }         from '@/config/env'
import { logger }      from '@/utils/logger'

interface RoleDoc {
  jobTitle:          string
  requiredSkills:    string[]
  niceToHaveSkills:  string[]
  experienceYears:   number
  requiredSections:  string[]
  commonExperiences: string[]
  industryContext:   string
}

interface SkillDoc {
  skill:    string
  category: string
  aliases:  string[]
  related:  string[]
  implies:  string[]
}

/**
 * Retrieve similar role profiles for a given job title.
 * Used by Marcus (RoleAnalyzerAgent) to ground the role profile.
 */
export async function getRoleContext(jobTitle: string): Promise<string> {
  if (!env.ENABLE_RAG) return ''
  try {
    const embedding = await embedText(jobTitle)
    const results   = await vectorSearch<RoleDoc>('job_roles', embedding, 3)

    if (results.length === 0) return ''

    return results.map(r =>
      `Role: ${r.jobTitle}\n` +
      `Required: ${r.requiredSkills.slice(0, 8).join(', ')}\n` +
      `Nice to have: ${r.niceToHaveSkills.slice(0, 5).join(', ')}\n` +
      `Experience: ${r.experienceYears}+ years\n` +
      `Typical sections: ${r.requiredSections.join(', ')}\n` +
      `Industry: ${r.industryContext}`,
    ).join('\n\n---\n\n')
  } catch (err) {
    logger.warn('[KnowledgeRetriever] getRoleContext failed', { err })
    return ''
  }
}

/**
 * Retrieve skill taxonomy entries for alias detection.
 * Used by Nora (GapDetectorAgent) to prevent false-positive "missing" flags.
 */
export async function getSkillContext(skills: string[]): Promise<string> {
  if (!env.ENABLE_RAG) return ''
  try {
    if (skills.length === 0) return ''

    const query     = skills.join(', ')
    const embedding = await embedText(query)
    const results   = await vectorSearch<SkillDoc>('skill_taxonomy', embedding, 5)

    if (results.length === 0) return ''

    return results.map(s =>
      `Skill: ${s.skill} (${s.category})\n` +
      `Aliases: ${s.aliases.join(', ')}\n` +
      `Related: ${s.related.join(', ')}`,
    ).join('\n\n')
  } catch (err) {
    logger.warn('[KnowledgeRetriever] getSkillContext failed', { err })
    return ''
  }
}

/**
 * Retrieve improvement patterns relevant to the detected gaps.
 * Used by Sage (RecommenderAgent) to ground recommendations.
 */
export async function getImprovementContext(gaps: string[]): Promise<string> {
  if (!env.ENABLE_RAG) return ''
  try {
    if (gaps.length === 0) return ''

    const query     = `improvement tips for: ${gaps.slice(0, 5).join(', ')}`
    const embedding = await embedText(query)
    const results   = await vectorSearch<SkillDoc>('skill_taxonomy', embedding, 3)

    if (results.length === 0) return ''

    return results.map(s =>
      `Skill: ${s.skill}\nCategory: ${s.category}\nRelated: ${s.related.join(', ')}`,
    ).join('\n\n')
  } catch (err) {
    logger.warn('[KnowledgeRetriever] getImprovementContext failed', { err })
    return ''
  }
}
