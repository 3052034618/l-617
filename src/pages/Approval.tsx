import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Layers,
  Target,
  Eye,
  FileCheck,
  History,
  ListChecks,
  ArrowRight,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import type { SimulationTask, ApprovalStatus, ApprovalRecord } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'pending' | 'approved' | 'all';
type NodeStatus = 'pending' | 'current' | 'approved' | 'rejected' | 'published';
type UserRoleType = 'scientist' | 'processor' | 'manager' | 'chief';

const tabConfig: { key: TabType; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: '待我审批', icon: Clock },
  { key: 'approved', label: '我已审批', icon: FileCheck },
  { key: 'all', label: '全部审批', icon: ListChecks },
];

const roleConfig: { key: UserRoleType; label: string; description: string }[] = [
  { key: 'scientist', label: '科学家', description: '提交任务、查看审批状态' },
  { key: 'processor', label: '数据处理员', description: '一级审批（数据完整性审核）' },
  { key: 'manager', label: '项目负责人', description: '二级审批（结果质量审核）' },
  { key: 'chief', label: '主管', description: '全局查看、管理' },
];

const level1Styles: Record<NodeStatus, { ring: string; bg: string; icon: string; text: string }> = {
  pending: { ring: 'border-blue-500/30', bg: 'bg-blue-500/10', icon: 'text-blue-500/50', text: 'text-slate-500' },
  current: { ring: 'border-blue-400 shadow-glow', bg: 'bg-blue-500/20', icon: 'text-blue-400 animate-pulse', text: 'text-blue-400' },
  approved: { ring: 'border-emerald-500/50', bg: 'bg-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-400' },
  rejected: { ring: 'border-red-500/50', bg: 'bg-red-500/20', icon: 'text-red-400', text: 'text-red-400' },
  published: { ring: 'border-cyan-500/50', bg: 'bg-cyan-500/20', icon: 'text-cyan-400', text: 'text-cyan-400' },
};

const level2Styles: Record<NodeStatus, { ring: string; bg: string; icon: string; text: string }> = {
  pending: { ring: 'border-purple-500/30', bg: 'bg-purple-500/10', icon: 'text-purple-500/50', text: 'text-slate-500' },
  current: { ring: 'border-purple-400 shadow-glow', bg: 'bg-purple-500/20', icon: 'text-purple-400 animate-pulse', text: 'text-purple-400' },
  approved: { ring: 'border-emerald-500/50', bg: 'bg-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-400' },
  rejected: { ring: 'border-red-500/50', bg: 'bg-red-500/20', icon: 'text-red-400', text: 'text-red-400' },
  published: { ring: 'border-cyan-500/50', bg: 'bg-cyan-500/20', icon: 'text-cyan-400', text: 'text-cyan-400' },
};

const getApprovalLevel = (status: ApprovalStatus): 1 | 2 => {
  if (status === 'pending_first' || status === 'approved_first') return 1;
  return 2;
};

