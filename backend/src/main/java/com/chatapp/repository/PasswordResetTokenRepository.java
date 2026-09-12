package com.chatapp.repository;

import com.chatapp.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByEmailAndUsedFalseOrderByExpiryDateDesc(String email);

    Optional<PasswordResetToken> findTopByEmailAndOtpAndUsedFalse(String email, String otp);
}

