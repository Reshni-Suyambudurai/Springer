import { http } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse } from '../types/api.response';
import type {
  TrainingProgramRequest,
  TrainingProgramResponse,
  TrainingCourseRequest,
  TrainingCourseResponse,
  BatchCourseRequest,
  BatchCourseResponse,
  BatchAllocationRequest,
  BatchAllocationResponse,
  AttendanceMarkRequest,
  BulkAttendanceMarkRequest,
  AttendanceResponse,
  AttendanceStatsResponse,
  TrainingScoreRequest,
  TrainingScoreResponse,
  UserSummary,
} from '../types/Academy/academy.types';

// ==================== PROGRAM YEARS API ====================
export const programYearsApi = {
  async getDistinctYears(): Promise<ApiResponse<number[]>> {
    try {
      const response = await http.get('/academy/programs/years/all');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== USER APIs (academy-scoped) ====================
export const userApi = {
  async getUsersByRole(role: string): Promise<ApiResponse<UserSummary[]>> {
    try {
      const rolesResponse = await http.get('/auth/roles');
      const roles = rolesResponse.data?.data ?? [];
      const matchedRole = roles.find((r: { roleId: number; roleName: string }) => r.roleName === role);

      if (!matchedRole) {
        return {
          success: true,
          message: `No users found for role ${role}`,
          data: [],
        } as ApiResponse<UserSummary[]>;
      }

      const response = await http.get('/auth/users/by-roles', { params: { roleIds: matchedRole.roleId } });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== TRAINING PROGRAM APIs ====================
export const trainingProgramApi = {

  async createProgram(data: TrainingProgramRequest): Promise<ApiResponse<TrainingProgramResponse>> {
    try {
      const response = await http.post('/academy/programs', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllPrograms(active?: boolean): Promise<ApiResponse<TrainingProgramResponse[]>> {
    try {
      const params = active !== undefined ? { active } : {};
      const response = await http.get('/academy/programs', { params });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getProgramById(programId: number): Promise<ApiResponse<TrainingProgramResponse>> {
    try {
      const response = await http.get(`/academy/programs/${programId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getProgramsByCycle(cycleId: number): Promise<ApiResponse<TrainingProgramResponse[]>> {
    try {
      const response = await http.get(`/academy/programs/cycle/${cycleId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async updateProgram(programId: number, data: Partial<TrainingProgramRequest>): Promise<ApiResponse<TrainingProgramResponse>> {
    try {
      const response = await http.patch(`/academy/programs/${programId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getProgramsByLocation(location: string): Promise<ApiResponse<TrainingProgramResponse[]>> {
    try {
      const response = await http.get(`/academy/programs/location/${location}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteProgram(programId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/academy/programs/${programId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== TRAINING COURSE APIs ====================
export const trainingCourseApi = {

  async createCourse(data: TrainingCourseRequest): Promise<ApiResponse<TrainingCourseResponse>> {
    try {
      const response = await http.post('/academy/courses', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllCourses(): Promise<ApiResponse<TrainingCourseResponse[]>> {
    try {
      const response = await http.get('/academy/courses');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCourseById(courseId: number): Promise<ApiResponse<TrainingCourseResponse>> {
    try {
      const response = await http.get(`/academy/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCoursesByStatus(status: string): Promise<ApiResponse<TrainingCourseResponse[]>> {
    try {
      const response = await http.get(`/academy/courses/status/${status}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async updateCourse(courseId: number, data: Partial<TrainingCourseRequest>): Promise<ApiResponse<TrainingCourseResponse>> {
    try {
      const response = await http.patch(`/academy/courses/${courseId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async updateCourseStatus(courseId: number, status: string): Promise<ApiResponse<TrainingCourseResponse>> {
    try {
      const response = await http.patch(`/academy/courses/${courseId}/status`, null, { params: { status } });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCoursesByTrainer(trainerId: number): Promise<ApiResponse<TrainingCourseResponse[]>> {
    try {
      const response = await http.get(`/academy/courses/trainer/${trainerId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteCourse(courseId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/academy/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== BATCH COURSE APIs ====================
export const batchCourseApi = {

  async linkCourseToBatch(data: BatchCourseRequest): Promise<ApiResponse<BatchCourseResponse>> {
    try {
      const response = await http.post('/academy/batch-courses', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllBatchCourses(): Promise<ApiResponse<BatchCourseResponse[]>> {
    try {
      const response = await http.get('/academy/batch-courses');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCoursesByProgram(programId: number): Promise<ApiResponse<BatchCourseResponse[]>> {
    try {
      const response = await http.get(`/academy/batch-courses/program/${programId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCoursesByBatch(programId: number, batchNumber: number): Promise<ApiResponse<BatchCourseResponse[]>> {
    try {
      const response = await http.get(`/academy/batch-courses/program/${programId}/batch/${batchNumber}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getBatchCourseById(batchCourseId: number): Promise<ApiResponse<BatchCourseResponse>> {
    try {
      const response = await http.get(`/academy/batch-courses/${batchCourseId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getCoursesByTrainingCourse(courseId: number): Promise<ApiResponse<BatchCourseResponse[]>> {
    try {
      const response = await http.get(`/academy/batch-courses/course/${courseId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async removeCourseFromBatch(batchCourseId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/academy/batch-courses/${batchCourseId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== BATCH ALLOCATION APIs ====================
export const batchAllocationApi = {

  async createAllocation(data: BatchAllocationRequest): Promise<ApiResponse<BatchAllocationResponse>> {
    try {
      const response = await http.post('/academy/batch-allocations', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllAllocations(): Promise<ApiResponse<BatchAllocationResponse[]>> {
    try {
      const response = await http.get('/academy/batch-allocations');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllocationsByProgram(programId: number): Promise<ApiResponse<BatchAllocationResponse[]>> {
    try {
      const response = await http.get(`/academy/batch-allocations/program/${programId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllocationsByBatch(programId: number, batchNumber: number): Promise<ApiResponse<BatchAllocationResponse[]>> {
    try {
      const response = await http.get(`/academy/batch-allocations/program/${programId}/batch/${batchNumber}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllocationsByCandidate(candidateId: number): Promise<ApiResponse<BatchAllocationResponse[]>> {
    try {
      const response = await http.get(`/academy/batch-allocations/candidate/${candidateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async updateAllocation(studentId: number, data: Partial<BatchAllocationRequest>): Promise<ApiResponse<BatchAllocationResponse>> {
    try {
      const response = await http.patch(`/academy/batch-allocations/${studentId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteAllocation(studentId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/academy/batch-allocations/${studentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async markProjectReady(studentId: number): Promise<ApiResponse<BatchAllocationResponse>> {
    try {
      const response = await http.patch(`/academy/batch-allocations/${studentId}/mark-ready`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllocationsByMinAttendance(programId: number, minPercentage: number): Promise<ApiResponse<BatchAllocationResponse[]>> {
    try {
      const response = await http.get(`/academy/batch-allocations/program/${programId}/min-attendance/${minPercentage}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== ATTENDANCE APIs ====================
export const attendanceApi = {

  async markAttendance(data: AttendanceMarkRequest): Promise<ApiResponse<AttendanceResponse>> {
    try {
      const response = await http.post('/academy/attendance/mark', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async markAttendanceBulk(data: BulkAttendanceMarkRequest): Promise<ApiResponse<AttendanceResponse[]>> {
    try {
      const response = await http.post('/academy/attendance/mark-bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAttendanceSummary(studentId: number): Promise<ApiResponse<AttendanceStatsResponse>> {
    try {
      const response = await http.get(`/academy/attendance/${studentId}/summary`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

// ==================== TRAINING SCORE APIs ====================
export const trainingScoreApi = {

  async createScore(data: TrainingScoreRequest): Promise<ApiResponse<TrainingScoreResponse>> {
    try {
      const response = await http.post('/academy/scores', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllScores(): Promise<ApiResponse<TrainingScoreResponse[]>> {
    try {
      const response = await http.get('/academy/scores');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getScoresByStudent(studentId: number): Promise<ApiResponse<TrainingScoreResponse[]>> {
    try {
      const response = await http.get(`/academy/scores/student/${studentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getScoresByCourse(courseId: number): Promise<ApiResponse<TrainingScoreResponse[]>> {
    try {
      const response = await http.get(`/academy/scores/course/${courseId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getScoreById(scoreId: number): Promise<ApiResponse<TrainingScoreResponse>> {
    try {
      const response = await http.get(`/academy/scores/${scoreId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getScoresByStatus(status: string): Promise<ApiResponse<TrainingScoreResponse[]>> {
    try {
      const response = await http.get(`/academy/scores/status/${status}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getScoresByReviewer(reviewerId: number): Promise<ApiResponse<TrainingScoreResponse[]>> {
    try {
      const response = await http.get(`/academy/scores/reviewer/${reviewerId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async updateScore(scoreId: number, data: Partial<TrainingScoreRequest>): Promise<ApiResponse<TrainingScoreResponse>> {
    try {
      const response = await http.patch(`/academy/scores/${scoreId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteScore(scoreId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/academy/scores/${scoreId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
