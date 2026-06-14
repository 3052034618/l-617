import type {
  SimulationTask,
  Alert,
  ApprovalRecord,
  StatisticsOverview,
  TrendData,
  Recommendation,
  RegionStatus,
  Report,
  MonitorData,
  SpectrumData,
  TaskStatus,
} from '../types/index.js'
import {
  generateId,
  formatDate,
  randomIntInRange,
  randomInRange,
  generateSpectrumData,
} from '../utils/helpers.js'

export { generateId }

class DataStore {
  tasks: SimulationTask[] = []
  alerts: Alert[] = []
  approvals: ApprovalRecord[] = []
  reports: Report[] = []
  recommendBands: Recommendation[] = []
  recommendParameters: Recommendation[] = []
  recommendHistory: Recommendation[] = []
  statisticsOverview: StatisticsOverview = {
    totalTasks: 0,
    completedTasks: 0,
    runningTasks: 0,
    pendingTasks: 0,
    successRate: 0,
    avgAccuracy: 0,
    totalResourceUsage: 0,
    alertCount: 0,
  }
  completionRateTrend: TrendData[] = []
  accuracyTrend: TrendData[] = []
  resourceTrend: TrendData[] = []
  regionStats: RegionStatus[] = []

  private initialized = false

  init(): void {
    if (this.initialized) return

    this.initTasks()
    this.initAlerts()
    this.initApprovals()
    this.initReports()
    this.initRecommendations()
    this.initStatistics()
    this.initTrends()
    this.initRegionStats()

    this.initialized = true
  }

  private initTasks(): void {
    const statuses: TaskStatus[] = [
      'completed',
      'computing',
      'modeling',
      'completed',
      'synthesizing',
      'pending',
      'failed',
      'completed',
      'rollback',
      'completed',
      'computing',
      'pending',
    ]

    const taskNames = [
      '华北平原夏季气溶胶辐射传输模拟',
      '长江三角洲地表反射率反演',
      '珠江三角洲热红外亮温模拟',
      '四川盆地大雾天气辐射模拟',
      '西北戈壁沙漠下垫面反射率测量',
      '青藏高原大气垂直廓线分析',
      '东北地区冰雪覆盖地表辐射特性',
      '南海海域海洋气溶胶光学厚度反演',
      '东部沿海城市空气污染遥感监测',
      '黄土高原植被覆盖区光谱响应模拟',
      '云贵高原喀斯特地貌辐射传输',
      '塔里木盆地沙尘天气模拟',
    ]

    const regionNames = [
      '华北平原',
      '长江三角洲',
      '珠江三角洲',
      '四川盆地',
      '西北戈壁',
      '青藏高原',
      '东北地区',
      '南海海域',
    ]
    const surfaceTypes = ['植被', '水体', '沙漠', '城市', '冰雪', '农田']
    const aerosolModels = ['大陆型', '海洋型', '城市型', '沙尘型', '生物质燃烧型']
    const creators = ['张科学家', '李研究员', '王工程师', '陈教授', '刘博士']

    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const status = statuses[i % statuses.length]
      const isCompleted = status === 'completed'
      const createdAt = new Date(now)
      createdAt.setDate(createdAt.getDate() - Math.floor(i / 2))

      const progress =
        status === 'pending'
          ? 0
          : status === 'modeling'
            ? Math.floor(randomInRange(10, 40))
            : status === 'computing'
              ? Math.floor(randomInRange(40, 80))
              : status === 'synthesizing'
                ? Math.floor(randomInRange(80, 95))
                : isCompleted
                  ? 100
                  : status === 'failed'
                    ? Math.floor(randomInRange(30, 70))
                    : Math.floor(randomInRange(20, 50))

      const approvalStatus: SimulationTask['approvalStatus'] = isCompleted
        ? i % 3 === 0
          ? 'approved'
          : i % 3 === 1
            ? 'pending_first'
            : 'pending_second'
        : 'none'

      const alertLevel =
        i % 5 === 0 ? ('level2' as const) : i % 7 === 0 ? ('level1' as const) : null

      const updatedAt = new Date(createdAt)
      updatedAt.setHours(updatedAt.getHours() + randomIntInRange(1, 48))

      const task: SimulationTask = {
        id: generateId('task'),
        name: taskNames[i % taskNames.length],
        region: regionNames[i % regionNames.length],
        status,
        progress,
        createdAt: formatDate(createdAt),
        updatedAt: formatDate(updatedAt),
        createdBy: creators[i % creators.length],
        parameters: {
          profileFile: `profile_${i + 1}.dat`,
          surfaceType: surfaceTypes[i % surfaceTypes.length],
          aerosolModel: aerosolModels[i % aerosolModels.length],
          wavelengthRange: [0.4, 2.5],
          spectralResolution: 0.01,
          observationAngle: Math.floor(randomInRange(0, 60)),
        },
        approvalStatus,
        alertLevel,
        computeDuration: isCompleted ? Math.floor(randomInRange(120, 1800)) : undefined,
        resourceUsage: isCompleted ? Number(randomInRange(0.5, 8.0).toFixed(1)) : undefined,
      }

      if (isCompleted || status === 'failed' || status === 'rollback') {
        task.results = this.generateMockResults()
      }

      this.tasks.push(task)
    }

