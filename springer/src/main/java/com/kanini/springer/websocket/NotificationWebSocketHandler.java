package com.kanini.springer.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Common.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages WebSocket sessions per user.
 * Maps userId -> WebSocketSession so notifications go to the right user.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = extractUserId(session);
        if (userId != null) {
            userSessions.put(userId, session);
            log.info("WebSocket connected — userId: {}", userId);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = extractUserId(session);
        if (userId != null) {
            userSessions.remove(userId);
            log.info("WebSocket disconnected — userId: {}", userId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // One-way server push — no client messages needed
    }

    public void sendNotificationToUser(Long userId, NotificationResponse notification) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(notification);
                session.sendMessage(new TextMessage(json));
                log.info("Notification sent via WebSocket to userId: {}", userId);
            } catch (IOException e) {
                log.error("Failed to send WebSocket notification to userId: {} — {}", userId, e.getMessage());
            }
        } else {
            log.info("User {} not connected — notification saved to DB only", userId);
        }
    }

    private Long extractUserId(WebSocketSession session) {
        try {
            String query = session.getUri() != null ? session.getUri().getQuery() : null;
            if (query != null && query.startsWith("userId=")) {
                return Long.parseLong(query.substring(7));
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid userId in WebSocket query: {}", session.getUri());
        }
        return null;
    }
}
