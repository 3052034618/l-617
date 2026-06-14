import type { SimulationTask, Alert, ApprovalRecord, StatisticsOverview, SpectrumData, ChannelData, SimulationResults } from '@/types';

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return date.toISOString();
}

export function generateSpectrumData(points: number, minWL: number, maxWL: number, baseValue: number, variance: number): SpectrumData[] {
  const data: SpectrumData[] = [];
  const step = (maxWL - minWL) / (points - 1);
  for (let i = 0; i < points; i++) {
    const wavelength = minWL + i * step;
    const variation = (Math.sin(wavelength * 2) * 0.3 + Math.cos(wavelength * 0.7) * 0.2) * variance;
    const value = Math.max(0, Math.min(1, baseValue + variation + randomInRange(-0.02, 0.02)));
    data.push({ wavelength: Number(wavelength.toFixed(2)), value: Number(value.toFixed(4)) });
  }
  return data;
}

export function generateBrightnessTemp(): ChannelData[] {
  const channels = [
    { channel: 'VIS_01', wavelength: 0.55 },
    { channel: 'VIS_02', wavelength: 0.66 },
    { channel: 'NIR_01', wavelength: 0.86 },
    { channel: 'NIR_02', wavelength: 1.24 },
    { channel: 'SWIR_01', wavelength: 1.64 },
    { channel: 'SWIR_02', wavelength: 2.25 },
    { channel: 'TIR_01', wavelength: 10.8 },
    { channel: 'TIR_02', wavelength: 12.0 },
  ];
  return channels.map((c) => ({
    ...c,
    value: c.wavelength < 3 ? randomInRange(0.1, 0.9) : randomInRange(250, 310),
  }));
}

export function generateMockResults(): SimulationResults {
  return {
    transmittance: generateSpectrumData(100, 0.4, 2.5, 0.7, 0.2),
    reflectance: generateSpectrumData(100, 0.4, 2.5, 0.3, 0.15),
    brightnessTemperature: generateBrightnessTemp(),
    radiationBalance: Number(randomInRange(-0.003, 0.003).toFixed(5)),
    fittingResidual: Number(randomInRange(0.008, 0.02).toFixed(4)),
    accuracy: Number(randomInRange(0.92, 0.98).toFixed(4)),
  };
}

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
  '黄土高原植被覆盖区光谱响应模拟',
  '云贵高原喀斯特地貌辐射传输',
  '塔里木盆地沙尘天气模拟',
];

const regions = ['华北平原', '长江三角洲', '珠江三角洲', '四川盆地', '西北戈壁', '青藏高原', '东北地区', '南海海域'];
const surfaceTypes = ['植被', '水体', '沙漠', '城市', '冰雪', '农田'];
const aerosolModels = ['大陆型', '海洋型', '城市型', '沙尘型', '生物质燃烧型'];
const creators = ['张科学家', '李研究员', '王工程师', '陈教授', '刘博士'];

