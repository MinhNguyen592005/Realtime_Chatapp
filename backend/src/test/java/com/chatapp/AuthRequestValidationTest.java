package com.chatapp;

import com.chatapp.payload.ForgotPasswordRequest;
import com.chatapp.payload.RegisterRequest;
import com.chatapp.payload.ResetPasswordRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    @Test
    void registrationRequiresValidEmailAndPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("member");
        request.setEmail("member@example.technology");
        request.setPassword("Password1!");
        assertTrue(validator.validate(request).isEmpty());

        request.setEmail("not-an-email");
        assertFalse(validator.validate(request).isEmpty());

        request.setEmail("member@example.com");
        for (String invalidPassword : new String[] {"short1!", "Password1", "Password!", "Password 1!"}) {
            request.setPassword(invalidPassword);
            assertFalse(validator.validate(request).isEmpty(), invalidPassword);
        }
    }

    @Test
    void passwordResetRequiresValidEmailOtpAndNewPassword() {
        ForgotPasswordRequest forgot = new ForgotPasswordRequest();
        forgot.setEmail("invalid");
        assertFalse(validator.validate(forgot).isEmpty());

        ResetPasswordRequest reset = new ResetPasswordRequest();
        reset.setEmail("member@example.com");
        reset.setOtp("123456");
        reset.setNewPassword("Password1!");
        assertTrue(validator.validate(reset).isEmpty());

        reset.setOtp("12345x");
        assertFalse(validator.validate(reset).isEmpty());
        reset.setOtp("123456");
        reset.setNewPassword("weak");
        assertFalse(validator.validate(reset).isEmpty());
    }
}
