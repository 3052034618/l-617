import { create } from 'zustand';
import type {
  SimulationTask,
  Alert,
  ApprovalRecord,
  MonitorData,
  StatisticsOverview,
  Recommendation,
  RegionStatus,
  TaskStatus,
  AlertLevel,
} from '@/types';
import { generateMockTasks, generateMockAlerts, generateMockApprovals, generateStatisticsOverview } from '@/mock/data';

interface AppState {
  tasks: SimulationTask[];
  alerts: Alert[];
  approvals: ApprovalRecord[];
  currentTask: SimulationTask | null;
  monitorData: MonitorData | null;
  statistics: StatisticsOverview | null;
  recommendations: Recommendation[];
  regions: RegionStatus[];
  selectedTaskId: string | null;
  userRole: 'scientist' | 'processor' | 'manager' | 'chief';
  sidebarCollapsed: boolean;

  setTasks: (tasks: SimulationTask[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setApprovals: (approvals: ApprovalRecord[]) => void;
  setCurrentTask: (task: SimulationTask | null) => void;
  setMonitorData: (data: MonitorData | null) => void;
  setStatistics: (stats: StatisticsOverview | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  addTask: (task: SimulationTask) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, progress?: number) => void;
  addAlert: (alert: Alert) => void;
  updateAlertStatus: (alertId: string, status: 'pending' | 'reviewed' | 'resolved') => void;
  approveTask: (taskId: string, level: 1 | 2, comment: string) => void;
  rejectTask: (taskId: string, level: 1 | 2, comment: string) => void;
  initializeMockData: () => void;
}

const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  alerts: [],
  approvals: [],
  currentTask: null,
  monitorData: null,
  statistics: null,
  recommendations: [],
  regions: [],
  selectedTaskId: null,
  userRole: 'scientist',
  sidebarCollapsed: false,

  setTasks: (tasks) => set({ tasks }),
  setAlerts: (alerts) => set({ alerts }),
  setApprovals: (approvals) => set({ approvals }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setMonitorData: (data) => set({ monitorData: data }),
  setStatistics: (stats) => set({ statistics: stats }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTaskStatus: (taskId, status, progress) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status, progress: progress ?? t.progress, updatedAt: new Date().toISOString() } : t
      ),
    })),

  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),

  updateAlertStatus: (alertId, status) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, status } : a)),
    })),

  approveTask: (taskId, level, comment) => {
    const now = new Date().toISOString();
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newApprovalStatus = task.approvalStatus;
    if (level === 1) {
      newApprovalStatus = 'approved_first';
    } else if (level === 2) {
      newApprovalStatus = 'approved';
    }

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, approvalStatus: newApprovalStatus as never, updatedAt: now } : t
      ),
      approvals: [
        {
          id: `appr-${Date.now()}`,
          taskId,
          taskName: task.name,
          level,
          approver: '当前用户',
          status: 'approved',
          comment,
          createdAt: now,
        },
        ...state.approvals,
      ],
    }));
  },

  rejectTask: (taskId, level, comment) => {
    const now = new Date().toISOString();
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, approvalStatus: 'rejected', updatedAt: now } : t
      ),
      approvals: [
        {
          id: `appr-${Date.now()}`,
          taskId,
          taskName: task.name,
          level,
          approver: '当前用户',
          status: 'rejected',
          comment,
          createdAt: now,
        },
        ...state.approvals,
      ],
    }));
  },

  initializeMockData: () => {
    const tasks = generateMockTasks();
    const alerts = generateMockAlerts();
    const approvals = generateMockApprovals();
    const statistics = generateStatisticsOverview();

    set({
      tasks,
      alerts,
      approvals,
      statistics,
      recommendations: [
        {
          id: 'rec-1',
          type: 'bands',
          title: '华北地区最优观测波段组合推荐',
          description: '基于近30天历史模拟，推荐0.55μm、0.66μm、0.86μm、1.24μm、2.25μm五波段组合，反演精度可达95.2%',
          confidence: 0.92,
          details: { bands: [0.55, 0.66, 0.86, 1.24, 2.25], accuracy: 0.952 },
        },
        {
          id: 'rec-2',
          type: 'parameters',
          title: '夏季陆地气溶胶模式优化参数',
          description: '建议将气溶胶光学厚度基准值调整为0.35，单次散射反照率设为0.92，可降低系统偏差约12%',
          confidence: 0.88,
          details: { aod: 0.35, ssa: 0.92, biasReduction: 0.12 },
        },
        {
          id: 'rec-3',
          type: 'bands',
          title: '热红外亮温反演波段优化',
          description: '推荐10.5-12.5μm热红外窗口，配合8.6μm水汽吸收通道，温度反演精度优于0.5K',
          confidence: 0.85,
          details: { bands: ['10.5-12.5μm', '8.6μm'], accuracy: '0.5K' },
        },
      ],
      regions: [
        { region: '华北平原', taskCount: 24, avgDeviation: 3.2, isPaused: false, lastSimulationAt: '2026-06-14T08:30:00Z' },
        { region: '长江三角洲', taskCount: 18, avgDeviation: 2.8, isPaused: false, lastSimulationAt: '2026-06-14T10:15:00Z' },
        { region: '珠江三角洲', taskCount: 31, avgDeviation: 5.8, isPaused: true, lastSimulationAt: '2026-06-13T16:45:00Z' },
        { region: '四川盆地', taskCount: 12, avgDeviation: 4.1, isPaused: false, lastSimulationAt: '2026-06-14T07:00:00Z' },
        { region: '西北戈壁', taskCount: 8, avgDeviation: 2.1, isPaused: false, lastSimulationAt: '2026-06-12T14:20:00Z' },
      ],
    });
  },
}));

export default useAppStore;
