import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  AlertCircle,
  Plus,
  Upload,
  FileBarChart,
  Activity,
  Bell,
  CheckSquare,
  Play,
  Pause,
  Eye,
  MapPin,
  BarChart3,
} from 'lucide-react';
import { statisticsApi, alertApi } from '@/api';
import type { AlertLevel, RegionStatus, StatisticsOverview, Alert, TrendData } from '@/types';
import { cn } from '@/lib/utils';

const levelColors: Record<AlertLevel, string> = {
  level1: 'text-yellow-400 bg-yellow-500/20',
  level2: 'text-orange-400 bg-orange-500/20',
  level3: 'text-red-400 bg-red-500/20',
};

const levelLabels: Record<AlertLevel, string> = {
  level1: '一级',
  level2: '二级',
  level3: '三级',
};

const quickActions = [
  { icon: Plus, label: '创建模拟', color: 'from-blue-500 to-cyan-400' },
  { icon: Upload, label: '上传数据', color: 'from-emerald-500 to-teal-400' },
  { icon: FileBarChart, label: '查看报告', color: 'from-purple-500 to-pink-400' },
  { icon: Activity, label: '实时监控', color: 'from-orange-500 to-amber-400' },
  { icon: Bell, label: '预警中心', color: 'from-red-500 to-rose-400' },
  { icon: CheckSquare, label: '审批中心', color: 'from-indigo-500 to-violet-400' },
];

