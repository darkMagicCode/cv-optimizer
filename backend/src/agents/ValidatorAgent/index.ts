import type { AgentNode }    from '@/orchestrator/AgentNode'
import type { PipelineState } from '@/types/pipeline'
import type { ValidationResult } from '@/types/agents'
import { CVProfileSchema }      from '@/agents/CVProfilerAgent/schema'
import { RoleProfileSchema }    from '@/agents/RoleAnalyzerAgent/schema'
import { GapDataSchema }        from '@/agents/GapDetectorAgent/schema'
import { ScoreDataSchema }      from '@/agents/ScoreEngineAgent/schema'
import { RecommendationsSchema } from '@/agents/RecommenderAgent/schema'
import { logger }               from '@/utils/logger'

// Schema map — keyed by the agent name that produced the output
const SCHEMAS: Record<string, { schema: { parse: (d: unknown) => unknown }; key: keyof PipelineState }> = {
  CVProfilerAgent:   { schema: CVProfileSchema,       key: 'cvProfile'       },
  RoleAnalyzerAgent: { schema: RoleProfileSchema,     key: 'roleProfile'     },
  GapDetectorAgent:  { schema: GapDataSchema,         key: 'gapData'         },
  ScoreEngineAgent:  { schema: ScoreDataSchema,       key: 'scoreData'       },
  RecommenderAgent:  { schema: RecommendationsSchema, key: 'recommendations' },
}

/**
 * Rex — Zod-only validator.
 * Does NOT call GPT-4o. Validates the last-produced output from the named agent.
 */
export class ValidatorAgent implements AgentNode {
  readonly name = 'ValidatorAgent'

  /**
   * Validate the output that was most recently added to state.
   * The orchestrator calls this right after each agent runs.
   * Rex determines which schema to apply by inspecting completedNodes.
   */
  async run(state: PipelineState): Promise<PipelineState> {
    // Find the last completed agent (the one we need to validate)
    const lastAgent = [...state.completedNodes].reverse()
      .find(name => name in SCHEMAS)

    if (!lastAgent) return state  // Nothing to validate yet

    const entry = SCHEMAS[lastAgent]!
    const data  = state[entry.key]

    if (data === undefined) {
      throw new Error(`[ValidatorAgent] ${lastAgent} produced no output for key "${entry.key}"`)
    }

    const result = this.validate(lastAgent, data)
    if (!result.ok) {
      throw new Error(`[ValidatorAgent] ${lastAgent} schema validation failed: ${result.reason}`)
    }

    logger.debug(`[ValidatorAgent] ✓ ${lastAgent} output is valid`)
    return state
  }

  validate(agentName: string, data: unknown): ValidationResult {
    const entry = SCHEMAS[agentName]
    if (!entry) {
      logger.warn(`[ValidatorAgent] No schema registered for "${agentName}" — skipping`)
      return { ok: true, reason: 'No schema registered' }
    }

    try {
      entry.schema.parse(data)
      return { ok: true, reason: '' }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      logger.warn(`[ValidatorAgent] Schema error for ${agentName}: ${reason}`)
      return { ok: false, reason }
    }
  }
}
