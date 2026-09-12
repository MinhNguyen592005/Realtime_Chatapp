package com.chatapp.controller;

import com.chatapp.payload.*;
import com.chatapp.security.UserPrincipal;
import com.chatapp.service.MessageService;
import com.chatapp.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getUserRooms(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<RoomResponse> rooms = roomService.getRoomsForUser(currentUser.getId());
        return ResponseEntity.ok(rooms);
    }

    @PostMapping
    public ResponseEntity<?> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            RoomResponse room = roomService.createRoom(request, currentUser.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(room);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoomById(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            RoomResponse room = roomService.getRoomById(roomId, currentUser.getId());
            return ResponseEntity.ok(room);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<?> getRoomMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            List<MessageResponse> messages = messageService.getMessagesByRoomId(roomId, currentUser.getId());
            return ResponseEntity.ok(messages);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PostMapping("/{roomId}/members")
    public ResponseEntity<?> addMember(
            @PathVariable Long roomId,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            RoomMemberResponse member = roomService.addMemberToRoom(roomId, request.getUserId(), currentUser.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(member);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @DeleteMapping("/{roomId}/members/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long roomId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            roomService.removeMemberFromRoom(roomId, userId, currentUser.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Member removed successfully"));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }
}

