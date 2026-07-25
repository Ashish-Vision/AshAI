package com.ashai.backend.service;

import com.ashai.backend.exception.EmailDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${app.mail.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    @Value("${app.frontend-url:http://localhost:5500}")
    private String frontendUrl;

    private final RestClient brevoClient;
    private final RestClient resendClient;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        this.brevoClient = RestClient.create("https://api.brevo.com/v3");
        this.resendClient = RestClient.create("https://api.resend.com");
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
        boolean brevoConfigured = brevoApiKey != null && !brevoApiKey.isBlank();
        boolean resendConfigured = resendApiKey != null && !resendApiKey.isBlank();
        boolean smtpConfigured = smtpUsername != null
                && !smtpUsername.isBlank()
                && smtpPassword != null
                && !smtpPassword.isBlank();

        if (!mailEnabled
                || fromAddress == null
                || fromAddress.isBlank()
                || (!brevoConfigured && !resendConfigured && !smtpConfigured)) {
            throw new EmailDeliveryException(
                    "Email delivery is not configured. Set BREVO_API_KEY and MAIL_FROM, then restart the backend."
            );
        }
    }

    private void send(String recipient, String subject, String body) {
        requireConfigured();

        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            sendWithBrevo(recipient, subject, body);
            return;
        }

        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendWithResend(recipient, subject, body);
            return;
        }

        sendWithSmtp(recipient, subject, body);
    }

    private void sendWithBrevo(String recipient, String subject, String body) {
        try {
            brevoClient.post()
                    .uri("/smtp/email")
                    .header("api-key", brevoApiKey)
                    .body(Map.of(
                            "sender", Map.of(
                                    "name", extractSenderName(),
                                    "email", extractSenderEmail()
                            ),
                            "to", List.of(Map.of("email", recipient)),
                            "subject", subject,
                            "textContent", body
                    ))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Email sent through Brevo to {}", maskEmail(recipient));
        } catch (RestClientException exception) {
            log.error("Brevo email delivery failed for {}", maskEmail(recipient));
            throw new EmailDeliveryException(
                    "The verification email could not be sent. Please try again later.",
                    exception
            );
        }
    }

    private void sendWithResend(String recipient, String subject, String body) {
        try {
            resendClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + resendApiKey)
                    .body(Map.of(
                            "from", fromAddress,
                            "to", List.of(recipient),
                            "subject", subject,
                            "text", body
                    ))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Email sent through Resend to {}", maskEmail(recipient));
        } catch (RestClientException exception) {
            log.error("Resend email delivery failed for {}", maskEmail(recipient));
            throw new EmailDeliveryException(
                    "The verification email could not be sent. Please try again later.",
                    exception
            );
        }
    }

    private void sendWithSmtp(String recipient, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            log.info("Email sent through SMTP to {}", maskEmail(recipient));
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

    private String extractSenderName() {
        int openingBracket = fromAddress.indexOf('<');
        if (openingBracket > 0) {
            String name = fromAddress.substring(0, openingBracket).trim();
            if (!name.isBlank()) {
                return name;
            }
        }
        return "AshAI";
    }

    private String extractSenderEmail() {
        int openingBracket = fromAddress.indexOf('<');
        int closingBracket = fromAddress.indexOf('>', openingBracket + 1);
        if (openingBracket >= 0 && closingBracket > openingBracket) {
            return fromAddress.substring(openingBracket + 1, closingBracket).trim();
        }
        return fromAddress.trim();
    }
}
