package com.chatapp.service;

import com.chatapp.model.*;
import com.chatapp.payload.MessageResponse;
import com.chatapp.payload.RoomMemberResponse;
import com.chatapp.payload.RoomResponse;
import com.chatapp.payload.CreateRoomRequest;
import com.chatapp.repository.ChatRoomRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.RoomMemberRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public List<RoomResponse> getRoomsForUser(Long userId) {
        List<ChatRoom> rooms = chatRoomRepository.findRoomsByUserId(userId);
        return rooms.stream()
                .map(room -> mapToRoomResponse(room, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));

        boolean isMember = roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
        if (!isMember) {
            throw new SecurityException("User is not a member of room: " + roomId);
        }

        return mapToRoomResponse(room, userId);
    }

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new IllegalArgumentException("Creator not found: " + creatorId));

        if (request.getType() == RoomType.DIRECT) {
            if (request.getMemberIds() == null || request.getMemberIds().isEmpty()) {
                throw new IllegalArgumentException("Direct chat requires target user ID in memberIds");
            }
            Long targetUserId = request.getMemberIds().get(0);
            if (targetUserId.equals(creatorId)) {
                throw new IllegalArgumentException("Cannot create direct chat with yourself");
            }

            // Check if direct room already exists
            Optional<ChatRoom> existingRoom = chatRoomRepository.findDirectRoomBetweenUsers(
                    RoomType.DIRECT, creatorId, targetUserId
            );
            if (existingRoom.isPresent()) {
                return mapToRoomResponse(existingRoom.get(), creatorId);
            }

            User targetUser = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUserId));

            ChatRoom room = ChatRoom.builder()
                    .name(null)
                    .type(RoomType.DIRECT)
                    .createdBy(creator)
                    .build();
            room = chatRoomRepository.save(room);

            RoomMember member1 = RoomMember.builder()
                    .room(room)
                    .user(creator)
                    .role(RoomRole.MEMBER)
                    .build();
            RoomMember member2 = RoomMember.builder()
                    .room(room)
                    .user(targetUser)
                    .role(RoomRole.MEMBER)
                    .build();

            roomMemberRepository.save(member1);
            roomMemberRepository.save(member2);

            return mapToRoomResponse(room, creatorId);
        } else {
            // Group Chat
            String roomName = request.getName();
            if (roomName == null || roomName.trim().isEmpty()) {
                roomName = "Group Chat";
            }

            ChatRoom room = ChatRoom.builder()
                    .name(roomName.trim())
                    .type(RoomType.GROUP)
                    .createdBy(creator)
                    .build();
            final ChatRoom savedRoom = chatRoomRepository.save(room);

            // Add creator as ADMIN_ROOM
            RoomMember adminMember = RoomMember.builder()
                    .room(savedRoom)
                    .user(creator)
                    .role(RoomRole.ADMIN_ROOM)
                    .build();
            roomMemberRepository.save(adminMember);

            // Add other members if provided
            if (request.getMemberIds() != null) {
                for (Long memberId : request.getMemberIds()) {
                    if (!memberId.equals(creatorId)) {
                        userRepository.findById(memberId).ifPresent(u -> {
                            RoomMember rm = RoomMember.builder()
                                    .room(savedRoom)
                                    .user(u)
                                    .role(RoomRole.MEMBER)
                                    .build();
                            roomMemberRepository.save(rm);
                        });
                    }
                }
            }

            return mapToRoomResponse(savedRoom, creatorId);
        }
    }

    @Transactional
    public RoomMemberResponse addMemberToRoom(Long roomId, Long targetUserId, Long currentUserId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));

        if (room.getType() != RoomType.GROUP) {
            throw new IllegalArgumentException("Cannot add members to a direct chat");
        }

        RoomMember currentMember = roomMemberRepository.findByRoomIdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new SecurityException("You are not a member of this room"));

        if (currentMember.getRole() != RoomRole.ADMIN_ROOM && !room.getCreatedBy().getId().equals(currentUserId)) {
            throw new SecurityException("Only room admins can add new members");
        }

        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, targetUserId)) {
            throw new IllegalArgumentException("User is already in this room");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUserId));

        RoomMember newMember = RoomMember.builder()
                .room(room)
                .user(targetUser)
                .role(RoomRole.MEMBER)
                .build();
        newMember = roomMemberRepository.save(newMember);

        return mapToRoomMemberResponse(newMember);
    }

    @Transactional
    public void removeMemberFromRoom(Long roomId, Long targetUserId, Long currentUserId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));

        RoomMember currentMember = roomMemberRepository.findByRoomIdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new SecurityException("You are not a member of this room"));

        boolean isSelfLeaving = currentUserId.equals(targetUserId);
        boolean isAdmin = currentMember.getRole() == RoomRole.ADMIN_ROOM
                || (room.getCreatedBy() != null && room.getCreatedBy().getId().equals(currentUserId));

        if (!isSelfLeaving && !isAdmin) {
            throw new SecurityException("You do not have permission to remove this member");
        }

        roomMemberRepository.deleteByRoomIdAndUserId(roomId, targetUserId);
    }

    public RoomResponse mapToRoomResponse(ChatRoom room, Long currentUserId) {
        List<RoomMember> members = roomMemberRepository.findByRoomId(room.getId());
        List<RoomMemberResponse> memberResponses = members.stream()
                .map(this::mapToRoomMemberResponse)
                .collect(Collectors.toList());

        String displayName = room.getName();
        if (room.getType() == RoomType.DIRECT) {
            // Find the other member to use their name
            Optional<RoomMember> other = members.stream()
                    .filter(m -> !m.getUser().getId().equals(currentUserId))
                    .findFirst();
            displayName = other.map(m -> m.getUser().getDisplayName() == null
                    || m.getUser().getDisplayName().isBlank()
                    ? m.getUser().getUsername() : m.getUser().getDisplayName()).orElse("Direct Chat");
        }

        Optional<Message> lastMessageOpt = messageRepository.findLastMessageByRoomId(room.getId());
        MessageResponse lastMessage = lastMessageOpt.map(this::mapToMessageResponse).orElse(null);

        return RoomResponse.builder()
                .id(room.getId())
                .name(displayName)
                .type(room.getType())
                .createdBy(room.getCreatedBy() != null ? AuthService.mapToPublicUserSummary(room.getCreatedBy()) : null)
                .createdAt(room.getCreatedAt())
                .members(memberResponses)
                .lastMessage(lastMessage)
                .build();
    }

    public RoomMemberResponse mapToRoomMemberResponse(RoomMember rm) {
        User u = rm.getUser();
        return RoomMemberResponse.builder()
                .id(rm.getId())
                .userId(u.getId())
                .username(u.getUsername())
                .displayName(u.getDisplayName())
                .avatarUrl(u.getAvatarUrl())
                .status(u.getStatus())
                .role(rm.getRole())
                .joinedAt(rm.getJoinedAt())
                .build();
    }

    public MessageResponse mapToMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoom().getId())
                .sender(message.getSender() != null ? AuthService.mapToPublicUserSummary(message.getSender()) : null)
                .content(message.getContent())
                .messageType(message.getMessageType())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
