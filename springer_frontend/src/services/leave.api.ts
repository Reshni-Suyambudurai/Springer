import { http } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse } from '../types/api.response';

export interface LeaveRequestRequest {
  studentId: number;
  fromDate: string;   // YYYY-MM-DD
  toDate: string;     // YYYY-MM-DD
  leaveType: string;  // SICK | PERSONAL | EMERGENCY | OTHER
  reason: string;
}

export interface LeaveReviewRequest {
  decision: 'APPROVE' | 'REJECT';
  remarks?: string;
  reviewedBy: number;
}

export interface LeaveRequestResponse {
  leaveId: number;
  studentId: number;
  studentName: string;
  programName: string;
  batchNumber: number;
  fromDate: string;
  toDate: string;
  totalDays: number;
  leaveType: string;
  reason: string;
  status: string;         // PENDING | APPROVED | REJECTED
  remarks: string | null; // TA Recruiter remarks
  reviewedBy: string | null;
  reviewedAt: string | null;
  appliedAt: string;
}

export const leaveApi = {

  async applyLeave(data: LeaveRequestRequest): Promise<ApiResponse<LeaveRequestResponse>> {
    try {
      const res = await http.post('/academy/leaves', data);
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async getLeavesByStudent(studentId: number): Promise<ApiResponse<LeaveRequestResponse[]>> {
    try {
      const res = await http.get(`/academy/leaves/student/${studentId}`);
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async getAllLeaves(): Promise<ApiResponse<LeaveRequestResponse[]>> {
    try {
      const res = await http.get('/academy/leaves');
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  async getLeavesByBatch(programId: number, batchNumber: number): Promise<ApiResponse<LeaveRequestResponse[]>> {
    try {
      const res = await http.get('/academy/leaves/batch', { params: { programId, batchNumber } });
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },

  // TA Recruiter only — TC cannot call this
  async reviewLeave(leaveId: number, data: LeaveReviewRequest): Promise<ApiResponse<LeaveRequestResponse>> {
    try {
      const res = await http.patch(`/academy/leaves/${leaveId}/review`, data);
      return res.data;
    } catch (e) { throw handleAxiosError(e); }
  },
};
