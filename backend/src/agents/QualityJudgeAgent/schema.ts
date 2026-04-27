import { z } from 'zod'

export const JudgeVerdictSchema = z.object({
  score:       z.number().int().min(0).max(10),
  passed:      z.boolean(),
  issues:      z.array(z.object({
    agent:       z.string(),
    check:       z.string(),
    description: z.string(),
  })),
  rerunAgents: z.array(z.string()),
  summary:     z.string().min(1),
})

export type JudgeVerdictOutput = z.infer<typeof JudgeVerdictSchema>
