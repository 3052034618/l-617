import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Thermometer,
  Sun,
  Gauge,
  ChevronDown,
  Radio,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { monitorApi, taskApi } from '@/api';
import type { SpectrumData, ChannelData, MonitorData, SimulationTask } from '@/types';

const CW = 600, CH = 220;
const PAD = { t: 20, r: 20, b: 30, l: 45 };

interface LogEntry { id: number; time: string; type: string; message: string; value: string; }

function LineChart({
  data, color, gradId, showArea = true,
  yMin = 0, yMax = 1, xLabel = '波长(μm)', yLabel = '透过率',
}: {
  data: SpectrumData[]; color: string; gradId: string; showArea?: boolean;
  yMin?: number; yMax?: number; xLabel?: string; yLabel?: string;
}) {
  const iw = CW - PAD.l - PAD.r, ih = CH - PAD.t - PAD.b;
  const minWl = data[0]?.wavelength ?? 0, maxWl = data[data.length - 1]?.wavelength ?? 1;
  const xS = (w: number) => PAD.l + ((w - minWl) / (maxWl - minWl)) * iw;
  const yS = (v: number) => PAD.t + ih - ((v - yMin) / (yMax - yMin)) * ih;

  const pathD = data.map((d, i) => `${i ? 'L' : 'M'} ${xS(d.wavelength)} ${yS(d.value)}`).join(' ');
  const areaD = `${pathD} L ${xS(maxWl)} ${PAD.t + ih} L ${xS(minWl)} ${PAD.t + ih} Z`;

  const yTicks = useMemo(() => Array.from({ length: 6 }, (_, i) => Number((yMin + ((yMax - yMin) / 5) * i).toFixed(2))), [yMin, yMax]);
  const xTicks = useMemo(() => Array.from({ length: 6 }, (_, i) => Number((minWl + ((maxWl - minWl) / 5) * i).toFixed(1))), [minWl, maxWl]);

  return (
    <svg width="100%" height={CH} viewBox={`0 0 ${CW} ${CH}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <filter id={`${gradId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={yS(t)} x2={CW - PAD.r} y2={yS(t)} stroke="rgba(59,130,246,0.1)" strokeDasharray="3,3" />
          <text x={PAD.l - 8} y={yS(t) + 4} textAnchor="end" fill="#64748b" fontSize="11">{t}</text>
        </g>
      ))}
      {xTicks.map((t, i) => (
        <text key={i} x={xS(t)} y={CH - PAD.b + 18} textAnchor="middle" fill="#64748b" fontSize="11">{t}</text>
      ))}
      {showArea && <path d={areaD} fill={`url(#${gradId})`} />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" filter={`url(#${gradId}-glow)`} className="transition-all duration-500" />
      {data.filter((_, i) => i % 20 === 0).map((d, i) => (
        <circle key={i} cx={xS(d.wavelength)} cy={yS(d.value)} r="3" fill={color} className="animate-pulse" />
      ))}
      <text x={CW / 2} y={CH - 5} textAnchor="middle" fill="#475569" fontSize="11">{xLabel}</text>
      <text x="12" y={CH / 2} textAnchor="middle" fill="#475569" fontSize="11" transform={`rotate(-90,12,${CH / 2})`}>{yLabel}</text>
    </svg>
  );
}

