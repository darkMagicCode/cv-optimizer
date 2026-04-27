import fs   from 'fs'
import path from 'path'
import { logger } from '@/utils/logger'

export class MemoryManager {
  private memoryPath: string

  constructor(agentDir: string) {
    this.memoryPath = path.join(agentDir, 'MEMORY.md')
  }

  /** Read current MEMORY.md content — called fresh every pipeline run */
  read(): string {
    if (!fs.existsSync(this.memoryPath)) return ''
    return fs.readFileSync(this.memoryPath, 'utf-8').trim()
  }

  /**
   * Append a lesson learned after a failed + retried run.
   * Called by BaseAgent.recordLesson() when the orchestrator detects a failure.
   */
  appendLesson(lesson: string): void {
    const timestamp  = new Date().toISOString()
    const entry      = `\n- [${timestamp}] ${lesson}`
    const sectionTag = '## Lessons Learned'

    const current    = this.read()
    const hasSection = current.includes(sectionTag)

    try {
      if (hasSection) {
        const updated = current.replace(sectionTag, `${sectionTag}${entry}`)
        fs.writeFileSync(this.memoryPath, updated, 'utf-8')
      } else {
        fs.appendFileSync(this.memoryPath, `\n\n${sectionTag}${entry}`, 'utf-8')
      }
      logger.debug(`[MemoryManager] Lesson appended to ${this.memoryPath}`)
    } catch (err) {
      logger.error('[MemoryManager] Failed to write lesson', { err })
    }
  }

  /**
   * Append a session summary entry after a pipeline run completes.
   */
  writeSession(runId: string, summary: string): void {
    const timestamp  = new Date().toISOString()
    const entry      = `\n- [${timestamp}] Run ${runId}: ${summary}`
    const sectionTag = '## Session History'

    const current    = this.read()
    const hasSection = current.includes(sectionTag)

    try {
      if (hasSection) {
        const updated = current.replace(sectionTag, `${sectionTag}${entry}`)
        fs.writeFileSync(this.memoryPath, updated, 'utf-8')
      } else {
        fs.appendFileSync(this.memoryPath, `\n\n${sectionTag}${entry}`, 'utf-8')
      }
    } catch (err) {
      logger.error('[MemoryManager] Failed to write session', { err })
    }
  }
}
