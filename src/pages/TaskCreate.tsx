import { useState, useMemo } from 'react';
import {
  Upload,
  FileText,
  Layers,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Download,
  Plus,
  Trash2,
  MapPin,
  CloudRain,
  Ruler,
  Eye,
  Sun,
  Cpu,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@/store/useAppStore';
import type { TaskParameters, SimulationTask } from '@/types';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
}

interface FormData {
  taskName: string;
  region: string;
  aerosolModel: string;
  wavelengthMin: number;
  wavelengthMax: number;
  spectralResolution: number;
  observationAngle: number;
  advancedParams: { scatteringOrder: number; surfaceReflectivity: number; waterVaporScale: number };
}

const STEPS = [
  { id: 1, title: '上传数据', icon: Upload },
  { id: 2, title: '参数配置', icon: Settings },
  { id: 3, title: '确认提交', icon: CheckCircle2 },
];

const AEROSOL_MODELS = ['continental', 'maritime', 'urban', 'dust', 'biomass'];
const AEROSOL_LABELS: Record<string, string> = {
  continental: '大陆型', maritime: '海洋型', urban: '城市型', dust: '沙尘型', biomass: '生物质燃烧型',
};
const REGIONS = ['华北平原', '长江三角洲', '珠江三角洲', '四川盆地', '西北戈壁', '东北平原', '青藏高原', '南海海域'];

const defaultFormData: FormData = {
  taskName: '', region: '', aerosolModel: 'continental',
  wavelengthMin: 0.4, wavelengthMax: 12.5, spectralResolution: 0.01, observationAngle: 0,
  advancedParams: { scatteringOrder: 4, surfaceReflectivity: 0.1, waterVaporScale: 1.0 },
};

const colorMap: Record<string, [string, string]> = {
  blue: ['bg-blue-500/10', 'text-blue-400'],
  green: ['bg-green-500/10', 'text-green-400'],
  purple: ['bg-purple-500/10', 'text-purple-400'],
  cyan: ['bg-cyan-500/10', 'text-cyan-400'],
  yellow: ['bg-yellow-500/10', 'text-yellow-400'],
  orange: ['bg-orange-500/10', 'text-orange-400'],
};

