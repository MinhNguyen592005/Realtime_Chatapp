package com.chatapp.service;

import com.chatapp.model.PasswordResetToken;
import com.chatapp.model.Role;
import com.chatapp.model.RoleName;
import com.chatapp.model.User;
import com.chatapp.model.UserStatus;
import com.chatapp.payload.AuthResponse;
import com.chatapp.payload.LoginRequest;
import com.chatapp.payload.RegisterRequest;
import com.chatapp.payload.UserSummary;
import com.chatapp.repository.PasswordResetTokenRepository;
import com.chatapp.repository.RoleRepository;
import com.chatapp.repository.UserRepository;
import com.chatapp.security.JwtTokenProvider;
import com.chatapp.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_RESET_ATTEMPTS = 5;

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    @Transactional
    public UserSummary register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (username.length() < 3 || username.length() > 50) {
            throw new IllegalArgumentException("Tên đăng nhập phải có từ 3 đến 50 ký tự.");
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Tên đăng nhập '" + username + "' đã có người sử dụng. Vui lòng chọn tên khác.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email '" + email + "' đã được đăng ký tài khoản. Vui lòng dùng email khác hoặc chọn Quên mật khẩu.");
        }

        // Fetch or create default ROLE_USER
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_USER)));

        // Automatically generate avatar via Dicebear from username
        String avatar = "https://api.dicebear.com/7.x/bottts/svg?seed=" + username;

        Set<Role> userRoles = new HashSet<>();
        userRoles.add(userRole);

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .avatarUrl(avatar)
                .status(UserStatus.ONLINE)
                .roles(userRoles)
                .build();

        User savedUser = userRepository.save(user);

        return mapToUserSummary(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername().trim(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Update status to ONLINE
            userRepository.updateUserStatus(userPrincipal.getUsername(), UserStatus.ONLINE);

            UserSummary summary = UserSummary.builder()
                    .id(userPrincipal.getId())
                    .username(userPrincipal.getUsername())
                    .displayName(userPrincipal.getDisplayName())
                    .email(userPrincipal.getEmail())
                    .avatarUrl(userPrincipal.getAvatarUrl())
                    .status(UserStatus.ONLINE)
                    .roles(userPrincipal.getAuthorities().stream().map(Object::toString).collect(Collectors.toSet()))
                    .build();

            return AuthResponse.builder()
                    .token(jwt)
                    .tokenType("Bearer")
                    .user(summary)
                    .build();
        } catch (Exception ex) {
            throw new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }
    }

    @Transactional
    public void forgotPassword(String email) {
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với email này."));

        String otp = String.format(Locale.ROOT, "%06d", SECURE_RANDOM.nextInt(1_000_000));

        // A newly requested code replaces every older unused code for this email.
        passwordResetTokenRepository.invalidateActiveTokens(cleanEmail);
        PasswordResetToken token = PasswordResetToken.builder()
                .email(cleanEmail)
                .otp(otp)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();
        // Only delivered codes are persisted. A failed send rolls back the old-code invalidation.
        emailService.sendOtpEmail(cleanEmail, otp);
        token.setSentAt(LocalDateTime.now());
        passwordResetTokenRepository.save(token);
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void resetPassword(String email, String otp, String newPassword) {
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        String cleanOtp = otp.trim();

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findTopByEmailAndUsedFalseAndSentAtIsNotNullOrderByIdDesc(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không chính xác hoặc đã được sử dụng."));

        if (!resetToken.getExpiryDate().isAfter(LocalDateTime.now())) {
            resetToken.setUsed(true);
            passwordResetTokenRepository.save(resetToken);
            throw new IllegalArgumentException("Mã OTP đã hết hiệu lực. Vui lòng yêu cầu mã mới.");
        }

        if (!resetToken.getOtp().equals(cleanOtp)) {
            int previousAttempts = resetToken.getFailedAttempts() == null ? 0 : resetToken.getFailedAttempts();
            int failedAttempts = previousAttempts + 1;
            resetToken.setFailedAttempts(failedAttempts);
            if (failedAttempts >= MAX_RESET_ATTEMPTS) {
                resetToken.setUsed(true);
            }
            passwordResetTokenRepository.save(resetToken);
            throw new IllegalArgumentException(
                    failedAttempts >= MAX_RESET_ATTEMPTS
                            ? "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới."
                            : "Mã OTP không chính xác."
            );
        }

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với email này."));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    public static UserSummary mapToUserSummary(User user) {
        return mapToUserSummary(user, true);
    }

    public static UserSummary mapToPublicUserSummary(User user) {
        return mapToUserSummary(user, false);
    }

    private static UserSummary mapToUserSummary(User user, boolean includeEmail) {
        Set<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet())
                : Collections.emptySet();

        return UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(includeEmail ? user.getEmail() : null)
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roles(roleNames)
                .build();
    }
}
