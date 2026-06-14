import apiClient from './client';
import type { ApprovalRecord, SimulationTask } from '@/types';

export interface ApprovalChain {
  taskId: string;
  taskName: string;
  currentLevel: number;
  status: string;
  records: ApprovalRecord[];
}

export interface ApprovalParams {
  level: number;
  approver: string;
  comment: string;
}

export const approvalApi = {
  getPending(role: 'processor' | 'manager' | 'chief' = 'processor') {
    return apiClient.get<ApprovalRecord[]>(`/approvals/pending?role=${role}`);
  },

  getHistory() {
    return apiClient.get<ApprovalRecord[]>('/approvals/history');
  },

  getChain(taskId: string) {
    return apiClient.get<ApprovalChain>(`/approvals/chain/${taskId}`);
  },

  submit(taskId: string, level = 1) {
    return apiClient.post<ApprovalRecord>('/approvals/submit', { taskId, level });
  },

  approve(taskId: string, params: ApprovalParams) {
    return apiClient.put<{
      approval: ApprovalRecord;
      task: SimulationTask;
      nextApproval?: ApprovalRecord;
    }>(`/approvals/${taskId}/approve`, params);
  },

  reject(taskId: string, params: ApprovalParams) {
    return apiClient.put<{
      approval: ApprovalRecord;
      task: SimulationTask;
    }>(`/approvals/${taskId}/reject`, params);
  },
};

export default approvalApi;
