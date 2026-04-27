import { z } from 'zod'

export const RecommendationsSchema = z.object({
  recommendations: z.array(z.object({
    priority: z.enum(['High', 'Medium', 'Low']),
    action:   z.string().min(1),
    detail:   z.string().min(1),
    impact:   z.string().min(1),
  })).min(6),
})

export type RecommendationsOutput = z.infer<typeof RecommendationsSchema>
