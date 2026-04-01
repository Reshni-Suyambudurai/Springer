// Program Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Hiring

export interface ProgramResponse {
  programId: number;
  programName: string;
}

export interface InstituteProgramRequest {
  instituteId: number;
  programId: number;
}

// Nested program details for institutes
export interface ProgramDetails {
  programId: number;
  programName: string;
}
