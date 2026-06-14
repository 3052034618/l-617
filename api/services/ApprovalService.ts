import type { SimulationTask, ApprovalRecord, ApprovalStatus } from '../types/index.js'
import { persistentStore as store } from '../data/persistentStore.js'
import { generateId, formatDate } from '../utils/helpers.js'

class ApprovalService {
  submitForApproval(taskId: string, level: 1 | 2 = 1): { success: boolean; message?: string; data?: ApprovalRecord } {
    const task = store.getTaskById(taskId)
    if (!task) {
      return { success: false, message: '任务不存在' }
    }

    const validTransitions: Record<ApprovalStatus, ApprovalStatus[]> = {
      none: ['pending_first'],
      pending_first: [],
      approved_first: ['pending_second'],
      pending_second: [],
      approved: [],
      published: [],
      rejected: ['pending_first', 'pending_second'],
    }

    const targetStatus: ApprovalStatus = level === 1 ? 'pending_first' : 'pending_second'
    const allowedTransitions = validTransitions[task.approvalStatus]

    if (!allowedTransitions.includes(targetStatus)) {
      return {
        success: false,
        message: `当前状态 ${task.approvalStatus} 无法提交到 ${targetStatus}`,
      }
    }

    const existingPending = store.approvals.find(
      (a) => a.taskId === taskId && a.level === level && a.status === 'pending',
    )
    if (existingPending) {
      return { success: false, message: '该级审批已存在待处理记录' }
    }

    const approvalRecord: ApprovalRecord = {
      id: generateId('appr'),
      taskId,
      taskName: task.name,
      level,
      approver: '',
      status: 'pending',
      comment: '',
      createdAt: formatDate(),
      applicant: task.createdBy,
      submittedAt: formatDate(),
    }

    store.approvals.unshift(approvalRecord)

    store.updateTask(taskId, {
      approvalStatus: targetStatus,
    })

    return { success: true, data: approvalRecord }
  }

  approve(
    taskId: string,
    level: 1 | 2,
    approver: string,
    comment: string = '',
  ): { success: boolean; message?: string; data?: { task?: SimulationTask; currentApproval?: ApprovalRecord; nextApproval?: ApprovalRecord } } {
    const task = store.getTaskById(taskId)
    if (!task) {
      return { success: false, message: '任务不存在' }
    }

    const expectedStatus: ApprovalStatus = level === 1 ? 'pending_first' : 'pending_second'
    if (task.approvalStatus !== expectedStatus) {
      return {
        success: false,
        message: `当前状态 ${task.approvalStatus} 不支持${level}级审批`,
      }
    }

    const pendingApproval = store.approvals.find(
      (a) => a.taskId === taskId && a.level === level && a.status === 'pending',
    )
    if (!pendingApproval) {
      return { success: false, message: '未找到待处理的审批记录' }
    }

    const now = formatDate()
    pendingApproval.status = 'approved'
    pendingApproval.approver = approver
    pendingApproval.comment = comment
    pendingApproval.approvedAt = now

    let nextApproval: ApprovalRecord | undefined

    if (level === 1) {
      store.updateTask(taskId, {
        approvalStatus: 'approved_first',
      })

      nextApproval = {
        id: generateId('appr'),
        taskId,
        taskName: task.name,
        level: 2,
        approver: '',
        status: 'pending',
        comment: '',
        createdAt: now,
        applicant: task.createdBy,
        submittedAt: now,
      }

      store.approvals.unshift(nextApproval)

      store.updateTask(taskId, {
        approvalStatus: 'pending_second',
      })
    } else {
      store.updateTask(taskId, {
        approvalStatus: 'published',
        publishedAt: now,
      })
    }

    const updatedTask = store.getTaskById(taskId)

    return {
      success: true,
      data: {
        task: updatedTask,
        currentApproval: pendingApproval,
        nextApproval,
      },
    }
  }

  reject(
    taskId: string,
    level: 1 | 2,
    approver: string,
    comment: string = '',
  ): { success: boolean; message?: string; data?: { task?: SimulationTask; approval?: ApprovalRecord } } {
    const task = store.getTaskById(taskId)
    if (!task) {
      return { success: false, message: '任务不存在' }
    }

    const expectedStatus: ApprovalStatus = level === 1 ? 'pending_first' : 'pending_second'
    if (task.approvalStatus !== expectedStatus) {
      return {
        success: false,
        message: `当前状态 ${task.approvalStatus} 不支持驳回`,
      }
    }

    const pendingApproval = store.approvals.find(
      (a) => a.taskId === taskId && a.level === level && a.status === 'pending',
    )
    if (!pendingApproval) {
      return { success: false, message: '未找到待处理的审批记录' }
    }

    const now = formatDate()
    pendingApproval.status = 'rejected'
    pendingApproval.approver = approver
    pendingApproval.comment = comment
    pendingApproval.approvedAt = now

    store.updateTask(taskId, {
      approvalStatus: 'rejected',
    })

    const updatedTask = store.getTaskById(taskId)

    return {
      success: true,
      data: {
        task: updatedTask,
        approval: pendingApproval,
      },
    }
  }

  getApprovalChain(taskId: string): ApprovalRecord[] {
    const chain = store.approvals
      .filter((a) => a.taskId === taskId)
      .sort((a, b) => {
        const levelOrder = a.level - b.level
        if (levelOrder !== 0) return levelOrder
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
    return chain
  }

  getPendingByRole(role: 'processor' | 'manager'): ApprovalRecord[] {
    const level: 1 | 2 = role === 'processor' ? 1 : 2
    return store.approvals.filter((a) => a.level === level && a.status === 'pending')
  }

  getApprovalHistory(): ApprovalRecord[] {
    return store.approvals
      .filter((a) => a.status !== 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
}

export const approvalService = new ApprovalService()
export default ApprovalService
