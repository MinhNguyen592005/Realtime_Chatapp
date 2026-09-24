package com.chatapp.repository;

import com.chatapp.model.PasswordResetToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PasswordResetToken> findTopByEmailAndUsedFalseAndSentAtIsNotNullOrderByIdDesc(String email);

    @Modifying
    @Query("UPDATE PasswordResetToken token SET token.used = true WHERE token.email = :email AND token.used = false")
    int invalidateActiveTokens(@Param("email") String email);
}
