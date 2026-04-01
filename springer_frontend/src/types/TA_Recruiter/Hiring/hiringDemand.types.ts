// Hiring Demand Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Hiring

import type { SkillResponse } from './skill.types';

// ApprovalStatus values matching backend enum
export const ApprovalStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type ApprovalStatusType = typeof ApprovalStatus[keyof typeof ApprovalStatus];

export interface HiringDemandRequest {
  cycleId: number;
  businessUnit: string;
  demandCount: number;
  compensationBand: string;
  jobDescription: string;
  approvalStatus: ApprovalStatusType;
  skillIds: number[];
}

export interface HiringDemandResponse {
  demandId: number;
  cycleId: number;
  cycleName: string;
  businessUnit: string;
  demandCount: number;
  compensationBand: string;
  approvalStatus: string;
  createdByUsername: string;
  createdAt: string; // ISO-8601 format from LocalDateTime
  skills: SkillResponse[];
}

