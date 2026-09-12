package com.chatapp.payload;

import com.chatapp.model.MessageType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    private Long id;
    private Long roomId;
    private UserSummary sender;
    private String content;
    private MessageType messageType;
    private LocalDateTime createdAt;
}

