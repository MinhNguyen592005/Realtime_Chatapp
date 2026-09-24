package com.chatapp;

import com.chatapp.service.EmailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class EmailServiceTest {

    @Test
    void sendsCodeToRegisteredAddress() {
        JavaMailSender sender = mock(JavaMailSender.class);
        EmailService service = new EmailService(sender, "", "sender@example.com");

        service.sendOtpEmail("member@example.com", "123456");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(messageCaptor.capture());
        SimpleMailMessage message = messageCaptor.getValue();
        assertEquals("sender@example.com", message.getFrom());
        assertEquals("member@example.com", message.getTo()[0]);
        assertTrue(message.getText().contains("123456"));
    }

    @Test
    void missingConfigurationOrDeliveryFailureDoesNotReportSuccess() {
        JavaMailSender sender = mock(JavaMailSender.class);
        assertThrows(IllegalStateException.class,
                () -> new EmailService(sender, "", "").sendOtpEmail("member@example.com", "123456"));
        verifyNoInteractions(sender);

        doThrow(new MailSendException("SMTP unavailable"))
                .when(sender).send(any(SimpleMailMessage.class));
        assertThrows(IllegalStateException.class,
                () -> new EmailService(sender, "", "sender@example.com")
                        .sendOtpEmail("member@example.com", "123456"));
    }
}
