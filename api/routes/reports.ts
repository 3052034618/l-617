import { Router, type Request, type Response } from 'express'
import { persistentStore as store } from '../data/persistentStore.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const reports = store.getReports()
    res.json({
      success: true,
      data: reports,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取报告列表失败',
    })
  }
})

router.get('/:taskId', (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params
    const report = store.getReportByTaskId(taskId)

    if (!report) {
      res.status(404).json({
        success: false,
        error: '报告不存在',
      })
      return
    }

    res.json({
      success: true,
      data: {
        ...report,
        sections: [
          { title: '模拟概况', content: '本次模拟基于6S辐射传输模型...' },
          { title: '光谱分析', content: '光谱曲线显示...' },
          { title: '精度评估', content: '整体精度达到94.8%...' },
          { title: '结论建议', content: '建议进一步优化气溶胶参数...' },
        ],
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取报告数据失败',
    })
  }
})

router.post('/:taskId/generate', (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params
    const { taskName, reportType, generatedBy } = req.body

    const existingReport = store.getReportByTaskId(taskId)
    if (existingReport) {
      res.json({
        success: true,
        data: existingReport,
      })
      return
    }

    const newReport = store.generateReport(
      taskId,
      taskName || `任务 ${taskId}`,
      reportType || 'full_report',
      generatedBy || '当前用户',
    )

    res.status(201).json({
      success: true,
      data: newReport,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '生成报告失败',
    })
  }
})

router.get('/:taskId/pdf', (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params
    const report = store.getReportByTaskId(taskId)

    if (!report) {
      res.status(404).json({
        success: false,
        error: '报告不存在',
      })
      return
    }

    res.json({
      success: true,
      data: {
        url: `/api/reports/${taskId}/pdf/download`,
        filename: `report_${taskId}.pdf`,
        size: 2048000,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取PDF下载链接失败',
    })
  }
})

router.post('/export', (req: Request, res: Response): void => {
  try {
    store.init()
    const {
      sensorType,
      observationGeometry,
      timeWindow,
      format,
      taskIds,
    } = req.body

    const reports = store.getReports()
    const tasks = store.tasks

    let filteredTasks = [...tasks]

    if (taskIds && taskIds.length > 0) {
      filteredTasks = filteredTasks.filter((t) => taskIds.includes(t.id))
    }

    if (timeWindow?.start) {
      filteredTasks = filteredTasks.filter(
        (t) => new Date(t.createdAt) >= new Date(timeWindow.start),
      )
    }
    if (timeWindow?.end) {
      filteredTasks = filteredTasks.filter(
        (t) => new Date(t.createdAt) <= new Date(timeWindow.end),
      )
    }

    const count = filteredTasks.length || reports.length
    const exportFormat = format || 'xlsx'
    const baseSize = count * 1024 * 50

    let sizeDescription = `共 ${count} 条记录`
    const descriptions: string[] = []

    if (sensorType) {
      descriptions.push(`传感器类型: ${sensorType}`)
    }
    if (observationGeometry) {
      descriptions.push(`观测几何: ${observationGeometry}`)
    }
    if (timeWindow?.start || timeWindow?.end) {
      const start = timeWindow.start || '不限'
      const end = timeWindow.end || '不限'
      descriptions.push(`时间范围: ${start} ~ ${end}`)
    }
    if (descriptions.length > 0) {
      sizeDescription += ` (${descriptions.join(', ')})`
    }

    const filename = `report_export_${Date.now()}.${exportFormat}`
    const downloadUrl = `/api/reports/export/${Date.now()}`

    res.json({
      success: true,
      data: {
        downloadUrl,
        filename,
        size: baseSize,
        count,
        description: sizeDescription,
        format: exportFormat,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '导出数据失败',
    })
  }
})

export default router
