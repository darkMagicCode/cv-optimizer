export type Priority = 'High' | 'Medium' | 'Low'

export interface PartialSkill {
  skill: string
  note: string
}

export interface MissingSection {
  section: string
  reason: string
}

export interface Recommendation {
  priority: Priority
  action: string
  detail: string
}

export interface CategoryScore {
  score: number
  note: string
}

export interface AnalysisResult {
  matchScore: number
  verdict: string
  categories: {
    technicalSkills: CategoryScore
    experience: CategoryScore
    presentation: CategoryScore
    keywords: CategoryScore
  }
  existingSkills: string[]
  missingSkills: string[]
  partialSkills: PartialSkill[]
  missingSections: MissingSection[]
  missingExperiences: string[]
  recommendations: Recommendation[]
}
