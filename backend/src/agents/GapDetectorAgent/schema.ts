import { z } from 'zod'

export const GapDataSchema = z.object({
  existingSkills:  z.array(z.string()),
  missingSkills:   z.array(z.string()),
  partialSkills:   z.array(z.object({
    skill: z.string(),
    note:  z.string(),
  })),
  missingSections: z.array(z.object({
    section: z.string(),
    reason:  z.string(),
  })),
  experienceGaps:  z.array(z.string()),
})

export type GapDataOutput = z.infer<typeof GapDataSchema>
