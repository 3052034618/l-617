import { useState, useMemo } from 'react';
import {
  FileBarChart,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Download,
  Database,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ThermometerSun,
  Layers,
  Target,
  CheckCircle2,
  Lightbulb,
  Calendar,
  DownloadCloud,
  Settings2,
  SlidersHorizontal,
  Clock,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type ReportType = 'comprehensive' | 'spectrum' | 'brightness_temp';

interface ReportSection {
  id: string;
  title: string;
  icon: typeof FileBarChart;
}

interface Report {
  id: string;
  title: string;
  taskName: string;
  type: ReportType;
  createdAt: string;
  gradient: string;
  pattern: 'grid' | 'dots' | 'waves' | 'circuits';
}

const reportTypeConfig: Record<ReportType, { label: string; color: string; bg: string; border: string; icon: typeof FileBarChart }> = {
  comprehensive: { label: '综合报告', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', icon: Layers },
  spectrum: { label: '光谱报告', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', icon: Activity },
  brightness_temp: { label: '亮温报告', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: ThermometerSun },
};

const reportSections: ReportSection[] = [
  { id: 'cover', title: '报告封面', icon: BookOpen },
  { id: 'spectrum', title: '多光谱反射率曲线', icon: Activity },
  { id: 'brightness', title: '热红外亮温分布', icon: ThermometerSun },
  { id: 'correction', title: '大气校正前后对比', icon: Layers },
  { id: 'validation', title: '反演产品精度验证', icon: Target },
  { id: 'conclusion', title: '结论与建议', icon: Lightbulb },
];

const filterOptions: { value: ReportType | 'all'; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'comprehensive', label: '综合报告' },
  { value: 'spectrum', label: '光谱报告' },
  { value: 'brightness_temp', label: '亮温报告' },
];

const gradients = [
  'from-blue-600 via-cyan-500 to-teal-400',
  'from-purple-600 via-violet-500 to-indigo-400',
  'from-orange-500 via-amber-500 to-yellow-400',
  'from-emerald-500 via-teal-500 to-cyan-400',
  'from-rose-500 via-pink-500 to-fuchsia-400',
  'from-indigo-500 via-blue-500 to-cyan-400',
];

const patterns: Report['pattern'][] = ['grid', 'dots', 'waves', 'circuits'];

function generateMockReports(): Report[] {
  const taskNames = [
    '华北平原夏季气溶胶辐射传输模拟',
    '长江三角洲地表反射率反演',
    '珠江三角洲热红外亮温模拟',
    '四川盆地大雾天气辐射模拟',
    '西北戈壁沙漠下垫面反射率测量',
    '青藏高原大气垂直廓线分析',
    '东北地区冰雪覆盖地表辐射特性',
    '南海海域海洋气溶胶光学厚度反演',
    '东部沿海城市空气污染遥感监测',
  ];
  const types: ReportType[] = ['comprehensive', 'spectrum', 'brightness_temp'];
  const reports: Report[] = [];

  for (let i = 0; i < 9; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i / 2));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    reports.push({
      id: `report-${i + 1}`,
      title: `${taskNames[i % taskNames.length]}分析报告`,
      taskName: taskNames[i % taskNames.length],
      type: types[i % 3],
      createdAt: date.toISOString(),
      gradient: gradients[i % gradients.length],
      pattern: patterns[i % patterns.length],
    });
  }
  return reports;
}

const PatternOverlay = ({ pattern }: { pattern: Report['pattern'] }) => {
  if (pattern === 'grid') {
    return (
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>
    );
  }
  if (pattern === 'dots') {
    return (
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }} />
      </div>
    );
  }
  if (pattern === 'waves') {
    return (
      <div className="absolute inset-0 opacity-20 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50 T150,50 T200,50" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
          <path d="M0,70 Q25,50 50,70 T100,70 T150,70 T200,70" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <path d="M0,30 Q25,10 50,30 T100,30 T150,30 T200,30" fill="none" stroke="white" strokeWidth="0.5" opacity="0.4" />
        </svg>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 opacity-15">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <line x1="0" y1="50" x2="30" y2="50" stroke="white" strokeWidth="0.3" />
        <line x1="70" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.3" />
        <line x1="50" y1="0" x2="50" y2="30" stroke="white" strokeWidth="0.3" />
        <line x1="50" y1="70" x2="50" y2="100" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="30" cy="30" r="5" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="70" cy="70" r="5" fill="none" stroke="white" strokeWidth="0.3" />
      </svg>
    </div>
  );
};

