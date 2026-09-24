package com.chatapp;

import com.chatapp.model.PasswordResetToken;
import com.chatapp.model.User;
import com.chatapp.repository.PasswordResetTokenRepository;
import com.chatapp.repository.RoleRepository;
import com.chatapp.repository.UserRepository;
import com.chatapp.security.JwtTokenProvider;
import com.chatapp.service.AuthService;
import com.chatapp.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock AuthenticationManager authenticationManager;
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider tokenProvider;
    @Mock EmailService emailService;
    @InjectMocks AuthService authService;

    @Test
    void forgotPasswordSendsCodeOnlyToRegisteredEmail() {
        when(userRepository.findByEmail("member@example.com"))
                .thenReturn(Optional.of(User.builder().email("member@example.com").build()));

        authService.forgotPassword(" MEMBER@example.com ");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(passwordResetTokenRepository).invalidateActiveTokens("member@example.com");
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        verify(emailService).sendOtpEmail(eq("member@example.com"), codeCaptor.capture());
        assertTrue(codeCaptor.getValue().matches("[0-9]{6}"));
        assertEquals(codeCaptor.getValue(), tokenCaptor.getValue().getOtp());
        assertTrue(tokenCaptor.getValue().getSentAt() != null);

        assertThrows(IllegalArgumentException.class, () -> authService.forgotPassword("missing@example.com"));
    }

    @Test
    void failedDeliveryDoesNotSaveAUsableCode() {
        when(userRepository.findByEmail("member@example.com"))
                .thenReturn(Optional.of(User.builder().email("member@example.com").build()));
        doThrow(new IllegalStateException("SMTP unavailable"))
                .when(emailService).sendOtpEmail(eq("member@example.com"), anyString());

        assertThrows(IllegalStateException.class,
                () -> authService.forgotPassword("member@example.com"));

        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void wrongCodeIsBlockedAfterFiveAttempts() {
        PasswordResetToken token = PasswordResetToken.builder()
                .email("member@example.com")
                .otp("123456")
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .sentAt(LocalDateTime.now())
                .failedAttempts(4)
                .build();
        when(passwordResetTokenRepository.findTopByEmailAndUsedFalseAndSentAtIsNotNullOrderByIdDesc("member@example.com"))
                .thenReturn(Optional.of(token));

        assertThrows(IllegalArgumentException.class,
                () -> authService.resetPassword("member@example.com", "999999", "Password1!"));

        assertEquals(5, token.getFailedAttempts());
        assertTrue(token.isUsed());
        verify(passwordResetTokenRepository).save(token);
        verifyNoInteractions(userRepository);
    }

    @Test
    void validUnusedCodeChangesPasswordAndCannotBeReused() {
        PasswordResetToken token = PasswordResetToken.builder()
                .email("member@example.com")
                .otp("123456")
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .sentAt(LocalDateTime.now())
                .build();
        User user = User.builder().email("member@example.com").password("old-hash").build();
        when(passwordResetTokenRepository.findTopByEmailAndUsedFalseAndSentAtIsNotNullOrderByIdDesc("member@example.com"))
                .thenReturn(Optional.of(token), Optional.empty());
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("Password1!")).thenReturn("new-hash");

        authService.resetPassword("member@example.com", "123456", "Password1!");

        assertEquals("new-hash", user.getPassword());
        assertTrue(token.isUsed());
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).save(token);
        assertThrows(IllegalArgumentException.class,
                () -> authService.resetPassword("member@example.com", "123456", "Password1!"));
    }
}
