package com.chatapp.payload;

import com.chatapp.model.UserStatus;
import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummary {
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String avatarUrl;
    private UserStatus status;
    private Set<String> roles;
}
