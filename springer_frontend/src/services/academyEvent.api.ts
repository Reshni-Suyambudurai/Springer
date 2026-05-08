import { http } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse } from '../types/api.response';

export interface AcademyEventRequest {
  title: string;
  description?: string;
  eventDate: string;       // YYYY-MM-DD
  eventTime?: string;      // HH:mm
  eventType: string;       // MEETING | ASSESSMENT | REVIEW | SESSION | CLIENT_VISIT | OTHER
  venue?: string;          // ONLINE | OFFLINE
  programId?: number | null;
  batchNumbers?: number[] | null;
  createdBy: number;
}

export interface AcademyEventResponse {
  eventId: number;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  eventType: string;
  venue: string | null;    // ONLINE | OFFLINE
  programId: number | null;
  batchNumber: number | null;
  batchNumbers: number[] | null;
  createdByName: string | null;
  createdAt: string;
}

export const academyEventApi = {

  async createEvent(data: AcademyEventRequest): Promise<ApiResponse<AcademyEventResponse>> {
    try {
      const response = await http.post('/academy/events', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getAllEvents(): Promise<ApiResponse<AcademyEventResponse[]>> {
    try {
      const response = await http.get('/academy/events');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getEventsForStudent(studentId: number): Promise<ApiResponse<AcademyEventResponse[]>> {
    try {
      const response = await http.get(`/academy/events/student/${studentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async deleteEvent(eventId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/academy/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
