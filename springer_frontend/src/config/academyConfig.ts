export interface AcademyConfig {
  tabs: Array<{ key: string; label: string }>;
  scoreStatuses: string[];
  paginationOptions: number[];
  defaultRowsPerPage: number;
  defaultBatchNumber: number;
  defaultBatchCapacity: number;
  attendanceExcellentThreshold: number;
  attendanceAcceptableThreshold: number;
}

// Tabs visible to TA_RECRUITER and TA_HEAD (full access)
const RECRUITER_TABS = [
  { key: 'joining-tracker',   label: 'Joining Tracker' },
  { key: 'programs',          label: 'Programs' },
  { key: 'courses',           label: 'Courses' },
  { key: 'batch-courses',     label: 'Batch Courses' },
  { key: 'batch-allocations', label: 'Batch Allocations' },
  { key: 'scores',            label: 'Scores' },
  { key: 'attendance',        label: 'Attendance' },
  { key: 'candidate-progress',label: 'Candidate Progress' },
];

// Tabs visible to TRAINING_COORDINATOR (Lavanya) — only her work
const COORDINATOR_TABS = [
  { key: 'scores',            label: 'Scores' },
  { key: 'attendance',        label: 'Attendance' },
  { key: 'candidate-progress',label: 'Candidate Progress' },
];

const BASE_CONFIG = {
  scoreStatuses: ['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE'],
  paginationOptions: [5, 10, 25],
  defaultRowsPerPage: 10,
  defaultBatchNumber: 1,
  defaultBatchCapacity: 0,
  attendanceExcellentThreshold: 85,
  attendanceAcceptableThreshold: 75,
};

export const getAcademyConfig = async (role?: string): Promise<AcademyConfig> => {
  try {
    const isCoordinator = role?.toUpperCase() === 'TRAINING_COORDINATOR'
      || role?.toUpperCase() === 'MEMBERS';
    return {
      ...BASE_CONFIG,
      tabs: isCoordinator ? COORDINATOR_TABS : RECRUITER_TABS,
    };
  } catch (error) {
    console.error('Failed to load academy config:', error);
    return { ...BASE_CONFIG, tabs: RECRUITER_TABS };
  }
};

let cachedConfig: Record<string, AcademyConfig> = {};
let configPromise: Record<string, Promise<AcademyConfig>> = {};

export const getCachedAcademyConfig = async (role?: string): Promise<AcademyConfig> => {
  const key = role ?? 'default';
  if (cachedConfig[key]) return cachedConfig[key];
  if (configPromise[key]) return configPromise[key];
  configPromise[key] = getAcademyConfig(role);
  cachedConfig[key] = await configPromise[key];
  return cachedConfig[key];
};

export const invalidateConfigCache = () => {
  cachedConfig = {};
  configPromise = {};
};
