import { Router, type Request, type Response } from 'express'
import { persistentStore as store } from '../data/persistentStore.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    store.init()
    const { level, status, type, page = '1', pageSize = '10' } = req.query
    const pageNum = parseInt(page as string, 10)
    const pageSizeNum = parseInt(pageSize as string, 10)

    let filtered = [...store.alerts]

    if (level) {
      filtered = filtered.filter(a => a.level === level)
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status)
    }
    if (type) {
      filtered = filtered.filter(a => a.type === type)
    }

    const total = filtered.length
    const start = (pageNum - 1) * pageSizeNum
    const list = filtered.slice(start, start + pageSizeNum)

    res.json({
      success: true,
      data: {
        list,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取预警列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    store.init()
    const alert = store.getAlertById(req.params.id)
    if (!alert) {
      res.status(404).json({
        success: false,
        error: '预警不存在',
      })
      return
    }
    res.json({ success: true, data: alert })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取预警详情失败',
    })
  }
})

router.put('/:id/review', (req: Request, res: Response): void => {
  try {
    store.init()
    const alert = store.getAlertById(req.params.id)
    if (!alert) {
      res.status(404).json({
        success: false,
        error: '预警不存在',
      })
      return
    }

    if (alert.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: '该预警状态不支持复核',
      })
      return
    }

    const { action, comment, adjustment, reviewedBy } = req.body

    if (!action || (action !== 'adjust' && action !== 'ignore')) {
      res.status(400).json({
        success: false,
        error: 'action 参数必须为 adjust 或 ignore',
      })
      return
    }

    let adjustmentLog = undefined
    let updatedTask = undefined

    if (action === 'adjust') {
      if (!adjustment || !adjustment.parameter) {
        res.status(400).json({
          success: false,
          error: 'adjust 操作必须提供 adjustment 参数',
        })
        return
      }

      adjustmentLog = store.addAdjustmentLog({
        alertId: alert.id,
        taskId: alert.taskId,
        parameter: adjustment.parameter,
        oldValue: adjustment.oldValue ?? 0,
        newValue: adjustment.newValue ?? 0,
        reason: adjustment.reason || comment || '参数调整',
        operator: reviewedBy || '当前用户',
      })

      const task = store.getTaskById(alert.taskId)
      if (task) {
        const paramUpdates: any = {}
        if (adjustment.parameter === 'aerosol_optical_depth') {
          paramUpdates.aerosolModel = adjustment.newValue
        } else if (adjustment.parameter === 'surface_emissivity') {
          paramUpdates.surfaceType = adjustment.newValue
        } else if (adjustment.parameter === 'observation_angle') {
          paramUpdates.observationAngle = adjustment.newValue
        } else if (adjustment.parameter === 'spectral_resolution') {
          paramUpdates.spectralResolution = adjustment.newValue
        }

        const updatedParameters = {
          ...task.parameters,
          ...paramUpdates,
        }

        const newResults = {
          ...task.results,
          accuracy: task.results
            ? Number((task.results.accuracy * 0.98 + 0.02).toFixed(4))
            : 0.95,
          fittingResidual: task.results
            ? Number((task.results.fittingResidual * 0.9).toFixed(4))
            : 0.01,
        }

        updatedTask = store.updateTask(alert.taskId, {
          parameters: updatedParameters,
          results: newResults,
        })
      }
    }

    const updatedAlert = store.updateAlert(req.params.id, {
      status: action === 'adjust' ? 'resolved' : 'reviewed',
      reviewedBy: reviewedBy || '当前用户',
      reviewComment: comment || (action === 'ignore' ? '已忽略' : '已调整'),
      adjustment: adjustmentLog,
    })

    res.json({
      success: true,
      data: {
        alert: updatedAlert,
        task: updatedTask,
        adjustmentLog,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '复核预警失败',
    })
  }
})

router.put('/:id/resolve', (req: Request, res: Response): void => {
  try {
    store.init()
    const alert = store.getAlertById(req.params.id)
    if (!alert) {
      res.status(404).json({
        success: false,
        error: '预警不存在',
      })
      return
    }

    const { adjustment, reviewedBy } = req.body

    const updates: any = {
      status: 'resolved',
    }

    if (!alert.reviewedBy) {
      updates.reviewedBy = reviewedBy || '当前用户'
    }
    if (adjustment) {
      updates.adjustment = adjustment
    }

    const updated = store.updateAlert(req.params.id, updates)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '标记解决失败',
    })
  }
})

export default router
