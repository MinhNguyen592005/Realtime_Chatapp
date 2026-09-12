package com.chatapp.controller;

import com.chatapp.model.MessageType;
import com.chatapp.payload.ChatMessageRequest;
import com.chatapp.payload.MessageResponse;
import com.chatapp.payload.TypingNotification;
import com.chatapp.security.UserPrincipal;
import com.chatapp.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal) {
        if (principal == null) {
            log.error("Attempt to send message without authenticated principal");
            return;
        }

        UserPrincipal userPrincipal = extractUserPrincipal(principal);
        if (userPrincipal == null) {
            log.error("Cannot resolve UserPrincipal from principal: {}", principal.getName());
            return;
        }

        log.info("Received message from [{}] for room [{}]: {}", userPrincipal.getUsername(), request.getRoomId(), request.getContent());

        MessageResponse savedMessage = messageService.saveMessage(
                request.getRoomId(),
                userPrincipal.getId(),
                request.getContent(),
                MessageType.CHAT
        );

        // Broadcast to subscribers of /topic/room.{roomId}
        messagingTemplate.convertAndSend("/topic/room." + request.getRoomId(), savedMessage);
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessageRequest request, Principal principal) {
        if (principal == null) return;
        UserPrincipal userPrincipal = extractUserPrincipal(principal);
        if (userPrincipal == null) return;

        log.info("User [{}] joined room [{}]", userPrincipal.getUsername(), request.getRoomId());

        MessageResponse joinMessage = messageService.saveMessage(
                request.getRoomId(),
                userPrincipal.getId(),
                userPrincipal.getUsername() + " has joined the chat",
                MessageType.JOIN
        );

        messagingTemplate.convertAndSend("/topic/room." + request.getRoomId(), joinMessage);
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingNotification typingNotification, Principal principal) {
        if (principal == null) return;
        UserPrincipal userPrincipal = extractUserPrincipal(principal);
        if (userPrincipal == null) return;

        typingNotification.setUsername(userPrincipal.getUsername());

        // Broadcast typing indicator to /topic/room.{roomId}.typing
        messagingTemplate.convertAndSend(
                "/topic/room." + typingNotification.getRoomId() + ".typing",
                typingNotification
        );
    }

    private UserPrincipal extractUserPrincipal(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof UserPrincipal userPrincipal) {
                return userPrincipal;
            }
        }
        return null;
    }
}

