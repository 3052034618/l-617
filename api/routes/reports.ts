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
    const { format, taskIds } = req.body
    res.json({
      success: true,
      data: {
        downloadUrl: `/api/reports/export/${Date.now()}`,
        format: format || 'xlsx',
        count: taskIds?.length || store.getReports().length,
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
