export interface AcademyTab {
  key: string;
  label: string;
  group: string;
}

export interface AcademyTabGroup {
  key: string;
  label: string;
  tabs: AcademyTab[];
}

export interface AcademyConfig {
  tabGroups: AcademyTabGroup[];
  tabs: AcademyTab[];
  scoreStatuses: string[];
  paginationOptions: number[];
  defaultRowsPerPage: number;
  defaultBatchNumber: number;
  defaultBatchCapacity: number;
  attendanceExcellentThreshold: number;
  attendanceAcceptableThreshold: number;
}

// ── Group: Program Setup (one-time config at start of cycle) ──
const SETUP_TABS: AcademyTab[] = [
  { key: 'programs',           label: 'Programs',          group: 'setup' },
  { key: 'courses',            label: 'Courses',           group: 'setup' },
  { key: 'batch-courses',      label: 'Course Schedule',   group: 'setup' },
  { key: 'batch-allocations',  label: 'Student Allocation',group: 'setup' },
];

// ── Group: Training (daily work) ──
const TRAINING_TABS: AcademyTab[] = [
  { key: 'attendance',          label: 'Attendance',      group: 'training' },
  { key: 'scores',              label: 'Scores',          group: 'training' },
  { key: 'candidate-progress',  label: 'Intern Progress', group: 'training' },
];

// ── Group: Management (operational tasks) ──
const MANAGEMENT_TABS: AcademyTab[] = [
  { key: 'joining-tracker', label: 'Joining Status',  group: 'management' },
  { key: 'calendar',        label: 'Calendar',        group: 'management' },
  { key: 'leaves',          label: 'Leave Requests',  group: 'management' },
  { key: 'warnings',        label: 'Disciplinary',    group: 'management' },
];

// ── Coordinator only sees Training + Management ──
const COORDINATOR_TRAINING: AcademyTab[] = [
  { key: 'attendance',          label: 'Attendance',      group: 'training' },
  { key: 'scores',              label: 'Scores',          group: 'training' },
  { key: 'candidate-progress',  label: 'Intern Progress', group: 'training' },
];

const COORDINATOR_MANAGEMENT: AcademyTab[] = [
  { key: 'leaves',    label: 'Leave Requests', group: 'management' },
  { key: 'warnings',  label: 'Disciplinary',   group: 'management' },
  { key: 'calendar',  label: 'Calendar',        group: 'management' },
];

const RECRUITER_GROUPS: AcademyTabGroup[] = [
  { key: 'setup',      label: 'Program Setup', tabs: SETUP_TABS },
  { key: 'training',   label: 'Training',      tabs: TRAINING_TABS },
  { key: 'management', label: 'Management',    tabs: MANAGEMENT_TABS },
];

const COORDINATOR_GROUPS: AcademyTabGroup[] = [
  { key: 'training',   label: 'Training',   tabs: COORDINATOR_TRAINING },
  { key: 'management', label: 'Management', tabs: COORDINATOR_MANAGEMENT },
];

const MEMBERS_GROUPS: AcademyTabGroup[] = [
  { key: 'training',   label: 'Training',   tabs: COORDINATOR_TRAINING },
  { key: 'management', label: 'Management', tabs: COORDINATOR_MANAGEMENT },
];

const BASE_CONFIG = {
  scoreStatuses: ['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE'],
  paginationOptions: [10, 25, 50],
  defaultRowsPerPage: 10,
  defaultBatchNumber: 1,
  defaultBatchCapacity: 0,
  attendanceExcellentThreshold: 85,
  attendanceAcceptableThreshold: 75,
};

export const getAcademyConfig = async (role?: string): Promise<AcademyConfig> => {
  const upper = role?.toUpperCase() ?? '';
  const groups = upper === 'MEMBERS' ? MEMBERS_GROUPS
    : upper === 'TRAINING_COORDINATOR' ? COORDINATOR_GROUPS
    : RECRUITER_GROUPS;
  const tabs = groups.flatMap(g => g.tabs);
  return { ...BASE_CONFIG, tabGroups: groups, tabs };
};

let cachedConfig = new Map<string, AcademyConfig>();
let configPromise = new Map<string, Promise<AcademyConfig>>();

export const getCachedAcademyConfig = async (role?: string): Promise<AcademyConfig> => {
  const key = role ?? 'default';
  const cached = cachedConfig.get(key);
  if (cached) return cached;
  const inFlight = configPromise.get(key);
  if (inFlight) return inFlight;
  const request = getAcademyConfig(role);
  configPromise.set(key, request);
  const resolved = await request;
  cachedConfig.set(key, resolved);
  configPromise.delete(key);
  return resolved;
};

export const invalidateConfigCache = () => {
  cachedConfig = new Map<string, AcademyConfig>();
  configPromise = new Map<string, Promise<AcademyConfig>>();
};
