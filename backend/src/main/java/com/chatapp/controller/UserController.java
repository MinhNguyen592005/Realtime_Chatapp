package com.chatapp.controller;

import com.chatapp.payload.UpdateProfileRequest;
import com.chatapp.payload.UserProfileResponse;
import com.chatapp.payload.UserSummary;
import com.chatapp.security.UserPrincipal;
import com.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserSummary> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserSummary userSummary = userService.getCurrentUser(currentUser);
        return ResponseEntity.ok(userSummary);
    }

    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(userService.getProfile(currentUser.getId(), currentUser.getId()));
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(currentUser.getId(), request));
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(userService.getProfile(userId, currentUser.getId()));
    }

    @GetMapping
    public ResponseEntity<List<UserSummary>> searchUsers(
            @RequestParam(value = "query", required = false) String query,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<UserSummary> users = userService.searchUsers(query, currentUser.getId());
        return ResponseEntity.ok(users);
    }
}
