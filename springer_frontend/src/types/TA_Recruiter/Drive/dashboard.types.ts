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

// ==================== Drive Details Analysis ====================

export interface DriveBreakdown {
  driveId: number;
  driveName: string;
  driveMode: string;
  location: string;
  instituteName: string | null;
  startDate: string | null;
  distinctBatchCount: number;
  batchApplicationCounts: Record<string, number>;
  appliedCount: number;
  selectedCount: number;
  droppedCount: number;
  rejectedCount: number;
}

export interface DriveDetailsAnalysisResponse {
  cycleId: number;
  cycleName: string;
  cycleYear: number;
  totalCandidates: number;
  selectedCount: number;
  rejectedCount: number;
  droppedCount: number;
  acceptedCount: number;
  joinedCount: number;
  onCampusDriveCount: number;
  offCampusDriveCount: number;
  drives: DriveBreakdown[];
}

// ==================== College Analysis ====================

export interface CollegeAnalysisResponse {
  instituteId: number;
  instituteName: string;
  totalAppliedCount: number;
  selectedCount: number;
  rejectedCount: number;
  droppedCount: number;
  acceptedCount: number;
  joinedCount: number;
  notJoinedCount: number;
  offerRejectedCount: number;
}
