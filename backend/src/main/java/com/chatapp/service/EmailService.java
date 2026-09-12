package com.chatapp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    public void sendOtpEmail(String toEmail, String otp) {
        // Prominently log to console for instant local developer testing
        System.out.println("==================================================================");
        System.out.println("                 [REALTIME CHAT APP - EMAIL SERVICE]             ");
        System.out.println("  Đã gửi mã OTP đặt lại mật khẩu tới email: " + toEmail);
        System.out.println("  MÃ XÁC THỰC OTP (Hiệu lực trong 15 phút): >>> " + otp + " <<<");
        System.out.println("==================================================================");

        log.info("Password reset OTP generated for {}: {}", toEmail, otp);
    }
}

