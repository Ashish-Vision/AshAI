package com.ashai.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    public void sendVerificationEmail(String email, String token) {
        String verificationUrl = "http://localhost:5500/pages/verify-email.html?token=" + token;
        log.info("==================================================================");
        log.info("EMAIL DISPATCH -> To: {}", email);
        log.info("Subject: Verify your AshAI Account");
        log.info("Action Link: {}", verificationUrl);
        log.info("==================================================================");
    }

    public void sendPasswordResetEmail(String email, String token) {
        String resetUrl = "http://localhost:5500/pages/reset-password.html?token=" + token;
        log.info("==================================================================");
        log.info("EMAIL DISPATCH -> To: {}", email);
        log.info("Subject: Reset your AshAI Password");
        log.info("Action Link: {}", resetUrl);
        log.info("==================================================================");
    }
}
