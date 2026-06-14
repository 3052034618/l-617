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

    const { reviewComment, reviewedBy } = req.body
    const updated = store.updateAlert(req.params.id, {
      status: 'reviewed',
      reviewedBy: reviewedBy || '当前用户',
      reviewComment: reviewComment || '已复核',
    })

    res.json({ success: true, data: updated })
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
