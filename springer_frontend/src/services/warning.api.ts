import { http } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse, Page } from '../types/api.response';

export interface InternWarningRequest {
  studentId: number;
  issuedBy: number;
  warningType: string;  // ATTENDANCE | PERFORMANCE | BEHAVIOUR | PUNCTUALITY | OTHER
  severity: string;     // MINOR | MODERATE | SEVERE
  message: string;
  courseId?: number | null;
}

export interface InternWarningResponse {
  warningId: number;
  studentId: number;
  studentName: string;
  programName: string;
  batchNumber: number;
  issuedByName: string;
  warningType: string;
  severity: string;
  message: string;
  courseId: number | null;
  status: string;         // ACTIVE | ACKNOWLEDGED
  issuedAt: string;
  acknowledgedAt: string | null;
  acknowledgementComment: string | null;
}

export const warningApi = {

  async getAllWarnings(): Promise<ApiResponse<InternWarningResponse[]>> {
    try {
      const res = await http.get('/academy/warnings');
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async getWarningsFiltered(params: {
    programId?: number;
    batchNumber?: number;
    status?: string;
    warningType?: string;
    search?: string;
    page: number;
    size: number;
  }): Promise<ApiResponse<Page<InternWarningResponse>>> {
    try {
      const res = await http.get('/academy/warnings/filtered', { params });
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async issueWarning(data: InternWarningRequest): Promise<ApiResponse<InternWarningResponse>> {
    try {
      const res = await http.post('/academy/warnings', data);
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async getWarningsByStudent(studentId: number): Promise<ApiResponse<InternWarningResponse[]>> {
    try {
      const res = await http.get(`/academy/warnings/student/${studentId}`);
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async getWarningsByBatch(programId: number, batchNumber: number): Promise<ApiResponse<InternWarningResponse[]>> {
    try {
      const res = await http.get('/academy/warnings/batch', { params: { programId, batchNumber } });
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async acknowledgeWarning(warningId: number, acknowledgementComment: string): Promise<ApiResponse<InternWarningResponse>> {
    try {
      const res = await http.patch(`/academy/warnings/${warningId}/acknowledge`, null, {
        params: { acknowledgementComment },
      });
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },
};
