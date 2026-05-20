import {http} from "./api/https";
import { handleAxiosError } from "./api.error";

// Common type imports
import type { ApiResponse } from "../types/api.response";

// Email Template type imports
import type { 
  EmailTemplateRequest, 
  EmailTemplateResponse, 
  EmailTemplateUpdateRequest,
  BulkEmailResult,
  SharedEmailContext,
} from "../types/Common/emailTemplate.types";

// ==================== EMAIL TEMPLATE APIs ====================
export const emailTemplateApi = {
  /**
   * Create a new email template
   * POST /api/email-templates
   */
  async createEmailTemplate(data: EmailTemplateRequest): Promise<ApiResponse<EmailTemplateResponse>> {
    try {
      const response = await http.post('/email-templates', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get email template by ID
   * GET /api/email-templates/{templateId}
   */
  async getEmailTemplateById(templateId: number): Promise<ApiResponse<EmailTemplateResponse>> {
    try {
      const response = await http.get(`/email-templates/${templateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all email templates
   * GET /api/email-templates
   */
  async getAllEmailTemplates(): Promise<ApiResponse<EmailTemplateResponse[]>> {
    try {
      const response = await http.get('/email-templates');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get email templates by list of IDs
   * POST /api/email-templates/by-ids
   */
  async getEmailTemplatesByIds(templateIds: number[]): Promise<ApiResponse<EmailTemplateResponse[]>> {
    try {
      const response = await http.post('/email-templates/by-ids', templateIds);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update email template
   * PATCH /api/email-templates/{templateId}
   */
  async updateEmailTemplate(templateId: number, data: EmailTemplateUpdateRequest): Promise<ApiResponse<EmailTemplateResponse>> {
    try {
      const response = await http.patch(`/email-templates/${templateId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Delete email template
   * DELETE /api/email-templates/{templateId}
   */
  async deleteEmailTemplate(templateId: number): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete(`/email-templates/${templateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Send an email template to multiple recipients.
   * Accepts a FormData with a 'request' JSON part and optional 'attachments' file parts.
   * POST /api/email-templates/send-bulk  (multipart/form-data)
   */
  async sendBulkEmail(form: FormData): Promise<ApiResponse<BulkEmailResult>> {
    try {
      // Extract the request JSON string from FormData and send as plain JSON
      const requestJson = form.get('request') as string;
      const payload = JSON.parse(requestJson);
      const response = await http.post('/email-templates/send-bulk', payload);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Send personalized emails using a template.
   * Loads the template from DB by templateId, substitutes only non-null tokens.
   * POST /api/email-templates/send-personalized
   */
  async sendPersonalizedEmail(context: SharedEmailContext): Promise<ApiResponse<void>> {
    try {
      const response = await http.post('/email-templates/send-personalized', context);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