export function generateMockTasks(): SimulationTask[] {
  const tasks: SimulationTask[] = [];
  const statuses: SimulationTask['status'][] = [
    'pending',
    'modeling',
    'computing',
    'synthesizing',
    'completed',
    'completed',
    'completed',
    'failed',
    'rollback',
  ];

  for (let i = 0; i < 12; i++) {
    const status = statuses[i % statuses.length];
    const isCompleted = status === 'completed';
    const progress = status === 'pending' ? 0
      : status === 'modeling' ? Math.floor(randomInRange(10, 40))
      : status === 'computing' ? Math.floor(randomInRange(40, 80))
      : status === 'synthesizing' ? Math.floor(randomInRange(80, 95))
      : isCompleted ? 100
      : status === 'failed' ? Math.floor(randomInRange(30, 70))
      : Math.floor(randomInRange(20, 50));

    const approvalStatus: SimulationTask['approvalStatus'] = isCompleted
      ? (i % 4 === 0 ? 'published' : i % 4 === 1 ? 'pending_first' : i % 4 === 2 ? 'pending_second' : 'rejected')
      : 'none';

    const alertLevel = i % 5 === 0 ? ('level2' as const) : i % 7 === 0 ? ('level1' as const) : null;

    const createdAt = formatDate(Math.floor(i / 2));
    const publishedAt = approvalStatus === 'published' ? formatDate(Math.floor(i / 4)) : undefined;
    const task: SimulationTask = {
      id: generateId('task'),
      name: taskNames[i % taskNames.length],
      region: regions[i % regions.length],
      status,
      progress,
      createdAt,
      updatedAt: formatDate(Math.floor(i / 4)),
      createdBy: creators[i % creators.length],
      parameters: {
        profileFile: `profile_${i + 1}.dat`,
        surfaceType: surfaceTypes[i % surfaceTypes.length],
        aerosolModel: aerosolModels[i % aerosolModels.length],
        wavelengthRange: [0.4, 2.5],
        spectralResolution: 0.01,
        observationAngle: Math.floor(randomInRange(0, 60)),
      },
      results: isCompleted || status === 'failed' || status === 'rollback' ? generateMockResults() : undefined,
      approvalStatus,
      alertLevel,
      computeDuration: isCompleted ? Math.floor(randomInRange(120, 1800)) : undefined,
      resourceUsage: isCompleted ? Number(randomInRange(0.5, 8.0).toFixed(1)) : undefined,
      publishedAt,
    };
    tasks.push(task);
  }

  return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const alertMessages = {
  radiation_balance: [
    '辐射平衡偏差超过阈值，需检查大气廓线输入数据',
    '辐射平衡计算出现系统性偏差，建议复核气溶胶光学厚度参数',
    '短波与长波辐射不平衡，可能存在水汽吸收计算误差',
  ],
  fitting_residual: [
    '光谱拟合残差偏高，建议增加光谱分辨率',
    '拟合残差超过阈值，需调整气溶胶粒子谱分布',
    '热红外通道拟合残差异常，检查发射率参数设置',
  ],
  region_deviation: [
    '该区域连续三次模拟反射率偏差超过5%，已触发区域预警',
    '区域模拟结果波动较大，建议核查下垫面类型数据',
  ],
};

export function generateMockAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const types: Alert['type'][] = ['radiation_balance', 'fitting_residual', 'region_deviation'];
  const levels: Alert['level'][] = ['level1', 'level2', 'level3'];
  const statuses: Alert['status'][] = ['pending', 'pending', 'reviewed', 'resolved'];

  for (let i = 0; i < 8; i++) {
    const type = types[i % types.length];
    const level = levels[i % levels.length];
    const status = statuses[i % statuses.length];
    const threshold = type === 'radiation_balance' ? 0.005 : type === 'fitting_residual' ? 0.015 : 0.05;
    const deviation = threshold * randomInRange(1.1, 2.0);

    alerts.push({
      id: generateId('alert'),
      taskId: generateId('task'),
      taskName: taskNames[i % taskNames.length],
      level,
      type,
      message: alertMessages[type][i % alertMessages[type].length],
      deviation: Number(deviation.toFixed(5)),
      threshold,
      createdAt: formatDate(i),
      status,
      reviewedBy: status !== 'pending' ? creators[i % creators.length] : undefined,
      reviewComment: status !== 'pending' ? '已复核，调整参数后重新计算' : undefined,
      adjustment: status === 'resolved' ? {
        id: generateId('adj'),
        alertId: generateId('alert'),
        taskId: generateId('task'),
        parameter: type === 'radiation_balance' ? 'aerosol_optical_depth' : 'surface_emissivity',
        oldValue: Number(randomInRange(0.2, 0.5).toFixed(3)),
        newValue: Number(randomInRange(0.2, 0.5).toFixed(3)),
        reason: '降低系统偏差',
        operator: creators[i % creators.length],
        createdAt: formatDate(i),
      } : undefined,
    });
  }

  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateMockApprovals(): ApprovalRecord[] {
  const approvals: ApprovalRecord[] = [];
  for (let i = 0; i < 8; i++) {
    const level = i < 4 ? 1 : 2;
    const status = i % 4 === 0 ? 'pending' : i % 4 === 3 ? 'rejected' : 'approved';
    const createdAt = formatDate(i + 1);
    const approvedAt = status !== 'pending' ? formatDate(i) : undefined;
    approvals.push({
      id: generateId('appr'),
      taskId: generateId('task'),
      taskName: taskNames[i % taskNames.length],
      level,
      approver: status !== 'pending' ? (level === 1 ? '数据处理员王工' : '项目负责人李总') : '',
      status,
      comment: status === 'approved'
        ? (level === 1 ? '模型构建合理，参数设置正确，提交上级审批' : '反演结果符合预期，精度达标，同意发布')
        : status === 'rejected'
          ? '反射率曲线存在异常波动，建议重新核查输入数据'
          : '',
      createdAt,
      applicant: creators[i % creators.length],
      submittedAt: createdAt,
      approvedAt,
    });
  }
  return approvals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateStatisticsOverview(): StatisticsOverview {
  return {
    totalTasks: 156,
    completedTasks: 128,
    runningTasks: 12,
    pendingTasks: 8,
    successRate: 0.925,
    avgAccuracy: 0.948,
    totalResourceUsage: 458.6,
    alertCount: 23,
  };
}

export function generateTrendData(days: number, baseValue: number, variance: number): { date: string; value: number }[] {
  const data: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Number((baseValue + Math.sin(i * 0.3) * variance * 0.5 + randomInRange(-variance, variance) * 0.3).toFixed(3)),
    });
  }
  return data;
}
