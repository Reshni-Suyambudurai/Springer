import { http } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse } from '../types/api.response';
import type {
  InternDashboardData,
  InternActivationRequest,
  InternActivationResponse,
  InternProfileRequest,
  InternProfileResponse,
  InternCertificateResponse,
} from '../types/Academy/intern.types';

export const internApi = {

  // ── Dashboard ───────────────────────────────────────────────────────────────

  async getDashboard(userId: number): Promise<ApiResponse<InternDashboardData>> {
    try {
      const response = await http.get(`/intern/dashboard/${userId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  // ── Activation ──────────────────────────────────────────────────────────────

  async activateIntern(candidateId: number, data: InternActivationRequest): Promise<ApiResponse<InternActivationResponse>> {
    try {
      const response = await http.post(`/intern/activate/${candidateId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  // ── Password ────────────────────────────────────────────────────────────────

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<ApiResponse<string>> {
    try {
      const response = await http.post(`/intern/change-password/${userId}`, { oldPassword, newPassword });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  // ── Profile ─────────────────────────────────────────────────────────────────

  async getProfile(userId: number): Promise<ApiResponse<InternProfileResponse>> {
    try {
      const response = await http.get(`/intern/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async saveOrUpdateProfile(userId: number, data: InternProfileRequest): Promise<ApiResponse<InternProfileResponse>> {
    try {
      const response = await http.post(`/intern/profile/${userId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  // ── Certificates ────────────────────────────────────────────────────────────

  async uploadCertificate(
    studentId: number,
    certificateName: string,
    issuer: string,
    issueDate: string | null,
    file: File
  ): Promise<ApiResponse<InternCertificateResponse>> {
    try {
      const formData = new FormData();
      formData.append('certificateName', certificateName);
      formData.append('issuer', issuer);
      if (issueDate) formData.append('issueDate', issueDate);
      formData.append('file', file);
      const response = await http.post(`/intern/certificates/${studentId}`, formData);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getProfileByStudent(studentId: number): Promise<ApiResponse<InternProfileResponse>> {
    try {
      const response = await http.get(`/intern/profile/by-student/${studentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCertificates(studentId: number): Promise<ApiResponse<InternCertificateResponse[]>> {
    try {
      const response = await http.get(`/intern/certificates/${studentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async openCertificate(certificateId: number): Promise<void> {
    try {
      const response = await http.get(`/intern/certificates/${certificateId}/file`, {
        responseType: 'blob',
      });
      const objectUrl = window.URL.createObjectURL(response.data);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteCertificate(certificateId: number, studentId: number): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete(`/intern/certificates/${certificateId}`, {
        params: { studentId },
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
