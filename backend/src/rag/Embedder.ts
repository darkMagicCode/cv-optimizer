import { embed } from '@/config/openai'

/**
 * Embed a single text string.
 */
export async function embedText(text: string): Promise<number[]> {
  return embed(text)
}

/**
 * Embed multiple texts in sequence.
 * Adds a small delay between calls to avoid rate limiting.
 */
export async function embedBatch(texts: string[], delayMs = 200): Promise<number[][]> {
  const results: number[][] = []
  for (const text of texts) {
    results.push(await embed(text))
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
  }
  return results
}
