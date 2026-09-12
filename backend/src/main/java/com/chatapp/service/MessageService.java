package com.chatapp.service;

import com.chatapp.model.*;
import com.chatapp.payload.MessageResponse;
import com.chatapp.repository.ChatRoomRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.RoomMemberRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomService roomService;

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesByRoomId(Long roomId, Long userId) {
        boolean isMember = roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
        if (!isMember) {
            throw new SecurityException("User is not a member of room: " + roomId);
        }

        List<Message> messages = messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
        return messages.stream()
                .map(roomService::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse saveMessage(Long roomId, Long senderId, String content, MessageType messageType) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));

        User sender = null;
        if (senderId != null) {
            sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + senderId));

            // Ensure sender is a member
            boolean isMember = roomMemberRepository.existsByRoomIdAndUserId(roomId, senderId);
            if (!isMember) {
                // Auto-join if system or throw exception
                throw new SecurityException("Sender is not a member of this room");
            }
        }

        Message message = Message.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .messageType(messageType != null ? messageType : MessageType.CHAT)
                .build();

        Message savedMessage = messageRepository.save(message);
        return roomService.mapToMessageResponse(savedMessage);
    }
}

