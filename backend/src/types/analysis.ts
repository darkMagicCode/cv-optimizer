import type {
  CVProfile,
  RoleProfile,
  GapData,
  ScoreData,
  RecommendationsData,
  JudgeVerdict,
} from './agents'

// The final API response shape sent to the frontend
export interface AnalysisResult {
  runId:           string
  jobTitle:        string
  cvProfile:       CVProfile
  roleProfile:     RoleProfile
  gapData:         GapData
  scoreData:       ScoreData
  recommendations: RecommendationsData
  judgeVerdict:    JudgeVerdict
  durationMs:      number
}

export interface AnalysisError {
  error:   string
  runId?:  string
  details?: string
}