export default function TaskCreate() {
  const navigate = useNavigate();
  const addTask = useAppStore((s) => s.addTask);

  const [currentStep, setCurrentStep] = useState(1);
  const [profileFiles, setProfileFiles] = useState<UploadedFile[]>([]);
  const [surfaceFile, setSurfaceFile] = useState<UploadedFile | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fmtSize = (b: number) => (b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB');
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const handleProfileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).map((f) => ({ id: Math.random().toString(36).slice(2), name: f.name, size: f.size }));
    setProfileFiles((p) => [...p, ...files]);
  };

  const handleSurfaceDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setSurfaceFile({ id: Math.random().toString(36).slice(2), name: f.name, size: f.size });
  };

  const updateForm = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
  };

  const updateAdv = <K extends keyof FormData['advancedParams']>(k: K, v: FormData['advancedParams'][K]) =>
    setFormData((p) => ({ ...p, advancedParams: { ...p.advancedParams, [k]: v } }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (profileFiles.length === 0) e.profileFiles = '请至少上传一个廓线参数文件';
    if (!surfaceFile) e.surfaceFile = '请上传下垫面类型数据';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!formData.taskName.trim()) e.taskName = '请输入任务名称';
    if (!formData.region) e.region = '请选择区域';
    if (formData.wavelengthMin >= formData.wavelengthMax) e.wavelength = '最小波长必须小于最大波长';
    if (formData.wavelengthMin < 0.2 || formData.wavelengthMin > 25) e.wavelengthMin = '波长范围 0.2 - 25 μm';
    if (formData.wavelengthMax < 0.2 || formData.wavelengthMax > 25) e.wavelengthMax = '波长范围 0.2 - 25 μm';
    if (formData.spectralResolution <= 0) e.spectralResolution = '光谱分辨率必须大于0';
    if (formData.observationAngle < -90 || formData.observationAngle > 90) e.observationAngle = '观测角度范围 -90° ~ 90°';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep < 3) setCurrentStep((p) => p + 1);
  };

  const estimatedTime = useMemo(() => {
    const t = Math.round(120 * (formData.wavelengthMax - formData.wavelengthMin) * (0.01 / formData.spectralResolution) * 0.5 + profileFiles.length * 30);
    return Math.floor(t / 60) > 0 ? `${Math.floor(t / 60)}分${t % 60}秒` : `${t}秒`;
  }, [formData.wavelengthMax, formData.wavelengthMin, formData.spectralResolution, profileFiles.length]);

  const estimatedResources = useMemo(() => {
    const wr = formData.wavelengthMax - formData.wavelengthMin;
    const rf = 0.01 / formData.spectralResolution;
    const cpu = Math.round(2 + rf * 2);
    const mem = Math.round(512 + wr * rf * 100);
    return { cpu, memory: mem > 1024 ? `${(mem / 1024).toFixed(1)} GB` : `${mem} MB` };
  }, [formData.wavelengthMax, formData.wavelengthMin, formData.spectralResolution]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    const taskId = `task-${Date.now()}`;
    const parameters: TaskParameters = {
      profileFile: profileFiles[0]?.name || '', surfaceType: surfaceFile?.name || '',
      aerosolModel: formData.aerosolModel,
      wavelengthRange: [formData.wavelengthMin, formData.wavelengthMax],
      spectralResolution: formData.spectralResolution, observationAngle: formData.observationAngle,
    };
    const newTask: SimulationTask = {
      id: taskId, name: formData.taskName, region: formData.region, status: 'pending',
      progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      createdBy: '当前用户', parameters, approvalStatus: 'none',
    };
    addTask(newTask);
    setIsSubmitting(false);
    navigate(`/tasks/${taskId}`);
  };

  const ErrMsg = ({ msg }: { msg?: string }) => msg ? <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p> : null;

  const InfoRow = ({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: React.ReactNode }) => {
    const [bg, text] = colorMap[color] || ['', ''];
    return <div className="flex items-start gap-3"><div className={cn('p-2 rounded-lg', bg)}><span className={text}>{icon}</span></div><div><div className="text-xs text-slate-400">{label}</div><div className="text-sm text-white">{value}</div></div></div>;
  };

  const StepIndicator = () => (
    <div className="glass rounded-xl p-6 mb-6 animate-slide-up">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const active = currentStep === step.id;
          const done = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                  done && 'bg-gradient-to-br from-green-500/20 to-emerald-400/20 border-green-500 shadow-glow',
                  active && 'bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border-cyan-400 shadow-glow-cyan animate-glow-pulse',
                  !active && !done && 'bg-deep-800/50 border-slate-600/50')}>
                  {done ? <Check className="w-5 h-5 text-green-400" /> : <Icon className={cn('w-5 h-5', active ? 'text-cyan-400' : done ? 'text-green-400' : 'text-slate-500')} />}
                </div>
                <div className={cn('text-sm font-medium mt-2', active ? 'text-white' : done ? 'text-slate-300' : 'text-slate-500')}>{step.title}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-deep-800 rounded-full overflow-hidden">
                    <div className={cn('h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500', done ? 'w-full' : 'w-0')} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const dropZoneCls = (error?: string) => cn('border-2 border-dashed rounded-xl text-center transition-all',
    isDragging ? 'border-cyan-400 bg-cyan-500/10' : error ? 'border-red-500/50 bg-red-500/5' : 'border-space-600/50 bg-deep-800/30 hover:border-blue-500/50');

  const Step1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />大气垂直廓线参数文件</h3>
          <button onClick={() => console.log('下载示例')} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Download className="w-4 h-4" />下载示例</button>
        </div>
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleProfileDrop} className={cn(dropZoneCls(errors.profileFiles), 'p-8')}>
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 mb-1">拖拽文件到此处上传</p>
          <p className="text-sm text-slate-500">支持 .txt, .dat, .nc 格式，可批量上传</p>
        </div>
        <ErrMsg msg={errors.profileFiles} />
        {profileFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {profileFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 glass-light rounded-lg group">
                <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="w-4 h-4 text-blue-400" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{f.name}</div>
                  <div className="text-xs text-slate-500">{fmtSize(f.size)}</div>
                </div>
                <button onClick={() => setProfileFiles((p) => p.filter((x) => x.id !== f.id))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-green-400" />下垫面类型数据</h3>
          <button onClick={() => console.log('下载示例')} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Download className="w-4 h-4" />下载示例</button>
        </div>
        {!surfaceFile ? (
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleSurfaceDrop} className={cn(dropZoneCls(errors.surfaceFile), 'p-6')}>
            <Plus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">点击或拖拽上传下垫面类型数据</p>
            <p className="text-xs text-slate-500 mt-1">支持 .shp, .tif, .dat 格式</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 glass-light rounded-lg">
            <div className="p-3 bg-green-500/10 rounded-lg"><Layers className="w-5 h-5 text-green-400" /></div>
            <div className="flex-1">
              <div className="text-sm text-white font-medium">{surfaceFile.name}</div>
              <div className="text-xs text-slate-500">{fmtSize(surfaceFile.size)}</div>
            </div>
            <button onClick={() => setSurfaceFile(null)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <ErrMsg msg={errors.surfaceFile} />
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">任务名称 <span className="text-red-400">*</span></label>
          <input type="text" value={formData.taskName} onChange={(e) => updateForm('taskName', e.target.value)}
            placeholder="请输入任务名称，如：华北平原夏季辐射模拟" className={cn('w-full', errors.taskName && 'border-red-500/50')} />
          <ErrMsg msg={errors.taskName} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2"><MapPin className="w-4 h-4 inline mr-1 text-cyan-400" />区域选择 <span className="text-red-400">*</span></label>
          <select value={formData.region} onChange={(e) => updateForm('region', e.target.value)} className={cn('w-full', errors.region && 'border-red-500/50')}>
            <option value="">请选择模拟区域</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <ErrMsg msg={errors.region} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2"><CloudRain className="w-4 h-4 inline mr-1 text-purple-400" />气溶胶模式</label>
          <div className="grid grid-cols-5 gap-2">
            {AEROSOL_MODELS.map((m) => (
              <button key={m} onClick={() => updateForm('aerosolModel', m)}
                className={cn('p-3 rounded-lg text-center transition-all border',
                  formData.aerosolModel === m ? 'bg-gradient-to-br from-purple-500/20 to-violet-400/20 border-purple-500/50 text-white shadow-glow' : 'bg-deep-800/50 border-space-600/30 text-slate-400 hover:border-purple-500/30')}>
                <div className="text-sm font-medium">{AEROSOL_LABELS[m]}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2"><Ruler className="w-4 h-4 inline mr-1 text-yellow-400" />波长范围 (μm) <span className="text-red-400">*</span></label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input type="number" step="0.01" value={formData.wavelengthMin} onChange={(e) => updateForm('wavelengthMin', parseFloat(e.target.value) || 0)}
                className={cn('w-full', errors.wavelengthMin && 'border-red-500/50')} />
              <p className="text-xs text-slate-500 mt-1 text-center">最小波长</p>
            </div>
            <div className="text-slate-500">—</div>
            <div className="flex-1">
              <input type="number" step="0.01" value={formData.wavelengthMax} onChange={(e) => updateForm('wavelengthMax', parseFloat(e.target.value) || 0)}
                className={cn('w-full', errors.wavelengthMax && 'border-red-500/50')} />
              <p className="text-xs text-slate-500 mt-1 text-center">最大波长</p>
            </div>
          </div>
          <ErrMsg msg={errors.wavelength || errors.wavelengthMin || errors.wavelengthMax} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2"><Eye className="w-4 h-4 inline mr-1 text-cyan-400" />光谱分辨率 (μm)</label>
            <input type="number" step="0.001" value={formData.spectralResolution} onChange={(e) => updateForm('spectralResolution', parseFloat(e.target.value) || 0)}
              className={cn('w-full', errors.spectralResolution && 'border-red-500/50')} />
            <ErrMsg msg={errors.spectralResolution} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2"><Sun className="w-4 h-4 inline mr-1 text-orange-400" />观测角度 (°)</label>
            <input type="number" step="1" value={formData.observationAngle} onChange={(e) => updateForm('observationAngle', parseFloat(e.target.value) || 0)}
              className={cn('w-full', errors.observationAngle && 'border-red-500/50')} />
            <ErrMsg msg={errors.observationAngle} />
          </div>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full p-4 flex items-center justify-between text-left hover:bg-deep-800/30 transition-colors">
          <span className="text-sm font-medium text-slate-300 flex items-center gap-2"><Settings className="w-4 h-4 text-slate-400" />高级参数</span>
          <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform', showAdvanced && 'rotate-90')} />
        </button>
        {showAdvanced && (
          <div className="p-4 pt-0 border-t border-space-700/30">
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { k: 'scatteringOrder', label: '散射阶数', step: 1, min: 1, max: 10 },
                { k: 'surfaceReflectivity', label: '地表反照率', step: 0.01, min: 0, max: 1 },
                { k: 'waterVaporScale', label: '水汽缩放因子', step: 0.1, min: 0, max: 3 },
              ].map(({ k, label, step, min, max }) => (
                <div key={k}>
                  <label className="block text-xs text-slate-400 mb-1">{label}</label>
                  <input type="number" step={step} min={min} max={max} value={formData.advancedParams[k as keyof typeof formData.advancedParams]}
                    onChange={(e) => updateAdv(k as keyof FormData['advancedParams'], parseFloat(e.target.value) || 0)} className="w-full text-sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const StatCard = ({ icon, color, title, value, desc }: { icon: React.ReactNode; color: string; title: string; value: string; desc: string }) => {
    const [bg, text] = colorMap[color] || ['', ''];
    return <div className="glass rounded-xl p-5"><div className="flex items-center gap-3 mb-3"><div className={cn('p-2 rounded-lg', bg)}><span className={text}>{icon}</span></div><div><div className="text-sm text-slate-400">{title}</div><div className="text-xl font-bold font-mono" style={{ color: text }}>{value}</div></div></div><div className="text-xs text-slate-500">{desc}</div></div>;
  };

  const Step3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-400" />配置信息汇总</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="w-4 h-4 text-blue-400" /></div>
              <div>
                <div className="text-xs text-slate-400">廓线文件</div>
                <div className="text-sm text-white">{profileFiles.length} 个文件</div>
                {profileFiles.slice(0, 2).map((f) => <div key={f.id} className="text-xs text-slate-500 font-mono truncate max-w-48">{f.name}</div>)}
                {profileFiles.length > 2 && <div className="text-xs text-slate-500">等 {profileFiles.length} 个文件</div>}
              </div>
            </div>
            <InfoRow icon={<Layers className="w-4 h-4" />} color="green" label="下垫面数据" value={surfaceFile?.name || '-'} />
            <InfoRow icon={<CloudRain className="w-4 h-4" />} color="purple" label="气溶胶模式" value={AEROSOL_LABELS[formData.aerosolModel] || ''} />
          </div>
          <div className="space-y-4">
            <InfoRow icon={<MapPin className="w-4 h-4" />} color="cyan" label="任务名称" value={formData.taskName || '-'} />
            <InfoRow icon={<Ruler className="w-4 h-4" />} color="yellow" label="波长范围" value={<span className="font-mono">{formData.wavelengthMin} - {formData.wavelengthMax} μm</span>} />
            <InfoRow icon={<Eye className="w-4 h-4" />} color="orange" label="分辨率 / 观测角" value={<span className="font-mono">{formData.spectralResolution} μm / {formData.observationAngle}°</span>} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Clock className="w-5 h-5" />} color="blue" title="预估计算时间" value={estimatedTime} desc="基于波长范围、光谱分辨率和数据量估算" />
        <StatCard icon={<Cpu className="w-5 h-5" />} color="purple" title="预估资源消耗" value={`${estimatedResources.cpu} 核 · ${estimatedResources.memory}`} desc="计算峰值资源使用预估" />
      </div>

      <div className="glass rounded-xl p-4 bg-yellow-500/5 border-yellow-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-400 mb-1">提交前请注意</p>
            <ul className="space-y-1 text-slate-400 text-xs">
              <li>• 任务提交后将进入队列等待计算，不可中途修改参数</li>
              <li>• 计算完成后将通过站内消息通知您</li>
              <li>• 如需取消任务，请在任务开始前操作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 animate-slide-up">
        <button onClick={() => navigate('/tasks')} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />返回任务列表
        </button>
      </div>
      <StepIndicator />
      <div className="glass rounded-xl p-6 mb-6">
        {currentStep === 1 && <Step1 />}
        {currentStep === 2 && <Step2 />}
        {currentStep === 3 && <Step3 />}
      </div>
      <div className="flex items-center justify-between">
        <button onClick={() => currentStep > 1 && setCurrentStep((p) => p - 1)} disabled={currentStep === 1 || isSubmitting}
          className={cn('btn btn-secondary', (currentStep === 1 || isSubmitting) && 'opacity-50 cursor-not-allowed')}>
          <ChevronLeft className="w-4 h-4" />上一步
        </button>
        {currentStep < 3 ? (
          <button onClick={handleNext} className="btn btn-primary">下一步<ChevronRight className="w-4 h-4" /></button>
        ) : (
          <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-success min-w-32">
            {isSubmitting ? <><Sparkles className="w-4 h-4 animate-spin" />提交中...</> : <><Check className="w-4 h-4" />提交任务</>}
          </button>
        )}
      </div>
    </div>
  );
}
