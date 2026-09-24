package com.chatapp;

import com.chatapp.model.PasswordResetToken;
import com.chatapp.repository.PasswordResetTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "logging.level.org.hibernate.SQL=OFF"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ActiveProfiles("h2")
class PasswordResetTokenRepositoryTest {

    @Autowired
    PasswordResetTokenRepository repository;

    @MockBean(name = "initData")
    CommandLineRunner initData;

    @Test
    void onlyDeliveredCodesCanBeUsedAndNewRequestInvalidatesOldCode() {
        PasswordResetToken oldConsoleCode = PasswordResetToken.builder()
                .email("member@example.com")
                .otp("111111")
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();
        repository.saveAndFlush(oldConsoleCode);
        assertTrue(repository.findTopByEmailAndUsedFalseAndSentAtIsNotNullOrderByIdDesc("member@example.com")
                .isEmpty());

        PasswordResetToken deliveredCode = PasswordResetToken.builder()
                .email("member@example.com")
                .otp("222222")
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .sentAt(LocalDateTime.now())
                .build();
        repository.invalidateActiveTokens("member@example.com");
        repository.saveAndFlush(deliveredCode);

        PasswordResetToken usableCode = repository
                .findTopByEmailAndUsedFalseAndSentAtIsNotNullOrderByIdDesc("member@example.com")
                .orElseThrow();
        assertEquals("222222", usableCode.getOtp());
    }
}
