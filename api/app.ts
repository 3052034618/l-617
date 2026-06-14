/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import monitorRoutes from './routes/monitor.js'
import alertRoutes from './routes/alerts.js'
import approvalRoutes from './routes/approvals.js'
import reportRoutes from './routes/reports.js'
import statisticsRoutes from './routes/statistics.js'
import recommendRoutes from './routes/recommend.js'
import { store } from './data/store.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * Data initialization middleware
 */
app.use((req: Request, res: Response, next: NextFunction): void => {
  store.init()
  next()
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/monitor', monitorRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/recommend', recommendRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
