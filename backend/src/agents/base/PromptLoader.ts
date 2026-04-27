import fs   from 'fs'
import path from 'path'
import { logger } from '@/utils/logger'

// Static files loaded once at agent startup and cached
const STATIC_FILES = [
  'IDENTITY.md',
  'SOUL.md',
  'GOALS.md',
  'CONSTRAINTS.md',
] as const

// Cache keyed by agent directory — survives the process lifetime
const cache = new Map<string, string>()

/**
 * Read all static definition files from the agent's folder and compile them
 * into a single system prompt string, separated by --- dividers.
 */
export function loadPrompt(agentDir: string): string {
  if (cache.has(agentDir)) return cache.get(agentDir)!

  const sections: string[] = []

  for (const file of STATIC_FILES) {
    const filePath = path.join(agentDir, file)
    if (!fs.existsSync(filePath)) {
      logger.warn(`[PromptLoader] Missing definition file: ${filePath}`)
      continue
    }

    const content     = fs.readFileSync(filePath, 'utf-8').trim()
    const sectionName = file.replace('.md', '')
    sections.push(`### ${sectionName}\n\n${content}`)
  }

  if (sections.length === 0) {
    throw new Error(`[PromptLoader] No definition files found in ${agentDir}`)
  }

  const compiled = sections.join('\n\n---\n\n')
  cache.set(agentDir, compiled)
  logger.debug(`[PromptLoader] Compiled prompt for ${path.basename(agentDir)} (${sections.length} sections)`)
  return compiled
}

/** Clear the prompt cache — useful in tests */
export function clearPromptCache(): void {
  cache.clear()
}
