import { Router, type Request, type Response } from 'express'
import { persistentStore as store } from '../data/persistentStore.js'

const router = Router()

router.get('/realtime', (req: Request, res: Response): void => {
  try {
    store.init()
    const { taskId } = req.query

    if (!taskId) {
      res.status(400).json({
        success: false,
        error: '缺少 taskId 参数',
      })
      return
    }

    const task = store.getTaskById(taskId as string)
    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      })
      return
    }

    const monitorData = store.generateMonitorData(taskId as string)

    if (task.status !== 'completed' && task.status !== 'failed' && task.status !== 'pending') {
      const newProgress = Math.min(99, task.progress + Math.floor(Math.random() * 3))
      store.updateTask(taskId as string, { progress: newProgress })
    }

    res.json({
      success: true,
      data: monitorData,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取实时监控数据失败',
    })
  }
})

router.get('/history', (req: Request, res: Response): void => {
  try {
    store.init()
    const { taskId, limit = '20' } = req.query

    if (!taskId) {
      res.status(400).json({
        success: false,
        error: '缺少 taskId 参数',
      })
      return
    }

    const task = store.getTaskById(taskId as string)
    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      })
      return
    }

    const count = parseInt(limit as string, 10)
    const historyData = store.generateMonitorHistory(taskId as string, count)

    res.json({
      success: true,
      data: historyData,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取历史监控数据失败',
    })
  }
})

export default router
