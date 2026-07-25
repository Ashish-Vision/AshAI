package com.ashai.backend.service;

import com.ashai.backend.exception.EmailDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${app.frontend-url:http://localhost:5500}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String email, String token) {
        String verificationUrl = frontendUrl
                + "/pages/verify-email.html?token="
                + token;
        send(
                email,
                "Verify your AshAI account",
                """
                Welcome to AshAI.

                Verify that you own this email address by opening this link:
                %s

                This link expires in 24 hours. If you did not create an AshAI
                account, you can safely ignore this email.
                """.formatted(verificationUrl)
        );
    }

    public void sendPasswordResetEmail(String email, String token) {
        String resetUrl = frontendUrl
                + "/pages/reset-password.html?token="
                + token;
        send(
                email,
                "Reset your AshAI password",
                """
                A password reset was requested for your AshAI account.

                Set a new password using this link:
                %s

                This link expires in 2 hours. If you did not request this,
                ignore this email and your password will remain unchanged.
                """.formatted(resetUrl)
        );
    }

    public void requireConfigured() {
        if (!mailEnabled || fromAddress == null || fromAddress.isBlank()) {
            throw new EmailDeliveryException(
                    "Email delivery is not configured. Set the SMTP environment variables and restart the backend."
            );
        }
    }

    private void send(String recipient, String subject, String body) {
        requireConfigured();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            log.info("Email sent successfully to {}", maskEmail(recipient));
        } catch (MailException exception) {
            log.error("Email delivery failed for {}", maskEmail(recipient));
            throw new EmailDeliveryException(
                    "The verification email could not be sent. Please try again later.",
                    exception
            );
        }
    }

    private String maskEmail(String email) {
        int separator = email == null ? -1 : email.indexOf('@');
        if (separator <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(separator);
    }
}
