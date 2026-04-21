export interface InternActivationRequest {
  outlookEmail: string;
}

export interface InternActivationResponse {
  userId: number;
  email: string;
  message: string;
}

export interface InternCourseScore {
  courseId: number;
  courseName: string;
  score: number | null;
  status: string | null;
  review: string | null;
  weightage: number | null;
  minScore: number;
  /** For technical: 100. For communication: sum of all sub-field maxScores. */
  maxScore: number;
  isCommunication: boolean;
  communicationBreakdown: string | null; // JSON, only for communication courses
  courseStartDate: string | null;
  courseEndDate: string | null;
  courseStatus: string | null;
}

export interface InternAttendanceRecord {
  date: string;
  isPresent: boolean;
}

export interface BatchmateCourseScore {
  courseId: number;
  courseName: string;
  score: number | null;
  status: string | null;
}

export interface BatchmateDetailedScore {
  rank: number;
  candidateName: string;
  weightedScore: number | null;
  attendancePercentage: number;
  performance: string | null;
  isMe: boolean;
  courseScores: BatchmateCourseScore[];
}

export interface BatchmateScore {
  rank: number;
  weightedScore: number | null;
  attendancePercentage: number;
  performance: string | null;
  isMe: boolean;
}

export interface CourseComparison {
  courseId: number;
  courseName: string;
  weightage: number;
  minScore: number;
  myScore: number | null;
  batchAverage: number;
  batchHighest: number;
  myRankInCourse: number | null;
  totalScoredInCourse: number;
}

export interface InternDashboardData {
  studentId: number;
  candidateName: string;
  email: string;
  department: string;
  programName: string;
  batchNumber: number;
  programYear: number;
  location: string | null;
  attendancePercentage: number;
  overallWeightedScore: number | null;
  performance: string | null;
  status: string;
  batchStartDate: string | null;
  batchEndDate: string | null;
  rank: number;
  totalInBatch: number;
  courseScores: InternCourseScore[];
  attendanceRecords: InternAttendanceRecord[];
  batchLeaderboard: BatchmateScore[];
  totalApprovedLeaveDays: number;
  courseComparisons: CourseComparison[];
  detailedLeaderboard: BatchmateDetailedScore[];
}

// ── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileLink {
  platform: string; // LinkedIn | GitHub | HackerRank | CodeChef | LeetCode | Portfolio | Other
  url: string;
}

export interface InternProfileResponse {
  profileId: number | null;
  userId: number;
  bio: string | null;
  profileLinks: ProfileLink[];
  updatedAt: string | null;
}

export interface InternProfileRequest {
  bio: string;
  profileLinks: ProfileLink[];
}

// ── Certificates ─────────────────────────────────────────────────────────────

export interface InternCertificateResponse {
  certificateId: number;
  studentId: number;
  certificateName: string;
  issuer: string;
  issueDate: string | null;
  uploadedAt: string;
}
