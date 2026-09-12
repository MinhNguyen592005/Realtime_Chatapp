package com.chatapp.event;

import com.chatapp.model.UserStatus;
import com.chatapp.payload.UserSummary;
import com.chatapp.security.UserPrincipal;
import com.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    private final UserService userService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            String username = principal.getName();
            log.info("Received new WebSocket connection from user: {}", username);
            userService.updateUserStatus(username, UserStatus.ONLINE);

            Map<String, Object> statusEvent = new HashMap<>();
            statusEvent.put("username", username);
            statusEvent.put("status", UserStatus.ONLINE);
            messagingTemplate.convertAndSend("/topic/presence", statusEvent);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            String username = principal.getName();
            log.info("WebSocket user disconnected: {}", username);
            userService.updateUserStatus(username, UserStatus.OFFLINE);

            Map<String, Object> statusEvent = new HashMap<>();
            statusEvent.put("username", username);
            statusEvent.put("status", UserStatus.OFFLINE);
            messagingTemplate.convertAndSend("/topic/presence", statusEvent);
        }
    }
}
