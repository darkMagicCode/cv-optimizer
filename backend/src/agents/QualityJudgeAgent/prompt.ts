import path         from 'path'
import { loadPrompt } from '@/agents/base/PromptLoader'

export function getPrompt(): string {
  return loadPrompt(path.join(__dirname))
}
