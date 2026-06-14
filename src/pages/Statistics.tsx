import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Target,
  Clock,
  AlertTriangle,
  TrendingUp,
  Play,
  Pause,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import { statisticsApi } from '@/api';
import { cn } from '@/lib/utils';
import type { RegionStatus, StatisticsOverview, TrendData } from '@/types';

type TimeRange = 'day' | 'week' | 'month';

const trendDataMap: Record<TimeRange, { label: string; value: number }[]> = {
  day: Array.from({ length: 24 }, (_, i) => ({
    label: `${String(i).padStart(2, '0')}:00`,
    value: 60 + Math.sin(i * 0.5) * 20 + Math.random() * 15,
  })),
  week: [
    { label: '周一', value: 85 },
    { label: '周二', value: 92 },
    { label: '周三', value: 78 },
    { label: '周四', value: 88 },
    { label: '周五', value: 95 },
    { label: '周六', value: 72 },
    { label: '周日', value: 90 },
  ],
  month: Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}日`,
    value: 75 + Math.sin(i * 0.3) * 15 + Math.random() * 10,
  })),
};

const accuracyDistribution = [
  { range: '80-85%', count: 12 },
  { range: '85-90%', count: 28 },
  { range: '90-95%', count: 45 },
  { range: '95-98%', count: 32 },
  { range: '98-100%', count: 18 },
];

const resourceColors = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b'];
const resourceData = [
  { name: '计算节点', value: 45 },
  { name: '存储资源', value: 25 },
  { name: '网络带宽', value: 15 },
  { name: '内存使用', value: 15 },
];

const statCards = [
  { key: 'rate', label: '模拟完成率', icon: Target, color: 'emerald', trend: '5.2%' },
  { key: 'accuracy', label: '平均反演精度', icon: BarChart3, color: 'cyan', trend: '2.8%' },
  { key: 'duration', label: '总计算时长', icon: Clock, color: 'purple', trend: '累计' },
  { key: 'alert', label: '预警发生率', icon: AlertTriangle, color: 'red', trend: '1.3%' },
];

interface RegionDetail {
  region: RegionStatus;
  recentDeviations: Array<{ date: string; deviation: number; taskId: string }>;
  pauseReason?: string;
  pausedAt?: string;
}

export default function Statistics() {
  const [statistics, setStatistics] = useState<StatisticsOverview | null>(null);
  const [regions, setRegions] = useState<RegionStatus[]>([]);
  const [completionTrend, setCompletionTrend] = useState<TrendData[]>([]);
  const [accuracyTrend, setAccuracyTrend] = useState<TrendData[]>([]);
  const [resourceTrend, setResourceTrend] = useState<TrendData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionDetail | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const fetchData = useCallback(async () => {
    const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
    const [overviewRes, completionRes, accuracyRes, resourcesRes, regionsRes] = await Promise.all([
      statisticsApi.getOverview(),
      statisticsApi.getCompletionRate(days),
      statisticsApi.getAccuracy(days),
      statisticsApi.getResources(days),
      statisticsApi.getRegions(),
    ]);

    if (overviewRes.success && overviewRes.data) {
      setStatistics(overviewRes.data);
    }
    if (completionRes.success && completionRes.data) {
      setCompletionTrend(completionRes.data);
    }
    if (accuracyRes.success && accuracyRes.data) {
      setAccuracyTrend(accuracyRes.data);
    }
    if (resourcesRes.success && resourcesRes.data) {
      setResourceTrend(resourcesRes.data);
    }
    if (regionsRes.success && regionsRes.data) {
      setRegions(regionsRes.data);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegionClick = async (regionName: string) => {
    const res = await statisticsApi.getRegionDetail(regionName);
    if (res.success && res.data) {
      setSelectedRegion(res.data);
      setShowRegionModal(true);
    }
  };

  const trendData = completionTrend.map((item) => ({ label: item.date, value: item.value }));
  const accuracyDistribution = accuracyTrend.length > 0
    ? accuracyTrend.map((item) => ({ range: item.date, count: item.value }))
    : [{ range: '暂无数据', count: 0 }];
  const maxAccuracyCount = Math.max(...accuracyDistribution.map((d) => d.count), 1);

  const avgCompletion = useMemo(() => {
    const sum = trendData.reduce((acc, item) => acc + item.value, 0);
    return (sum / trendData.length).toFixed(1);
  }, [trendData]);

  const buildLinePath = (data: { label: string; value: number }[], w: number, h: number, pad: number) => {
    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => ({
      x: pad + (i / (data.length - 1)) * (w - pad * 2),
      y: h - pad - ((d.value - minVal) / range) * (h - pad * 2),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + ((curr.x - prev.x) * 2) / 3;
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    return {
      linePath: path,
      areaPath: `${path} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`,
      points,
    };
  };

  const chartW = 700;
  const chartH = 200;
  const chartPad = 30;
  const { linePath, areaPath, points } = buildLinePath(trendData, chartW, chartH, chartPad);

  const donutSize = 160;
  const donutStroke = 20;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCirc = 2 * Math.PI * donutRadius;

  const regionAccuracy = regions.map((r) => ({
    region: r.region,
    accuracy: 100 - r.avgDeviation,
    taskCount: r.taskCount,
  }));
  const maxRegionAcc = Math.max(...regionAccuracy.map((d) => d.accuracy));

  const getStatValue = (key: string) => {
    if (!statistics) {
      return { rate: '92.5%', accuracy: '94.8%', duration: '458h', alert: '14.7%' }[key];
    }
    switch (key) {
      case 'rate':
        return `${(statistics.successRate * 100).toFixed(1)}%`;
      case 'accuracy':
        return `${(statistics.avgAccuracy * 100).toFixed(1)}%`;
      case 'duration':
        return `${statistics.totalResourceUsage.toFixed(0)}h`;
      case 'alert':
        return `${((statistics.alertCount / (statistics.totalTasks || 1)) * 100).toFixed(1)}%`;
      default:
        return '0';
    }
  };

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: 'text-cyan-400' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: 'text-purple-400' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'text-red-400' },
  };

  let donutOffset = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">综合统计看板</h1>
            <p className="text-sm text-slate-400">全方位数据分析与指标监控</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/50 border border-slate-700/50">
          {(['day', 'week', 'month'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                timeRange === range
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              {range === 'day' ? '日' : range === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={card.key} className="glass rounded-xl p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-2 rounded-lg', colorClasses[card.color].bg)}>
                <card.icon className={cn('w-5 h-5', colorClasses[card.color].icon)} />
              </div>
              <div className={cn('flex items-center gap-1 text-xs', colorClasses[card.color].text)}>
                {card.key === 'duration' ? <Clock className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                <span>{card.trend}</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{getStatValue(card.key)}</div>
            <div className="text-sm text-slate-400">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-400 rounded-full" />
              完成率趋势
            </h2>
            <div className="text-sm">
              <span className="text-slate-400">平均 </span>
              <span className="text-cyan-400 font-semibold">{avgCompletion}%</span>
            </div>
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1={chartPad}
                  y1={chartPad + ratio * (chartH - chartPad * 2)}
                  x2={chartW - chartPad}
                  y2={chartPad + ratio * (chartH - chartPad * 2)}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
              <path d={areaPath} fill="url(#areaGrad)" />
              <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                  <title>{trendData[i].label}: {trendData[i].value.toFixed(1)}%</title>
                </g>
              ))}
            </svg>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              {trendData.filter((_, i) => i % Math.ceil(trendData.length / 6) === 0).map((item) => (
                <span key={item.label}>{item.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-400 rounded-full" />
            精度分布图
          </h2>
          <div className="h-48 flex items-end justify-between gap-3 px-2">
            {accuracyDistribution.map((item) => (
              <div key={item.range} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group flex justify-center">
                  <div
                    className="w-10 bg-gradient-to-t from-purple-600 to-pink-400 rounded-t-md transition-all duration-500 hover:from-pink-400 hover:to-purple-400"
                    style={{ height: `${(item.count / maxAccuracyCount) * 140}px` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-slate-800 text-pink-400 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-pink-500/30 z-10">
                    {item.count} 个任务
                  </div>
                </div>
                <span className="text-xs text-slate-500">{item.range}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-3 text-center">
            <div><div className="text-lg font-bold text-purple-400">{statistics?.totalTasks ?? 0}</div><div className="text-xs text-slate-500">总任务数</div></div>
            <div><div className="text-lg font-bold text-cyan-400">{statistics ? `${(statistics.avgAccuracy * 100).toFixed(1)}%` : '0%'}</div><div className="text-xs text-slate-500">平均精度</div></div>
            <div><div className="text-lg font-bold text-emerald-400">{statistics ? `${statistics.successRate * 100}%` : '0%'}</div><div className="text-xs text-slate-500">优秀率</div></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-400 rounded-full" />
            区域精度对比
          </h2>
          <div className="space-y-4">
            {regionAccuracy.map((item, idx) => (
              <div key={item.region} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {item.region}
                  </span>
                  <span className="text-cyan-400 font-medium">{item.accuracy.toFixed(1)}%</span>
                </div>
                <div className="w-full h-6 bg-slate-700/30 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-lg transition-all duration-700"
                    style={{ width: `${(item.accuracy / maxRegionAcc) * 100}%`, animationDelay: `${0.1 + idx * 0.1}s` }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {item.taskCount} 任务
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-400 rounded-full" />
            资源消耗趋势
          </h2>
          <div className="h-48 flex items-end justify-between gap-1 px-2">
            {resourceTrend.map((item, index) => (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group">
                  <div
                    className="w-full bg-gradient-to-t from-amber-600 to-orange-400 rounded-t-md transition-all duration-500 hover:from-orange-400 hover:to-amber-400"
                    style={{
                      height: `${Math.max(item.value * 1.5, 4)}px`,
                      animationDelay: `${0.3 + index * 0.03}s`,
                    }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-slate-800 text-orange-400 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-orange-500/30 z-10">
                    {item.value}%
                  </div>
                </div>
                {index % Math.ceil(resourceTrend.length / 6) === 0 && (
                  <span className="text-xs text-slate-500">{item.date}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-3 text-center">
            <div><div className="text-lg font-bold text-orange-400">{statistics ? statistics.totalResourceUsage.toFixed(0) : 0}h</div><div className="text-xs text-slate-500">总消耗</div></div>
            <div><div className="text-lg font-bold text-cyan-400">{resourceTrend.length > 0 ? (resourceTrend.reduce((s, i) => s + i.value, 0) / resourceTrend.length).toFixed(1) : 0}%</div><div className="text-xs text-slate-500">平均利用率</div></div>
            <div><div className="text-lg font-bold text-emerald-400">{resourceTrend.length > 0 ? Math.min(...resourceTrend.map(i => i.value)).toFixed(1) : 0}%</div><div className="text-xs text-slate-500">最低值</div></div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-400 rounded-full" />
            区域偏差监控
          </h2>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">导出报表</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">区域名称</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">平均偏差</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">任务数量</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">状态</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">最近模拟</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {regions.map((region: RegionStatus, idx: number) => (
                <tr
                  key={region.region}
                  className="hover:bg-slate-700/20 transition-colors cursor-pointer"
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                  onClick={() => handleRegionClick(region.region)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className={cn('w-4 h-4', region.isPaused ? 'text-slate-500' : 'text-cyan-400')} />
                      <span className={cn('font-medium', region.isPaused ? 'text-slate-400' : 'text-white')}>{region.region}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'font-semibold',
                      region.avgDeviation > 5 ? 'text-red-400' : region.avgDeviation > 3 ? 'text-amber-400' : 'text-emerald-400'
                    )}>
                      {region.avgDeviation}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center"><span className="text-slate-300">{region.taskCount}</span></td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      region.isPaused ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', region.isPaused ? 'bg-amber-400' : 'bg-emerald-400')} />
                      {region.isPaused ? '已暂停' : '运行中'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-slate-400 text-sm">
                      {new Date(region.lastSimulationAt).toLocaleDateString('zh-CN', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        region.isPaused ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {region.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRegionModal && selectedRegion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedRegion.region.region}</h3>
                  <p className="text-sm text-slate-400">区域详情</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegionModal(false)}
                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              {selectedRegion.region.isPaused && selectedRegion.pauseReason && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Pause className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-amber-400">区域已暂停</span>
                  </div>
                  <p className="text-sm text-slate-300">{selectedRegion.pauseReason}</p>
                  {selectedRegion.pausedAt && (
                    <p className="text-xs text-slate-500 mt-2">
                      暂停时间：{new Date(selectedRegion.pausedAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <div className="text-xl font-bold text-white">{selectedRegion.region.taskCount}</div>
                  <div className="text-xs text-slate-500">任务数</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <div className={cn(
                    'text-xl font-bold',
                    selectedRegion.region.avgDeviation > 5 ? 'text-red-400' :
                    selectedRegion.region.avgDeviation > 3 ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {selectedRegion.region.avgDeviation}%
                  </div>
                  <div className="text-xs text-slate-500">平均偏差</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <div className={cn(
                    'text-xl font-bold',
                    selectedRegion.region.isPaused ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {selectedRegion.region.isPaused ? '已暂停' : '运行中'}
                  </div>
                  <div className="text-xs text-slate-500">状态</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  最近超标记录
                </h4>
                <div className="space-y-2">
                  {selectedRegion.recentDeviations.length > 0 ? (
                    selectedRegion.recentDeviations.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
                      >
                        <div>
                          <div className="text-sm text-slate-300">任务 {item.taskId}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(item.date).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <span className={cn(
                          'text-sm font-semibold',
                          item.deviation > 5 ? 'text-red-400' : 'text-amber-400'
                        )}>
                          {item.deviation}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      暂无超标记录
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-700/50 flex justify-end gap-3">
              <button
                onClick={() => setShowRegionModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                关闭
              </button>
              <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                查看完整报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
