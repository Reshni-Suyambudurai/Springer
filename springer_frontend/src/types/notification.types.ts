export interface NotificationResponse {
  notificationId: number;
  message: string;
  type: string;
  isRead: boolean;
  sentToUserId: number;
  createdAt: string;
}
