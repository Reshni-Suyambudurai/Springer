// ==================== DOCUMENT TYPE ====================

export interface DocumentTypeResponse {
  documentTypeId: number;
  documentType: string;
  createdAt: string;
}

export interface DocumentTypeRequest {
  documentType: string;
}

// ==================== DOCUMENT LINK ====================

export interface DocumentLinkRequest {
  candidateId: number;
  cycleId: number;
  requiredDocumentTypeIds: number[];
  submissionDeadline?: string;
}

export interface DocumentLinkResponse {
  candidateId: number;
  candidateName: string;
  submissionLink: string;
  expiresAt: string;
}

export interface BulkDocumentLinkRequest {
  candidateIds: number[];
  cycleId: number;
  documentTypeIds: number[];
  submissionDeadline?: string;
}

// ==================== DOCUMENT SUBMISSION ====================

export interface DocumentSubmissionResponse {
  documentId: number;
  candidateId: number;
  candidateName: string;
  documentType: string;
  cycleId: number;
  verificationStatus: string; // COLLECTED | PENDING | APPROVED | REJECTED
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedBy: number | null;
}

// ==================== VERIFICATION ====================

export interface VerificationRequest {
  verifiedBy: number;
  comment?: string;
  rejectionReason?: string;
}

export interface VerificationResponse {
  documentId: number;
  candidateId: number;
  documentType: string;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedBy: number | null;
  rejectionReason: string | null;
  comment: string | null;
}

// ==================== DOCUMENT COMPLETION ====================

export interface DocumentStatusDetail {
  documentType: string;
  status: string;
  verifiedAt: string | null;
}

export interface DocumentCompletionResponse {
  candidateId: number;
  candidateName: string;
  cycleId: number;
  completePercentage: number;
  totalRequired: number;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  documents: DocumentStatusDetail[];
  isOfferReady: boolean;
}

// ==================== OFFER LETTER ====================

export interface OfferLetterRequest {
  candidateId: number;
  cycleId: number;
}

export interface BulkOfferGenerateRequest {
  candidateIds: number[];
  cycleId: number;
}

export interface BulkOfferGenerateResponse {
  totalRequested: number;
  totalSuccess: number;
  totalSkipped: number;
  totalFailed: number;
  results: Array<{
    candidateId: number;
    candidateName: string | null;
    status: string; // SUCCESS | SKIPPED | FAILED
    reason: string | null;
  }>;
}

export interface OfferLetterResponse {
  offerId: number;
  candidateId: number;
  candidateName: string;
  cycleId: number;
  issueDate: string | null;
  response: string;               // PENDING | ACCEPTED | DECLINED
  respondedDate: string | null;
  declineReason: string | null;
  applicationStage: string | null; // candidate's academy stage — editable only when ACCEPTED
}

// ==================== OFFER RESPONSE ====================

export interface OfferResponseRequest {
  response: string; // ACCEPTED | DECLINED
  respondedDate: string; // required
  declineReason?: string;
}

export interface BulkOfferResponseRequest {
  offerId: number;
  response: string; // ACCEPTED | DECLINED
  respondedDate: string;
  declineReason?: string;
}

export interface OfferResponseResponse {
  offerId: number;
  candidateId: number;
  candidateName: string;
  response: string;
  respondedDate: string | null;
  declineReason: string | null;
}

// ==================== PIPELINE REPORT ====================

export interface PipelineStatusResponse {
  cycleId: number;
  reportGeneratedAt: string;
  funnel: {
    candidatesSelected: number;
    documentsPending: number;
    offersIssued: number;
    offersAccepted: number;
    readyForAcademy: number;
  };
  conversionMetrics: {
    selectionToDocumentCollection: string;
    documentToOffer: string;
    offerToAcceptance: string;
  };
  timelineMetrics: {
    avgDaysInDocumentCollection: number;
    avgDaysInOfferPhase: number;
    bottleneck: string;
  };
}

// ==================== DASHBOARD CONTEXT ====================

export interface DocProcessingTab {
  key: string;
  label: string;
}

export interface DocProcessingContextProps {
  cycleId: number;
  cycleName: string;
}

// ==================== VERIFY DOCUMENTS TAB TYPES ====================

export interface CandidateWithDocs {
  candidate: {
    candidateId: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    applicationStage?: string;
  };
  docs: DocumentSubmissionResponse[];
  approvedCount: number;
  collectedCount: number;   // uploaded, awaiting review (COLLECTED)
  notUploadedCount: number; // not yet uploaded (PENDING)
  rejectedCount: number;
}

// ==================== DOCUMENT SUBMISSION STATUS (public page) ====================

export interface DocumentStatusDTO {
  documentId?: number;
  documentTypeId: number;
  documentType: string;
  required: boolean;
  status: string; // PENDING | COLLECTED | APPROVED | REJECTED
  uploadedAt: string | null;
  rejectionReason: string | null;
}

export interface DocumentSubmissionStatusResponse {
  candidateId: number;
  candidateName: string;
  cycleId: number;
  completionPercentage: number;
  totalRequired: number;
  documents: DocumentStatusDTO[];
  linkExpiryDate: string | null;
}
