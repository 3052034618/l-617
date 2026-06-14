import { Router, type Request, type Response } from 'express'
import { persistentStore as store } from '../data/persistentStore.js'
import { approvalService } from '../services/ApprovalService.js'
import type { ApprovalRecord } from '../types/index.js'

const router = Router()

router.get('/pending', (req: Request, res: Response): void => {
  try {
    const { role } = req.query

    if (role === 'processor' || role === 'manager') {
      const pendingApprovals = approvalService.getPendingByRole(role)
      res.json({
        success: true,
        data: pendingApprovals,
      })
      return
    }

    const pendingApprovals = store.getPendingApprovals()
    res.json({
      success: true,
      data: pendingApprovals,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取待审批列表失败',
    })
  }
})

router.get('/history', (req: Request, res: Response): void => {
  try {
    const historyApprovals = approvalService.getApprovalHistory()
    res.json({
      success: true,
      data: historyApprovals,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取审批历史失败',
    })
  }
})

router.get('/chain/:taskId', (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params
    const chain = approvalService.getApprovalChain(taskId)
    res.json({
      success: true,
      data: chain,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取审批链路失败',
    })
  }
})

router.put('/:taskId/approve', (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params
    const { level, approver, comment } = req.body

    if (!level || (level !== 1 && level !== 2)) {
      res.status(400).json({
        success: false,
        error: '请提供有效的审批级别 (1 或 2)',
      })
      return
    }

    const result = approvalService.approve(
      taskId,
      level as 1 | 2,
      approver || '当前用户',
      comment || '',
    )

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.message,
      })
      return
    }

    res.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '审批操作失败',
    })
  }
})

router.put('/:taskId/reject', (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params
    const { level, approver, comment } = req.body

    if (!level || (level !== 1 && level !== 2)) {
      res.status(400).json({
        success: false,
        error: '请提供有效的审批级别 (1 或 2)',
      })
      return
    }

    const result = approvalService.reject(
      taskId,
      level as 1 | 2,
      approver || '当前用户',
      comment || '',
    )

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.message,
      })
      return
    }

    res.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '驳回操作失败',
    })
  }
})

router.post('/submit', (req: Request, res: Response): void => {
  try {
    const { taskId, level } = req.body

    if (!taskId) {
      res.status(400).json({
        success: false,
        error: '请提供任务ID',
      })
      return
    }

    const result = approvalService.submitForApproval(taskId, level || 1)

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.message,
      })
      return
    }

    res.status(201).json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '提交审批失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { taskId, taskName, applicant, level } = req.body
    const newApproval = store.addApproval({
      taskId,
      taskName,
      applicant: applicant || '当前用户',
      level: level || 1,
    })
    res.status(201).json({
      success: true,
      data: newApproval,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '提交审批申请失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { action, level, remark, approver } = req.body
    const approval = store.getApprovalById(id)

    if (!approval) {
      res.status(404).json({
        success: false,
        error: '审批记录不存在',
      })
      return
    }

    let result: ApprovalRecord | undefined

    if (action === 'approve') {
      if (level === 1) {
        const approveResult = store.approveFirstLevel(
          approval.taskId,
          approver || '当前用户',
          remark,
        )
        result = approveResult?.currentApproval
      } else if (level === 2) {
        result = store.approveSecondLevel(
          approval.taskId,
          approver || '当前用户',
          remark,
        )
      }
    } else if (action === 'reject') {
      result = store.rejectApproval(
        approval.taskId,
        level as 1 | 2,
        approver || '当前用户',
        remark,
      )
    }

    if (!result) {
      res.status(400).json({
        success: false,
        error: '审批操作失败，状态不支持此操作',
      })
      return
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '审批操作失败',
    })
  }
})

export default router
