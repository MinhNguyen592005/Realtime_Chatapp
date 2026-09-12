package com.chatapp.controller;

import com.chatapp.payload.UserSummary;
import com.chatapp.security.UserPrincipal;
import com.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
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

    @GetMapping
    public ResponseEntity<List<UserSummary>> searchUsers(
            @RequestParam(value = "query", required = false) String query,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<UserSummary> users = userService.searchUsers(query, currentUser.getId());
        return ResponseEntity.ok(users);
    }
}

