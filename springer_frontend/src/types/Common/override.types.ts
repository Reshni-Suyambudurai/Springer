// Manual Override Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Common

// Represents a single field-level change in a manual override
export interface FieldChangeDTO {
  field: string;
  old: unknown; // Object from Java
  newValue: unknown; // Object from Java
}

// Request DTO for logging a manual override
export interface ManualOverrideRequest {
  entityType: string; // CANDIDATES, DRIVES, etc.
  entityId: number;
  changes: FieldChangeDTO[];
  overrideReason: string;
  createdBy: number; // User ID who performed the override
}

// Response DTO for manual override records
export interface ManualOverrideResponse {
  overrideId: number;
  entityType: string;
  entityId: number;
  changes: FieldChangeDTO[];
  overrideReason: string;
  createdById: number;
  createdByName: string;
  createdAt: string; // ISO-8601 format from LocalDateTime
}

// Query parameters for filtering overrides
export interface OverrideQueryParams {
  fromDate?: string; // YYYY-MM-DD format
  entityType?: string;
  userId?: number;
}
