package com.chatapp;

import com.chatapp.model.User;
import com.chatapp.payload.UpdateProfileRequest;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.UserService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    @Test
    void publicProfileAndSearchDoNotRevealEmail() {
        UserRepository repository = mock(UserRepository.class);
        UserService service = new UserService(repository);
        User friend = User.builder().id(2L).username("friend")
                .displayName("Bạn thân").email("friend@gmail.com").bio("Xin chào").build();
        when(repository.findById(2L)).thenReturn(Optional.of(friend));
        when(repository.findAll()).thenReturn(List.of(friend));

        assertNull(service.getProfile(2L, 1L).getEmail());
        assertEquals("friend@gmail.com", service.getProfile(2L, 2L).getEmail());
        assertNull(service.searchUsers("", 1L).get(0).getEmail());
        assertEquals("Bạn thân", service.searchUsers("", 1L).get(0).getDisplayName());
    }

    @Test
    void updatesOnlyAuthenticatedUsersPublicFields() {
        UserRepository repository = mock(UserRepository.class);
        UserService service = new UserService(repository);
        User user = User.builder().id(1L).username("login-name")
                .email("owner@gmail.com").password("password-hash").build();
        when(repository.findById(1L)).thenReturn(Optional.of(user));
        when(repository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setDisplayName("  Tên mới  ");
        request.setAvatarUrl(" https://example.com/avatar.png ");
        request.setBio("  Giới thiệu mới  ");

        var result = service.updateProfile(1L, request);

        assertEquals("Tên mới", result.getDisplayName());
        assertEquals("https://example.com/avatar.png", result.getAvatarUrl());
        assertEquals("Giới thiệu mới", result.getBio());
        assertEquals("login-name", user.getUsername());
        assertEquals("owner@gmail.com", user.getEmail());
        assertEquals("password-hash", user.getPassword());
        verify(repository).findById(1L);
    }

    @Test
    void rejectsUnsafeAvatarUrlWithoutSaving() {
        UserRepository repository = mock(UserRepository.class);
        UserService service = new UserService(repository);
        User user = User.builder().id(1L).username("owner").build();
        when(repository.findById(1L)).thenReturn(Optional.of(user));
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setDisplayName("Owner");
        request.setAvatarUrl("javascript:alert(1)");

        assertThrows(IllegalArgumentException.class, () -> service.updateProfile(1L, request));
        verify(repository, never()).save(any(User.class));

        request.setAvatarUrl(null);
        request.setDisplayName(null);
        assertThrows(IllegalArgumentException.class, () -> service.updateProfile(1L, request));
    }
}
