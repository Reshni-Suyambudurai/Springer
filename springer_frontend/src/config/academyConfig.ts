/**
 * Academy Module Configuration
 * These should be loaded from backend API, not hardcoded
 * This file provides a single source of truth for all configurable values
 */

export interface AcademyConfig {
  tabs: Array<{ key: string; label: string }>;
  scoreStatuses: string[];
  paginationOptions: number[];
  defaultRowsPerPage: number;
  defaultBatchNumber: number;
  defaultBatchCapacity: number;
  // Attendance thresholds (percentages)
  attendanceExcellentThreshold: number;  // 85% - Green
  attendanceAcceptableThreshold: number; // 75% - Orange
}

/**
 * Get Academy Configuration from Backend
 * TODO: Replace this with actual API call to /api/config/academy
 * For now, using defaults that should come from database
 */
export const getAcademyConfig = async (): Promise<AcademyConfig> => {
  try {
    // In production, fetch from backend API
    // const response = await fetch('/api/config/academy');
    // if (!response.ok) throw new Error('Failed to load academy config');
    // return response.json();

    // Fallback defaults (should never be used in production)
    return {
      tabs: [
        { key: 'programs', label: 'Programs' },
        { key: 'courses', label: 'Courses' },
        { key: 'batch-courses', label: 'Batch Courses' },
        { key: 'batch-allocations', label: 'Batch Allocations' },
        { key: 'scores', label: 'Scores' },
        { key: 'attendance', label: 'Attendance' },
      ],
      scoreStatuses: ['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE'],
      paginationOptions: [5, 10, 25],
      defaultRowsPerPage: 10,
      defaultBatchNumber: 1,
      defaultBatchCapacity: 0,
      attendanceExcellentThreshold: 85,
      attendanceAcceptableThreshold: 75,
    };
  } catch (error) {
    console.error('Failed to load academy config:', error);
    // Return safe defaults on error
    return {
      tabs: [
        { key: 'programs', label: 'Programs' },
        { key: 'courses', label: 'Courses' },
        { key: 'batch-courses', label: 'Batch Courses' },
        { key: 'batch-allocations', label: 'Batch Allocations' },
        { key: 'scores', label: 'Scores' },
        { key: 'attendance', label: 'Attendance' },
      ],
      scoreStatuses: ['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE'],
      paginationOptions: [5, 10, 25],
      defaultRowsPerPage: 10,
      defaultBatchNumber: 1,
      defaultBatchCapacity: 0,
      attendanceExcellentThreshold: 85,
      attendanceAcceptableThreshold: 75,
    };
  }
};

/**
 * Cache for config (avoid repeated API calls)
 */
let cachedConfig: AcademyConfig | null = null;
let configPromise: Promise<AcademyConfig> | null = null;

export const getCachedAcademyConfig = async (): Promise<AcademyConfig> => {
  if (cachedConfig) return cachedConfig;
  if (configPromise) return configPromise;

  configPromise = getAcademyConfig();
  cachedConfig = await configPromise;
  return cachedConfig;
};

/**
 * Invalidate cache (call this when admin updates configuration)
 */
export const invalidateConfigCache = () => {
  cachedConfig = null;
  configPromise = null;
};
