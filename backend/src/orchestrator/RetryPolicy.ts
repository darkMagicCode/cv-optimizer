import { env }    from '@/config/env'
import { logger } from '@/utils/logger'
import type { PipelineState } from '@/types/pipeline'
import { PipelineAbortedError, isAbortError, throwIfAborted } from './Cancellation'

/**
 * Retry a pipeline step with exponential backoff.
 * On failure it appends to state.errors and re-throws after max attempts.
 */
export async function withRetry<T>(
  nodeName: string,
  fn:       () => Promise<T>,
  state:    PipelineState,
): Promise<T> {
  const maxAttempts = env.MAX_RETRIES
  const baseDelay   = env.RETRY_BASE_DELAY_MS

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      throwIfAborted(state.abortSignal, `[${nodeName}] canceled before attempt ${attempt}`)
      return await fn()
    } catch (err) {
      if (isAbortError(err) || state.abortSignal?.aborted) {
        throw new PipelineAbortedError(`[${nodeName}] canceled`)
      }

      const message = err instanceof Error ? err.message : String(err)

      state.errors.push({ node: nodeName, error: message, attempt })
      logger.warn(`[${nodeName}] Attempt ${attempt}/${maxAttempts} failed: ${message}`)

      if (attempt === maxAttempts) {
        logger.error(`[${nodeName}] Max retries reached`)
        throw new Error(`[${nodeName}] failed after ${maxAttempts} attempts: ${message}`)
      }

      const delay = baseDelay * Math.pow(2, attempt - 1)
      logger.debug(`[${nodeName}] Retrying in ${delay}ms`)
      await sleep(delay, state.abortSignal)
    }
  }

  // TypeScript needs this — unreachable in practice
  throw new Error(`[${nodeName}] Retry loop exited unexpectedly`)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new PipelineAbortedError('Retry backoff canceled'))
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      reject(new PipelineAbortedError('Retry backoff canceled'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
