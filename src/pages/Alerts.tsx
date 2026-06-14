import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Sun,
  Activity,
  MapPin,
  X,
  Settings,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { alertApi } from '@/api';
import type { AlertLevel, AlertType, AlertStatus, Alert, AdjustmentLog } from '@/types';
import { cn } from '@/lib/utils';

const levelConfig: Record<AlertLevel, { bg: string; text: string; border: string; glow: string; label: string; color: string }> = {
  level1: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]', label: '一级预警', color: '#f59e0b' },
  level2: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50', glow: 'shadow-[0_0_25px_rgba(249,115,22,0.4)]', label: '二级预警', color: '#f97316' },
  level3: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/60', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]', label: '三级预警', color: '#ef4444' },
};

const typeInfo: Record<AlertType, { icon: typeof Sun; label: string }> = {
  radiation_balance: { icon: Sun, label: '辐射平衡' },
  fitting_residual: { icon: Activity, label: '光谱拟合' },
  region_deviation: { icon: MapPin, label: '区域偏差' },
};

const statusInfo: Record<AlertStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: '待处理', icon: Clock, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  reviewed: { label: '已复核', icon: CheckCircle, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  resolved: { label: '已解决', icon: CheckCircle, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

const suggestions: Record<AlertType, string[]> = {
  radiation_balance: ['检查大气廓线输入数据，验证水汽和温度垂直分布', '复核气溶胶光学厚度参数设置', '对比历史同期模拟结果，判断是否为系统性偏差'],
  fitting_residual: ['增加光谱分辨率，优化拟合算法参数', '调整气溶胶粒子谱分布模型，考虑多峰分布', '检查发射率参数设置，特别是热红外通道'],
  region_deviation: ['核查下垫面类型数据，确认地表覆盖分类', '检查区域气象条件，是否存在异常天气系统', '对比相邻区域模拟结果，判断偏差范围'],
};

const parameterOptions = [
  { value: 'aerosol_optical_depth', label: '气溶胶光学厚度' },
  { value: 'surface_emissivity', label: '地表发射率' },
  { value: 'observation_angle', label: '观测角度' },
  { value: 'spectral_resolution', label: '光谱分辨率' },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<(Alert & { adjustmentLogs?: AdjustmentLog[] }) | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewAction, setReviewAction] = useState<'adjust' | 'ignore'>('ignore');
  const [adjustmentParam, setAdjustmentParam] = useState('aerosol_optical_depth');
  const [adjustmentOldValue, setAdjustmentOldValue] = useState('');
  const [adjustmentNewValue, setAdjustmentNewValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize };
      if (levelFilter !== 'all') params.level = levelFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (searchText) params.search = searchText;

      const result = await alertApi.getList(params);
      if (result.success && result.data) {
        setAlerts(result.data.list);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error('获取预警列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, levelFilter, statusFilter, typeFilter, searchText]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    setPage(1);
  }, [levelFilter, statusFilter, typeFilter, searchText]);

  const fetchAlertDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const result = await alertApi.getById(id);
      if (result.success && result.data) {
        setSelectedAlert(result.data);
      }
    } catch (error) {
      console.error('获取预警详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const stats = useMemo(() => ({
    level1: alerts.filter((a) => a.level === 'level1').length,
    level2: alerts.filter((a) => a.level === 'level2').length,
    level3: alerts.filter((a) => a.level === 'level3').length,
  }), [alerts]);

  const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return formatTime(iso);
  };

  const handleViewDetail = async (alert: Alert) => {
    setSelectedAlert(alert);
    await fetchAlertDetail(alert.id);
  };

  const handleOpenReview = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowReview(true);
    setReviewAction('ignore');
    setReviewComment('');
    setAdjustmentParam('aerosol_optical_depth');
    setAdjustmentOldValue('');
    setAdjustmentNewValue('');
    setAdjustmentReason('');
  };

  const handleReview = async () => {
    if (!selectedAlert) return;
    setSubmitting(true);
    try {
      const data: {
        action: 'adjust' | 'ignore';
        comment: string;
        adjustment?: {
          parameter: string;
          oldValue: number;
          newValue: number;
          reason: string;
        };
      } = {
        action: reviewAction,
        comment: reviewComment || (reviewAction === 'ignore' ? '已忽略' : '已调整'),
      };

      if (reviewAction === 'adjust') {
        data.adjustment = {
          parameter: adjustmentParam,
          oldValue: parseFloat(adjustmentOldValue) || 0,
          newValue: parseFloat(adjustmentNewValue) || 0,
          reason: adjustmentReason,
        };
      }

      const result = await alertApi.review(selectedAlert.id, data);
      if (result.success && result.data) {
        await fetchAlerts();
        await fetchAlertDetail(selectedAlert.id);
        setShowReview(false);
      }
    } catch (error) {
      console.error('复核失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    setSubmitting(true);
    try {
      const result = await alertApi.resolve(selectedAlert.id);
      if (result.success && result.data) {
        await fetchAlerts();
        await fetchAlertDetail(selectedAlert.id);
      }
    } catch (error) {
      console.error('标记解决失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const LevelBadge = ({ level, pulse }: { level: AlertLevel; pulse?: boolean }) => {
    const cfg = levelConfig[level];
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.bg, cfg.text, cfg.border)}>
        <span className={cn('w-2 h-2 rounded-full', cfg.text.replace('text-', 'bg-'))} style={pulse ? { animation: 'pulse 2s infinite' } : {}} />
        {cfg.label}
      </span>
    );
  };

  const FilterGroup = ({ label, value, options, onChange }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
  }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex rounded-lg bg-slate-800/50 p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md transition-all',
              value === opt.value
                ? 'bg-blue-500/30 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const AlertCard = ({ alert, index }: { alert: Alert; index: number }) => {
    const lc = levelConfig[alert.level];
    const ti = typeInfo[alert.type];
    const si = statusInfo[alert.status];
    const TypeIcon = ti.icon;
    const StatusIcon = si.icon;

    return (
      <div
        className={cn('glass rounded-xl p-5 card-hover animate-slide-up relative overflow-hidden', alert.level !== 'level1' && lc.glow)}
        style={{ animationDelay: `${0.25 + index * 0.05}s` }}
      >
        <div className={cn('absolute inset-0 rounded-xl opacity-30 pointer-events-none border', lc.border)} />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-lg', lc.bg)}><TypeIcon className={cn('w-5 h-5', lc.text)} /></div>
              <div>
                <LevelBadge level={alert.level} pulse={alert.status === 'pending'} />
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  {ti.label}
                </div>
              </div>
            </div>
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', si.className)}>
              <StatusIcon className="w-3 h-3" />
              {si.label}
            </span>
          </div>
          <p className="text-sm text-slate-200 mb-3 line-clamp-2">{alert.message}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">关联任务：</span>
            <span className="text-xs text-cyan-400 truncate">{alert.taskName}</span>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">偏差数值</span>
              <span className="text-xs text-slate-500">阈值</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-lg font-bold font-mono', lc.text)}>{alert.deviation.toFixed(5)}</span>
              <span className="text-sm text-slate-400 font-mono">{alert.threshold}</span>
            </div>
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min((alert.deviation / alert.threshold) * 100, 100)}%`, backgroundColor: lc.color }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{formatRelative(alert.createdAt)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewDetail(alert)}
                className="px-3 py-1.5 text-xs rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />查看详情
              </button>
              {alert.status === 'pending' && (
                <button
                  onClick={() => handleOpenReview(alert)}
                  className="px-3 py-1.5 text-xs rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />复核处理
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">预警中心</h1>
            <p className="text-sm text-slate-400">实时监控模拟任务异常，及时处理预警信息</p>
          </div>
        </div>
        {loading && <span className="text-xs text-cyan-400">刷新中...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['level1', 'level2', 'level3'] as AlertLevel[]).map((level, i) => {
          const cfg = levelConfig[level];
          return (
            <div key={level} className={cn('glass rounded-xl p-5 card-hover animate-slide-up relative overflow-hidden', cfg.glow)} style={{ animationDelay: `${0.05 + i * 0.05}s` }}>
              <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20', cfg.text.replace('text-', 'bg-'))} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2.5 rounded-lg', cfg.bg)}><AlertTriangle className={cn('w-5 h-5', cfg.text)} /></div>
                  <LevelBadge level={level} pulse />
                </div>
                <div className={cn('text-3xl font-bold mb-1', cfg.text)}>{stats[level as keyof typeof stats]}</div>
                <div className="text-sm text-slate-400">{cfg.label}总数</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">筛选：</span>
          </div>
          <FilterGroup
            label="级别"
            value={levelFilter}
            options={[{ value: 'all', label: '全部' }, { value: 'level1', label: '一级' }, { value: 'level2', label: '二级' }, { value: 'level3', label: '三级' }]}
            onChange={(v) => setLevelFilter(v as AlertLevel | 'all')}
          />
          <FilterGroup
            label="状态"
            value={statusFilter}
            options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待处理' }, { value: 'reviewed', label: '已复核' }, { value: 'resolved', label: '已解决' }]}
            onChange={(v) => setStatusFilter(v as AlertStatus | 'all')}
          />
          <FilterGroup
            label="类型"
            value={typeFilter}
            options={[{ value: 'all', label: '全部' }, { value: 'radiation_balance', label: '辐射平衡' }, { value: 'fitting_residual', label: '光谱拟合' }, { value: 'region_deviation', label: '区域偏差' }]}
            onChange={(v) => setTypeFilter(v as AlertType | 'all')}
          />
          <div className="flex-1 min-w-[200px] ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="搜索预警消息或任务名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {alerts.map((alert, i) => (
          <AlertCard key={alert.id} alert={alert} index={i} />
        ))}
      </div>

      {alerts.length === 0 && !loading && (
        <div className="glass rounded-xl p-12 text-center animate-fade-in">
          <XCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">暂无符合条件的预警信息</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              page === 1
                ? 'border-slate-700/50 text-slate-600 cursor-not-allowed'
                : 'border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                page === p
                  ? 'bg-blue-500/30 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              page === totalPages
                ? 'border-slate-700/50 text-slate-600 cursor-not-allowed'
                : 'border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 ml-2">
            共 {total} 条
          </span>
        </div>
      )}

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedAlert(null); setShowReview(false); }}>
          <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className={cn('p-5 border-b border-slate-700/50 relative overflow-hidden', levelConfig[selectedAlert.level].bg)}>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2.5 rounded-xl border', levelConfig[selectedAlert.level].bg, levelConfig[selectedAlert.level].border)}>
                    <AlertOctagon className={cn('w-6 h-6', levelConfig[selectedAlert.level].text)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">预警详情</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <LevelBadge level={selectedAlert.level} />
                      <span className="text-xs text-slate-400">ID: {selectedAlert.id}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setSelectedAlert(null); setShowReview(false); }} className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)] space-y-5">
              {detailLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">加载中...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />基本信息
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">预警类型</div>
                        <div className="text-sm text-white flex items-center gap-2">
                          {(() => { const Icon = typeInfo[selectedAlert.type].icon; return <Icon className="w-4 h-4 text-cyan-400" />; })()}
                          {typeInfo[selectedAlert.type].label}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">当前状态</div>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusInfo[selectedAlert.status].className)}>
                          {statusInfo[selectedAlert.status].label}
                        </span>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">关联任务</div>
                        <div className="text-sm text-cyan-400 truncate">{selectedAlert.taskName}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">创建时间</div>
                        <div className="text-sm text-white">{formatTime(selectedAlert.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-orange-500 to-yellow-400 rounded-full" />预警描述
                    </h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-200 leading-relaxed">{selectedAlert.message}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-400 rounded-full" />偏差对比
                    </h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-end justify-around gap-8 h-40 px-8">
                        <div className="flex flex-col items-center gap-2 flex-1">
                          <div className="text-xs text-slate-400 font-mono">{selectedAlert.threshold}</div>
                          <div className="w-full max-w-[60px] bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-md" style={{ height: '100px' }} />
                          <span className="text-xs text-slate-500">阈值</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 flex-1">
                          <div className={cn('text-xs font-mono font-bold', levelConfig[selectedAlert.level].text)}>
                            {selectedAlert.deviation.toFixed(5)}
                          </div>
                          <div className="relative w-full max-w-[60px] rounded-t-md" style={{ height: `${Math.min((selectedAlert.deviation / selectedAlert.threshold) * 100, 150)}px` }}>
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', levelConfig[selectedAlert.level].bg, levelConfig[selectedAlert.level].text)}>
                                +{((selectedAlert.deviation / selectedAlert.threshold - 1) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-full rounded-t-md" style={{ backgroundColor: levelConfig[selectedAlert.level].color }} />
                          </div>
                          <span className="text-xs text-slate-500">实际偏差</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                        <span className="text-xs text-slate-500">超出阈值</span>
                        <span className={cn('text-sm font-bold font-mono', levelConfig[selectedAlert.level].text)}>
                          {(selectedAlert.deviation - selectedAlert.threshold).toFixed(5)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-400 rounded-full" />处理建议
                    </h4>
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <ul className="space-y-2 text-sm text-slate-300">
                        {suggestions[selectedAlert.type].map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {selectedAlert.adjustmentLogs && selectedAlert.adjustmentLogs.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-400 rounded-full" />调整日志
                      </h4>
                      <div className="space-y-3">
                        {selectedAlert.adjustmentLogs.map((log) => (
                          <div key={log.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-cyan-400">{log.parameter}</span>
                              <span className="text-xs text-slate-500">{formatTime(log.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm mb-2">
                              <span className="text-slate-400">调整前：</span>
                              <span className="text-orange-400 font-mono">{log.oldValue}</span>
                              <span className="text-slate-500">→</span>
                              <span className="text-emerald-400 font-mono">{log.newValue}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              <span>操作人：{log.operator}</span>
                              {log.reason && <span className="ml-4">原因：{log.reason}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!showReview ? (
              <div className="p-4 border-t border-slate-700/50 flex items-center justify-end gap-3">
                <button onClick={() => setSelectedAlert(null)} className="px-4 py-2 text-sm rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors">
                  关闭
                </button>
                {selectedAlert.status === 'pending' && (
                  <button onClick={() => setShowReview(true)} className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2">
                    <Settings className="w-4 h-4" />复核处理
                  </button>
                )}
                {selectedAlert.status === 'reviewed' && (
                  <button onClick={handleResolve} disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" />标记已解决
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 border-t border-slate-700/50 space-y-4 max-h-[400px] overflow-y-auto">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-cyan-400" />复核处理
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-slate-400">复核操作</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReviewAction('ignore')}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all',
                        reviewAction === 'ignore'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600/50'
                      )}
                    >
                      <SkipForward className="w-4 h-4 inline mr-1" />忽略
                    </button>
                    <button
                      onClick={() => setReviewAction('adjust')}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all',
                        reviewAction === 'adjust'
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600/50'
                      )}
                    >
                      <Settings className="w-4 h-4 inline mr-1" />参数调整
                    </button>
                  </div>
                </div>

                {reviewAction === 'adjust' && (
                  <div className="space-y-3 bg-slate-800/30 rounded-lg p-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">调整参数</label>
                      <select
                        value={adjustmentParam}
                        onChange={(e) => setAdjustmentParam(e.target.value)}
                        className="w-full text-sm"
                      >
                        {parameterOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">调整前值</label>
                        <input
                          type="number"
                          value={adjustmentOldValue}
                          onChange={(e) => setAdjustmentOldValue(e.target.value)}
                          placeholder="输入原值"
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">调整后值</label>
                        <input
                          type="number"
                          value={adjustmentNewValue}
                          onChange={(e) => setAdjustmentNewValue(e.target.value)}
                          placeholder="输入新值"
                          className="w-full text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">调整原因</label>
                      <textarea
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="请输入调整原因..."
                        rows={2}
                        className="w-full text-sm resize-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">复核备注</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="请输入复核备注..."
                    rows={2}
                    className="w-full text-sm resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setShowReview(false)} className="px-4 py-2 text-sm rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <X className="w-4 h-4" />取消
                  </button>
                  <button onClick={handleReview} disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2 disabled:opacity-50">
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />提交中...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" />确认复核</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
