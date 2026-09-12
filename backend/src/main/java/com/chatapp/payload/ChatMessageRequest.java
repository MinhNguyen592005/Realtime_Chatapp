package com.chatapp.payload;

import com.chatapp.model.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageRequest {
    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private MessageType messageType = MessageType.CHAT;
}

