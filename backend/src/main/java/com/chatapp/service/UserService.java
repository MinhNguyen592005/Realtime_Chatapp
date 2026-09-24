package com.chatapp.service;

import com.chatapp.model.User;
import com.chatapp.model.UserStatus;
import com.chatapp.payload.UpdateProfileRequest;
import com.chatapp.payload.UserProfileResponse;
import com.chatapp.payload.UserSummary;
import com.chatapp.repository.UserRepository;
import com.chatapp.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.NoSuchElementException;
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
    public UserProfileResponse getProfile(Long userId, Long viewerId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng."));
        return toProfile(user, userId.equals(viewerId));
    }

    @Transactional
    public UserProfileResponse updateProfile(Long currentUserId, UpdateProfileRequest request) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng."));
        String name = request.getDisplayName() == null ? "" : request.getDisplayName().trim();
        if (name.isEmpty() || name.length() > 80) {
            throw new IllegalArgumentException("Tên hiển thị phải có từ 1 đến 80 ký tự.");
        }
        String avatarUrl = blankToNull(request.getAvatarUrl());
        if (avatarUrl != null) {
            try {
                URI uri = new URI(avatarUrl);
                if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                        || uri.getHost() == null || uri.getUserInfo() != null) {
                    throw new IllegalArgumentException("URL ảnh đại diện phải là liên kết HTTP hoặc HTTPS hợp lệ.");
                }
            } catch (URISyntaxException ex) {
                throw new IllegalArgumentException("URL ảnh đại diện không hợp lệ.");
            }
        }
        String bio = blankToNull(request.getBio());
        user.setDisplayName(name);
        user.setAvatarUrl(avatarUrl);
        user.setBio(bio);
        return toProfile(userRepository.save(user), true);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static UserProfileResponse toProfile(User user, boolean owner) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(owner ? user.getEmail() : null)
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
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
                .map(AuthService::mapToPublicUserSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserStatus(String username, UserStatus status) {
        userRepository.updateUserStatus(username, status);
    }
}
