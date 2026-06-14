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
  setUserRole: (role: 'scientist' | 'processor' | 'manager' | 'chief') => void;

  addTask: (task: SimulationTask) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, progress?: number) => void;
  addAlert: (alert: Alert) => void;
  updateAlertStatus: (alertId: string, status: 'pending' | 'reviewed' | 'resolved') => void;
  approveTask: (taskId: string, level: 1 | 2, comment: string) => Promise<void>;
  rejectTask: (taskId: string, level: 1 | 2, comment: string) => Promise<void>;
  fetchApprovals: (role?: 'processor' | 'manager') => Promise<void>;
  fetchApprovalChain: (taskId: string) => Promise<ApprovalRecord[]>;
  submitForApproval: (taskId: string, level?: 1 | 2) => Promise<void>;
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
  setUserRole: (role) => set({ userRole: role }),

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

  approveTask: async (taskId, level, comment) => {
    const now = new Date().toISOString();
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const response = await fetch(`/api/approvals/${taskId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, approver: '当前用户', comment }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error('审批失败:', result.error);
        return;
      }

      if (level === 1 && result.data?.nextApproval) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, approvalStatus: 'pending_second', updatedAt: now } : t
          ),
          approvals: [
            {
              ...result.data.currentApproval,
            },
            result.data.nextApproval,
            ...state.approvals.filter(
              (a) => !(a.taskId === taskId && a.level === level && a.status === 'pending')
            ),
          ],
        }));
      } else if (level === 2) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, approvalStatus: 'published', publishedAt: now, updatedAt: now }
              : t
          ),
          approvals: [
            {
              ...result.data?.currentApproval,
            },
            ...state.approvals.filter(
              (a) => !(a.taskId === taskId && a.level === level && a.status === 'pending')
            ),
          ],
        }));
      }
    } catch (error) {
      console.error('审批请求失败:', error);
      let newApprovalStatus = task.approvalStatus;
      if (level === 1) {
        newApprovalStatus = 'approved_first';
      } else if (level === 2) {
        newApprovalStatus = 'published';
      }

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                approvalStatus: newApprovalStatus as never,
                updatedAt: now,
                publishedAt: level === 2 ? now : undefined,
              }
            : t
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
            approvedAt: now,
            applicant: task.createdBy,
            submittedAt: now,
          },
          ...state.approvals,
        ],
      }));
    }
  },

  rejectTask: async (taskId, level, comment) => {
    const now = new Date().toISOString();
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const response = await fetch(`/api/approvals/${taskId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, approver: '当前用户', comment }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error('驳回失败:', result.error);
        return;
      }

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, approvalStatus: 'rejected', updatedAt: now } : t
        ),
        approvals: [
          {
            ...result.data?.approval,
          },
          ...state.approvals.filter(
            (a) => !(a.taskId === taskId && a.level === level && a.status === 'pending')
          ),
        ],
      }));
    } catch (error) {
      console.error('驳回请求失败:', error);
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
            approvedAt: now,
            applicant: task.createdBy,
            submittedAt: now,
          },
          ...state.approvals,
        ],
      }));
    }
  },

  fetchApprovals: async (role) => {
    try {
      const url = role ? `/api/approvals/pending?role=${role}` : '/api/approvals/pending';
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        set({ approvals: result.data });
      }
    } catch (error) {
      console.error('获取审批列表失败:', error);
    }
  },

  fetchApprovalChain: async (taskId) => {
    try {
      const response = await fetch(`/api/approvals/chain/${taskId}`);
      const result = await response.json();
      if (result.success) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, approvalChain: result.data } : t
          ),
        }));
        return result.data;
      }
    } catch (error) {
      console.error('获取审批链路失败:', error);
    }
    return [];
  },

  submitForApproval: async (taskId, level = 1) => {
    try {
      const response = await fetch('/api/approvals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, level }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error('提交审批失败:', result.error);
      }
    } catch (error) {
      console.error('提交审批请求失败:', error);
    }
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
