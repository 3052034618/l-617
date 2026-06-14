export type TaskStatus =
  | 'pending'
  | 'modeling'
  | 'computing'
  | 'synthesizing'
  | 'completed'
  | 'failed'
  | 'rollback'

export type AlertLevel = 'level1' | 'level2' | 'level3'
export type AlertType = 'radiation_balance' | 'fitting_residual' | 'region_deviation'
export type AlertStatus = 'pending' | 'reviewed' | 'resolved'

export type ApprovalStatus =
  | 'none'
  | 'pending_first'
  | 'approved_first'
  | 'pending_second'
  | 'approved'
  | 'rejected'

export type UserRole = 'scientist' | 'processor' | 'manager' | 'chief'

export interface TaskParameters {
  profileFile: string
  surfaceType: string
  aerosolModel: string
  wavelengthRange: [number, number]
  spectralResolution: number
  observationAngle: number
}

export interface SpectrumData {
  wavelength: number
  value: number
}

export interface ChannelData {
  channel: string
  value: number
  wavelength: number
}

export interface SimulationResults {
  transmittance: SpectrumData[]
  reflectance: SpectrumData[]
  brightnessTemperature: ChannelData[]
  radiationBalance: number
  fittingResidual: number
  accuracy?: number
}

export interface SimulationTask {
  id: string
  name: string
  region: string
  status: TaskStatus
  progress: number
  createdAt: string
  updatedAt: string
  createdBy: string
  userId?: string
  userName?: string
  parameters: TaskParameters
  results?: SimulationResults
  approvalStatus: ApprovalStatus
  alertLevel?: AlertLevel | null
  computeDuration?: number
  resourceUsage?: number
}

export interface AdjustmentLog {
  id: string
  alertId: string
  taskId: string
  parameter: string
  oldValue: number
  newValue: number
  reason: string
  operator: string
  createdAt: string
}

export interface Alert {
  id: string
  taskId: string
  taskName: string
  level: AlertLevel
  type: AlertType
  message: string
  deviation: number
  threshold: number
  createdAt: string
  status: AlertStatus
  reviewedBy?: string
  reviewComment?: string
  adjustment?: AdjustmentLog
}

export interface ApprovalRecord {
  id: string
  taskId: string
  taskName: string
  level: 1 | 2
  approver: string
  status: 'approved' | 'rejected' | 'pending'
  comment: string
  createdAt: string
}

export interface MonitorData {
  timestamp: string
  taskId: string
  transmittance: SpectrumData[]
  reflectance: SpectrumData[]
  brightnessTemp: ChannelData[]
  radiationBalance: number
  fittingResidual: number
  progress: number
}

export interface StatisticsOverview {
  totalTasks: number
  completedTasks: number
  runningTasks: number
  pendingTasks: number
  successRate: number
  avgAccuracy: number
  totalResourceUsage: number
  alertCount: number
}

export interface TrendData {
  date: string
  value: number
}

export interface Recommendation {
  id: string
  type: 'bands' | 'parameters'
  title: string
  description: string
  confidence: number
  details: Record<string, unknown>
}

export interface RegionStatus {
  region: string
  taskCount: number
  avgDeviation: number
  isPaused: boolean
  lastSimulationAt: string
}

export interface Report {
  id: string
  taskId: string
  taskName: string
  reportType: string
  generatedAt: string
  generatedBy: string
  status: 'generating' | 'generated' | 'failed'
}
