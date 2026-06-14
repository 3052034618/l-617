# 大气辐射传输计算服务

基于简化逐线积分模型的大气辐射传输计算服务，使用 Python + Flask 实现。

## 功能特性

- 大气透过率计算（考虑瑞利散射、气溶胶消光、水汽吸收、臭氧吸收）
- 地表反射率模拟（支持多种下垫面类型）
- 卫星通道亮温计算（可见光近红外/热红外）
- 辐射平衡偏差估算
- 光谱拟合残差分析

## 物理模型

- **Beer-Lambert 定律**: 描述辐射在大气中的衰减
- **气溶胶光学厚度**: Angstrom 指数公式
- **瑞利散射**: 波长四次方反比关系
- **水汽吸收**: 主要吸收带的高斯近似
- **普朗克定律**: 黑体辐射与亮温转换
- **地表反射率**: 典型地物光谱曲线模型

## 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### 启动服务

```bash
python app.py
```

服务默认运行在 `http://localhost:5001`

## API 接口

### 1. 健康检查
```
GET /api/health
```

### 2. 开始模拟
```
POST /api/compute/simulate
Content-Type: application/json

{
  "wavelength_min": 0.4,
  "wavelength_max": 2.5,
  "spectral_resolution": 0.01,
  "surface_type": "vegetation",
  "aerosol_model": "continental",
  "observation_angle": 0.0
}
```

### 3. 查询模拟状态
```
GET /api/compute/status/{task_id}
```

### 4. 计算透过率
```
POST /api/compute/transmittance
```

### 5. 计算反射率
```
POST /api/compute/reflectance
```

### 6. 计算亮温
```
POST /api/compute/brightness-temp
```

### 7. 获取下垫面类型
```
GET /api/compute/surface-types
```

### 8. 获取气溶胶模式
```
GET /api/compute/aerosol-models
```

## 支持的下垫面类型

- 植被 (vegetation)
- 水体 (water)
- 沙漠 (desert)
- 城市 (urban)
- 冰雪 (snow)
- 农田 (farmland)

## 支持的气溶胶模式

- 大陆型 (continental)
- 海洋型 (marine)
- 城市型 (urban)
- 沙尘型 (dust)
- 生物质燃烧型 (biomass_burning)
