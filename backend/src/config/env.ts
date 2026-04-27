import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  OPENAI_API_KEY:          z.string().min(1, 'OPENAI_API_KEY is required'),
  ENABLE_RAG:              z.coerce.boolean().default(true),
  // Required only when ENABLE_RAG=true — validated separately below
  MONGODB_URI:             z.string().optional(),
  PORT:                    z.coerce.number().default(3001),
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  JUDGE_QUALITY_THRESHOLD: z.coerce.number().min(0).max(10).default(7),
  MAX_RETRIES:             z.coerce.number().min(1).max(5).default(3),
  RETRY_BASE_DELAY_MS:     z.coerce.number().default(400),
  RATE_LIMIT_WINDOW_MS:    z.coerce.number().default(60_000),
  RATE_LIMIT_MAX:          z.coerce.number().default(20),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌  Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

// Cross-field: MONGODB_URI required only when RAG is enabled
if (parsed.data.ENABLE_RAG && !parsed.data.MONGODB_URI) {
  console.error('❌  MONGODB_URI is required when ENABLE_RAG=true')
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
