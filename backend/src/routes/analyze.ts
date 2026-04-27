import { Router, type Request, type Response, type NextFunction } from 'express'
import multer                       from 'multer'
import { randomUUID }               from 'crypto'
import { extractText }              from '@/utils/fileParser'
import { PipelineOrchestrator }     from '@/orchestrator/PipelineOrchestrator'
import { createInitialState }       from '@/types/pipeline'
import { CVProfilerAgent }          from '@/agents/CVProfilerAgent'
import { RoleAnalyzerAgent }        from '@/agents/RoleAnalyzerAgent'
import { GapDetectorAgent }         from '@/agents/GapDetectorAgent'
import { ScoreEngineAgent }         from '@/agents/ScoreEngineAgent'
import { RecommenderAgent }         from '@/agents/RecommenderAgent'
import { ValidatorAgent }           from '@/agents/ValidatorAgent'
import { QualityJudgeAgent }        from '@/agents/QualityJudgeAgent'
import { getRoleContext, getSkillContext, getImprovementContext } from '@/rag/KnowledgeRetriever'
import { env }                    from '@/config/env'
import { logger }                 from '@/utils/logger'
import type { AnalysisResult }      from '@/types/analysis'
import { PipelineAbortedError, isAbortError, throwIfAborted } from '@/orchestrator/Cancellation'

export const analyzeRouter = Router()

// Multer — memory storage, 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Unsupported file type. Use PDF, DOCX, or TXT.'))
    }
  },
})

function uploadSingleFile(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err) => {
    if (!err) {
      next()
      return
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File is too large. Max size is 5MB.' })
      return
    }

    if (err instanceof Error && err.message.includes('Unsupported file type')) {
      res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' })
      return
    }

    next(err)
  })
}

analyzeRouter.post(
  '/',
  uploadSingleFile,
  async (req: Request, res: Response, next: NextFunction) => {
    const runId = randomUUID()
    const abortController = new AbortController()
    const abortRun = (reason: string) => {
      if (!abortController.signal.aborted) {
        abortController.abort(reason)
        logger.warn(`[/api/analyze] Run ${runId} canceled: ${reason}`)
      }
    }

    req.once('aborted', () => abortRun('request_aborted'))
    res.once('close', () => {
      if (!res.writableEnded) abortRun('request_closed')
    })

    try {
      // ── Validation ──────────────────────────────────────────────────────────

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded', runId })
        return
      }

      const jobTitle = (req.body.jobTitle as string | undefined)?.trim()
      if (!jobTitle) {
        res.status(400).json({ error: 'jobTitle is required', runId })
        return
      }

      logger.info(`[/api/analyze] New run ${runId} — "${jobTitle}"`)
      if (!env.ENABLE_RAG) {
        logger.info('[/api/analyze] RAG disabled — running pipeline without retrieval context')
      }

      // ── File Parsing ─────────────────────────────────────────────────────────

      const cvText = await extractText(req.file.buffer, req.file.mimetype)
      throwIfAborted(abortController.signal, `Run ${runId} aborted during file parsing`)

      if (!cvText) {
        res.status(400).json({ error: 'Could not extract text from file', runId })
        return
      }

      // ── RAG Context Prefetch ─────────────────────────────────────────────────
      // Kick off all three RAG queries in parallel before the pipeline starts

      const [roleContext, skillContext, improvementContext] = await Promise.all([
        getRoleContext(jobTitle),
        getSkillContext([]),                          // populated after Aria runs
        getImprovementContext([]),                    // populated after Nora runs
      ])
      throwIfAborted(abortController.signal, `Run ${runId} aborted during context prefetch`)

      // ── Pipeline Setup ────────────────────────────────────────────────────────

      const state = createInitialState({ cvText, jobTitle, runId })
      state.abortSignal = abortController.signal

      // Pre-seed RAG context for agents that use it at run time
      state.ragContext['RoleAnalyzerAgent']  = roleContext
      state.ragContext['GapDetectorAgent']   = skillContext
      state.ragContext['RecommenderAgent']   = improvementContext

      const orchestrator = new PipelineOrchestrator()
        .setValidator(new ValidatorAgent())
        .setJudge(new QualityJudgeAgent())
        .use(new CVProfilerAgent())
        .use(new RoleAnalyzerAgent())
        .use(new GapDetectorAgent())
        .use(new ScoreEngineAgent())
        .use(new RecommenderAgent())

      // ── Run Pipeline ──────────────────────────────────────────────────────────

      const finalState = await orchestrator.run(state)
      throwIfAborted(abortController.signal, `Run ${runId} aborted after orchestration`)

      // ── Post-pipeline RAG enrichment ──────────────────────────────────────────
      // Re-fetch skill context with actual skills from Aria's output for re-runs

      if (finalState.cvProfile) {
        const enrichedSkillContext = await getSkillContext(finalState.cvProfile.skills)
        throwIfAborted(abortController.signal, `Run ${runId} aborted during enrichment`)
        if (enrichedSkillContext && finalState.ragContext['GapDetectorAgent'] === '') {
          finalState.ragContext['GapDetectorAgent'] = enrichedSkillContext
        }
      }

      // ── Response ──────────────────────────────────────────────────────────────

      if (
        !finalState.cvProfile      ||
        !finalState.roleProfile    ||
        !finalState.gapData        ||
        !finalState.scoreData      ||
        !finalState.recommendations ||
        !finalState.judgeVerdict
      ) {
        logger.error(`[/api/analyze] Run ${runId} — pipeline incomplete`)
        res.status(502).json({ error: 'Analysis incomplete. Please try again.', runId })
        return
      }

      const result: AnalysisResult = {
        runId,
        jobTitle,
        cvProfile:       finalState.cvProfile,
        roleProfile:     finalState.roleProfile,
        gapData:         finalState.gapData,
        scoreData:       finalState.scoreData,
        recommendations: finalState.recommendations,
        judgeVerdict:    finalState.judgeVerdict,
        durationMs:      Date.now() - finalState.startedAt,
      }

      logger.info(`[/api/analyze] Run ${runId} complete — score ${result.scoreData.matchScore}/100 in ${result.durationMs}ms`)
      res.status(200).json(result)
    } catch (err) {
      if (isAbortError(err) || abortController.signal.aborted) {
        if (!res.headersSent) {
          res.status(499).json({ error: 'Client closed request', runId })
        }
        return
      }

      if (err instanceof PipelineAbortedError) {
        if (!res.headersSent) {
          res.status(499).json({ error: err.message, runId })
        }
        return
      }

      next(err)
    }
  },
)
