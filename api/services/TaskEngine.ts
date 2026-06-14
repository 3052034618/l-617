import { persistentStore as store } from '../data/persistentStore.js'
import { generateId, randomInRange, generateSpectrumData, generateChannelData } from '../utils/helpers.js'
import type {
  SimulationTask,
  TaskStatus,
  SimulationResults,
  Alert,
  AlertLevel,
} from '../types/index.js'

interface StateConfig {
  duration: [number, number]
  progressRange: [number, number]
  nextState: TaskStatus
}

interface TaskState {
  currentTimeout: NodeJS.Timeout | null
  progressInterval: NodeJS.Timeout | null
  isPaused: boolean
  pausedAt: TaskStatus | null
  pausedProgress: number
}

class TaskEngine {
  private taskStates: Map<string, TaskState> = new Map()
  private stateConfigs: Record<TaskStatus, StateConfig> = {
    pending: {
      duration: [2000, 2000],
      progressRange: [0, 0],
      nextState: 'modeling',
    },
    modeling: {
      duration: [2000, 3000],
      progressRange: [0, 30],
      nextState: 'computing',
    },
    computing: {
      duration: [3000, 5000],
      progressRange: [30, 75],
      nextState: 'synthesizing',
    },
    synthesizing: {
      duration: [2000, 3000],
      progressRange: [75, 95],
      nextState: 'completed',
    },
    completed: {
      duration: [0, 0],
      progressRange: [100, 100],
      nextState: 'completed',
    },
    failed: {
      duration: [0, 0],
      progressRange: [0, 0],
      nextState: 'failed',
    },
    rollback: {
      duration: [0, 0],
      progressRange: [0, 0],
      nextState: 'rollback',
    },
  }

  constructor() {
    this.init()
  }

  init(): void {
    this.resumeRunningTasks()
  }

  private resumeRunningTasks(): void {
    const runningStatuses: TaskStatus[] = ['modeling', 'computing', 'synthesizing']
    const runningTasks = store.tasks.filter((t) => runningStatuses.includes(t.status))

    for (const task of runningTasks) {
      console.log(`[TaskEngine] 恢复任务: ${task.id} (${task.status})`)
      this.startTask(task.id)
    }
  }

  startTask(taskId: string): boolean {
    const task = store.getTaskById(taskId)
    if (!task) return false

    this.clearTaskState(taskId)

    const taskState: TaskState = {
      currentTimeout: null,
      progressInterval: null,
      isPaused: false,
      pausedAt: null,
      pausedProgress: 0,
    }

    this.taskStates.set(taskId, taskState)

    this.processState(taskId, task.status)

    return true
  }

  pauseTask(taskId: string): boolean {
    const taskState = this.taskStates.get(taskId)
    const task = store.getTaskById(taskId)

    if (!taskState || !task) return false

    taskState.isPaused = true
    taskState.pausedAt = task.status
    taskState.pausedProgress = task.progress

    if (taskState.currentTimeout) {
      clearTimeout(taskState.currentTimeout)
      taskState.currentTimeout = null
    }

    if (taskState.progressInterval) {
      clearInterval(taskState.progressInterval)
      taskState.progressInterval = null
    }

    return true
  }

  resumeTask(taskId: string): boolean {
    const taskState = this.taskStates.get(taskId)
    const task = store.getTaskById(taskId)

    if (!taskState || !task || !taskState.isPaused) return false

    taskState.isPaused = false

    if (taskState.pausedAt) {
      this.processState(taskId, taskState.pausedAt, taskState.pausedProgress)
    }

    return true
  }

  private clearTaskState(taskId: string): void {
    const taskState = this.taskStates.get(taskId)
    if (taskState) {
      if (taskState.currentTimeout) {
        clearTimeout(taskState.currentTimeout)
      }
      if (taskState.progressInterval) {
        clearInterval(taskState.progressInterval)
      }
    }
    this.taskStates.delete(taskId)
  }

  private processState(taskId: string, state: TaskStatus, startProgress?: number): void {
    const task = store.getTaskById(taskId)
    if (!task) return

    const taskState = this.taskStates.get(taskId)
    if (!taskState) return

    if (state === 'completed') {
      this.handleCompletion(taskId)
      return
    }

    if (state === 'rollback' || state === 'failed') {
      this.clearTaskState(taskId)
      return
    }

    const config = this.stateConfigs[state]
    if (!config) return

    store.updateTask(taskId, { status: state })

    const duration = randomInRange(config.duration[0], config.duration[1])
    const progressStart = startProgress ?? config.progressRange[0]
    const progressEnd = config.progressRange[1]

    this.startProgressUpdate(taskId, progressStart, progressEnd, duration)

    taskState.currentTimeout = setTimeout(() => {
      this.onStateComplete(taskId, state)
    }, duration)
  }

