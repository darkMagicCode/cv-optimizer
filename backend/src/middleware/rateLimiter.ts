import rateLimit from 'express-rate-limit'
import { env }   from '@/config/env'

export const apiRateLimiter = rateLimit({
  windowMs:         env.RATE_LIMIT_WINDOW_MS,
  max:              env.RATE_LIMIT_MAX,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests. Please try again later.' },
  skip: req => req.method === 'OPTIONS',
})
