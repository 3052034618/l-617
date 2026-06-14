import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Eye,
  RotateCcw,
  Trash2,
  Clock,
  Cpu,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '@/api';
import type { TaskStatus, SimulationTask } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; border: string; icon: typeof Clock; gradient: string }> = {
  pending: { label: '待校验', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30', icon: Clock, gradient: 'from-gray-500 to-gray-400' },
  modeling: { label: '模型构建', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Sparkles, gradient: 'from-yellow-500 to-amber-400' },
  computing: { label: '辐射传输计算', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: Cpu, gradient: 'from-blue-500 to-cyan-400' },
  synthesizing: { label: '光谱合成', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', icon: Sparkles, gradient: 'from-purple-500 to-violet-400' },
  completed: { label: '已完成', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', icon: CheckCircle, gradient: 'from-green-500 to-emerald-400' },
  failed: { label: '失败', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: XCircle, gradient: 'from-red-500 to-rose-400' },
  rollback: { label: '异常回退', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: AlertTriangle, gradient: 'from-orange-500 to-amber-400' },
};

const filterOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待校验' },
  { value: 'modeling', label: '模型构建' },
  { value: 'computing', label: '辐射传输计算' },
  { value: 'synthesizing', label: '光谱合成' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'rollback', label: '异常回退' },
];

const statConfig: { key: TaskStatus | 'running'; label: string }[] = [
  { key: 'pending', label: '待校验' },
  { key: 'running', label: '运行中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '失败' },
  { key: 'rollback', label: '异常回退' },
];

const PAGE_SIZE = 8;

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<SimulationTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await taskApi.getList({ page: 1, pageSize: 100 });
    if (res.success && res.data) {
      setTasks(res.data.list);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    intervalRef.current = window.setInterval(fetchTasks, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesSearch =
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    counts.running = (counts.modeling || 0) + (counts.computing || 0) + (counts.synthesizing || 0);
    return counts;
  }, [tasks]);

  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    const res = await taskApi.remove(taskId);
    if (res.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const handleRestart = async (taskId: string) => {
    const res = await taskApi.restart(taskId);
    if (res.success && res.data) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data! : t)));
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const handleFilterClick = (status: TaskStatus | 'all') => {
    setStatusFilter(status);
    setShowFilterDropdown(false);
    setCurrentPage(1);
  };

  const handleStatClick = (key: TaskStatus | 'running') => {
    setStatusFilter(key === 'running' ? 'computing' : key);
    setCurrentPage(1);
  };

  const isStatActive = (key: TaskStatus | 'running') =>
    (key === 'running' && ['modeling', 'computing', 'synthesizing'].includes(statusFilter)) ||
    statusFilter === key;

  const getStatGradient = (key: TaskStatus | 'running') => {
    if (key === 'running') return 'from-blue-500 to-cyan-400';
    return statusConfig[key].gradient;
  };

  const getStatColor = (key: TaskStatus | 'running') => {
    if (key === 'running') return 'text-blue-400';
    return statusConfig[key].color;
  };

  const renderPages = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return { pages, start, end };
  };

  const { pages, start, end } = renderPages();

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-blue-500/30">
            <ListTodo className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">任务管理</h1>
            <p className="text-sm text-slate-400">查看和管理所有模拟任务</p>
          </div>
        </div>
        <button onClick={() => navigate('/tasks/create')} className="btn btn-primary">
          <Plus className="w-4 h-4" />创建模拟
        </button>
      </div>

      {/* 筛选搜索栏 */}
      <div className="glass rounded-xl p-4 animate-slide-up stagger-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-deep-800/80 border border-space-600/30 rounded-lg text-sm text-slate-300 hover:border-blue-500/50 transition-colors"
            >
              <Filter className="w-4 h-4 text-blue-400" />
              <span>{filterOptions.find((o) => o.value === statusFilter)?.label || '全部状态'}</span>
              <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', showFilterDropdown && 'rotate-180')} />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 glass rounded-lg shadow-xl py-1 z-50 animate-fade-in">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterClick(option.value)}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      statusFilter === option.value ? 'text-cyan-400 bg-blue-500/10' : 'text-slate-300 hover:bg-space-700/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索任务名称、区域、创建人..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-deep-800/80 border border-space-600/30 rounded-lg focus:border-blue-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 任务统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-slide-up stagger-2">
        {statConfig.map((stat, index) => (
          <button
            key={stat.key}
            onClick={() => handleStatClick(stat.key)}
            className={cn('glass rounded-xl p-4 text-left card-hover transition-all duration-300', isStatActive(stat.key) && 'border-blue-500/50 shadow-glow')}
            style={{ animationDelay: `${0.1 + index * 0.05}s` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', getStatGradient(stat.key))} />
              <span className="text-sm text-slate-400">{stat.label}</span>
            </div>
            <div className={cn('text-2xl font-bold number-animate', getStatColor(stat.key))}>
              {statusCounts[stat.key] || 0}
            </div>
          </button>
        ))}
      </div>

      {/* 任务表格 */}
      <div className="glass rounded-xl overflow-hidden animate-slide-up stagger-3">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-space-700/50">
                {['任务名称', '区域', '状态', '进度', '创建时间', '创建人', '操作'].map((th, i) => (
                  <th
                    key={th}
                    className={cn('px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider', i === 6 ? 'text-right' : 'text-left')}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((task: SimulationTask, index: number) => {
                const cfg = statusConfig[task.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr
                    key={task.id}
                    className={cn('border-b border-space-700/30 table-row-hover cursor-pointer transition-colors', index === paginatedTasks.length - 1 && 'border-b-0')}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white truncate max-w-xs">{task.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{task.region}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.bg, cfg.color, cfg.border, task.status === 'computing' && 'animate-pulse')}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-deep-800 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full progress-glow bg-gradient-to-r', cfg.gradient)}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-10 text-right">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400 font-mono">{formatDate(task.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{task.createdBy}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-blue-500/10 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRestart(task.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="重启"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
              <ListTodo className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400">暂无匹配的任务</p>
          </div>
        )}

        {/* 分页器 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-space-700/50">
            <div className="text-sm text-slate-400">
              共 <span className="text-white font-medium">{filteredTasks.length}</span> 条任务
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn('p-2 rounded-lg transition-colors', currentPage === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-space-700/50')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {start > 1 && (
                <>
                  <button onClick={() => setCurrentPage(1)} className="w-8 h-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-space-700/50 transition-colors">1</button>
                  {start > 2 && <span className="text-slate-500 px-1">...</span>}
                </>
              )}
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    page === currentPage ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-glow' : 'text-slate-400 hover:text-white hover:bg-space-700/50'
                  )}
                >
                  {page}
                </button>
              ))}
              {end < totalPages && (
                <>
                  {end < totalPages - 1 && <span className="text-slate-500 px-1">...</span>}
                  <button onClick={() => setCurrentPage(totalPages)} className="w-8 h-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-space-700/50 transition-colors">{totalPages}</button>
                </>
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn('p-2 rounded-lg transition-colors', currentPage === totalPages ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-space-700/50')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
