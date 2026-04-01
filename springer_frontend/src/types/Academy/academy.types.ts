// ==================== TRAINING PROGRAM ====================

export interface TrainingProgramRequest {
  programName: string;
  programYear: number;
  capacity: number;
  numberOfBatches: number;
  location: string;
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
  startDate: string;   // "YYYY-MM-DD"
  endDate: string;     // "YYYY-MM-DD"
  minScore: number;
  weightage: number;
  conductedBy: number; // userId of trainer
}

export interface TrainingCourseResponse {
  courseId: number;
  courseName: string;
  description: string;
  startDate: string;
  endDate: string;
  minScore: number;
  weightage: number;
  conductedBy: number;
  status: string; // PLANNED | ACTIVE | COMPLETED | CANCELLED
  createdAt: string;
}

// ==================== BATCH COURSE ====================

export interface BatchCourseRequest {
  batchNo: number;
  courseId: number;
  programId: number;
}

export interface BatchCourseResponse {
  batchCourseId: number;
  batchNo: number;
  courseId: number;
  programId: number;
  cycleId: number | null;
  createdAt: string;
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
  createdAt: string;
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
}

export interface TrainingScoreResponse {
  scoreId: number;
  courseId: number;
  studentId: number;
  score: number;
  review: string;
  status: string; // EXCELLENT | GOOD | AVERAGE | BELOW_AVERAGE
  reviewedBy: number;
  createdAt: string;
}

// ==================== INLINE SCORE EDIT STATE ====================

export interface InlineScoreState {
  score: string;
  review: string;
  saving: boolean;
}
