import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import DataStore, { store } from './store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_FILE_PATH = path.join(__dirname, 'db.json')
const DEBOUNCE_DELAY = 1000

interface StoreData {
  tasks: DataStore['tasks']
  alerts: DataStore['alerts']
  approvals: DataStore['approvals']
  reports: DataStore['reports']
  adjustmentLogs: DataStore['adjustmentLogs']
  recommendBands: DataStore['recommendBands']
  recommendParameters: DataStore['recommendParameters']
  recommendHistory: DataStore['recommendHistory']
  statisticsOverview: DataStore['statisticsOverview']
  completionRateTrend: DataStore['completionRateTrend']
  accuracyTrend: DataStore['accuracyTrend']
  resourceTrend: DataStore['resourceTrend']
  regionStats: DataStore['regionStats']
  uploadedFiles: DataStore['uploadedFiles']
}

class PersistentDataStore extends DataStore {
  private saveTimeout: NodeJS.Timeout | null = null
  private dataFilePath: string = DATA_FILE_PATH

  constructor() {
    super()
  }

  async init(): Promise<void> {
    if (this.initialized) return

    const loaded = await this.loadFromFile()
    if (!loaded) {
      super.init()
      void this.saveToFile()
    }

    this.initialized = true
  }

  async saveToFile(): Promise<void> {
    try {
      console.log('[DEBUG] saveToFile called, uploadedFiles:', this.uploadedFiles.length)
      const data: StoreData = {
        tasks: this.tasks,
        alerts: this.alerts,
        approvals: this.approvals,
        reports: this.reports,
        adjustmentLogs: this.adjustmentLogs,
        recommendBands: this.recommendBands,
        recommendParameters: this.recommendParameters,
        recommendHistory: this.recommendHistory,
        statisticsOverview: this.statisticsOverview,
        completionRateTrend: this.completionRateTrend,
        accuracyTrend: this.accuracyTrend,
        resourceTrend: this.resourceTrend,
        regionStats: this.regionStats,
        uploadedFiles: this.uploadedFiles,
      }

      const jsonData = JSON.stringify(data, null, 2)
      await fs.writeFile(this.dataFilePath, jsonData, 'utf-8')
      console.log('[DEBUG] saveToFile completed successfully')
    } catch (error) {
      console.error('Failed to save data to file:', error)
    }
  }

  async loadFromFile(): Promise<boolean> {
    try {
      await fs.access(this.dataFilePath)
      const fileContent = await fs.readFile(this.dataFilePath, 'utf-8')
      const data: StoreData = JSON.parse(fileContent)

      this.tasks = data.tasks || []
      this.alerts = data.alerts || []
      this.approvals = data.approvals || []
      this.reports = data.reports || []
      this.adjustmentLogs = data.adjustmentLogs || []
      this.recommendBands = data.recommendBands || []
      this.recommendParameters = data.recommendParameters || []
      this.recommendHistory = data.recommendHistory || []
      this.statisticsOverview = data.statisticsOverview || this.statisticsOverview
      this.completionRateTrend = data.completionRateTrend || []
      this.accuracyTrend = data.accuracyTrend || []
      this.resourceTrend = data.resourceTrend || []
      this.regionStats = data.regionStats || []
      this.uploadedFiles = data.uploadedFiles || []

      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('Data file not found, will initialize with mock data')
      } else {
        console.error('Failed to load data from file:', error)
      }
      return false
    }
  }

  scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(() => {
      void this.saveToFile()
      this.saveTimeout = null
    }, DEBOUNCE_DELAY)
  }

  addTask(task: Parameters<DataStore['addTask']>[0]): ReturnType<DataStore['addTask']> {
    const result = super.addTask(task)
    this.scheduleSave()
    return result
  }

  updateTask(...args: Parameters<DataStore['updateTask']>): ReturnType<DataStore['updateTask']> {
    const result = super.updateTask(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  deleteTask(...args: Parameters<DataStore['deleteTask']>): ReturnType<DataStore['deleteTask']> {
    const result = super.deleteTask(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  restartTask(...args: Parameters<DataStore['restartTask']>): ReturnType<DataStore['restartTask']> {
    const result = super.restartTask(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  updateAlert(...args: Parameters<DataStore['updateAlert']>): ReturnType<DataStore['updateAlert']> {
    const result = super.updateAlert(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  addApproval(...args: Parameters<DataStore['addApproval']>): ReturnType<DataStore['addApproval']> {
    const result = super.addApproval(...args)
    this.scheduleSave()
    return result
  }

  approveFirstLevel(...args: Parameters<DataStore['approveFirstLevel']>): ReturnType<DataStore['approveFirstLevel']> {
    const result = super.approveFirstLevel(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  approveSecondLevel(...args: Parameters<DataStore['approveSecondLevel']>): ReturnType<DataStore['approveSecondLevel']> {
    const result = super.approveSecondLevel(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  rejectApproval(...args: Parameters<DataStore['rejectApproval']>): ReturnType<DataStore['rejectApproval']> {
    const result = super.rejectApproval(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  generateReport(...args: Parameters<DataStore['generateReport']>): ReturnType<DataStore['generateReport']> {
    const result = super.generateReport(...args)
    this.scheduleSave()
    setTimeout(() => this.scheduleSave(), 1500)
    return result
  }

  addUploadedFile(...args: Parameters<DataStore['addUploadedFile']>): ReturnType<DataStore['addUploadedFile']> {
    console.log('[DEBUG] PersistentDataStore.addUploadedFile called, current uploadedFiles:', this.uploadedFiles.length)
    const result = super.addUploadedFile(...args)
    console.log('[DEBUG] After super.addUploadedFile, uploadedFiles:', this.uploadedFiles.length)
    this.scheduleSave()
    return result
  }

  deleteUploadedFile(...args: Parameters<DataStore['deleteUploadedFile']>): ReturnType<DataStore['deleteUploadedFile']> {
    const result = super.deleteUploadedFile(...args)
    if (result) {
      this.scheduleSave()
    }
    return result
  }

  addAdjustmentLog(...args: Parameters<DataStore['addAdjustmentLog']>): ReturnType<DataStore['addAdjustmentLog']> {
    const result = super.addAdjustmentLog(...args)
    this.scheduleSave()
    return result
  }

  saveToStorage(): void {
    this.scheduleSave()
  }

  loadFromStorage(): void {
    void this.loadFromFile()
  }
}

export const persistentStore = new PersistentDataStore()

export default PersistentDataStore
export { DATA_FILE_PATH }
