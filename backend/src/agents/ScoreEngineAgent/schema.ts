import { z } from 'zod'

import { countSentences } from '@/utils/sentences'

const CategoryScoresSchema = z.object({
  technicalSkills: z.number().int().min(0).max(100),
  experience:      z.number().int().min(0).max(100),
  presentation:    z.number().int().min(0).max(100),
  keywords:        z.number().int().min(0).max(100),
})

export const ScoreDataSchema = z.object({
  matchScore:     z.number().int().min(0).max(100),
  categoryScores: CategoryScoresSchema,
  notes: z.object({
    technicalSkills: z.string(),
    experience:      z.string(),
    presentation:    z.string(),
    keywords:        z.string(),
  }),
  verdict: z.string().min(1),
}).refine(
  (data) => {
    const n = countSentences(data.verdict)
    return n >= 2 && n <= 3
  },
  {
    message: 'verdict must be exactly 2 or 3 sentences',
    path:    ['verdict'],
  },
)

export type ScoreDataOutput = z.infer<typeof ScoreDataSchema>
