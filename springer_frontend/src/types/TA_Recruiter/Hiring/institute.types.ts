// Institute Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Hiring

// Institute Filters Type
export interface InstituteFilters {
  instituteName: string;
  state: string;
  cities: string[];
  instituteTier: string;
  status: string;
  programs: string[];
}

export interface InstituteRequest {
  instituteName: string;
  instituteTier: string; // TIER_1, TIER_2, TIER_3

  state: string;
  city: string;
  isActive: boolean;
  programIds?: number[]; // Optional list of program IDs to map to this institute
}

export interface InstituteResponse {
  instituteId: number;
  instituteName: string;
  instituteTier: string;
 
  state: string;
  city: string;
  isActive: boolean;
  createdAt: string; // ISO-8601 format from LocalDateTime
  programs: {
    programId: number;
    programName: string;
  }[];
}

// Nested TPO details interface
export interface TPODetails {
  tpoId: number;
  tpoName: string;
  tpoEmail: string;
  tpoMobile: string;
  tpoDesignation?: string;
  tpoStatus: string;
  isPrimary: boolean;
  createdAt: string; // ISO-8601 format from LocalDateTime
}

// Nested program details interface
export interface ProgramDetails {
  instituteProgramId: number; // Mapping ID for deletion
  programId: number;
  programName: string;
}

// Institute with associated TPO contacts
export interface InstituteWithTPOsResponse {
  instituteId: number;
  instituteName: string;
  instituteTier: string;
  state: string;
  city: string;
  isActive: boolean;
  createdAt: string; // ISO-8601 format from LocalDateTime
  tpoDetails: TPODetails[];
  programs: ProgramDetails[]; // Programs offered by this institute
}

// Pagination response for institutes with TPOs
export interface PagedInstituteWithTPOsResponse {
  content: InstituteWithTPOsResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Lightweight institute name response (for dropdowns)
export interface InstituteNameResponse {
  instituteId: number;
  instituteName: string;
}


