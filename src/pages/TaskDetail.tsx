import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Download,
  Trash2,
  Clock,
  Sparkles,
  Cpu,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Layers,
  CloudRain,
  Ruler,
  Settings,
  Eye,
  Thermometer,
  Sun,
  Target,
  TrendingUp,
  Shield,
  History,
  ChevronRight,
} from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import type { TaskStatus, SimulationTask, SpectrumData } from '@/types';
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

const timelineStatuses: { status: TaskStatus; label: string }[] = [
  { status: 'pending', label: '待校验' },
  { status: 'modeling', label: '模型构建' },
  { status: 'computing', label: '辐射传输计算' },
  { status: 'synthesizing', label: '光谱合成' },
  { status: 'completed', label: '完成' },
];

const statusOrder: TaskStatus[] = ['pending', 'modeling', 'computing', 'synthesizing', 'completed', 'failed', 'rollback'];

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, approvals } = useAppStore();

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);
  const taskApprovals = useMemo(() => approvals.filter((a) => a.taskId === id), [approvals, id]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  const isStatusCompleted = (status: TaskStatus) => {
    if (!task) return false;
    const currentIdx = statusOrder.indexOf(task.status);
    const targetIdx = statusOrder.indexOf(status);
    return currentIdx > targetIdx;
  };

  const isStatusCurrent = (status: TaskStatus) => task?.status === status;

  const renderSpectrumChart = (data: SpectrumData[], color: string, label: string) => {
    const width = 280;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (data.length === 0) return null;

    const minWL = data[0].wavelength;
    const maxWL = data[data.length - 1].wavelength;
    const maxVal = Math.max(...data.map((d) => d.value));
    const minVal = Math.min(...data.map((d) => d.value));
    const valRange = maxVal - minVal || 1;

    const points = data.map((d) => {
      const x = padding.left + ((d.wavelength - minWL) / (maxWL - minWL)) * chartWidth;
      const y = padding.top + chartHeight - ((d.value - minVal) / valRange) * chartHeight;
      return `${x},${y}`;
    });

    const areaPoints = `${padding.left},${padding.top + chartHeight} ${points.join(' ')} ${padding.left + chartWidth},${padding.top + chartHeight}`;

    return (
      <div className="glass-light rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-2">{label}</div>
        <svg width={width} height={height} className="w-full">
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="rgba(59, 130, 246, 0.1)"
              strokeDasharray="2,2"
            />
          ))}
          <polygon points={areaPoints} fill={`url(#gradient-${label})`} />
          <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1.5" />
          <text x={padding.left} y={height - 5} className="text-[10px] fill-slate-500">{minWL}μm</text>
          <text x={width - padding.right} y={height - 5} className="text-[10px] fill-slate-500 text-anchor-end">{maxWL}μm</text>
          <text x={padding.left - 5} y={padding.top + 5} className="text-[10px] fill-slate-500 text-anchor-end">{maxVal.toFixed(2)}</text>
        </svg>
      </div>
    );
  };

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">任务不存在</h2>
        <p className="text-slate-400 mb-6">未找到ID为 {id} 的任务</p>
        <button onClick={() => navigate('/tasks')} className="btn btn-primary">
          <ArrowLeft className="w-4 h-4" />返回任务列表
        </button>
      </div>
    );
  }

  const cfg = statusConfig[task.status];
  const StatusIcon = cfg.icon;
  const hasResults = task.status === 'completed' || task.status === 'failed' || task.status === 'rollback';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 animate-slide-up">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 rounded-lg glass hover:border-blue-500/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{task.name}</h1>
          <p className="text-sm text-slate-400">
            任务ID: <span className="font-mono text-cyan-400">{task.id}</span>
          </p>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border', cfg.bg, cfg.color, cfg.border)}>
          <StatusIcon className={cn('w-4 h-4', task.status === 'computing' && 'animate-spin')} />
          {cfg.label}
        </span>
      </div>

      <div className="glass rounded-xl p-4 flex items-center justify-between animate-slide-up stagger-1">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-slate-400">区域：</span>
            <span className="text-white font-medium">{task.region}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">创建人：</span>
            <span className="text-white font-medium">{task.createdBy}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">创建时间：</span>
            <span className="text-white font-mono">{formatDate(task.createdAt)}</span>
          </div>
          {task.computeDuration && (
            <div className="text-sm">
              <span className="text-slate-400">计算耗时：</span>
              <span className="text-cyan-400 font-mono">{formatDuration(task.computeDuration)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">
            <RotateCcw className="w-4 h-4" />重启
          </button>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />导出
          </button>
          <button className="btn btn-danger">
            <Trash2 className="w-4 h-4" />删除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <div className="glass rounded-xl p-5 animate-slide-up stagger-2">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              状态时间线
            </h2>
            <div className="relative">
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500/50 via-blue-500/30 to-slate-700" />
              <div className="space-y-6">
                {timelineStatuses.map((item, index) => {
                  const completed = isStatusCompleted(item.status);
                  const current = isStatusCurrent(item.status);
                  const itemCfg = statusConfig[item.status];
                  const ItemIcon = itemCfg.icon;

                  return (
                    <div key={item.status} className="relative flex items-start gap-4 pl-8">
                      <div
                        className={cn(
                          'absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                          completed && 'bg-green-500/20 border-green-500',
                          current && `bg-gradient-to-r ${itemCfg.gradient} border-transparent shadow-glow animate-glow-pulse`,
                          !completed && !current && 'bg-deep-800 border-slate-600'
                        )}
                      >
                        {completed ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : current ? (
                          <ItemIcon className="w-3 h-3 text-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className={cn('text-sm font-medium', completed || current ? 'text-white' : 'text-slate-500')}>
                          {item.label}
                        </div>
                        {(completed || current) && (
                          <div className="text-xs text-slate-400 mt-1 font-mono">
                            {formatDate(task.updatedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(task.status === 'failed' || task.status === 'rollback') && (
                  <div className="relative flex items-start gap-4 pl-8">
                    <div className={cn(
                      'absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      'bg-red-500/20 border-red-500'
                    )}>
                      <XCircle className="w-3 h-3 text-red-400" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="text-sm font-medium text-red-400">
                        {task.status === 'failed' ? '计算失败' : '异常回退'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {formatDate(task.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-5 animate-slide-up stagger-3">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              参数配置
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">大气廓线文件</div>
                  <div className="text-sm text-white font-mono">{task.parameters.profileFile}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Layers className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">下垫面类型</div>
                  <div className="text-sm text-white">{task.parameters.surfaceType}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <CloudRain className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">气溶胶模式</div>
                  <div className="text-sm text-white">{task.parameters.aerosolModel}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Ruler className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">波长范围</div>
                  <div className="text-sm text-white font-mono">
                    {task.parameters.wavelengthRange[0]} - {task.parameters.wavelengthRange[1]} μm
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Eye className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">光谱分辨率</div>
                  <div className="text-sm text-white font-mono">{task.parameters.spectralResolution} μm</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Sun className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">观测角度</div>
                  <div className="text-sm text-white font-mono">{task.parameters.observationAngle}°</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          {hasResults && task.results && (
            <div className="glass rounded-xl p-5 animate-slide-up stagger-2">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                计算结果
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {renderSpectrumChart(task.results.transmittance, '#00D4FF', '大气透过率')}
                {renderSpectrumChart(task.results.reflectance, '#10B981', '地表反射率')}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="glass-light rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-slate-400">辐射平衡偏差</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {task.results.radiationBalance.toExponential(2)}
                  </div>
                </div>
                <div className="glass-light rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-400">光谱拟合残差</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {task.results.fittingResidual.toFixed(4)}
                  </div>
                </div>
                <div className="glass-light rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-400">反演精度</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-green-400">
                    {task.results.accuracy ? `${(task.results.accuracy * 100).toFixed(1)}%` : '-'}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">卫星通道亮温</h3>
                <div className="grid grid-cols-4 gap-2">
                  {task.results.brightnessTemperature.map((ch) => (
                    <div key={ch.channel} className="glass-light rounded-lg p-2 text-center">
                      <div className="text-xs text-slate-400 font-mono">{ch.channel}</div>
                      <div className="text-sm font-bold text-cyan-400 font-mono">
                        {ch.value < 10 ? ch.value.toFixed(3) : ch.value.toFixed(1)}
                        <span className="text-xs text-slate-500 ml-1">{ch.wavelength < 3 ? '' : 'K'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-5 animate-slide-up stagger-3">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              审批记录
            </h2>
            {taskApprovals.length > 0 ? (
              <div className="space-y-3">
                {taskApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="glass-light rounded-lg p-4 flex items-start gap-4"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      approval.status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'
                    )}>
                      {approval.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{approval.approver}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            approval.level === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                          )}>
                            {approval.level === 1 ? '一级审批' : '二级审批'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {formatDate(approval.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mt-2">{approval.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无审批记录</p>
              </div>
            )}
          </div>

          {task.alertLevel && (
            <div className="glass rounded-xl p-5 animate-slide-up stagger-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                调整日志
              </h2>
              <div className="glass-light rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn(
                      'w-5 h-5',
                      task.alertLevel === 'level1' ? 'text-yellow-400' :
                      task.alertLevel === 'level2' ? 'text-orange-400' : 'text-red-400'
                    )} />
                    <span className="font-medium text-white">
                      {task.alertLevel === 'level1' ? '一级预警' :
                       task.alertLevel === 'level2' ? '二级预警' : '三级预警'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{formatDate(task.updatedAt)}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">参数</div>
                    <div className="text-sm text-white font-mono">aerosol_optical_depth</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">调整前</div>
                    <div className="text-sm text-red-400 font-mono flex items-center gap-1">
                      0.350 <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">调整后</div>
                    <div className="text-sm text-green-400 font-mono">0.420</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-space-700/50">
                  <div className="text-xs text-slate-400 mb-1">调整原因</div>
                  <p className="text-sm text-slate-300">降低系统偏差，提高反演精度</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


