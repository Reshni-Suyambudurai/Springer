import { http } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse } from '../types/api.response';
import type { EmailTemplateRequest, EmailTemplateResponse, EmailTemplateUpdateRequest } from '../types/Common/emailTemplate.types';

export const emailTemplateApi = {
  async getAllEmailTemplates(): Promise<ApiResponse<EmailTemplateResponse[]>> {
    try {
      const response = await http.get('/email-templates');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getEmailTemplateById(templateId: number): Promise<ApiResponse<EmailTemplateResponse>> {
    try {
      const response = await http.get(`/email-templates/${templateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async createEmailTemplate(data: EmailTemplateRequest): Promise<ApiResponse<EmailTemplateResponse>> {
    try {
      const response = await http.post('/email-templates', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async updateEmailTemplate(templateId: number, data: EmailTemplateUpdateRequest): Promise<ApiResponse<EmailTemplateResponse>> {
    try {
      const response = await http.patch(`/email-templates/${templateId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteEmailTemplate(templateId: number): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete(`/email-templates/${templateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getEmailTemplatesByIds(ids: number[]): Promise<ApiResponse<EmailTemplateResponse[]>> {
    try {
      const response = await http.post('/email-templates/by-ids', ids);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async sendBulkEmail(formData: FormData): Promise<ApiResponse<{ successCount: number; skippedCount: number }>> {
    try {
      const response = await http.post('/email-templates/send-bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
