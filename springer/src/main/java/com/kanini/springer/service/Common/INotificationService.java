package com.kanini.springer.service.Common;

import com.kanini.springer.dto.Common.NotificationResponse;

import java.util.List;

public interface INotificationService {

    void createAndSend(Long sentToUserId, String message, String type);

    List<NotificationResponse> getNotificationsForUser(Long userId);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId);
}
