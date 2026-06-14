import apiClient from './client';

export interface Report {
  id: string;
  taskId: string;
  taskName: string;
  reportType: string;
  generatedAt: string;
  generatedBy: string;
  status: 'generating' | 'generated' | 'failed';
  sections?: Array<{ title: string; content: string }>;
}

export interface GenerateReportParams {
  taskName?: string;
  reportType?: string;
  generatedBy?: string;
}

export interface ExportParams {
  taskIds?: string[];
  sensorType?: string;
  observationGeometry?: string;
  timeWindow?: {
    start: string;
    end: string;
  };
  format?: 'csv' | 'json' | 'netcdf';
  includeSrf?: boolean;
}

export interface PdfInfo {
  url: string;
  filename: string;
  size: number;
}

export interface ExportResult {
  downloadUrl: string;
  format: string;
  count: number;
  filename?: string;
  size?: number;
}

export const reportApi = {
  getList() {
    return apiClient.get<Report[]>('/reports');
  },

  getByTaskId(taskId: string) {
    return apiClient.get<Report>(`/reports/${taskId}`);
  },

  generate(taskId: string, params?: GenerateReportParams) {
    return apiClient.post<Report>(`/reports/${taskId}/generate`, params);
  },

  getPdfInfo(taskId: string) {
    return apiClient.get<PdfInfo>(`/reports/${taskId}/pdf`);
  },

  downloadPdf(taskId: string) {
    const url = `http://localhost:3001/api/reports/${taskId}/pdf/download`;
    window.open(url, '_blank');
    return Promise.resolve({ success: true });
  },

  exportData(params: ExportParams) {
    return apiClient.post<ExportResult>('/reports/export', params);
  },

  getSensorTypes() {
    return Promise.resolve({
      success: true,
      data: [
        { id: 'landsat8', name: 'Landsat 8 OLI/TIRS' },
        { id: 'landsat9', name: 'Landsat 9 OLI-2/TIRS-2' },
        { id: 'sentinel2', name: 'Sentinel-2 MSI' },
        { id: 'modis', name: 'MODIS Terra/Aqua' },
        { id: 'viirs', name: 'VIIRS Suomi NPP' },
      ],
    });
  },

  getObservationGeometries() {
    return Promise.resolve({
      success: true,
      data: [
        { id: 'nadir', name: '天底观测 (0°)' },
        { id: 'small', name: '小角度 (0-20°)' },
        { id: 'medium', name: '中角度 (20-45°)' },
        { id: 'large', name: '大角度 (45-60°)' },
      ],
    });
  },
};

export default reportApi;