const getStatusBadgeConfig = (status: ApprovalStatus) => {
  const configs: Record<ApprovalStatus, { label: string; className: string }> = {
    none: { label: '未提交', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    pending_first: { label: '待一级审批', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    approved_first: { label: '一级通过', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    pending_second: { label: '待二级审批', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    approved: { label: '审批通过', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    published: { label: '已发布', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    rejected: { label: '已驳回', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  return configs[status];
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function FlowNode({ label, sublabel, status, level, showPublished }: { label: string; sublabel: string; status: NodeStatus; level: 1 | 2; showPublished?: boolean }) {
  const styles = level === 1 ? level1Styles : level2Styles;
  const displayStatus = showPublished && status === 'approved' ? 'published' : status;
  const style = styles[displayStatus];
  const StatusIcon = displayStatus === 'published' ? Globe : status === 'approved' ? CheckCircle : status === 'rejected' ? XCircle : Clock;
  return (
    <div className="flex flex-col items-center">
      <div className={cn('w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500', style.ring, style.bg)}>
        <StatusIcon className={cn('w-7 h-7', style.icon)} />
      </div>
      <div className="mt-3 text-center">
        <div className={cn('text-sm font-medium', style.text)}>{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{sublabel}</div>
      </div>
    </div>
  );
}

function ApprovalFlow({ task, chain }: { task: SimulationTask; chain?: ApprovalRecord[] }) {
  const status = task.approvalStatus;

  const getNodeStatus = (level: 1 | 2): NodeStatus => {
    if (status === 'rejected') return 'rejected';
    if (level === 1) {
      if (status === 'pending_first') return 'current';
      if (status === 'approved_first' || status === 'pending_second' || status === 'approved' || status === 'published') return 'approved';
      return 'pending';
    }
    if (status === 'pending_second') return 'current';
    if (status === 'approved' || status === 'published') return 'approved';
    return 'pending';
  };

  const lineStatus =
    status === 'approved_first' || status === 'pending_second' || status === 'approved' || status === 'published'
      ? 'active'
      : status === 'rejected'
      ? 'rejected'
      : 'pending';

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-slate-300 mb-6 flex items-center gap-2">
        <History className="w-4 h-4 text-cyan-400" />
        审批流程
      </h3>
      <div className="flex items-center justify-center gap-4">
        <FlowNode label="一级审批" sublabel="数据处理员" status={getNodeStatus(1)} level={1} />
        <div className="relative flex-1 max-w-24 h-0.5 bg-slate-700/50 overflow-hidden">
          {lineStatus === 'active' && <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse w-full" />}
          {lineStatus === 'rejected' && <div className="absolute inset-y-0 left-0 bg-red-500/50 w-full" />}
          {lineStatus === 'pending' && <div className="absolute inset-y-0 left-0 bg-slate-600/50 w-1/2 animate-shimmer" />}
          <ArrowRight
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 z-10',
              lineStatus === 'active' ? 'text-cyan-400' : lineStatus === 'rejected' ? 'text-red-400' : 'text-slate-600'
            )}
          />
        </div>
        <FlowNode label="二级审批" sublabel="项目负责人" status={getNodeStatus(2)} level={2} showPublished={status === 'published'} />
      </div>

      {status === 'published' && task.publishedAt && (
        <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400">任务已于 {formatDate(task.publishedAt)} 发布至应用数据库</span>
        </div>
      )}

      {chain && chain.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <h4 className="text-xs font-medium text-slate-400 mb-3">审批链路详情</h4>
          <div className="space-y-2">
            {chain.map((record) => (
              <div key={record.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/30">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  record.status === 'approved' ? 'bg-emerald-500/20' : record.status === 'rejected' ? 'bg-red-500/20' : 'bg-slate-500/20'
                )}>
                  {record.status === 'approved' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : record.status === 'rejected' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border',
                      record.level === 1 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    )}>
                      {record.level === 1 ? '一级' : '二级'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {record.status === 'approved' ? '通过' : record.status === 'rejected' ? '驳回' : '待审'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>申请人：{record.applicant || '—'}</div>
                    <div>提交时间：{formatDate(record.submittedAt)}</div>
                    {record.approver && record.status !== 'pending' && (
                      <div>审批人：{record.approver} · {formatDate(record.approvedAt)}</div>
                    )}
                    {record.comment && (
                      <div className="mt-1 p-2 bg-slate-700/50 rounded text-slate-300">
                        {record.comment}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalCard({
  task,
  onApprove,
  onReject,
  onViewDetail,
  userRole,
}: {
  task: SimulationTask;
  onApprove: (taskId: string, level: 1 | 2, comment: string) => void;
  onReject: (taskId: string, level: 1 | 2, comment: string) => void;
  onViewDetail: (task: SimulationTask) => void;
  userRole: UserRoleType;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const level = getApprovalLevel(task.approvalStatus);
  const isLevel1 = level === 1;
  const isPublished = task.approvalStatus === 'published';
  const isRejected = task.approvalStatus === 'rejected';

  const canApprove = useMemo(() => {
    if (task.approvalStatus === 'pending_first' && (userRole === 'processor' || userRole === 'chief')) return true;
    if (task.approvalStatus === 'pending_second' && (userRole === 'manager' || userRole === 'chief')) return true;
    return false;
  }, [task.approvalStatus, userRole]);

  const handleApprove = () => {
    onApprove(task.id, level, comment || '同意');
    setComment('');
    setExpanded(false);
  };

  const handleReject = () => {
    onReject(task.id, level, comment || '驳回');
    setComment('');
    setExpanded(false);
  };

  const statusBadge = getStatusBadgeConfig(task.approvalStatus);

  return (
    <div className="glass rounded-xl p-5 card-hover animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-base font-semibold text-white truncate">{task.name}</h3>
            {isPublished && (
              <span className="tag border bg-cyan-500/20 text-cyan-400 border-cyan-500/30 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                已发布
              </span>
            )}
            {isRejected && (
              <span className="tag border bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                已驳回
              </span>
            )}
            {!isPublished && !isRejected && (
              <span
                className={cn(
                  'tag border',
                  isLevel1
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                )}
              >
                {isLevel1 ? '一级审批' : '二级审批'}
              </span>
            )}
            <span className={cn('tag border text-xs', statusBadge.className)}>
              {statusBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {task.createdBy}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.createdAt)}
            </span>
            {task.publishedAt && (
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Globe className="w-3.5 h-3.5" />
                发布于 {formatDate(task.publishedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass-light rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MapPin className="w-3 h-3" />
            区域
          </div>
          <div className="text-sm text-slate-300 font-medium">{task.region}</div>
        </div>
        <div className="glass-light rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Layers className="w-3 h-3" />
            下垫面
          </div>
          <div className="text-sm text-slate-300 font-medium">{task.parameters.surfaceType}</div>
        </div>
        <div className="glass-light rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Target className="w-3 h-3" />
            精度预估
          </div>
          <div className="text-sm text-emerald-400 font-medium">
            {task.results?.accuracy ? `${(task.results.accuracy * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onViewDetail(task)} className="btn btn-secondary flex-1">
          <Eye className="w-4 h-4" />
          查看详情
        </button>
        {canApprove && (
          <button onClick={() => setExpanded(!expanded)} className={cn('btn flex-1', expanded ? 'btn-danger' : 'btn-success')}>
            {expanded ? (
              <>
                <XCircle className="w-4 h-4" />
                收起
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                审批
              </>
            )}
          </button>
        )}
      </div>

      {expanded && canApprove && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in">
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1.5 block">审批意见</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="请输入审批意见..."
              className="w-full h-20 resize-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleApprove} className="btn btn-success flex-1">
              <CheckCircle className="w-4 h-4" />
              通过
            </button>
            <button onClick={handleReject} className="btn btn-danger flex-1">
              <XCircle className="w-4 h-4" />
              驳回
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryItem({ record }: { record: ApprovalRecord }) {
  const isLevel1 = record.level === 1;
  const isApproved = record.status === 'approved';
  const isPending = record.status === 'pending';

  return (
    <div className="glass-light rounded-lg p-4 card-hover">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-medium text-white truncate flex-1">{record.taskName}</h4>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span
            className={cn(
              'tag border text-xs',
              isLevel1
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            )}
          >
            {isLevel1 ? '一级' : '二级'}
          </span>
          <span
            className={cn(
              'tag border text-xs',
              isPending
                ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                : isApproved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
            )}
          >
            {isPending ? '待审' : isApproved ? '通过' : '驳回'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-2 flex-wrap">
        {record.applicant && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            申请人：{record.applicant}
          </span>
        )}
        {!isPending && record.approver && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {record.approver}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(record.submittedAt || record.createdAt)}
        </span>
        {record.approvedAt && !isPending && (
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {formatDate(record.approvedAt)}
          </span>
        )}
      </div>
      {record.comment && (
        <div className="text-xs text-slate-400 bg-deep-800/50 rounded-lg p-2.5">
          <span className="text-slate-500">审批意见：</span>
          {record.comment}
        </div>
      )}
    </div>
  );
}

export default function Approval() {
  const { tasks, approvals, approveTask, rejectTask, userRole, setUserRole, fetchApprovalChain, initializeMockData } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedTask, setSelectedTask] = useState<SimulationTask | null>(null);
  const [selectedTaskChain, setSelectedTaskChain] = useState<ApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  const handleViewDetail = async (task: SimulationTask) => {
    setSelectedTask(task);
    setIsLoading(true);
    try {
      const chain = await fetchApprovalChain(task.id);
      setSelectedTaskChain(chain || task.approvalChain || []);
    } catch (error) {
      setSelectedTaskChain(task.approvalChain || []);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.approvalStatus === 'pending_first' || t.approvalStatus === 'pending_second');
    if (userRole === 'processor') {
      filtered = filtered.filter((t) => t.approvalStatus === 'pending_first');
    } else if (userRole === 'manager') {
      filtered = filtered.filter((t) => t.approvalStatus === 'pending_second');
    }
    return filtered;
  }, [tasks, userRole]);

  const approvedTasks = useMemo(
    () => tasks.filter((t) => ['approved_first', 'approved', 'published', 'rejected'].includes(t.approvalStatus)),
    [tasks]
  );

  const allTasks = useMemo(() => tasks.filter((t) => t.approvalStatus !== 'none'), [tasks]);

  const displayTasks = activeTab === 'pending' ? pendingTasks : activeTab === 'approved' ? approvedTasks : allTasks;

  const tabCounts = {
    pending: pendingTasks.length,
    approved: approvedTasks.length,
    all: allTasks.length,
  };

  const publishedCount = useMemo(() => tasks.filter((t) => t.approvalStatus === 'published').length, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-blue-500/30">
            <FileCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">审批中心</h1>
            <p className="text-sm text-slate-400">管理和处理模拟任务审批</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400">当前角色：</span>
          <div className="flex items-center gap-1">
            {roleConfig.map((role) => (
              <button
                key={role.key}
                onClick={() => setUserRole(role.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  userRole === role.key
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                )}
                title={role.description}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
        <div className="glass rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400 mb-1">{pendingTasks.filter(t => t.approvalStatus === 'pending_first').length}</div>
          <div className="text-xs text-slate-400">待一级审批</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-3xl font-bold text-purple-400 mb-1">{pendingTasks.filter(t => t.approvalStatus === 'pending_second').length}</div>
          <div className="text-xs text-slate-400">待二级审批</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{publishedCount}</div>
          <div className="text-xs text-slate-400">已发布</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-3xl font-bold text-red-400 mb-1">{tasks.filter(t => t.approvalStatus === 'rejected').length}</div>
          <div className="text-xs text-slate-400">已驳回</div>
        </div>
      </div>

      <div className="glass rounded-xl p-1.5 inline-flex animate-slide-up stagger-2">
        {tabConfig.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              )}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
              <span className={cn('text-xs px-2 py-0.5 rounded-full', isActive ? 'bg-white/20' : 'bg-slate-700/50')}>
                {tabCounts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {displayTasks.length > 0 ? (
            displayTasks.map((task, index) => (
              <div key={task.id} style={{ animationDelay: `${0.05 + index * 0.05}s` }}>
                <ApprovalCard
                  task={task}
                  onApprove={approveTask}
                  onReject={rejectTask}
                  onViewDetail={handleViewDetail}
                  userRole={userRole}
                />
              </div>
            ))
          ) : (
            <div className="glass rounded-xl p-12 text-center animate-slide-up stagger-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                <FileCheck className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">暂无审批任务</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedTask && (
            <div className="animate-slide-up stagger-1">
              {isLoading ? (
                <div className="glass rounded-xl p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">加载审批链路...</p>
                </div>
              ) : (
                <ApprovalFlow task={selectedTask} chain={selectedTaskChain} />
              )}
            </div>
          )}

          <div className="glass rounded-xl p-5 animate-slide-up stagger-2">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              审批历史
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {approvals.length > 0 ? (
                approvals.map((record) => <HistoryItem key={record.id} record={record} />)
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">暂无审批记录</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