  private startProgressUpdate(
    taskId: string,
    startProgress: number,
    endProgress: number,
    duration: number,
  ): void {
    const taskState = this.taskStates.get(taskId)
    if (!taskState) return

    const progressStep = (endProgress - startProgress) / (duration / 100)
    let currentProgress = startProgress

    taskState.progressInterval = setInterval(() => {
      currentProgress += progressStep
      if (currentProgress >= endProgress) {
        currentProgress = endProgress
        if (taskState.progressInterval) {
          clearInterval(taskState.progressInterval)
          taskState.progressInterval = null
        }
      }
      store.updateTask(taskId, { progress: Math.floor(currentProgress) })
    }, 100)
  }

  private onStateComplete(taskId: string, currentState: TaskStatus): void {
    const task = store.getTaskById(taskId)
    const taskState = this.taskStates.get(taskId)

    if (!task || !taskState || taskState.isPaused) return

    const config = this.stateConfigs[currentState]
    if (!config) return

    if (currentState === 'computing') {
      const results = this.generateMockResults()
      store.updateTask(taskId, { results })

      if (Math.random() < 0.1) {
        this.handleFailure(taskId, '辐射传输计算异常：数值求解器收敛失败')
        return
      }

      const alert = this.checkForAlerts(taskId, results)
      if (alert) {
        store.alerts.unshift(alert)
        store.initStatistics()
      }
    }

    if (config.nextState === 'completed') {
      this.handleCompletion(taskId)
    } else {
      this.processState(taskId, config.nextState)
    }
  }

  private handleCompletion(taskId: string): void {
    const task = store.getTaskById(taskId)
    if (!task) return

    store.updateTask(taskId, {
      status: 'completed',
      progress: 100,
      approvalStatus: 'pending_first',
      computeDuration: Math.floor(randomInRange(120, 1800)),
      resourceUsage: Number(randomInRange(0.5, 8.0).toFixed(1)),
    })

    store.addApproval({
      taskId: task.id,
      taskName: task.name,
      applicant: task.createdBy,
    })

    this.clearTaskState(taskId)
  }

  private handleFailure(taskId: string, reason: string): void {
    const task = store.getTaskById(taskId)
    if (!task) return

    const taskState = this.taskStates.get(taskId)
    if (taskState?.progressInterval) {
      clearInterval(taskState.progressInterval)
    }

    store.updateTask(taskId, {
      status: 'rollback',
      failureReason: reason,
      alertLevel: 'level3',
    })

    const alert: Alert = {
      id: generateId('alert'),
      taskId: task.id,
      taskName: task.name,
      level: 'level3',
      type: 'radiation_balance',
      message: reason,
      deviation: 0,
      threshold: 0.005,
      createdAt: new Date().toISOString(),
      status: 'pending',
    }
    store.alerts.unshift(alert)
    store.initStatistics()

    this.clearTaskState(taskId)
  }

  private checkForAlerts(taskId: string, results: SimulationResults): Alert | null {
    const task = store.getTaskById(taskId)
    if (!task) return null

    const radiationBalanceThreshold = 0.005
    const fittingResidualThreshold = 0.015

    if (Math.abs(results.radiationBalance) > radiationBalanceThreshold) {
      const level: AlertLevel =
        Math.abs(results.radiationBalance) > radiationBalanceThreshold * 2 ? 'level2' : 'level1'

      return {
        id: generateId('alert'),
        taskId: task.id,
        taskName: task.name,
        level,
        type: 'radiation_balance',
        message: `辐射平衡偏差${(Math.abs(results.radiationBalance) * 100).toFixed(3)}%，超过阈值${(radiationBalanceThreshold * 100).toFixed(1)}%`,
        deviation: Math.abs(results.radiationBalance),
        threshold: radiationBalanceThreshold,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
    }

    if (results.fittingResidual > fittingResidualThreshold) {
      const level: AlertLevel =
        results.fittingResidual > fittingResidualThreshold * 2 ? 'level2' : 'level1'

      return {
        id: generateId('alert'),
        taskId: task.id,
        taskName: task.name,
        level,
        type: 'fitting_residual',
        message: `光谱拟合残差${results.fittingResidual.toFixed(4)}，超过阈值${fittingResidualThreshold}`,
        deviation: results.fittingResidual,
        threshold: fittingResidualThreshold,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
    }

    return null
  }

  private generateMockResults(): SimulationResults {
    return {
      transmittance: generateSpectrumData(100, 0.4, 2.5),
      reflectance: generateSpectrumData(100, 0.4, 2.5).map((d) => ({
        wavelength: d.wavelength,
        value: Number((d.value * 0.4).toFixed(4)),
      })),
      brightnessTemperature: generateChannelData(),
      radiationBalance: Number(randomInRange(-0.008, 0.008).toFixed(5)),
      fittingResidual: Number(randomInRange(0.008, 0.025).toFixed(4)),
      accuracy: Number(randomInRange(0.92, 0.98).toFixed(4)),
    }
  }

  getTaskStatus(taskId: string): {
    status: TaskStatus
    progress: number
    isPaused: boolean
    failureReason?: string
  } | null {
    const task = store.getTaskById(taskId)
    if (!task) return null

    const taskState = this.taskStates.get(taskId)

    return {
      status: task.status,
      progress: task.progress,
      isPaused: taskState?.isPaused ?? false,
      failureReason: task.failureReason,
    }
  }
}

export const taskEngine = new TaskEngine()
export default TaskEngine
