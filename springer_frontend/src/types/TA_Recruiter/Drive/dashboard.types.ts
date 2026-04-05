export interface InstituteSummary {
  instituteId: number;
  instituteName: string;
  totalCandidates: number;
  selectedCount: number;
  rejectedCount: number;
  droppedCount: number;
  acceptedCount: number;
  joinedCount: number;
}

export interface DriveDashboardResponse {
  totalCandidates: number;
  selectedCount: number;
  rejectedCount: number;
  droppedCount: number;
  acceptedCount: number;
  joinedCount: number;
  driveLocationMap: Record<string, number>;
  instituteSummaries: InstituteSummary[];
}
