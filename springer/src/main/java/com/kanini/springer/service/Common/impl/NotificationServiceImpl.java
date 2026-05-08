package com.kanini.springer.service.Common.impl;

import com.kanini.springer.dto.Common.NotificationResponse;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.utils.Notification;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.NotificationRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Common.INotificationService;
import com.kanini.springer.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements INotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketHandler webSocketHandler;

    @Override
    @Transactional
    public void createAndSend(Long sentToUserId, String message, String type) {
        User sentTo = userRepository.findById(sentToUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + sentToUserId));

        Notification notification = new Notification();
        notification.setSentTo(sentTo);
        notification.setMessage(message);
        notification.setType(type);
        notification.setIsRead(false);

        Notification saved = notificationRepository.save(notification);

        // Push via WebSocket instantly
        NotificationResponse response = toResponse(saved);
        webSocketHandler.sendNotificationToUser(sentToUserId, response);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return notificationRepository.findBySentTo_UserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countBySentTo_UserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setNotificationId(n.getNotificationId());
        r.setMessage(n.getMessage());
        r.setType(n.getType());
        r.setIsRead(n.getIsRead());
        r.setSentToUserId(n.getSentTo() != null ? n.getSentTo().getUserId() : null);
        r.setCreatedAt(n.getCreatedAt());
        return r;
    }
}
