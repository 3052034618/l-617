import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Target,
  Sliders,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart2,
  MapPin,
  TrendingUp,
  Settings,
  History,
} from 'lucide-react';
import { recommendApi } from '@/api';
import { cn } from '@/lib/utils';
import type { Recommendation } from '@/types';

const regionOptions = ['全部区域', '华北平原', '长江三角洲', '珠江三角洲', '四川盆地', '西北戈壁'];

const historySimulationData = [
  { name: '方案A', accuracy: 92.5, usage: 85 },
  { name: '方案B', accuracy: 88.3, usage: 72 },
  { name: '方案C', accuracy: 95.1, usage: 91 },
  { name: '方案D', accuracy: 85.7, usage: 68 },
  { name: '方案E', accuracy: 91.2, usage: 78 },
  { name: '方案F', accuracy: 93.8, usage: 88 },
];

type TabType = 'bands' | 'parameters' | 'history';

export default function Recommend() {
  const [bandRecs, setBandRecs] = useState<Recommendation[]>([]);
  const [paramRecs, setParamRecs] = useState<Recommendation[]>([]);
  const [historyRecs, setHistoryRecs] = useState<Recommendation[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('bands');
  const [selectedRegion, setSelectedRegion] = useState('全部区域');
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    const region = selectedRegion === '全部区域' ? undefined : selectedRegion;
    const [bandsRes, paramsRes, historyRes] = await Promise.all([
      recommendApi.getBands(region),
      recommendApi.getParameters(),
      recommendApi.getHistory(),
    ]);

    if (bandsRes.success && bandsRes.data) {
      setBandRecs(bandsRes.data);
    }
    if (paramsRes.success && paramsRes.data) {
      setParamRecs(paramsRes.data);
    }
    if (historyRes.success && historyRes.data) {
      setHistoryRecs(historyRes.data);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const filteredRecommendations = activeTab === 'bands'
    ? bandRecs
    : activeTab === 'parameters'
    ? paramRecs
    : historyRecs;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApply = async (id: string) => {
    setApplyingId(id);
    try {
      await recommendApi.applyRecommendation(id);
    } catch (error) {
      console.error('应用推荐失败:', error);
    }
    setTimeout(() => setApplyingId(null), 1500);
  };

  const renderBandDetails = (rec: Recommendation) => {
    const bands = rec.details.bands as number[] | string[] | undefined;
    const accuracy = rec.details.accuracy as number | string | undefined;

    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-400">推荐波段列表</div>
        <div className="flex flex-wrap gap-2">
          {bands?.map((band, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-cyan-300 text-sm font-medium"
            >
              {typeof band === 'number' ? `${band}μm` : band}
            </div>
          ))}
        </div>
        {accuracy && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">预期反演精度：</span>
            <span className="text-emerald-400 font-semibold">
              {typeof accuracy === 'number' ? `${(accuracy * 100).toFixed(1)}%` : accuracy}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderParameterDetails = (rec: Recommendation) => {
    const details = rec.details as Record<string, number | string>;
    const paramLabels: Record<string, string> = {
      aod: '气溶胶光学厚度',
      ssa: '单次散射反照率',
      biasReduction: '偏差降低率',
    };

    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-400">参数配置详情</div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(details).map(([key, value]) => (
            <div
              key={key}
              className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"
            >
              <div className="text-xs text-slate-400 mb-1">
                {paramLabels[key] || key}
              </div>
              <div className="text-lg font-semibold text-cyan-300">
                {typeof value === 'number'
                  ? key === 'biasReduction'
                    ? `${(value * 100).toFixed(0)}%`
                    : value.toFixed(2)
                  : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">智能推荐引擎</h1>
            <p className="text-sm text-slate-400">基于历史数据的AI智能参数与波段推荐</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <button
              onClick={() => setActiveTab('bands')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                activeTab === 'bands'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <BarChart2 className="w-4 h-4" />
              波段推荐
            </button>
            <button
              onClick={() => setActiveTab('parameters')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                activeTab === 'parameters'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <Sliders className="w-4 h-4" />
              参数推荐
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <History className="w-4 h-4" />
              推荐历史
            </button>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredRecommendations.map((rec, index) => (
            <div
              key={rec.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all duration-300',
                'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50',
                'card-hover'
              )}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg',
                          rec.type === 'bands'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        )}
                      >
                        {rec.type === 'bands' ? (
                          <BarChart2 className="w-4 h-4" />
                        ) : (
                          <Settings className="w-4 h-4" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {rec.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      {rec.description}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">置信度</span>
                          <span className="text-xs font-medium text-cyan-400">
                            {(rec.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-1000',
                              rec.confidence >= 0.9
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : rec.confidence >= 0.8
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                                : 'bg-gradient-to-r from-amber-500 to-orange-400'
                            )}
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCard(rec.id)}
                    className="ml-4 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-600/30 transition-colors text-slate-400 hover:text-white"
                  >
                    {expandedCards.includes(rec.id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {expandedCards.includes(rec.id) && (
                  <div className="mt-5 pt-5 border-t border-slate-700/50">
                    {rec.type === 'bands'
                      ? renderBandDetails(rec)
                      : renderParameterDetails(rec)}

                    <div className="mt-5 flex items-center justify-end gap-3">
                      <button className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors">
                        查看详情
                      </button>
                      <button
                        onClick={() => handleApply(rec.id)}
                        disabled={applyingId === rec.id}
                        className={cn(
                          'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                          applyingId === rec.id
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                        )}
                      >
                        {applyingId === rec.id ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            已应用
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            应用推荐
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-400 rounded-full" />
            历史模拟分析
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-600 to-cyan-400" />
              反演精度
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-purple-600 to-pink-400" />
              资源利用率
            </span>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-4 px-2">
          {historySimulationData.map((item, index) => (
            <div key={item.name} className="flex-1 flex flex-col items-center gap-3">
              <div className="w-full flex items-end justify-center gap-1 h-48 relative group">
                <div
                  className="w-5 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm transition-all duration-500 hover:from-cyan-400 hover:to-blue-400"
                  style={{
                    height: `${item.accuracy * 1.5}px`,
                    animationDelay: `${0.3 + index * 0.1}s`,
                  }}
                />
                <div
                  className="w-5 bg-gradient-to-t from-purple-600 to-pink-400 rounded-t-sm transition-all duration-500 hover:from-pink-400 hover:to-purple-400"
                  style={{
                    height: `${item.usage * 1.5}px`,
                    animationDelay: `${0.35 + index * 0.1}s`,
                  }}
                />

                <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 text-xs bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-600/50 z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400">精度: {item.accuracy}%</span>
                    <span className="text-pink-400">利用率: {item.usage}%</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-500">{item.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 pt-5 border-t border-slate-700/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">92.8%</div>
            <div className="text-xs text-slate-500 mt-1">平均反演精度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              <TrendingUp className="w-5 h-5 inline mr-1" />
              8.5%
            </div>
            <div className="text-xs text-slate-500 mt-1">精度提升幅度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">6</div>
            <div className="text-xs text-slate-500 mt-1">对比方案数</div>
          </div>
        </div>
      </div>
    </div>
  );
}
