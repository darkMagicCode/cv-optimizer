import mongoose from 'mongoose'
import { env }    from './env'
import { logger } from '@/utils/logger'

export async function connectMongoDB(): Promise<void> {
  if (!env.ENABLE_RAG) {
    logger.info('RAG disabled — skipping MongoDB connection')
    return
  }

  if (!env.MONGODB_URI) {
    // Env validation should guarantee this when ENABLE_RAG is true
    throw new Error('MONGODB_URI is required when ENABLE_RAG is true')
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5_000,
    })
    logger.info('MongoDB connected')
  } catch (err) {
    logger.error('MongoDB connection failed', { err })
    throw err
  }
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect()
  logger.info('MongoDB disconnected')
}

mongoose.connection.on('error', err => {
  logger.error('MongoDB connection error', { err })
})

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — will attempt reconnect')
})
