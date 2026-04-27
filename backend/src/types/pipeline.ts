import type {
  CVProfile,
  RoleProfile,
  GapData,
  ScoreData,
  RecommendationsData,
  JudgeVerdict,
} from './agents'

export interface PipelineInput {
  cvText:   string
  jobTitle: string
  runId:    string
}

export interface PipelineState extends PipelineInput {
  // Populated progressively as each agent runs
  cvProfile?:       CVProfile
  roleProfile?:     RoleProfile
  gapData?:         GapData
  scoreData?:       ScoreData
  recommendations?: RecommendationsData
  judgeVerdict?:    JudgeVerdict

  // Orchestrator bookkeeping
  completedNodes:   string[]
  errors:           { node: string; error: string; attempt: number }[]
  ragContext:       Record<string, string>   // key = agent name, value = retrieved context
  startedAt:        number                   // Date.now()
  abortSignal?:     AbortSignal
}

export function createInitialState(input: PipelineInput): PipelineState {
  return {
    ...input,
    completedNodes: [],
    errors:         [],
    ragContext:     {},
    startedAt:      Date.now(),
  }
}
