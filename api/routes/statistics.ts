import { Router, type Request, type Response } from 'express'
import { persistentStore as store } from '../data/persistentStore.js'
import { formatDate, generateId, randomInRange } from '../utils/helpers.js'

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

router.get('/regions/:region', (req: Request, res: Response): void => {
  try {
    store.init()
    const { region } = req.params
    const regionStats = store.getRegionStats()
    const regionStat = regionStats.find((r) => r.region === region)

    if (!regionStat) {
      res.status(404).json({
        success: false,
        error: '区域不存在',
      })
      return
    }

    const pauseInfo = store.checkRegionPaused(region)

    const recentDeviations: Array<{
      date: string
      deviation: number
      taskId: string
      taskName: string
      type: string
    }> = []
    const now = new Date()

    const deviationTypes = ['反射率偏差', '辐射平衡偏差', '亮温偏差', '拟合残差超标', '气溶胶光学厚度偏差']
    const taskNames = [
      `${region}夏季气溶胶辐射传输模拟`,
      `${region}地表反射率反演`,
      `${region}热红外亮温模拟`,
      `${region}大雾天气辐射模拟`,
      `${region}下垫面反射率测量`,
    ]

    for (let i = 0; i < 5; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i - 1)
      recentDeviations.push({
        date: formatDate(date),
        deviation: Number(randomInRange(0.05, 0.15).toFixed(4)),
        taskId: generateId('task'),
        taskName: taskNames[i % taskNames.length],
        type: deviationTypes[i % deviationTypes.length],
      })
    }

    res.json({
      success: true,
      data: {
        ...regionStat,
        isPaused: pauseInfo.paused,
        pauseReason: pauseInfo.reason,
        recentDeviations,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取区域详情失败',
    })
  }
})

export default router
