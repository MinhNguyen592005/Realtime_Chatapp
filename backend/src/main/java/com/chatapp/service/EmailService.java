package com.chatapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from:}") String configuredFrom,
                        @Value("${spring.mail.username:}") String mailUsername) {
        this.mailSender = mailSender;
        this.fromAddress = configuredFrom.isBlank() ? mailUsername : configuredFrom;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        if (fromAddress.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình email gửi mã xác thực (MAIL_USERNAME hoặc MAIL_FROM).");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Mã xác thực đặt lại mật khẩu - Realtime Chat App");
        message.setText("Mã xác thực của bạn là: " + otp
                + "\n\nMã có hiệu lực trong 15 phút và chỉ dùng được một lần."
                + "\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.");

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            throw new IllegalStateException("Không thể gửi mã xác thực qua email. Vui lòng thử lại sau.", ex);
        }
    }
}
