package com.chatapp.payload;

import com.chatapp.model.RoomRole;
import com.chatapp.model.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMemberResponse {
    private Long id; // RoomMember id
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private UserStatus status;
    private RoomRole role;
    private LocalDateTime joinedAt;
}
