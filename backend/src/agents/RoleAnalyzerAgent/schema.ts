import { z } from 'zod'

export const RoleProfileSchema = z.object({
  jobTitle:                z.string(),
  seniority:               z.enum(['junior', 'mid', 'senior', 'principal']),
  requiredSkills:          z.array(z.string()).min(1),
  niceToHaveSkills:        z.array(z.string()),
  requiredExperienceYears: z.number().min(0),
  requiredSections:        z.array(z.string()),
  requiredExperiences:     z.array(z.string()),
  keywords:                z.array(z.string()),
  industryContext:         z.string(),
})

export type RoleProfileOutput = z.infer<typeof RoleProfileSchema>