const ReportCard = ({ report, onPreview, onExport }: { report: Report; onPreview: (r: Report) => void; onExport: (r: Report) => void }) => {
  const typeCfg = reportTypeConfig[report.type];
  const TypeIcon = typeCfg.icon;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="glass rounded-xl overflow-hidden card-hover group animate-fade-in">
      <div className={cn('relative h-40 bg-gradient-to-br', report.gradient)}>
        <PatternOverlay pattern={report.pattern} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">{report.title}</h3>
        </div>
        <div className="absolute top-3 right-3">
          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm', typeCfg.bg, typeCfg.color, typeCfg.border)}>
            <TypeIcon className="w-3 h-3" />
            {typeCfg.label}
          </span>
        </div>
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <FileBarChart className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">关联任务</p>
          <p className="text-sm text-slate-300 truncate">{report.taskName}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(report.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
          <button
            onClick={() => onPreview(report)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            预览
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            下载PDF
          </button>
          <button
            onClick={() => onExport(report)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            导出数据
          </button>
        </div>
      </div>
    </div>
  );
};

const PreviewModal = ({ report, onClose }: { report: Report; onClose: () => void }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = reportSections.length;

  const goToSection = (index: number) => {
    if (index >= 0 && index < totalSections) {
      setCurrentSection(index);
    }
  };

  const renderSectionContent = () => {
    const section = reportSections[currentSection];

    if (section.id === 'cover') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-12">
          <div className={cn('w-24 h-24 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-8 shadow-2xl', report.gradient)}>
            <FileBarChart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{report.title}</h2>
          <p className="text-slate-400 mb-8">{report.taskName}</p>
          <div className="flex items-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(report.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>{reportTypeConfig[report.type].label}</span>
            </div>
          </div>
        </div>
      );
    }

    if (section.id === 'spectrum') {
      const dataPoints = 50;
      const spectrumData = Array.from({ length: dataPoints }, (_, i) => {
        const wavelength = 0.4 + (i / (dataPoints - 1)) * 2.1;
        const value = 0.3 + Math.sin(wavelength * 2) * 0.15 + Math.cos(wavelength * 0.7) * 0.1 + (Math.random() - 0.5) * 0.05;
        return { wavelength, value: Math.max(0, Math.min(1, value)) };
      });

      return (
        <div className="p-8 h-full flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-2">多光谱反射率曲线</h3>
          <p className="text-sm text-slate-500 mb-6">波长范围：0.4μm - 2.5μm，光谱分辨率：10nm</p>
          <div className="flex-1 relative">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <defs>
                <linearGradient id="spectrumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="40" y1={20 + y * 1.6} x2="380" y2={20 + y * 1.6} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              <path
                d={`M 40 ${200 - 20 - spectrumData[0].value * 160} ${spectrumData.map((d, i) =>
                  `L ${40 + (i / (dataPoints - 1)) * 340} ${200 - 20 - d.value * 160}`
                ).join(' ')}`}
                fill="none"
                stroke="url(#spectrumGrad)"
                strokeWidth="2"
              />
              <path
                d={`M 40 180 L ${spectrumData.map((d, i) =>
                  `L ${40 + (i / (dataPoints - 1)) * 340} ${200 - 20 - d.value * 160}`
                ).join(' ')} L 380 180 Z`}
                fill="url(#spectrumGrad)"
                opacity="0.1"
              />
              <text x="40" y="195" fill="#64748b" fontSize="10">0.4μm</text>
              <text x="380" y="195" fill="#64748b" fontSize="10" textAnchor="end">2.5μm</text>
              <text x="30" y="25" fill="#64748b" fontSize="10" textAnchor="end">1.0</text>
              <text x="30" y="180" fill="#64748b" fontSize="10" textAnchor="end">0.0</text>
            </svg>
          </div>
        </div>
      );
    }

    if (section.id === 'brightness') {
      const gridSize = 20;
      const tempGrid = Array.from({ length: gridSize }, (_, y) =>
        Array.from({ length: gridSize }, (_, x) => {
          const dist = Math.sqrt(Math.pow(x - gridSize / 2, 2) + Math.pow(y - gridSize / 2, 2));
          const base = 280 - dist * 2;
          return base + (Math.random() - 0.5) * 10;
        })
      );

      const getColor = (temp: number) => {
        const t = (temp - 250) / 50;
        const r = Math.floor(30 + t * 200);
        const g = Math.floor(64 + t * 100);
        const b = Math.floor(200 - t * 150);
        return `rgb(${r}, ${g}, ${b})`;
      };

      return (
        <div className="p-8 h-full flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-2">热红外亮温分布图</h3>
          <p className="text-sm text-slate-500 mb-6">热红外通道：10.5μm - 12.5μm，亮温范围：250K - 310K</p>
          <div className="flex-1 flex items-center justify-center gap-8">
            <div className="relative">
              <div className="grid gap-0.5 p-2 bg-deep-800 rounded-lg" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                {tempGrid.flat().map((temp, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: getColor(temp) }}
                    title={`${temp.toFixed(1)}K`}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(230, 164, 50)' }} />
                <span className="text-slate-400">高温区 ~310K</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(130, 114, 150)' }} />
                <span className="text-slate-400">中温区 ~280K</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(30, 64, 200)' }} />
                <span className="text-slate-400">低温区 ~250K</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section.id === 'correction') {
      const beforeData = Array.from({ length: 30 }, (_, i) => {
        const wavelength = 0.5 + (i / 29) * 2;
        return { wavelength, value: 0.5 + Math.sin(wavelength * 1.5) * 0.2 + (Math.random() - 0.5) * 0.08 };
      });
      const afterData = Array.from({ length: 30 }, (_, i) => {
        const wavelength = 0.5 + (i / 29) * 2;
        return { wavelength, value: 0.35 + Math.sin(wavelength * 1.8) * 0.15 + (Math.random() - 0.5) * 0.03 };
      });

      return (
        <div className="p-8 h-full flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-2">大气校正前后对比</h3>
          <p className="text-sm text-slate-500 mb-6">采用 6S 辐射传输模型进行大气校正，校正后地表反射率精度提升约 15%</p>
          <div className="flex-1 relative">
            <svg viewBox="0 0 400 220" className="w-full h-full">
              {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="40" y1={20 + y * 1.8} x2="380" y2={20 + y * 1.8} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              <path
                d={`M 40 ${200 - beforeData[0].value * 160} ${beforeData.map((d, i) =>
                  `L ${40 + (i / (beforeData.length - 1)) * 340} ${200 - d.value * 160}`
                ).join(' ')}`}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.8"
              />
              <path
                d={`M 40 ${200 - afterData[0].value * 160} ${afterData.map((d, i) =>
                  `L ${40 + (i / (afterData.length - 1)) * 340} ${200 - d.value * 160}`
                ).join(' ')}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              <text x="300" y="40" fill="#f97316" fontSize="10">校正前</text>
              <text x="300" y="55" fill="#06b6d4" fontSize="10">校正后</text>
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: '平均偏差', before: '12.5%', after: '2.3%', trend: '↓ 81.6%' },
              { label: '相关系数', before: '0.872', after: '0.968', trend: '↑ 11.0%' },
              { label: 'RMSE', before: '0.045', after: '0.018', trend: '↓ 60.0%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-deep-800/50 rounded-lg p-3 border border-slate-700/30">
                <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-orange-400 text-sm line-through">{stat.before}</span>
                  <span className="text-cyan-400 text-lg font-semibold">{stat.after}</span>
                </div>
                <p className="text-xs text-emerald-400 mt-1">{stat.trend}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (section.id === 'validation') {
      const bands = ['0.55μm', '0.66μm', '0.86μm', '1.24μm', '1.64μm', '2.25μm'];
      const accuracies = [0.952, 0.948, 0.961, 0.935, 0.928, 0.919];

      return (
        <div className="p-8 h-full flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-2">反演产品精度验证</h3>
          <p className="text-sm text-slate-500 mb-6">采用地面实测数据进行交叉验证，共 256 个验证样本点</p>
          <div className="flex-1 flex items-center justify-around">
            <div className="space-y-3">
              {bands.map((band, i) => (
                <div key={band} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-14">{band}</span>
                  <div className="w-48 h-6 bg-deep-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full progress-glow"
                      style={{ width: `${accuracies[i] * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-cyan-400 w-16">{(accuracies[i] * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="url(#valGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${0.942 * 251.2} 251.2`}
                  />
                  <defs>
                    <linearGradient id="valGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">94.2%</span>
                  <span className="text-xs text-slate-500">总体精度</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 h-full flex flex-col">
        <h3 className="text-xl font-semibold text-white mb-2">结论与建议</h3>
        <p className="text-sm text-slate-500 mb-6">基于本次模拟分析的主要结论及后续工作建议</p>
        <div className="flex-1 space-y-4 overflow-y-auto">
          {[
            { title: '反射率反演精度良好', desc: '可见光和近红外波段反演精度均优于 95%，满足应用需求', type: 'success' },
            { title: '热红外亮温存在系统偏差', desc: '10.5-12.5μm 通道亮温反演偏差约 1.2K，建议优化发射率参数', type: 'warning' },
            { title: '气溶胶模型选择影响显著', desc: '不同气溶胶模型对短波通道反射率影响可达 8-12%，需根据区域特征优选', type: 'info' },
            { title: '建议增加观测角度维度', desc: '当前仅考虑天底观测，建议补充多角度观测数据以提升反演鲁棒性', type: 'info' },
          ].map((item, i) => (
            <div
              key={i}
              className={cn(
                'p-4 rounded-lg border',
                item.type === 'success' && 'bg-emerald-500/10 border-emerald-500/30',
                item.type === 'warning' && 'bg-amber-500/10 border-amber-500/30',
                item.type === 'info' && 'bg-blue-500/10 border-blue-500/30'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className={cn(
                  'w-4 h-4',
                  item.type === 'success' && 'text-emerald-400',
                  item.type === 'warning' && 'text-amber-400',
                  item.type === 'info' && 'text-blue-400'
                )} />
                <span className={cn(
                  'font-medium text-sm',
                  item.type === 'success' && 'text-emerald-300',
                  item.type === 'warning' && 'text-amber-300',
                  item.type === 'info' && 'text-blue-300'
                )}>{item.title}</span>
              </div>
              <p className="text-sm text-slate-400 ml-6">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl h-full max-h-[85vh] glass rounded-2xl overflow-hidden flex shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-deep-800/80 text-slate-400 hover:text-white hover:bg-deep-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-56 border-r border-slate-700/50 bg-deep-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-700/50">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              报告目录
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {reportSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => goToSection(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                    currentSection === index
                      ? 'text-cyan-400 bg-cyan-500/10 border-l-2 border-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30 border-l-2 border-transparent'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{section.title}</span>
                </button>
              );
            })}
          </div>
          <div className="p-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              {currentSection + 1} / {totalSections}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-deep-900/30">
          <div className="flex-1 overflow-hidden relative">
            {renderSectionContent()}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 bg-deep-900/50">
            <button
              onClick={() => goToSection(currentSection - 1)}
              disabled={currentSection === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                currentSection === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>

            <button className="btn btn-primary">
              <Download className="w-4 h-4" />
              下载 PDF
            </button>

            <button
              onClick={() => goToSection(currentSection + 1)}
              disabled={currentSection === totalSections - 1}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                currentSection === totalSections - 1
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              )}
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportPanel = ({ report, onClose }: { report: Report; onClose: () => void }) => {
  const [sensorType, setSensorType] = useState('all');
  const [geometry, setGeometry] = useState('all');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-15');
  const [format, setFormat] = useState<'csv' | 'json' | 'netcdf'>('csv');
  const [includeSrf, setIncludeSrf] = useState(false);

  const sensorOptions = [
    { value: 'all', label: '全部传感器' },
    { value: 'landsat8', label: 'Landsat 8 OLI' },
    { value: 'landsat9', label: 'Landsat 9 OLI-2' },
    { value: 'sentinel2', label: 'Sentinel-2 MSI' },
    { value: 'modis', label: 'MODIS' },
    { value: 'viirs', label: 'VIIRS' },
  ];

  const geometryOptions = [
    { value: 'all', label: '全部角度' },
    { value: 'nadir', label: '天底观测 (0°)' },
    { value: 'low', label: '小角度 (0°-30°)' },
    { value: 'medium', label: '中角度 (30°-60°)' },
    { value: 'high', label: '大角度 (60°-90°)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">数据导出</h3>
              <p className="text-xs text-slate-500">{report.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-cyan-400" />
              传感器类型
            </label>
            <select
              value={sensorType}
              onChange={(e) => setSensorType(e.target.value)}
              className="w-full text-sm"
            >
              {sensorOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              观测几何
            </label>
            <select
              value={geometry}
              onChange={(e) => setGeometry(e.target.value)}
              className="w-full text-sm"
            >
              {geometryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              时间窗口
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 text-sm"
              />
              <span className="text-slate-500">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              导出格式
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'csv', label: 'CSV', desc: '逗号分隔' },
                { value: 'json', label: 'JSON', desc: '结构化' },
                { value: 'netcdf', label: 'NetCDF', desc: '科学数据' },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value as 'csv' | 'json' | 'netcdf')}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-all',
                    format === fmt.value
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-deep-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600/50'
                  )}
                >
                  <p className="text-sm font-semibold">{fmt.label}</p>
                  <p className="text-xs opacity-70 mt-1">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={includeSrf}
                  onChange={(e) => setIncludeSrf(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 rounded-full bg-slate-700 peer-checked:bg-cyan-500 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </div>
              <div>
                <p className="text-sm text-slate-300 group-hover:text-white transition-colors">导出光谱响应函数 (SRF)</p>
                <p className="text-xs text-slate-500">包含各通道光谱响应曲线数据</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700/50 bg-deep-900/50">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            取消
          </button>
          <button className="btn btn-primary">
            <Download className="w-4 h-4" />
            开始导出
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const { tasks } = useAppStore();
  const [reports] = useState<Report[]>(generateMockReports);
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [exportReport, setExportReport] = useState<Report | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesType = typeFilter === 'all' || report.type === typeFilter;
      const matchesSearch =
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.taskName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [reports, typeFilter, searchQuery]);

  const handleFilterClick = (type: ReportType | 'all') => {
    setTypeFilter(type);
    setShowFilterDropdown(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-blue-500/30">
            <FileBarChart className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">报告中心</h1>
            <p className="text-sm text-slate-400">查看和下载模拟分析报告</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">共</span>
          <span className="text-white font-semibold">{reports.length}</span>
          <span className="text-slate-500">份报告</span>
        </div>
      </div>

      <div className="glass rounded-xl p-4 animate-slide-up stagger-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-deep-800/80 border border-slate-700/30 rounded-lg text-sm text-slate-300 hover:border-blue-500/50 transition-colors"
            >
              <Filter className="w-4 h-4 text-blue-400" />
              <span>{filterOptions.find((o) => o.value === typeFilter)?.label || '全部类型'}</span>
              <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', showFilterDropdown && 'rotate-180')} />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 w-40 glass rounded-lg shadow-xl py-1 z-50 animate-fade-in">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterClick(option.value)}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      typeFilter === option.value ? 'text-cyan-400 bg-blue-500/10' : 'text-slate-300 hover:bg-slate-700/50'
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
              placeholder="搜索报告标题、任务名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-deep-800/80 border border-slate-700/30 rounded-lg focus:border-blue-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map((report, index) => (
          <div key={report.id} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
            <ReportCard
              report={report}
              onPreview={(r) => setPreviewReport(r)}
              onExport={(r) => setExportReport(r)}
            />
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="glass rounded-xl py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
            <FileBarChart className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400">暂无匹配的报告</p>
        </div>
      )}

      {previewReport && (
        <PreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
      )}

      {exportReport && (
        <ExportPanel report={exportReport} onClose={() => setExportReport(null)} />
      )}
    </div>
  );
}
