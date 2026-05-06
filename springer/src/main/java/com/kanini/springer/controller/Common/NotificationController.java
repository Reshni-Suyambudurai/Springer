package com.kanini.springer.controller.Common;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Common.NotificationResponse;
import com.kanini.springer.service.Common.INotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final INotificationService notificationService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @PathVariable Long userId) {
        List<NotificationResponse> notifications = notificationService.getNotificationsForUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @PathVariable Long userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", count));
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }
}
