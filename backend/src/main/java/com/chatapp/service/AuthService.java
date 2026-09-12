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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

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
        String email = request.getEmail().trim().toLowerCase();

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
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản nào với địa chỉ email: " + cleanEmail));

        // Generate 6-digit random numeric OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));

        PasswordResetToken token = PasswordResetToken.builder()
                .email(cleanEmail)
                .otp(otp)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetTokenRepository.save(token);

        // Send OTP via Email / Console notification
        emailService.sendOtpEmail(cleanEmail, otp);
    }

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanOtp = otp.trim();

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findTopByEmailAndOtpAndUsedFalse(cleanEmail, cleanOtp)
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không chính xác hoặc đã được sử dụng."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hiệu lực (chỉ có giá trị trong 15 phút). Vui lòng yêu cầu mã mới.");
        }

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với email này."));

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    public static UserSummary mapToUserSummary(User user) {
        Set<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet())
                : Collections.emptySet();

        return UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roles(roleNames)
                .build();
    }
}
