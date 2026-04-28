import path                  from 'path'
import { BaseAgent }         from '@/agents/base/BaseAgent'
import type { PipelineState }     from '@/types/pipeline'
import { JudgeVerdictSchema } from './schema'
import { logger }            from '@/utils/logger'
import { reconcileMissingSkills } from '@/utils/skillMatcher'

const OUTPUT_INSTRUCTIONS = `
You are auditing the complete CV analysis pipeline output for factual accuracy and logical consistency.
Return ONLY valid JSON:

{
  "score": number (0–10, integer),
  "passed": boolean (true only if score >= 7),
  "issues": [
    {
      "agent": string (agent name responsible),
      "check": string (check that failed),
      "description": string (specific description of what is wrong)
    }
  ],
  "rerunAgents": string[] (agent names that need to re-run),
  "summary": string (1-2 sentence overall assessment)
}

Check these things in order:
1. existingSkills — are they ALL actually mentioned in the CV text?
2. missingSkills — are they genuinely absent (check for aliases)?
3. partialSkill notes — are they specific, not generic?
4. matchScore — does it match the weighted formula (±2 points)?
5. verdict narrative — is it exactly 2–3 sentences AND does it match the score range?
6. recommendations — do they reference real gaps? Is there ≥ 2 per priority level?
7. missingSections — are they truly absent from the CV's sections list?

If issues are found, add them to "issues" and include the responsible agent in "rerunAgents".
If no issues: score 9-10, passed true, empty issues array, empty rerunAgents.
Return ONLY the JSON object — no markdown, no explanation.
`.trim()

export class QualityJudgeAgent extends BaseAgent {
  readonly name = 'QualityJudgeAgent'

  protected resolveDir(): string {
    return path.join(__dirname)
  }

  async run(state: PipelineState): Promise<PipelineState> {
    logger.info(`[${this.name}] Reviewing pipeline output quality`)

    if (!state.cvProfile || !state.roleProfile || !state.gapData || !state.scoreData || !state.recommendations) {
      throw new Error(`[${this.name}] Pipeline not fully completed — missing agent outputs`)
    }

    const presentLinks = Object.entries(state.cvProfile.links)
      .filter(([, v]) => v && v.trim() !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')

    // Deterministic pre-check: run the same text-based reconciliation used by
    // GapDetectorAgent so the judge is told upfront about any contradictions
    // that code can prove — it doesn't have to rely solely on its own reasoning.
    const { recovered: knownFalseNegatives } = reconcileMissingSkills(
      state.gapData.missingSkills,
      state.cvText,
    )

    const deterministicBlock = knownFalseNegatives.length > 0
      ? `\n\n### DETERMINISTIC CHECK RESULT (from code — treat as ground truth)\n` +
        `The following skills are listed as "missing" in the gap analysis but were found in the raw CV text by regex+alias matching.\n` +
        `These are confirmed false negatives that MUST be flagged as issues:\n` +
        knownFalseNegatives.map(s => `- "${s}"`).join('\n')
      : `\n\n### DETERMINISTIC CHECK RESULT\nNo false negatives detected by code-level text matching.`

    const userMessage = `
Review the complete CV analysis pipeline output below for factual accuracy.${deterministicBlock}

### CV Summary (Aria extracted)
${state.cvProfile.summary}

### Original CV Skills (Aria extracted)
${JSON.stringify(state.cvProfile.skills, null, 2)}

### CV Links Present
${presentLinks || 'none'}

### CV Sections Present
${state.cvProfile.sections.join(', ')}

### CV Experience Highlights
${state.cvProfile.experience.map(e => `${e.role} at ${e.company}: ${e.highlights.join('; ')}`).join('\n')}

### Role Profile (Marcus built)
Required skills: ${state.roleProfile.requiredSkills.join(', ')}
Keywords: ${state.roleProfile.keywords.join(', ')}

### Gap Analysis (Nora classified)
Existing: ${state.gapData.existingSkills.join(', ')}
Missing: ${state.gapData.missingSkills.join(', ')}
Partial: ${state.gapData.partialSkills.map(p => `${p.skill} — ${p.note}`).join('; ')}
Missing sections: ${state.gapData.missingSections.map(s => `${s.section}: ${s.reason}`).join('; ')}

### Score Data (Leo computed)
matchScore: ${state.scoreData.matchScore}
categoryScores: ${JSON.stringify(state.scoreData.categoryScores)}
verdict: "${state.scoreData.verdict}"

### Recommendations (Sage generated)
${state.recommendations.recommendations.map(r => `[${r.priority}] ${r.action} — ${r.detail}`).join('\n')}
`.trim()

    const raw    = await this.chat(OUTPUT_INSTRUCTIONS, userMessage)
    const parsed = JSON.parse(raw)
    const result = JudgeVerdictSchema.parse(parsed)

    logger.info(`[${this.name}] Quality score: ${result.score}/10 — passed: ${result.passed}`)
    if (result.rerunAgents.length > 0) {
      logger.warn(`[${this.name}] Re-run requested for: ${result.rerunAgents.join(', ')}`)
    }

    return { ...state, judgeVerdict: result }
  }
}
