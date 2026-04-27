import type { PipelineState } from '@/types/pipeline'

export interface AgentNode {
  readonly name: string
  run(state: PipelineState): Promise<PipelineState>
}
