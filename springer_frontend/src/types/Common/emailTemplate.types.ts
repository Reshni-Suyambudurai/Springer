/**
 * Email Template Request DTO
 * Used for creating new email templates
 */
export interface EmailTemplateRequest {
  templateName: string;
  subject: string;
  body: string;
}

/**
 * Email Template Response DTO
 * Returned when fetching email template data
 */
export interface EmailTemplateResponse {
  templateId: number;
  templateName: string;
  subject: string;
  body: string;
}

/**
 * Email Template Update Request DTO
 * Used for updating existing email templates
 * All fields are optional for partial updates
 */
export interface EmailTemplateUpdateRequest {
  templateName?: string;
  subject?: string;
  body?: string;
}

/**
 * Bulk email send request DTO.
 * subject and body come from whatever is currently in the editor — DB copy is ignored.
 * templateId and templateName are optional and used only for server-side audit logging.
 */
export interface BulkEmailRequest {
  templateId?: number;
  templateName?: string;
  subject: string;
  body: string;
  emailIds: string[];
}

/**
 * Result of a bulk email send operation.
 */
export interface BulkEmailResult {
  totalRequested: number;
  successCount: number;
  skippedCount: number;
  sentTo: string[];
  skipped: string[];
}

// ── Personalized email types ───────────────────────────────────────────────

/**
 * Per-recipient data for a personalized email send.
 * All fields except email are optional; only non-null values are substituted.
 */
export interface PersonalizedRecipient {
  email: string;
  candidateName?: string | null;
  registrationCode?: string | null;
  batchTime?: string | null;
  roundNo?: string | null;
}

/**
 * Shared context for a personalized bulk email send.
 * Matches backend SharedEmailContext.
 * All fields except templateId are optional; only non-null values are substituted.
 */
export interface SharedEmailContext {
  templateId: number;
  subject?: string | null;
  driveName?: string | null;
  startDate?: string | null;
  location?: string | null;
  roundNo?: string | null;
  roundName?: string | null;
  recipients: PersonalizedRecipient[];
}
