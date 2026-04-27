import { useRef, useState } from 'react'

import { analyzeCV } from '@/services/api'
import type { AnalysisResult } from '@/types'
import { Header } from '@/components/Header'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { Sidebar } from '@/components/Sidebar'
import { UploadZone } from '@/components/UploadZone'

function App() {
  const [isLoading, setIsLoading]   = useState(false)
  const [analysis, setAnalysis]     = useState<AnalysisResult | null>(null)
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const resultsRef                  = useRef<HTMLDivElement>(null)

  async function handleAnalyze(file: File, jobTitle: string) {
    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const result = await analyzeCV(file, jobTitle)
      setAnalysis(result)
      setAnalyzedAt(new Date())
      // Scroll smoothly to results after paint
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setAnalysis(null)
    setAnalyzedAt(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="mx-auto w-full max-w-[1240px] space-y-6 p-4 md:p-6">

          {/* Upload + Job Title — always visible */}
          <UploadZone
            onAnalyze={handleAnalyze}
            onValidationError={setError}
            isLoading={isLoading}
          />

          {/* Error banner */}
          {error ? (
            <div
              className="rounded-xl border border-red-500/40 bg-red-950/35 px-4 py-3 text-sm text-red-300"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {/* Results — appear below upload section */}
          {analysis && analyzedAt ? (
            <div ref={resultsRef}>
              <ResultsDashboard
                analysis={analysis}
                analyzedAt={analyzedAt}
                onReset={handleReset}
              />
            </div>
          ) : null}

        </main>
      </div>
    </div>
  )
}

export default App
