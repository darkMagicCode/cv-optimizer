import { z } from 'zod'

const ExperienceEntrySchema = z.object({
  role:       z.string(),
  company:    z.string(),
  duration:   z.string(),
  highlights: z.array(z.string()),
})

const EducationEntrySchema = z.object({
  degree:      z.string(),
  institution: z.string(),
  year:        z.string(),
})

export const CVProfileSchema = z.object({
  name:                 z.string(),
  email:                z.string(),
  phone:                z.string(),
  location:             z.string(),
  summary:              z.string(),
  skills:               z.array(z.string()),
  experience:           z.array(ExperienceEntrySchema),
  education:            z.array(EducationEntrySchema),
  certifications:       z.array(z.string()),
  projects:             z.array(z.string()),
  languages:            z.array(z.string()),
  links:                z.object({
    github:    z.string().optional(),
    linkedin:  z.string().optional(),
    portfolio: z.string().optional(),
  }),
  sections:             z.array(z.string()),
  totalYearsExperience: z.number().min(0),
})

export type CVProfileOutput = z.infer<typeof CVProfileSchema>
