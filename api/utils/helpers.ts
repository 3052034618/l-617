/**
 * Utility helper functions
 */

import type {
  SpectrumData,
  ChannelData,
  SimulationResults,
  MonitorData,
} from '../types/index.js'

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}${random}`
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString()
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1))
}

export function generateSpectrumData(
  count: number = 100,
  minWavelength: number = 0.4,
  maxWavelength: number = 2.5,
  baseValue: number = 0.5,
  amplitude: number = 0.3,
): SpectrumData[] {
  const data: SpectrumData[] = []
  const step = (maxWavelength - minWavelength) / count

  for (let i = 0; i < count; i++) {
    const wavelength = minWavelength + i * step
    const wave = Math.sin((i / count) * Math.PI * 4) * amplitude
    const noise = (Math.random() - 0.5) * 0.05
    const value = Math.max(0, Math.min(1, baseValue + wave + noise))

    data.push({
      wavelength: Number(wavelength.toFixed(4)),
      value: Number(value.toFixed(4)),
    })
  }

  return data
}

export function generateChannelData(): ChannelData[] {
  const channels = [
    { name: 'B1', wavelength: 0.443 },
    { name: 'B2', wavelength: 0.490 },
    { name: 'B3', wavelength: 0.560 },
    { name: 'B4', wavelength: 0.665 },
    { name: 'B5', wavelength: 0.705 },
    { name: 'B6', wavelength: 0.740 },
    { name: 'B7', wavelength: 0.783 },
    { name: 'B8', wavelength: 0.842 },
    { name: 'B8A', wavelength: 0.865 },
    { name: 'B9', wavelength: 0.945 },
    { name: 'B10', wavelength: 1.375 },
    { name: 'B11', wavelength: 1.610 },
    { name: 'B12', wavelength: 2.190 },
  ]

  return channels.map((ch) => ({
    channel: ch.name,
    wavelength: ch.wavelength,
    value: Number(randomInRange(250, 320).toFixed(2)),
  }))
}

export function generateBrightnessTempData(
  days: number = 7,
  pointsPerDay: number = 24,
): { time: string; temperature: number }[] {
  const data: { time: string; temperature: number }[] = []
  const now = new Date()

  for (let day = days - 1; day >= 0; day--) {
    for (let point = 0; point < pointsPerDay; point++) {
      const date = new Date(now)
      date.setDate(date.getDate() - day)
      date.setHours(point, 0, 0, 0)

      const hourOfDay = point
      const diurnalVariation = 15 * Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2)
      const baseTemp = 20 + diurnalVariation
      const noise = (Math.random() - 0.5) * 3
      const temperature = baseTemp + noise

      data.push({
        time: formatDate(date),
        temperature: Number(temperature.toFixed(2)),
      })
    }
  }

  return data
}

export function generateSimulationResults(): SimulationResults {
  return {
    transmittance: generateSpectrumData(50, 0.4, 2.5, 0.7, 0.2),
    reflectance: generateSpectrumData(50, 0.4, 2.5, 0.3, 0.25),
    brightnessTemperature: generateChannelData(),
    radiationBalance: Number(randomInRange(280, 320).toFixed(2)),
    fittingResidual: Number(randomInRange(0.001, 0.05).toFixed(4)),
    accuracy: Number(randomInRange(90, 98).toFixed(2)),
  }
}

export function generateMonitorData(
  taskId: string,
  progress: number,
): MonitorData {
  return {
    timestamp: formatDate(),
    taskId,
    transmittance: generateSpectrumData(30, 0.4, 2.5, 0.6 + progress / 200, 0.15),
    reflectance: generateSpectrumData(30, 0.4, 2.5, 0.4 + progress / 300, 0.2),
    brightnessTemp: generateChannelData().map((c) => ({
      ...c,
      value: c.value + progress * 0.3,
    })),
    radiationBalance: Number(randomInRange(280, 320).toFixed(2)),
    fittingResidual: Number(randomInRange(0.001, 0.05).toFixed(4)),
    progress,
  }
}

export function generateHistoryData(
  taskId: string,
  count: number = 20,
): MonitorData[] {
  const data: MonitorData[] = []
  const now = new Date()

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now)
    timestamp.setMinutes(timestamp.getMinutes() - i * 5)
    const progress = Math.min(100, Math.floor(((count - i) / count) * 100))

    data.push({
      timestamp: formatDate(timestamp),
      taskId,
      transmittance: generateSpectrumData(20, 0.4, 2.5, 0.5 + progress / 200, 0.1),
      reflectance: generateSpectrumData(20, 0.4, 2.5, 0.3 + progress / 300, 0.15),
      brightnessTemp: generateChannelData().slice(0, 8).map((c) => ({
        ...c,
        value: c.value + progress * 0.2,
      })),
      radiationBalance: Number(randomInRange(285, 315).toFixed(2)),
      fittingResidual: Number(randomInRange(0.005, 0.04).toFixed(4)),
      progress,
    })
  }

  return data
}
