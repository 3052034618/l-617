import { Router, type Request, type Response } from 'express'
import { store } from '../data/store.js'
import type { ApprovalRecord } from '../types/index.js'

const router = Router()

router.get('/pending', (req: Request, res: Response): void => {
  try {
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
    const historyApprovals = store.getApprovalHistory()
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
        result = store.approveFirstLevel(id, approver || '当前用户', remark)
      } else if (level === 2) {
        result = store.approveSecondLevel(id, approver || '当前用户', remark)
      }
    } else if (action === 'reject') {
      result = store.rejectApproval(id, approver || '当前用户', remark)
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

router.post('/', (req: Request, res: Response): void => {
  try {
    const { taskId, taskName, applicant, applicantId } = req.body
    const newApproval = store.addApproval({
      taskId,
      taskName,
      applicant: applicant || '当前用户',
      applicantId: applicantId || 'user_001',
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

export default router