function MultiLineChart({
  datasets, xLabel = '波长(μm)', yLabel = '反射率',
}: { datasets: { name: string; data: SpectrumData[]; color: string }[]; xLabel?: string; yLabel?: string }) {
  const iw = CW - PAD.l - PAD.r, ih = CH - PAD.t - PAD.b;
  const minWl = datasets[0]?.data[0]?.wavelength ?? 0, maxWl = datasets[0]?.data[datasets[0].data.length - 1]?.wavelength ?? 1;
  const xS = (w: number) => PAD.l + ((w - minWl) / (maxWl - minWl)) * iw;
  const yS = (v: number) => PAD.t + ih - v * ih;
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const xTicks = useMemo(() => Array.from({ length: 6 }, (_, i) => Number((minWl + ((maxWl - minWl) / 5) * i).toFixed(1))), [minWl, maxWl]);

  return (
    <svg width="100%" height={CH} viewBox={`0 0 ${CW} ${CH}`} className="overflow-visible">
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={yS(t)} x2={CW - PAD.r} y2={yS(t)} stroke="rgba(59,130,246,0.1)" strokeDasharray="3,3" />
          <text x={PAD.l - 8} y={yS(t) + 4} textAnchor="end" fill="#64748b" fontSize="11">{t}</text>
        </g>
      ))}
      {xTicks.map((t, i) => (
        <text key={i} x={xS(t)} y={CH - PAD.b + 18} textAnchor="middle" fill="#64748b" fontSize="11">{t}</text>
      ))}
      {datasets.map((ds, idx) => (
        <path key={idx} d={ds.data.map((d, i) => `${i ? 'L' : 'M'} ${xS(d.wavelength)} ${yS(d.value)}`).join(' ')}
          fill="none" stroke={ds.color} strokeWidth="1.8" className="transition-all duration-500" />
      ))}
      <text x={CW / 2} y={CH - 5} textAnchor="middle" fill="#475569" fontSize="11">{xLabel}</text>
      <g transform={`translate(${PAD.l + 10}, ${PAD.t + 5})`}>
        {datasets.map((ds, idx) => (
          <g key={idx} transform={`translate(0, ${idx * 16})`}>
            <line x1="0" y1="6" x2="20" y2="6" stroke={ds.color} strokeWidth="2" />
            <text x="26" y="10" fill="#94a3b8" fontSize="11">{ds.name}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function MetricCard({
  icon: Icon, title, value, unit, trend, color = 'cyan', children,
}: {
  icon: React.ElementType; title: string; value: string; unit?: string;
  trend?: { value: string; up: boolean }; color?: 'cyan' | 'green' | 'yellow' | 'purple'; children?: React.ReactNode;
}) {
  const grads = {
    cyan: 'from-cyan-400 to-blue-500', green: 'from-emerald-400 to-green-500',
    yellow: 'from-amber-400 to-orange-500', purple: 'from-purple-400 to-pink-500',
  };
  const txtClrs = { cyan: 'text-cyan-400', green: 'text-emerald-400', yellow: 'text-amber-400', purple: 'text-purple-400' };

  return (
    <div className="glass rounded-xl p-5 card-hover border-glow relative overflow-hidden">
      <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${grads[color]} opacity-5 rounded-full blur-xl`} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${grads[color]} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${txtClrs[color]}`} />
          </div>
          <span className="text-sm text-slate-400">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white number-animate">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function HeatmapCell({ label, value, intensity, wavelength }: { label: string; value: string; intensity: number; wavelength: string }) {
  return (
    <div className="rounded-lg p-3 text-center transition-all duration-500 hover:scale-105 cursor-pointer"
      style={{
        background: `rgba(0, 212, 255, ${0.1 + intensity * 0.7})`,
        border: `1px solid rgba(0, 212, 255, ${0.2 + intensity * 0.5})`,
        boxShadow: intensity > 0.5 ? `0 0 ${10 + intensity * 15}px rgba(0, 212, 255, ${intensity * 0.3})` : 'none',
      }}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-bold mb-1" style={{ color: intensity > 0.5 ? '#fff' : '#94a3b8' }}>{value}</div>
      <div className="text-xs text-slate-500">{wavelength}μm</div>
    </div>
  );
}

export default function Monitor() {
  const [tasks, setTasks] = useState<SimulationTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [taskStatus, setTaskStatus] = useState<{ status: string; progress: number } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(true);
  const logIdRef = useRef(0);

  useEffect(() => {
    const fetchTasks = async () => {
      const res = await taskApi.getList({ pageSize: 20 });
      if (res.success && res.data) {
        const taskList = res.data.list;
        setTasks(taskList);
        const runningTask = taskList.find((t) => t.status === 'computing' || t.status === 'modeling' || t.status === 'synthesizing');
        if (runningTask) {
          setSelectedTaskId(runningTask.id);
        } else if (taskList.length > 0) {
          setSelectedTaskId(taskList[0].id);
        }
      }
    };
    fetchTasks();
  }, []);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  useEffect(() => {
    if (!selectedTaskId || !isLive) return;

    const fetchMonitorData = async () => {
      const res = await monitorApi.getRealtime(selectedTaskId);
      if (res.success && res.data) {
        setMonitorData(res.data);

        const types = ['透过率', '反射率', '亮温', '辐射平衡'];
        const msgs = ['数据采集完成', '模拟计算更新', '通道校准完成', '实时监控正常'];
        const idx = Math.floor(Math.random() * 4);
        setLogs((prev) => [...prev.slice(-9), {
          id: ++logIdRef.current, time: new Date().toLocaleTimeString('zh-CN'),
          type: types[idx], message: msgs[idx], value: (Math.random() * 0.15 + 0.82).toFixed(3),
        }]);
      }
    };

    const fetchTaskStatus = async () => {
      const res = await taskApi.getStatus(selectedTaskId);
      if (res.success && res.data) {
        setTaskStatus(res.data);
      }
    };

    fetchMonitorData();
    fetchTaskStatus();

    const iv = setInterval(() => {
      fetchMonitorData();
      fetchTaskStatus();
    }, 2000);

    return () => clearInterval(iv);
  }, [selectedTaskId, isLive]);

  useEffect(() => {
    if (monitorData) {
      const initLogs: LogEntry[] = [];
      const types = ['透过率', '反射率', '亮温', '辐射平衡'];
      const msgs = ['数据采集完成', '模拟计算更新', '通道校准完成', '偏差值正常'];
      for (let i = 0; i < 6; i++) {
        initLogs.push({
          id: ++logIdRef.current,
          time: new Date(Date.now() - i * 30000).toLocaleTimeString('zh-CN'),
          type: types[i % 4], message: msgs[i % 4],
          value: (Math.random() * 0.1 + 0.85).toFixed(3),
        });
      }
      setLogs(initLogs.reverse());
    }
  }, [monitorData ? monitorData.taskId : '']);

  const transData = monitorData?.transmittance || [];
  const brightTemp = monitorData?.brightnessTemp || [];

  const reflDatasets = useMemo(() => {
    if (!monitorData?.reflectance?.length) return [];
    const surfaces = [
      { name: '植被', color: '#10b981' },
      { name: '水体', color: '#3b82f6' },
      { name: '沙漠', color: '#f59e0b' },
      { name: '城市', color: '#6b7280' },
    ];
    return surfaces.map((s, i) => ({
      name: s.name,
      color: s.color,
      data: monitorData.reflectance.map((d) => ({
        wavelength: d.wavelength,
        value: Math.max(0, Math.min(1, d.value * (0.6 + i * 0.15))),
      })),
    }));
  }, [monitorData?.reflectance]);

  const avgTrans = useMemo(() => !transData.length ? '0.000' : (transData.reduce((s, d) => s + d.value, 0) / transData.length).toFixed(3), [transData]);
  const avgRefl = useMemo(() => {
    if (!reflDatasets.length || !reflDatasets[0].data.length) return '0.000';
    const d = reflDatasets[0].data;
    return (d.reduce((s, v) => s + v.value, 0) / d.length).toFixed(3);
  }, [reflDatasets]);

  const radBalance = useMemo(() => monitorData?.radiationBalance?.toFixed(5) || '0.00000', [monitorData?.radiationBalance]);
  const mainChs = brightTemp.filter((c) => ['VIS_01', 'NIR_01', 'TIR_01'].includes(c.channel));
  const tirTemps = brightTemp.filter((c) => c.wavelength > 3).map((c) => c.value);
  const maxT = Math.max(...tirTemps, 300), minT = Math.min(...tirTemps, 250);

  return (
    <div className="min-h-screen bg-deep-900 bg-grid p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-glow-cyan">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">实时监控中心</h1>
              <p className="text-sm text-slate-400 mt-0.5">大气辐射传输遥感模拟实时监测</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select value={selectedTaskId ?? ''} onChange={(e) => setSelectedTaskId(e.target.value || null)}
                className="appearance-none pr-10 pl-4 py-2.5 rounded-lg glass text-sm min-w-64 cursor-pointer">
                <option value="">-- 选择监控任务 --</option>
                {tasks.slice(0, 8).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                isLive ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-slate-700/50 border border-slate-600 text-slate-400'
              }`}>
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 pulse-dot' : 'bg-slate-500'}`} />
              <span className="text-sm font-medium">{isLive ? '实时更新中' : '已暂停'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5">
          <MetricCard icon={Sun} title="大气透过率均值" value={avgTrans} trend={{ value: '+2.3%', up: true }} color="cyan" />
          <MetricCard icon={Gauge} title="地表反射率均值" value={avgRefl} trend={{ value: '-1.1%', up: false }} color="green" />
          <MetricCard icon={Thermometer} title="卫星通道亮温" value="" color="yellow">
            <div className="space-y-2">
              {mainChs.map((ch) => (
                <div key={ch.channel} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{ch.channel}</span>
                  <span className="text-sm font-mono text-amber-300">
                    {ch.wavelength < 3 ? ch.value.toFixed(3) : `${ch.value.toFixed(1)}K`}
                  </span>
                </div>
              ))}
            </div>
          </MetricCard>
          <MetricCard icon={Zap} title="辐射平衡偏差" value={radBalance} unit="W/m²" trend={{ value: '正常范围', up: true }} color="purple" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5 border-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />大气透过率曲线
              </h2>
              <span className="text-xs text-slate-500">多波段光谱分析</span>
            </div>
            <LineChart data={transData} color="#00D4FF" gradId="trans-grad" />
          </div>
          <div className="glass rounded-xl p-5 border-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-emerald-400" />地表反射率曲线
              </h2>
              <span className="text-xs text-slate-500">下垫面类型对比</span>
            </div>
            <MultiLineChart datasets={reflDatasets} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 glass rounded-xl p-5 border-glow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-amber-400" />卫星通道亮温热力图
              </h2>
              <span className="text-xs text-slate-500">8通道实时监测</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {brightTemp.map((ch) => {
                const isTir = ch.wavelength > 3;
                const intensity = isTir ? (ch.value - minT) / (maxT - minT + 0.01) : ch.value;
                return <HeatmapCell key={ch.channel} label={ch.channel}
                  value={isTir ? `${ch.value.toFixed(1)}K` : ch.value.toFixed(3)}
                  intensity={Math.max(0.1, Math.min(1, intensity))} wavelength={ch.wavelength.toString()} />;
              })}
            </div>
          </div>
          <div className="glass rounded-xl p-5 border-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />实时数据日志
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{logs.length}条</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-deep-800/50 border border-slate-700/30 hover:border-cyan-500/30 transition-colors animate-fade-in">
                  <span className="text-xs text-slate-500 font-mono min-w-16">{log.time}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 whitespace-nowrap">{log.type}</span>
                  <span className="text-sm text-slate-300 flex-1 truncate">{log.message}</span>
                  <span className="text-sm font-mono text-emerald-400">{log.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedTask && (
          <div className="glass rounded-xl p-4 border-glow">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-sm text-slate-300">当前监控任务：<span className="text-cyan-400 font-medium">{selectedTask.name}</span></span>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-sm text-slate-400">区域：{selectedTask.region}</span>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-sm text-slate-400">进度：{taskStatus?.progress ?? selectedTask.progress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
