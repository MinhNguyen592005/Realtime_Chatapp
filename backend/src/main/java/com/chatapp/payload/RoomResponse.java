package com.chatapp.payload;

import com.chatapp.model.RoomType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {
    private Long id;
    private String name;
    private RoomType type;
    private UserSummary createdBy;
    private LocalDateTime createdAt;
    private List<RoomMemberResponse> members;
    private MessageResponse lastMessage;
}

