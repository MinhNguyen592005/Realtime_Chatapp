package com.chatapp.service;

import com.chatapp.model.User;
import com.chatapp.model.UserStatus;
import com.chatapp.payload.UserSummary;
import com.chatapp.repository.UserRepository;
import com.chatapp.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserSummary getCurrentUser(UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userPrincipal.getId()));
        return AuthService.mapToUserSummary(user);
    }

    @Transactional(readOnly = true)
    public List<UserSummary> searchUsers(String query, Long currentUserId) {
        List<User> users;
        if (query == null || query.trim().isEmpty()) {
            users = userRepository.findAll();
        } else {
            users = userRepository.searchUsers(query.trim());
        }

        return users.stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(AuthService::mapToUserSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserStatus(String username, UserStatus status) {
        userRepository.updateUserStatus(username, status);
    }
}

