export interface EmailTemplateRequest {
  templateName: string;
  subject: string;
  body: string;
}

export interface EmailTemplateUpdateRequest {
  templateName: string;
  subject: string;
  body: string;
}

export interface EmailTemplateResponse {
  templateId: number;
  templateName: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