    this.tasks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  private generateMockResults() {
    return {
      transmittance: generateSpectrumData(100, 0.4, 2.5),
      reflectance: generateSpectrumData(100, 0.4, 2.5).map((d) => ({
        wavelength: d.wavelength,
        value: Number((d.value * 0.4).toFixed(4)),
      })),
      brightnessTemperature: [
        { channel: 'VIS_01', wavelength: 0.55, value: randomInRange(0.1, 0.9) },
        { channel: 'VIS_02', wavelength: 0.66, value: randomInRange(0.1, 0.9) },
        { channel: 'NIR_01', wavelength: 0.86, value: randomInRange(0.1, 0.9) },
        { channel: 'NIR_02', wavelength: 1.24, value: randomInRange(0.1, 0.9) },
        { channel: 'SWIR_01', wavelength: 1.64, value: randomInRange(0.1, 0.9) },
        { channel: 'SWIR_02', wavelength: 2.25, value: randomInRange(0.1, 0.9) },
        { channel: 'TIR_01', wavelength: 10.8, value: randomInRange(250, 310) },
        { channel: 'TIR_02', wavelength: 12.0, value: randomInRange(250, 310) },
      ],
      radiationBalance: Number(randomInRange(-0.003, 0.003).toFixed(5)),
      fittingResidual: Number(randomInRange(0.008, 0.02).toFixed(4)),
      accuracy: Number(randomInRange(0.92, 0.98).toFixed(4)),
    }
  }

  private initAlerts(): void {
    const types: Alert['type'][] = [
      'radiation_balance',
      'fitting_residual',
      'region_deviation',
    ]
    const levels: Alert['level'][] = ['level1', 'level2', 'level3']
    const statuses: Alert['status'][] = ['pending', 'pending', 'reviewed', 'resolved']

    const alertMessages = {
      radiation_balance: [
        '辐射平衡偏差超过阈值，需检查大气廓线输入数据',
        '辐射平衡计算出现系统性偏差，建议复核气溶胶光学厚度参数',
        '短波与长波辐射不平衡，可能存在水汽吸收计算误差',
      ],
      fitting_residual: [
        '光谱拟合残差偏高，建议增加光谱分辨率',
        '拟合残差超过阈值，需调整气溶胶粒子谱分布',
        '热红外通道拟合残差异常，检查发射率参数设置',
      ],
      region_deviation: [
        '该区域连续三次模拟反射率偏差超过5%，已触发区域预警',
        '区域模拟结果波动较大，建议核查下垫面类型数据',
      ],
    }

    const taskNames = [
      '华北平原夏季气溶胶辐射传输模拟',
      '长江三角洲地表反射率反演',
      '珠江三角洲热红外亮温模拟',
      '四川盆地大雾天气辐射模拟',
      '西北戈壁沙漠下垫面反射率测量',
      '青藏高原大气垂直廓线分析',
      '东北地区冰雪覆盖地表辐射特性',
      '南海海域海洋气溶胶光学厚度反演',
    ]

    const creators = ['张科学家', '李研究员', '王工程师', '陈教授', '刘博士']

    for (let i = 0; i < 8; i++) {
      const type = types[i % types.length]
      const level = levels[i % levels.length]
      const status = statuses[i % statuses.length]
      const threshold =
        type === 'radiation_balance'
          ? 0.005
          : type === 'fitting_residual'
            ? 0.015
            : 0.05
      const deviation = threshold * randomInRange(1.1, 2.0)

      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - i)

      this.alerts.push({
        id: generateId('alert'),
        taskId: generateId('task'),
        taskName: taskNames[i % taskNames.length],
        level,
        type,
        message: alertMessages[type][i % alertMessages[type].length],
        deviation: Number(deviation.toFixed(5)),
        threshold,
        createdAt: formatDate(createdAt),
        status,
        reviewedBy: status !== 'pending' ? creators[i % creators.length] : undefined,
        reviewComment: status !== 'pending' ? '已复核，调整参数后重新计算' : undefined,
        adjustment:
          status === 'resolved'
            ? {
                id: generateId('adj'),
                alertId: generateId('alert'),
                taskId: generateId('task'),
                parameter:
                  type === 'radiation_balance'
                    ? 'aerosol_optical_depth'
                    : 'surface_emissivity',
                oldValue: Number(randomInRange(0.2, 0.5).toFixed(3)),
                newValue: Number(randomInRange(0.2, 0.5).toFixed(3)),
                reason: '降低系统偏差',
                operator: creators[i % creators.length],
                createdAt: formatDate(createdAt),
              }
            : undefined,
      })
    }