export default function Dashboard() {
  const [statistics, setStatistics] = useState<StatisticsOverview | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [regions, setRegions] = useState<RegionStatus[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchStatistics = useCallback(async () => {
    const [overviewRes, alertsRes, completionRes, regionsRes] = await Promise.all([
      statisticsApi.getOverview(),
      alertApi.getList({ status: 'pending', pageSize: 5 }),
      statisticsApi.getCompletionRate(7),
      statisticsApi.getRegions(),
    ]);

    if (overviewRes.success && overviewRes.data) {
      setStatistics(overviewRes.data);
    }
    if (alertsRes.success && alertsRes.data) {
      setAlerts(alertsRes.data.list);
    }
    if (completionRes.success && completionRes.data) {
      setTrendData(completionRes.data);
    }
    if (regionsRes.success && regionsRes.data) {
      setRegions(regionsRes.data);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    const dataTimer = setInterval(fetchStatistics, 10000);
    return () => {
      clearInterval(timeTimer);
      clearInterval(dataTimer);
    };
  }, [fetchStatistics]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekDay}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const formatAlertTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const pendingApprovals = statistics?.pendingTasks ?? 0;
  const recentAlerts = alerts.slice(0, 5);

  const avgCompletion = trendData.length > 0
    ? (trendData.reduce((sum, item) => sum + item.value, 0) / trendData.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-blue-500/30">
            <LayoutDashboard className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">工作台</h1>
            <p className="text-sm text-slate-400">欢迎回来，今天是个好日子</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-cyan-400 text-glow-cyan">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-slate-400">{formatDate(currentTime)}</div>
        </div>
      </div>

      {/* 统计卡片 2x2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5 card-hover animate-slide-up stagger-1">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>12.5%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 number-animate">
            {statistics?.totalTasks ?? 156}
          </div>
          <div className="text-sm text-slate-400">总任务数</div>
        </div>

        <div className="glass rounded-xl p-5 card-hover animate-slide-up stagger-2">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1 text-cyan-400 text-xs">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>进行中</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2 number-animate">
            {statistics?.runningTasks ?? 12}
          </div>
          <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full progress-glow"
              style={{ width: `${((statistics?.runningTasks ?? 12) / (statistics?.totalTasks ?? 156)) * 100}%` }}
            />
          </div>
          <div className="text-sm text-slate-400 mt-2">进行中任务</div>
        </div>

        <div className="glass rounded-xl p-5 card-hover animate-slide-up stagger-3">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <CheckSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>待处理</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 number-animate">
            {pendingApprovals}
          </div>
          <div className="text-sm text-slate-400">待审批任务</div>
        </div>

        <div className="glass rounded-xl p-5 card-hover animate-slide-up stagger-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="relative">
              <span className="w-2 h-2 bg-red-500 rounded-full pulse-dot text-red-500 inline-block" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400 mb-1 number-animate">
            {statistics?.alertCount ?? 23}
          </div>
          <div className="text-sm text-slate-400">预警数量</div>
        </div>
      </div>

      {/* 快捷操作区 */}
      <div className="glass rounded-xl p-5 animate-slide-up stagger-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
          快捷操作
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={action.label}
              className={cn(
                'group flex flex-col items-center gap-2 p-4 rounded-lg',
                'bg-slate-800/30 hover:bg-slate-700/50',
                'border border-slate-700/50 hover:border-blue-500/50',
                'transition-all duration-300 hover:-translate-y-1'
              )}
              style={{ animationDelay: `${0.3 + index * 0.05}s` }}
            >
              <div
                className={cn(
                  'p-3 rounded-lg bg-gradient-to-br opacity-90 group-hover:opacity-100',
                  'group-hover:scale-110 transition-transform duration-300',
                  action.color
                )}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 实时预警面板 */}
        <div className="glass rounded-xl p-5 animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-orange-400 rounded-full" />
              实时预警
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                {recentAlerts.length} 条
              </span>
            </h2>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  'bg-slate-800/30 hover:bg-slate-700/40',
                  'border border-slate-700/50 hover:border-slate-600/50',
                  'transition-all duration-200 group cursor-pointer'
                )}
                style={{ animationDelay: `${0.35 + index * 0.05}s` }}
              >
                <div className={cn('p-2 rounded-lg', levelColors[alert.level])}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded', levelColors[alert.level])}>
                      {levelLabels[alert.level]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatAlertTime(alert.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 truncate mt-1">{alert.taskName}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 性能趋势图 */}
        <div className="glass rounded-xl p-5 animate-slide-up stagger-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-400 rounded-full" />
              近7天完成率
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">平均</span>
              <span className="text-sm font-semibold text-cyan-400">{avgCompletion}%</span>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {trendData.map((item, index) => (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-md transition-all duration-500 hover:from-cyan-400 hover:to-blue-400"
                    style={{
                      height: `${item.value * 1.4}px`,
                      animationDelay: `${0.5 + index * 0.1}s`,
                    }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-slate-800 text-cyan-400 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cyan-500/30">
                    {item.value}%
                  </div>
                </div>
                <span className="text-xs text-slate-500">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 区域状态概览 */}
      <div className="glass rounded-xl p-5 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-400 rounded-full" />
            区域状态概览
          </h2>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            管理区域
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {regions.map((region: RegionStatus, index: number) => (
            <div
              key={region.region}
              className={cn(
                'p-4 rounded-lg border card-hover',
                region.isPaused
                  ? 'bg-slate-800/30 border-slate-700/50'
                  : 'bg-slate-800/50 border-slate-600/30 hover:border-cyan-500/30'
              )}
              style={{ animationDelay: `${0.45 + index * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className={cn('w-4 h-4', region.isPaused ? 'text-slate-500' : 'text-cyan-400')} />
                  <span className={cn('font-medium text-sm', region.isPaused ? 'text-slate-400' : 'text-white')}>
                    {region.region}
                  </span>
                </div>
                <button className={cn(
                  'p-1 rounded-md transition-colors',
                  region.isPaused
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                )}>
                  {region.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xl font-bold text-white">{region.taskCount}</div>
                  <div className="text-xs text-slate-500">任务数</div>
                </div>
                <div>
                  <div className={cn(
                    'text-xl font-bold',
                    region.avgDeviation > 4 ? 'text-red-400' : region.avgDeviation > 3 ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {region.avgDeviation}%
                  </div>
                  <div className="text-xs text-slate-500">平均偏差</div>
                </div>
              </div>
              {region.isPaused && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <Pause className="w-3 h-3" />
                    已暂停
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
