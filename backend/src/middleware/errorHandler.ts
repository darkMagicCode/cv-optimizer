import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger }   from '@/utils/logger'

export function errorHandler(
  err:  unknown,
  req:  Request,
  res:  Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    logger.warn('[errorHandler] Zod validation error', { path: req.path, issues: err.issues })
    res.status(400).json({ error: 'Validation error', details: err.issues })
    return
  }

  const message = err instanceof Error ? err.message : String(err)
  logger.error('[errorHandler]', { message, path: req.path })

  if (message.includes('failed after')) {
    res.status(502).json({ error: 'Analysis failed. Please try again.' })
    return
  }

  if (message.includes('MongoDB')) {
    res.status(503).json({ error: 'Service temporarily unavailable' })
    return
  }

  res.status(500).json({ error: 'Internal server error' })
}
