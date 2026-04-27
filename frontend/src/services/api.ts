import type { AnalysisResult } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// ── Backend response shape (matches backend/src/types/analysis.ts) ────────────

interface BackendResponse {
  runId:    string
  jobTitle: string
  scoreData: {
    matchScore:     number
    categoryScores: { technicalSkills: number; experience: number; presentation: number; keywords: number }
    notes:          { technicalSkills: string; experience: string; presentation: string; keywords: string }
    verdict:        string
  }
  gapData: {
    existingSkills:  string[]
    missingSkills:   string[]
    partialSkills:   { skill: string; note: string }[]
    missingSections: { section: string; reason: string }[]
    experienceGaps:  string[]
  }
  recommendations: {
    recommendations: { priority: 'High' | 'Medium' | 'Low'; action: string; detail: string; impact: string }[]
  }
}

/** Map the backend's nested response into the flat AnalysisResult the UI expects */
function mapResponse(raw: BackendResponse): AnalysisResult {
  const { scoreData, gapData, recommendations } = raw
  return {
    matchScore: scoreData.matchScore,
    verdict:    scoreData.verdict,
    categories: {
      technicalSkills: { score: scoreData.categoryScores.technicalSkills, note: scoreData.notes.technicalSkills },
      experience:      { score: scoreData.categoryScores.experience,      note: scoreData.notes.experience      },
      presentation:    { score: scoreData.categoryScores.presentation,    note: scoreData.notes.presentation    },
      keywords:        { score: scoreData.categoryScores.keywords,        note: scoreData.notes.keywords        },
    },
    existingSkills:     gapData.existingSkills,
    missingSkills:      gapData.missingSkills,
    partialSkills:      gapData.partialSkills,
    missingSections:    gapData.missingSections,
    missingExperiences: gapData.experienceGaps,
    recommendations:    recommendations.recommendations.map(r => ({
      priority: r.priority,
      action:   r.action,
      detail:   r.detail,
    })),
  }
}

export async function analyzeCV(file: File, jobTitle: string): Promise<AnalysisResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('jobTitle', jobTitle)

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    body:   form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  const raw = await res.json() as BackendResponse
  return mapResponse(raw)
}
