import { chat }        from '@/config/openai'
import { logger }      from '@/utils/logger'
import type { AgentNode }    from '@/orchestrator/AgentNode'
import type { PipelineState } from '@/types/pipeline'
import { loadPrompt }  from './PromptLoader'
import { MemoryManager } from './MemoryManager'

export abstract class BaseAgent implements AgentNode {
  abstract readonly name: string

  protected agentDir:   string
  protected basePrompt: string          // compiled from IDENTITY + SOUL + GOALS + CONSTRAINTS
  protected memory:     MemoryManager
  protected executionSignal?: AbortSignal

  constructor() {
    this.agentDir   = this.resolveDir()
    this.basePrompt = loadPrompt(this.agentDir)
    this.memory     = new MemoryManager(this.agentDir)
    logger.debug(`[${this.constructor.name}] Definition files loaded`)
  }

  /**
   * Each agent implements this to return __dirname of its own folder.
   * This allows PromptLoader to find the correct .md files.
   */
  protected abstract resolveDir(): string

  /** Core agent logic — must be implemented by every subclass */
  abstract run(state: PipelineState): Promise<PipelineState>

  setExecutionSignal(signal: AbortSignal | undefined): void {
    this.executionSignal = signal
  }

  /**
   * Wraps an OpenAI chat call with the agent's compiled system prompt.
   * Prepends MEMORY.md (fresh read) and appends OUTPUT_INSTRUCTIONS.
   */
  protected async chat(
    outputInstructions: string,
    userMessage:        string,
  ): Promise<string> {
    const memory      = this.memory.read()
    const memoryBlock = memory
      ? `### MEMORY\n\n${memory}\n\n---\n\n`
      : ''

    const systemPrompt = [
      this.basePrompt,
      memoryBlock,
      `### OUTPUT INSTRUCTIONS\n\n${outputInstructions}`,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n')

    logger.debug(`[${this.name}] Calling GPT-4o`)
    return chat(systemPrompt, userMessage, this.executionSignal)
  }

  /**
   * Called by the orchestrator when a validation failure or judge issue
   * is attributed to this agent — persists the lesson to MEMORY.md.
   */
  recordLesson(lesson: string): void {
    this.memory.appendLesson(lesson)
    logger.info(`[${this.name}] Lesson recorded: ${lesson}`)
  }
}
