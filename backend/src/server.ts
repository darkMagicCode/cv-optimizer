import './config/env'                           // Validates env vars — exits if invalid
import express                from 'express'
import cors                   from 'cors'
import { env }                from './config/env'
import { connectMongoDB }     from './config/mongodb'
import { logger }             from './utils/logger'
import { apiRateLimiter }     from './middleware/rateLimiter'
import { requestLogger }      from './middleware/requestLogger'
import { errorHandler }       from './middleware/errorHandler'
import { analyzeRouter }      from './routes/analyze'

const app = express()

// ── Middleware ────────────────────────────────────────────────────────────────

// Railway runs behind a reverse proxy and forwards client IP headers.
app.set('trust proxy', 1)

app.use(cors({
  origin:      env.NODE_ENV === 'production' ? false : '*',
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)
app.use('/api', apiRateLimiter)

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    rag:    env.ENABLE_RAG ? 'enabled' : 'disabled',
  })
})

app.use('/api/analyze', analyzeRouter)

// ── 404 Handler ───────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Error Handler ─────────────────────────────────────────────────────────────

app.use(errorHandler)

// ── Startup ───────────────────────────────────────────────────────────────────

async function start() {
  try {
    await connectMongoDB()

    app.listen(env.PORT, () => {
      logger.info(`CV Optimizer Backend running on http://localhost:${env.PORT}`)
      logger.info(`Environment: ${env.NODE_ENV}`)
    })
  } catch (err) {
    logger.error('Failed to start server', { err })
    process.exit(1)
  }
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down')
  process.exit(0)
})

start()
