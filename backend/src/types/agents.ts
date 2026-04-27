// ─── CV Profile (Aria's output) ───────────────────────────────────────────────

export interface ExperienceEntry {
  role:       string
  company:    string
  duration:   string
  highlights: string[]
}

export interface EducationEntry {
  degree:      string
  institution: string
  year:        string
}

export interface CVProfile {
  name:             string
  email:            string
  phone:            string
  location:         string
  summary:          string
  skills:           string[]
  experience:       ExperienceEntry[]
  education:        EducationEntry[]
  certifications:   string[]
  projects:         string[]
  languages:        string[]
  links:            { github?: string; linkedin?: string; portfolio?: string }
  sections:         string[]   // sections detected in the CV
  totalYearsExperience: number
}

// ─── Role Profile (Marcus's output) ──────────────────────────────────────────

export interface RoleProfile {
  jobTitle:             string
  seniority:            'junior' | 'mid' | 'senior' | 'principal'
  requiredSkills:       string[]
  niceToHaveSkills:     string[]
  requiredExperienceYears: number
  requiredSections:     string[]
  requiredExperiences:  string[]
  keywords:             string[]
  industryContext:      string
}

// ─── Gap Data (Nora's output) ─────────────────────────────────────────────────

export interface PartialSkillNote {
  skill: string
  note:  string    // specific description of what evidence is missing
}

export interface GapData {
  existingSkills:  string[]
  missingSkills:   string[]
  partialSkills:   PartialSkillNote[]
  missingSections: { section: string; reason: string }[]
  experienceGaps:  string[]
}

// ─── Score Data (Leo's output) ────────────────────────────────────────────────

export interface CategoryScores {
  technicalSkills: number   // 0–100
  experience:      number   // 0–100
  presentation:    number   // 0–100
  keywords:        number   // 0–100
}

export interface ScoreData {
  matchScore:      number           // 0–100 overall
  categoryScores:  CategoryScores
  notes:           Record<keyof CategoryScores, string>
  verdict:         string
}

// ─── Recommendations (Sage's output) ─────────────────────────────────────────

export type Priority = 'High' | 'Medium' | 'Low'

export interface Recommendation {
  priority: Priority
  action:   string   // short scannable action (< 10 words)
  detail:   string   // specific, actionable detail
  impact:   string   // expected effect on the match score
}

export interface RecommendationsData {
  recommendations: Recommendation[]
}

// ─── Judge Verdict (Vera's output) ───────────────────────────────────────────

export interface JudgeIssue {
  agent:       string
  check:       string
  description: string
}

export interface JudgeVerdict {
  score:        number        // 0–10
  passed:       boolean
  issues:       JudgeIssue[]
  rerunAgents:  string[]
  summary:      string
}

// ─── Validator Result ─────────────────────────────────────────────────────────

export interface ValidationResult {
  ok:     boolean
  reason: string
}
