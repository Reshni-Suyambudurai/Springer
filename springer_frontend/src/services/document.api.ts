import { http, publicHttp } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse } from '../types/api.response';
import type {
  DocumentTypeResponse,
  DocumentTypeRequest,
  DocumentLinkRequest,
  DocumentLinkResponse,
  BulkDocumentLinkRequest,
  DocumentSubmissionResponse,
  VerificationRequest,
  VerificationResponse,
  DocumentCompletionResponse,
  OfferLetterRequest,
  BulkOfferGenerateRequest,
  BulkOfferGenerateResponse,
  OfferLetterResponse,
  OfferResponseRequest,
  OfferResponseResponse,
  BulkOfferResponseRequest,
  PipelineStatusResponse,
  DocumentSubmissionStatusResponse,
} from '../types/DocumentCollection/document.types';

// ==================== DOCUMENT TYPES ====================
export const documentTypeApi = {
  async getAllTypes(): Promise<ApiResponse<DocumentTypeResponse[]>> {
    try {
      const response = await http.get('/documents/types');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async createType(data: DocumentTypeRequest): Promise<ApiResponse<DocumentTypeResponse>> {
    try {
      const response = await http.post('/documents/types', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteType(documentTypeId: number): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete(`/documents/types/${documentTypeId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== DOCUMENT LINKS ====================
export const documentLinkApi = {
  async sendSubmissionLink(data: DocumentLinkRequest): Promise<ApiResponse<DocumentLinkResponse>> {
    try {
      const response = await http.post('/documents/send-submission-link', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async sendBulkSubmissionLinks(data: BulkDocumentLinkRequest): Promise<ApiResponse<Record<string, string>>> {
    try {
      const response = await http.post('/documents/send-submission-link/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async resendSubmissionLink(candidateId: number, cycleId: number, documentTypeIds?: number[], submissionDeadline?: string): Promise<ApiResponse<string>> {
    try {
      const response = await http.post('/documents/resend-submission-link', null, {
        params: { 
          candidateId, 
          cycleId,
          ...(documentTypeIds && documentTypeIds.length > 0 && { documentTypeIds: documentTypeIds.join(',') }),
          ...(submissionDeadline && { submissionDeadline })
        },
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== DOCUMENT SUBMISSIONS ====================
export const documentSubmissionApi = {
  async getAllSubmissions(params?: {
    status?: string;
    cycleId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<DocumentSubmissionResponse[]>> {
    try {
      const response = await http.get('/documents/submissions', { params });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getSubmissionsByCandidate(candidateId: number): Promise<ApiResponse<DocumentSubmissionResponse[]>> {
    try {
      const response = await http.get(`/documents/submissions/candidate/${candidateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getSubmissionById(documentId: number): Promise<ApiResponse<DocumentSubmissionResponse>> {
    try {
      const response = await http.get(`/documents/submissions/${documentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async openFile(documentId: number): Promise<void> {
    try {
      const response = await http.get(`/documents/submissions/${documentId}/file`, {
        responseType: 'blob',
      });
      const objectUrl = window.URL.createObjectURL(response.data);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  getFileUrl(documentId: number): string {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    return `${baseURL}/documents/submissions/${documentId}/file`;
  },
};

// ==================== VERIFICATION ====================
export const verificationApi = {
  async getPendingVerifications(params?: {
    cycleId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<VerificationResponse[]>> {
    try {
      const response = await http.get('/documents/verification/pending', { params });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async approveDocument(documentId: number, data: VerificationRequest): Promise<ApiResponse<VerificationResponse>> {
    try {
      const response = await http.patch(`/documents/verification/${documentId}/approve`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async rejectDocument(documentId: number, data: VerificationRequest): Promise<ApiResponse<VerificationResponse>> {
    try {
      const response = await http.patch(`/documents/verification/${documentId}/reject`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getDocumentCompletion(candidateId: number, cycleId: number): Promise<ApiResponse<DocumentCompletionResponse>> {
    try {
      const response = await http.get(`/documents/verification/candidate/${candidateId}/completion`, {
        params: { cycleId },
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== OFFERS ====================
export const offerApi = {
  async getAllOffers(params?: {
    offerResponse?: string;
    cycleId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<OfferLetterResponse[]>> {
    try {
      const response = await http.get('/offers', { params });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getOfferReadyCandidates(cycleId: number): Promise<ApiResponse<OfferLetterResponse[]>> {
    try {
      const response = await http.get('/offers/offer-ready', { params: { cycleId } });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async generateOffer(data: OfferLetterRequest): Promise<ApiResponse<OfferLetterResponse>> {
    try {
      const response = await http.post('/offers/generate', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async bulkGenerateOffers(data: BulkOfferGenerateRequest): Promise<ApiResponse<BulkOfferGenerateResponse>> {
    try {
      const response = await http.post('/offers/bulk-generate', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async bulkRecordResponse(data: BulkOfferResponseRequest[]): Promise<ApiResponse<OfferResponseResponse[]>> {
    try {
      const response = await http.post('/offers/bulk-response', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async recordOfferResponse(offerId: number, data: OfferResponseRequest): Promise<ApiResponse<OfferResponseResponse>> {
    try {
      const response = await http.patch(`/offers/${offerId}/response`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCandidateOffer(candidateId: number): Promise<ApiResponse<OfferResponseResponse>> {
    try {
      const response = await http.get(`/offers/candidate/${candidateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== REPORTS ====================
export const docReportApi = {
  async getPipelineStatus(cycleId: number): Promise<ApiResponse<PipelineStatusResponse>> {
    try {
      const response = await http.get('/reports/pipeline-status', { params: { cycleId } });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getDocumentCompletionReport(cycleId: number): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await http.get('/reports/document-completion', { params: { cycleId } });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== PUBLIC SUBMISSION PAGE (candidate-facing) ====================
// Uses publicHttp (no auth header) — candidates are NOT logged-in users.
// Authentication is done via the JWT token embedded in the URL.
export const documentSubmissionPageApi = {

  // GET /api/documents/submission-status?token=xxx
  // Called when candidate opens the submission link
  async getSubmissionStatus(token: string): Promise<ApiResponse<DocumentSubmissionStatusResponse>> {
    try {
      const response = await publicHttp.get('/documents/submission-status', { params: { token } });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  // POST /api/documents/submissions (multipart) with token
  // Called when candidate uploads a document
  async uploadDocument(
    documentTypeId: number,
    file: File,
    token: string
  ): Promise<ApiResponse<DocumentSubmissionResponse>> {
    try {
      const formData = new FormData();
      formData.append('documentTypeId', String(documentTypeId));
      formData.append('file', file);
      formData.append('token', token);
      const response = await publicHttp.post('/documents/submissions', formData);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