    this.alerts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  private initApprovals(): void {
    const statuses: ApprovalRecord['status'][] = [
      'pending',
      'approved',
      'pending',
      'approved',
      'rejected',
    ]

    const now = new Date()

    for (let i = 0; i < 5; i++) {
      const task = this.tasks[i]
      const createdAt = new Date(now)
      createdAt.setDate(createdAt.getDate() - (i + 2))

      this.approvals.push({
        id: generateId('appr'),
        taskId: task.id,
        taskName: task.name,
        level: (i % 2 === 0 ? 1 : 2) as 1 | 2,
        approver: i % 2 === 0 ? '数据处理员王工' : '项目负责人李总',
        status: statuses[i],
        comment:
          statuses[i] === 'approved'
            ? '数据完整，同意执行'
            : statuses[i] === 'rejected'
              ? '参数设置不合理，请重新提交'
              : '',
        createdAt: formatDate(createdAt),
      })
    }
  }

  private initReports(): void {
    const now = new Date()
    for (let i = 0; i < 5; i++) {
      const task = this.tasks[i]
      const generatedAt = new Date(now)
      generatedAt.setDate(generatedAt.getDate() - i)

      this.reports.push({
        id: generateId('report'),
        taskId: task.id,
        taskName: task.name,
        reportType: 'full_report',
        generatedAt: formatDate(generatedAt),
        generatedBy: '张科学家',
        status: i === 2 ? 'generating' : i === 4 ? 'failed' : 'generated',
      })
    }
  }

  private initRecommendations(): void {
    const bandTitles = [
      '建议增加近红外波段观测',
      '热红外波段分辨率优化建议',
      '可见光波段选择推荐',
    ]
    const paramTitles = [
      '气溶胶模型参数优化建议',
      '地表反射率参数调整方案',
      '大气廓线参数推荐配置',
    ]

    for (let i = 0; i < 3; i++) {
      this.recommendBands.push({
        id: generateId('rec'),
        type: 'bands',
        title: bandTitles[i],
        description: `基于历史数据分析，${bandTitles[i]}可提升反演精度约${5 + i * 2}%`,
        confidence: Number((0.85 + i * 0.05).toFixed(2)),
        details: { bands: ['NIR_03', 'SWIR_03'], improvement: `${5 + i * 2}%` },
      })

      this.recommendParameters.push({
        id: generateId('rec'),
        type: 'parameters',
        title: paramTitles[i],
        description: paramTitles[i],
        confidence: Number((0.78 + i * 0.06).toFixed(2)),
        details: { parameter: paramTitles[i], recommendedValue: 0.5 + i * 0.1 },
      })

      this.recommendHistory.push({
        id: generateId('rec'),
        type: i % 2 === 0 ? 'bands' : 'parameters',
        title: `历史推荐 ${i + 1}`,
        description: '已采纳的历史推荐方案',
        confidence: Number((0.8 + i * 0.05).toFixed(2)),
        details: { adopted: true, effect: 'positive' },
      })
    }
  }

  private initStatistics(): void {
    const runningStatuses: TaskStatus[] = ['modeling', 'computing', 'synthesizing']
    const completedTasks = this.tasks.filter((t) => t.status === 'completed').length
    const totalTasks = this.tasks.length

    this.statisticsOverview = {
      totalTasks,
      completedTasks,
      runningTasks: this.tasks.filter((t) => runningStatuses.includes(t.status)).length,
      pendingTasks: this.tasks.filter((t) => t.status === 'pending').length,
      successRate:
        totalTasks > 0
          ? Number(((completedTasks / totalTasks) * 100).toFixed(1))
          : 0,
      avgAccuracy: 94.5,
      totalResourceUsage: 1256.8,
      alertCount: this.alerts.filter((a) => a.status === 'pending').length,
    }
  }

