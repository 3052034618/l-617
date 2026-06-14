import { Router, type Request, type Response } from 'express'
import { persistentStore as store } from '../data/persistentStore.js'
import { taskEngine } from '../services/index.js'
import type { SimulationTask } from '../types/index.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    store.init()
    const { page = '1', pageSize = '10', status, search, region } = req.query
    const pageNum = parseInt(page as string, 10)
    const pageSizeNum = parseInt(pageSize as string, 10)

    let filtered = [...store.tasks]

    if (status) {
      filtered = filtered.filter(t => t.status === status)
    }
    if (region) {
      filtered = filtered.filter(t => t.region === region)
    }
    if (search) {
      const keyword = (search as string).toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(keyword) ||
        t.id.toLowerCase().includes(keyword)
      )
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
      error: '获取任务列表失败',
    })
  }
})

router.get('/check-region', (req: Request, res: Response): void => {
  try {
    store.init()
    const { region } = req.query
    if (!region) {
      res.status(400).json({
        success: false,
        error: '缺少 region 参数',
      })
      return
    }
    const result = store.checkRegionPaused(region as string)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '检查区域暂停状态失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    store.init()
    const task = store.getTaskById(req.params.id)
    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      })
      return
    }
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取任务详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    store.init()
    const {
      name,
      region,
      parameters,
      createdBy,
      userId,
      userName,
      profileFileId,
      surfaceFileId,
    } = req.body

    const newTask = store.addTask({
      name: name || '新建模拟任务',
      region: region || '默认区域',
      status: 'pending',
      progress: 0,
      createdBy: createdBy || '当前用户',
      userId: userId || 'user_001',
      userName: userName || '当前用户',
      parameters: parameters || {
        profileFile: 'default.dat',
        surfaceType: '植被',
        aerosolModel: '大陆型',
        wavelengthRange: [0.4, 2.5],
        spectralResolution: 0.01,
        observationAngle: 0,
      },
      approvalStatus: 'none',
      profileFileId,
      surfaceFileId,
    } as SimulationTask & { profileFileId?: string; surfaceFileId?: string })

    taskEngine.startTask(newTask.id)

    res.status(201).json({ success: true, data: newTask })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建任务失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    store.init()
    const updated = store.updateTask(req.params.id, req.body)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      })
      return
    }
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新任务失败',
    })
  }
})

router.put('/:id/restart', (req: Request, res: Response): void => {
  try {
    store.init()
    const task = store.restartTask(req.params.id)
    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      })
      return
    }
    taskEngine.startTask(task.id)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '重启任务失败',
    })
  }
})

router.get('/:id/status', (req: Request, res: Response): void => {
  try {
    store.init()
    const status = taskEngine.getTaskStatus(req.params.id)
    if (!status) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      })
      return
    }
    res.json({ success: true, data: status })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取任务状态失败',
    })
  }
})

router.put('/:id/pause', (req: Request, res: Response): void => {
  try {
    store.init()
    const success = taskEngine.pauseTask(req.params.id)
    if (!success) {
      res.status(404).json({
        success: false,
        error: '任务不存在或无法暂停',
      })
      return
    }
    const task = store.getTaskById(req.params.id)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '暂停任务失败',
    })
  }
})

router.put('/:id/resume', (req: Request, res: Response): void => {
  try {
    store.init()
    const success = taskEngine.resumeTask(req.params.id)
    if (!success) {
      res.status(404).json({
        success: false,
        error: '任务不存在或无法恢复',
      })
      return
    }
    const task = store.getTaskById(req.params.id)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '恢复任务失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    store.init()
    const success = store.deleteTask(req.params.id)
    if (!success) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      })
      return
    }
    res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除任务失败',
    })
  }
})

export default router
