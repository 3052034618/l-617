import type { FileValidationResult } from '../types/index.js'

function removeBOM(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }
  return content
}

function parseDelimitedContent(content: string): string[][] {
  content = removeBOM(content)
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'))

  return lines.map((line) =>
    line
      .split(/[,\t\s|;]+/)
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0)
  )
}

function findColumnIndex(headers: string[], targetNames: string[]): number {
  const lowerTargets = targetNames.map((name) => name.toLowerCase())
  return headers.findIndex((header) =>
    lowerTargets.some((target) => header.toLowerCase().includes(target))
  )
}

export function validateProfileFile(content: string): FileValidationResult {
  try {
    const rows = parseDelimitedContent(content)

    if (rows.length < 2) {
      return {
        valid: false,
        message: '文件数据行数不足，至少需要包含表头和一行数据',
      }
    }

    const headers = rows[0]
    const dataRows = rows.slice(1)

    const tempCol = findColumnIndex(headers, ['温度', 'temperature', 'temp', 't'])
    const humidityCol = findColumnIndex(headers, ['湿度', 'humidity', 'rh', '水汽', 'h'])
    const pressureCol = findColumnIndex(headers, ['压力', '压强', 'pressure', 'pres', 'p'])

    const hasTemperature = tempCol !== -1
    const hasHumidity = humidityCol !== -1
    const hasPressure = pressureCol !== -1

    const missingColumns: string[] = []
    if (!hasTemperature) missingColumns.push('温度(temperature)')
    if (!hasHumidity) missingColumns.push('湿度(humidity)')
    if (!hasPressure) missingColumns.push('压力(pressure)')

    if (missingColumns.length > 0) {
      return {
        valid: false,
        message: `缺少必要的列：${missingColumns.join('、')}。请确保文件包含温度、湿度、压力三列数据。`,
        details: {
          foundColumns: headers,
          missingColumns,
        },
      }
    }

    let validDataRows = 0
    const errors: string[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const lineNum = i + 2

      if (row.length < headers.length) {
        errors.push(`第${lineNum}行数据列数不足`)
        continue
      }

      const tempVal = parseFloat(row[tempCol])
      const humVal = parseFloat(row[humidityCol])
      const presVal = parseFloat(row[pressureCol])

      if (isNaN(tempVal)) {
        errors.push(`第${lineNum}行温度数据无效：${row[tempCol]}`)
      }
      if (isNaN(humVal)) {
        errors.push(`第${lineNum}行湿度数据无效：${row[humidityCol]}`)
      }
      if (isNaN(presVal)) {
        errors.push(`第${lineNum}行压力数据无效：${row[pressureCol]}`)
      }

      if (!isNaN(tempVal) && !isNaN(humVal) && !isNaN(presVal)) {
        validDataRows++
      }
    }

    if (validDataRows === 0) {
      return {
        valid: false,
        message: '没有有效的数据行，请检查数据格式是否正确',
        details: { errors },
      }
    }

    if (errors.length > 0 && validDataRows < dataRows.length * 0.5) {
      return {
        valid: false,
        message: `数据质量较差，超过50%的数据行存在错误。前几个错误：${errors.slice(0, 3).join('；')}`,
        details: {
          totalRows: dataRows.length,
          validRows: validDataRows,
          errors: errors.slice(0, 10),
        },
      }
    }

    return {
      valid: true,
      message: `校验通过，共${validDataRows}行有效数据`,
      details: {
        totalRows: dataRows.length,
        validRows: validDataRows,
        columns: {
          temperature: headers[tempCol],
          humidity: headers[humidityCol],
          pressure: headers[pressureCol],
        },
        warnings: errors.length > 0 ? errors.slice(0, 5) : undefined,
      },
    }
  } catch (error) {
    return {
      valid: false,
      message: `文件解析失败：${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

export function validateSurfaceFile(content: string): FileValidationResult {
  try {
    const rows = parseDelimitedContent(content)

    if (rows.length < 2) {
      return {
        valid: false,
        message: '文件数据行数不足，至少需要包含表头和一行数据',
      }
    }

    const headers = rows[0]
    const dataRows = rows.slice(1)

    const typeCol = findColumnIndex(headers, [
      '类型',
      'type',
      'class',
      '分类',
      'category',
      '地表类型',
      'landcover',
      'lc',
    ])

    const hasTypeColumn = typeCol !== -1

    if (!hasTypeColumn) {
      const validTypeKeywords = [
        '植被',
        '水体',
        '沙漠',
        '城市',
        '冰雪',
        '农田',
        '森林',
        '草地',
        '裸地',
        '湿地',
        'vegetation',
        'water',
        'desert',
        'urban',
        'snow',
        'ice',
        'cropland',
        'forest',
        'grassland',
        'barren',
        'wetland',
      ]

      let foundTypeData = false
      let detectedTypeCol = -1

      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const sampleValues = dataRows.slice(0, 10).map((row) =>
          row[colIdx]?.toLowerCase() || ''
        )
        const typeMatches = sampleValues.filter((val) =>
          validTypeKeywords.some((keyword) => val.includes(keyword.toLowerCase()))
        )
        if (typeMatches.length >= 3) {
          foundTypeData = true
          detectedTypeCol = colIdx
          break
        }
      }

      if (!foundTypeData) {
        return {
          valid: false,
          message: '未找到地表类型分类数据。请确保文件包含类型(type/class)列，或数据中包含地表类型分类信息。',
          details: {
            foundColumns: headers,
            expectedKeywords: validTypeKeywords,
          },
        }
      }

      return {
        valid: true,
        message: `校验通过，自动检测到地表类型数据在第${detectedTypeCol + 1}列，共${dataRows.length}行数据`,
        details: {
          totalRows: dataRows.length,
          autoDetected: true,
          typeColumn: headers[detectedTypeCol] || `column_${detectedTypeCol}`,
        },
      }
    }

    const validTypes = new Set<string>()
    let validDataRows = 0
    const errors: string[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const lineNum = i + 2

      if (row.length <= typeCol) {
        errors.push(`第${lineNum}行缺少类型数据`)
        continue
      }

      const typeValue = row[typeCol].trim()
      if (typeValue) {
        validTypes.add(typeValue)
        validDataRows++
      } else {
        errors.push(`第${lineNum}行类型数据为空`)
      }
    }

    if (validDataRows === 0) {
      return {
        valid: false,
        message: '没有有效的地表类型数据',
        details: { errors },
      }
    }

    return {
      valid: true,
      message: `校验通过，共${validDataRows}行有效数据，包含${validTypes.size}种地表类型`,
      details: {
        totalRows: dataRows.length,
        validRows: validDataRows,
        typeColumn: headers[typeCol],
        typeCount: validTypes.size,
        sampleTypes: Array.from(validTypes).slice(0, 10),
        warnings: errors.length > 0 ? errors.slice(0, 5) : undefined,
      },
    }
  } catch (error) {
    return {
      valid: false,
      message: `文件解析失败：${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

export const allowedExtensions = ['.dat', '.txt', '.csv', '.json', '.tif']

export function validateFileExtension(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  return allowedExtensions.includes(ext)
}

export const maxFileSize = 10 * 1024 * 1024
