import { env }           from '@/config/env'
import { logger }        from '@/utils/logger'
import type { AgentNode }     from './AgentNode'
import type { PipelineState } from '@/types/pipeline'
import { withRetry }     from './RetryPolicy'
import { BaseAgent }     from '@/agents/base/BaseAgent'
import { throwIfAborted } from './Cancellation'

// Imported lazily to avoid circular deps at module load time
// The orchestrator wires them in routes/analyze.ts
export class PipelineOrchestrator {
  private nodes:     AgentNode[] = []
  private validator: AgentNode | null = null
  private judge:     AgentNode | null = null

  // Register the validator (Rex) — injected from outside
  setValidator(v: AgentNode): this {
    this.validator = v
    return this
  }

  // Register the quality judge (Vera) — injected from outside
  setJudge(j: AgentNode): this {
    this.judge = j
    return this
  }

  use(node: AgentNode): this {
    this.nodes.push(node)
    return this
  }

  private throwIfCanceled(state: PipelineState, phase: string): void {
    throwIfAborted(state.abortSignal, `[Pipeline] Canceled during ${phase}`)
  }

  private attachSignal(node: AgentNode, signal: AbortSignal | undefined): void {
    if (node instanceof BaseAgent) {
      node.setExecutionSignal(signal)
    }
  }

  async run(state: PipelineState): Promise<PipelineState> {
    logger.info(`[Pipeline] Starting run ${state.runId} for "${state.jobTitle}"`)

    // 1. Run each agent in sequence, with Rex validating after each
    for (const node of this.nodes) {
      this.throwIfCanceled(state, `before ${node.name}`)
      this.attachSignal(node, state.abortSignal)
      if (this.validator) this.attachSignal(this.validator, state.abortSignal)

      state = await withRetry(
        node.name,
        async () => {
          this.throwIfCanceled(state, `${node.name} execution`)
          const next = await node.run(state)

          // Rex validates if present
          if (this.validator) {
            this.throwIfCanceled(next, `${node.name} validation`)
            const validatorState = await this.validator.run(next)
            return validatorState
          }
          return next
        },
        state,
      )

      state.completedNodes.push(node.name)
      logger.info(`[Pipeline] ✓ ${node.name} completed`)
    }

    // 2. Vera reviews the full output
    if (this.judge) {
      this.throwIfCanceled(state, 'before quality judge')
      this.attachSignal(this.judge, state.abortSignal)
      state = await this.judge.run(state)
      logger.info(`[Pipeline] Quality judge score: ${state.judgeVerdict?.score ?? 'n/a'}`)

      // 3. Selectively re-run failing agents if score below threshold
      const verdict = state.judgeVerdict
      if (verdict && verdict.score < env.JUDGE_QUALITY_THRESHOLD && verdict.rerunAgents.length > 0) {
        logger.warn(`[Pipeline] Quality below threshold — re-running: ${verdict.rerunAgents.join(', ')}`)

        for (const agentName of verdict.rerunAgents) {
          this.throwIfCanceled(state, `before re-run ${agentName}`)
          const node = this.nodes.find(n => n.name === agentName)
          if (!node) continue
          this.attachSignal(node, state.abortSignal)

          // Teach the agent what Vera found before re-running
          if (node instanceof BaseAgent && verdict.issues.length > 0) {
            const lesson = verdict.issues
              .filter(i => i.agent === agentName)
              .map(i => `${i.check}: ${i.description}`)
              .join('; ')
            if (lesson) node.recordLesson(lesson)
          }

          state = await withRetry(
            agentName,
            async () => {
              this.throwIfCanceled(state, `${agentName} re-run`)
              return node.run(state)
            },
            state,
          )
          logger.info(`[Pipeline] ✓ ${agentName} re-run completed`)
        }

        // Re-run judge after corrections
        this.throwIfCanceled(state, 'before re-judge')
        state = await this.judge.run(state)
        logger.info(`[Pipeline] Re-judge score: ${state.judgeVerdict?.score ?? 'n/a'}`)
      }
    }

    const durationMs = Date.now() - state.startedAt
    logger.info(`[Pipeline] Run ${state.runId} completed in ${durationMs}ms`)
    return state
  }
}
