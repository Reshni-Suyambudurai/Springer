// ==================== TRAINING PROGRAM ====================

export const TrainingLocation = {
  CHENNAI: 'CHENNAI',
  BANGALORE: 'BANGALORE',
  HYDERABAD: 'HYDERABAD',
  PUNE: 'PUNE',
  MUMBAI: 'MUMBAI',
  DELHI: 'DELHI',
  COIMBATORE: 'COIMBATORE',
  REMOTE: 'REMOTE',
} as const;

export type TrainingLocation = typeof TrainingLocation[keyof typeof TrainingLocation];

export interface TrainingProgramRequest {
  programName: string;
  programYear: number;
  capacity: number;
  numberOfBatches: number;
  location: TrainingLocation | '';
  cycleId: number;
}

export interface TrainingProgramResponse {
  programId: number;
  programName: string;
  programYear: number;
  capacity: number;
  numberOfBatches: number;
  location: string;
  status: boolean;
  cycleId: number;
  createdAt: string;
}

// ==================== TRAINING COURSE ====================

export interface TrainingCourseRequest {
  courseName: string;
  description: string;
  minScore: number;
  weightage?: number;          // not needed for communication courses
  isCommunication?: boolean;
  communicationTemplate?: string; // JSON string, only for communication courses
}

export interface TrainingCourseResponse {
  courseId: number;
  courseName: string;
  description: string;
  minScore: number;
  weightage: number | null;    // null for communication courses
  isCommunication: boolean;
  communicationTemplate: string | null; // JSON string, only for communication courses
  createdAt: string;
}

// ==================== BATCH COURSE ====================

export interface BatchCourseRequest {
  batchNo: number;
  courseId: number;
  programId: number;
  startDate: string;
  endDate: string;
  conductedBy: number;
  status?: string;
}

export interface BatchCourseResponse {
  batchCourseId: number;
  batchNo: number;
  courseId: number;
  courseName: string;
  programId: number;
  cycleId: number | null;
  startDate: string | null;
  endDate: string | null;
  conductedBy: number | null;
  trainerName: string | null;
  status: string;
  createdAt: string;
}

// ==================== BATCH SCHEDULE ====================

export interface BatchScheduleRequest {
  programId: number;
  batchNumber: number;
  startDate: string;  // "YYYY-MM-DD"
  endDate: string;    // "YYYY-MM-DD"
}

export interface BatchScheduleResponse {
  batchScheduleId: number;
  programId: number;
  programName: string;
  batchNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string | null;
}

// ==================== BATCH ALLOCATION ====================

export interface BatchAllocationRequest {
  programId: number;
  candidateId: number;
  batchNumber: number;
  isActive: boolean;
  performance?: string;
}

export interface BatchAllocationResponse {
  studentId: number;
  programId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  department: string;
  batchNumber: number;
  isActive: boolean;
  performance: string | null;
  attendancePercentage: number;
  overallWeightedScore: number | null;
  createdAt: string;
  /** Populated if this student was transferred from another batch. */
  transferredFromStudentId: number | null;
}

export interface BatchTransferRequest {
  targetProgramId: number;
  targetBatchNumber: number;
  transferReason?: string;
}

// ==================== ATTENDANCE ====================

export interface AttendanceMarkRequest {
  studentId: number;
  attendanceDate: string; // "YYYY-MM-DD"
  isPresent: boolean;
}

export interface BulkAttendanceMarkRequest {
  programId: number;
  batchNumber: number;
  attendanceDate: string; // "YYYY-MM-DD"
  isPresent: boolean;
}

export interface AttendanceResponse {
  studentId: number;
  studentName: string;
  attendanceDate: string;
  isPresent: boolean;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

export interface AttendanceStatsResponse {
  studentId: number;
  studentName: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  attendancePercentage: number;
}

// ==================== ACADEMY DASHBOARD TAB ====================

export interface AcademyTab {
  key: string;
  label: string;
}

export interface AcademyContextProps {
  programYear: number;
  programs: TrainingProgramResponse[];
  cycles?: import('../TA_Recruiter/Hiring/hiringCycle.types').HiringCycleResponse[];
  onProgramsChanged?: () => void;
}

// ==================== USER SUMMARY (for dropdowns) ====================

export interface UserSummary {
  userId: number;
  username: string;
  email: string;
}

// ==================== TRAINING SCORE ====================

export interface TrainingScoreRequest {
  courseId: number;
  studentId: number;
  score: number;
  review: string;
  reviewedBy: number; // auto-populated from logged-in user via tokenstore
  /** Only sent when the course has isCommunication = true. JSON string. */
  communicationBreakdown?: string;
}

export interface TrainingScoreResponse {
  scoreId: number;
  courseId: number;
  studentId: number;
  score: number;
  /** For technical: 100. For communication: sum of all sub-field maxScores. */
  maxScore: number;
  review: string;
  status: string; // EXCELLENT | GOOD | AVERAGE | BELOW_AVERAGE
  reviewedBy: number;
  communicationBreakdown: string | null; // JSON string, only for Communication courses
  createdAt: string;
}

// ==================== INLINE SCORE EDIT STATE ====================

export interface InlineScoreState {
  score: string;
  review: string;
  saving: boolean;
}

// ==================== EXCEL UPLOAD ====================

export interface ExcelUploadResponse {
  savedCount: number;
  failedCount: number;
  totalRows: number;
  errors: string[];
}

// ==================== JOINING TRACKER ====================

export interface JoiningTrackerRequest {
  cycleId: number;
  applicationStages: string[];
}

export interface BatchCandidateResponse {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  cgpa: number;
  applicationStage: string;
  instituteName: string;
  mobile: string;
  degree: string;
  cycleId: number;
  updatedAt: string;
  userId?: number;
}

export interface JoiningTrackerCandidate {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  instituteName: string;
  mobile: string;
  department: string;
  degree: string;
  cycleId: number;
  applicationStage: string;
  updatedAt: string;
  userId?: number;
}

export interface JoiningStatusUpdateRequest {
  status: 'JOINED' | 'NOT_JOINED' | 'OFFER_REJECTED';
  updatedBy: number;
  reason?: string;
}
