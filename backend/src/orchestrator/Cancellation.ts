export class PipelineAbortedError extends Error {
  constructor(message = 'Pipeline run was aborted') {
    super(message)
    this.name = 'PipelineAbortedError'
  }
}

export function isAbortError(err: unknown): boolean {
  if (err instanceof PipelineAbortedError) return true
  if (err instanceof Error && err.name === 'AbortError') return true
  return false
}

export function throwIfAborted(signal: AbortSignal | undefined, reason: string): void {
  if (!signal?.aborted) return
  throw new PipelineAbortedError(reason)
}
