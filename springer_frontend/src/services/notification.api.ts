import { http } from './api/https';
import { handleAxiosError } from './api.error';
import type { ApiResponse } from '../types/api.response';
import type { NotificationResponse } from '../types/notification.types';

export const notificationApi = {

  async getNotifications(userId: number): Promise<ApiResponse<NotificationResponse[]>> {
    try {
      const response = await http.get(`/notifications/user/${userId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async getUnreadCount(userId: number): Promise<ApiResponse<number>> {
    try {
      const response = await http.get(`/notifications/user/${userId}/unread-count`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  async markAsRead(notificationId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
