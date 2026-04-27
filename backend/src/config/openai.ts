import OpenAI from 'openai'
import { env }    from './env'
import { logger } from '@/utils/logger'

// Singleton OpenAI client
let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    logger.debug('OpenAI client initialised')
  }
  return _client
}

/**
 * Send a chat completion request to GPT-4o.
 * Returns the assistant message content as a string.
 */
export async function chat(
  systemPrompt: string,
  userMessage:  string,
  signal?: AbortSignal,
): Promise<string> {
  const client   = getOpenAIClient()
  const response = await client.chat.completions.create({
    model:    'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  },
    ],
    temperature:     0.2,
    response_format: { type: 'json_object' },
  }, { signal })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('GPT-4o returned empty content')
  return content
}

/**
 * Generate a text embedding using text-embedding-3-small.
 * Returns a 1536-dimension float array.
 */
export async function embed(text: string): Promise<number[]> {
  const client   = getOpenAIClient()
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8_000), // stay within token limit
  })
  return response.data[0]!.embedding
}
