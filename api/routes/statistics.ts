import { Router, type Request, type Response } from 'express'
import { store } from '../data/store.js'

const router = Router()

router.get('/overview', (req: Request, res: Response): void => {
  try {
    const overview = store.getStatistics()
    res.json({
      success: true,
      data: overview,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取概览统计失败',
    })
  }
})

router.get('/completion-rate', (req: Request, res: Response): void => {
  try {
    const { days } = req.query
    const daysNum = days ? parseInt(days as string, 10) : 30
    const trend = store.getCompletionRateTrend(daysNum)
    res.json({
      success: true,
      data: trend,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取完成率趋势失败',
    })
  }
})

router.get('/accuracy', (req: Request, res: Response): void => {
  try {
    const { days } = req.query
    const daysNum = days ? parseInt(days as string, 10) : 30
    const trend = store.getAccuracyTrend(daysNum)
    res.json({
      success: true,
      data: trend,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取精度统计失败',
    })
  }
})

router.get('/resources', (req: Request, res: Response): void => {
  try {
    const { days } = req.query
    const daysNum = days ? parseInt(days as string, 10) : 30
    const trend = store.getResourceTrend(daysNum)
    res.json({
      success: true,
      data: {
        trend,
        breakdown: [
          { type: '计算资源', usage: 280.5, unit: 'CPU·h' },
          { type: '存储资源', usage: 156.2, unit: 'GB' },
          { type: '网络传输', usage: 22.1, unit: 'GB' },
        ],
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取资源消耗统计失败',
    })
  }
})

router.get('/regions', (req: Request, res: Response): void => {
  try {
    const regionStats = store.getRegionStats()
    res.json({
      success: true,
      data: regionStats,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取区域统计失败',
    })
  }
})

export default router
