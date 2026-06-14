import apiClient from './client';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  type: 'profile' | 'surface';
  size: number;
  uploadTime: string;
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationMessage?: string;
  filePath?: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface UploadResponse {
  file: UploadedFile;
  validation: ValidationResult;
}

export const uploadApi = {
  uploadProfile(file: File) {
    return apiClient.upload<UploadResponse>('/upload/profile', file);
  },

  uploadSurface(file: File) {
    return apiClient.upload<UploadResponse>('/upload/surface', file);
  },

  getFiles(type?: 'profile' | 'surface') {
    const query = type ? `?type=${type}` : '';
    return apiClient.get<{ list: UploadedFile[]; total: number }>(`/upload/files${query}`);
  },

  deleteFile(filename: string) {
    return apiClient.delete<{ filename: string; message: string }>(`/upload/${filename}`);
  },

  validate(filename: string, type?: 'profile' | 'surface') {
    const query = type ? `?type=${type}` : '';
    return apiClient.get<ValidationResult>(`/upload/validate/${filename}${query}`);
  },
};

export default uploadApi;
