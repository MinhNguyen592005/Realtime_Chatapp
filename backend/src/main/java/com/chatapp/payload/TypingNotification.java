package com.chatapp.payload;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingNotification {
    private Long roomId;
    private String username;
    private boolean typing;
}