  private initTrends(): void {
    const days = 7
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      this.completionRateTrend.push({
        date: dateStr,
        value: Number(randomInRange(75, 95).toFixed(1)),
      })

      this.accuracyTrend.push({
        date: dateStr,
        value: Number(randomInRange(90, 98).toFixed(2)),
      })

      this.resourceTrend.push({
        date: dateStr,
        value: Number(randomInRange(80, 150).toFixed(1)),
      })
    }
  }

  private initRegionStats(): void {
    const regionNames = ['华北平原', '长江三角洲', '珠江三角洲', '四川盆地', '西北戈壁']
    for (let i = 0; i < 5; i++) {
      this.regionStats.push({
        region: regionNames[i],
        taskCount: Math.floor(randomInRange(10, 50)),
        avgDeviation: Number(randomInRange(0.02, 0.08).toFixed(3)),
        isPaused: i === 3,
        lastSimulationAt: formatDate(new Date(Date.now() - i * 86400000)),
      })
    }
  }

  addTask(task: Partial<SimulationTask>): SimulationTask {
    const now = formatDate()
    const newTask: SimulationTask = {
      id: generateId('task'),
      name: task.name || '新建模拟任务',
      region: task.region || '默认区域',
      status: 'pending',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: task.createdBy || '当前用户',
      parameters: task.parameters || {
        profileFile: 'default.dat',
        surfaceType: '植被',
        aerosolModel: '大陆型',
        wavelengthRange: [0.4, 2.5],
        spectralResolution: 0.01,
        observationAngle: 0,
      },
      approvalStatus: 'none',
    }
    this.tasks.unshift(newTask)
    this.initStatistics()
    return newTask
  }

  getTaskById(id: string): SimulationTask | undefined {
    return this.tasks.find((t) => t.id === id)
  }

  updateTask(id: string, updates: Partial<SimulationTask>): SimulationTask | undefined {
    const index = this.tasks.findIndex((t) => t.id === id)
    if (index === -1) return undefined

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updatedAt: formatDate(),
    }
    this.initStatistics()
    return this.tasks[index]
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex((t) => t.id === id)
    if (index === -1) return false
    this.tasks.splice(index, 1)
    this.initStatistics()
    return true
  }

  restartTask(id: string): SimulationTask | undefined {
    const task = this.getTaskById(id)
    if (!task) return undefined

    task.status = 'pending'
    task.progress = 0
    task.updatedAt = formatDate()
    task.results = undefined
    this.initStatistics()
    return task
  }

  getAlertById(id: string): Alert | undefined {
    return this.alerts.find((a) => a.id === id)
  }

  updateAlert(id: string, updates: Partial<Alert>): Alert | undefined {
    const index = this.alerts.findIndex((a) => a.id === id)
    if (index === -1) return undefined

    this.alerts[index] = {
      ...this.alerts[index],
      ...updates,
    }
    this.initStatistics()
    return this.alerts[index]
  }

  generateMonitorData(taskId: string): MonitorData {
    const task = this.getTaskById(taskId)
    const progress = task ? task.progress : Math.floor(Math.random() * 100)

    const transmittance = generateSpectrumData(100, 0.4, 2.5)
    const reflectance = transmittance.map((d) => ({
      wavelength: d.wavelength,
      value: Number((d.value * 0.4).toFixed(4)),
    }))

    const brightnessTemp = [
      { channel: 'VIS_01', wavelength: 0.55, value: randomInRange(0.1, 0.9) },
      { channel: 'VIS_02', wavelength: 0.66, value: randomInRange(0.1, 0.9) },
      { channel: 'NIR_01', wavelength: 0.86, value: randomInRange(0.1, 0.9) },
      { channel: 'NIR_02', wavelength: 1.24, value: randomInRange(0.1, 0.9) },
      { channel: 'SWIR_01', wavelength: 1.64, value: randomInRange(0.1, 0.9) },
      { channel: 'SWIR_02', wavelength: 2.25, value: randomInRange(0.1, 0.9) },
      { channel: 'TIR_01', wavelength: 10.8, value: randomInRange(250, 310) },
      { channel: 'TIR_02', wavelength: 12.0, value: randomInRange(250, 310) },
    ]

    return {
      timestamp: formatDate(),
      taskId,
      transmittance,
      reflectance,
      brightnessTemp,
      radiationBalance: Number(randomInRange(-0.003, 0.003).toFixed(5)),
      fittingResidual: Number(randomInRange(0.008, 0.02).toFixed(4)),
      progress,
    }
  }

  generateMonitorHistory(taskId: string, count: number = 20): MonitorData[] {
    const data: MonitorData[] = []
    const now = Date.now()

    for (let i = count - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * 60000)
      const progress = Math.min(100, Math.floor((count - i) * (100 / count)))

      const transmittance = generateSpectrumData(50, 0.4, 2.5)
      const reflectance = transmittance.map((d) => ({
        wavelength: d.wavelength,
        value: Number((d.value * 0.4).toFixed(4)),
      }))

      data.push({
        timestamp: formatDate(timestamp),
        taskId,
        transmittance,
        reflectance,
        brightnessTemp: [
          { channel: 'TIR_01', wavelength: 10.8, value: randomInRange(250, 310) },
          { channel: 'TIR_02', wavelength: 12.0, value: randomInRange(250, 310) },
        ],
        radiationBalance: Number(randomInRange(-0.003, 0.003).toFixed(5)),
        fittingResidual: Number(randomInRange(0.008, 0.02).toFixed(4)),
        progress,
      })
    }

    return data
  }

  getPendingApprovals(): ApprovalRecord[] {
    return this.approvals.filter((a) => a.status === 'pending')
  }

  getApprovalHistory(): ApprovalRecord[] {
    return this.approvals.filter((a) => a.status !== 'pending')
  }

  getApprovalById(id: string): ApprovalRecord | undefined {
    return this.approvals.find((a) => a.id === id)
  }

  addApproval(approval: {
    taskId: string
    taskName: string
    applicant?: string
    applicantId?: string
  }): ApprovalRecord {
    const newApproval: ApprovalRecord = {
      id: generateId('appr'),
      taskId: approval.taskId,
      taskName: approval.taskName,
      level: 1,
      approver: '数据处理员王工',
      status: 'pending',
      comment: '',
      createdAt: formatDate(),
    }
    this.approvals.unshift(newApproval)
    return newApproval
  }

  approveFirstLevel(
    id: string,
    approver: string,
    remark?: string,
  ): ApprovalRecord | undefined {
    const approval = this.approvals.find((a) => a.id === id)
    if (!approval || approval.status !== 'pending') return undefined

    approval.status = 'approved'
    approval.approver = approver
    if (remark) approval.comment = remark
    return approval
  }

  approveSecondLevel(
    id: string,
    approver: string,
    remark?: string,
  ): ApprovalRecord | undefined {
    const approval = this.approvals.find((a) => a.id === id)
    if (!approval || approval.status !== 'pending') return undefined

    approval.status = 'approved'
    approval.approver = approver
    if (remark) approval.comment = remark
    return approval
  }

  rejectApproval(
    id: string,
    approver: string,
    remark?: string,
  ): ApprovalRecord | undefined {
    const approval = this.approvals.find((a) => a.id === id)
    if (!approval) return undefined

    approval.status = 'rejected'
    approval.approver = approver
    if (remark) approval.comment = remark
    return approval
  }

  getStatistics(): StatisticsOverview {
    return { ...this.statisticsOverview }
  }

  getCompletionRateTrend(days?: number): TrendData[] {
    return days ? this.completionRateTrend.slice(-days) : this.completionRateTrend
  }

  getAccuracyTrend(days?: number): TrendData[] {
    return days ? this.accuracyTrend.slice(-days) : this.accuracyTrend
  }

  getResourceTrend(days?: number): TrendData[] {
    return days ? this.resourceTrend.slice(-days) : this.resourceTrend
  }

  getRegionStats(): RegionStatus[] {
    return [...this.regionStats]
  }

  getRecommendBands(): Recommendation[] {
    return [...this.recommendBands]
  }

  getRecommendParameters(): Recommendation[] {
    return [...this.recommendParameters]
  }

  getRecommendHistory(): Recommendation[] {
    return [...this.recommendHistory]
  }

  getReports(): Report[] {
    return [...this.reports]
  }

  getReportByTaskId(taskId: string): Report | undefined {
    return this.reports.find((r) => r.taskId === taskId)
  }

  generateReport(
    taskId: string,
    taskName: string,
    reportType: string,
    generatedBy: string,
  ): Report {
    const report: Report = {
      id: generateId('report'),
      taskId,
      taskName,
      reportType,
      generatedAt: formatDate(),
      generatedBy,
      status: 'generating',
    }
    this.reports.unshift(report)

    setTimeout(() => {
      const r = this.reports.find((x) => x.id === report.id)
      if (r) r.status = 'generated'
    }, 1000)

    return report
  }
}

export const store = new DataStore()
export const dataStore = store
export default DataStore
