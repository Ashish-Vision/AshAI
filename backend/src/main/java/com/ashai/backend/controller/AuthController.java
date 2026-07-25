package com.ashai.backend.controller;

import com.ashai.backend.dto.*;
import com.ashai.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.github.client-id:}")
    private String githubClientId;

    @GetMapping("/oauth/providers")
    public ResponseEntity<Map<String, Boolean>> oauthProviders() {
        return ResponseEntity.ok(Map.of(
                "google", isConfigured(googleClientId),
                "github", isConfigured(githubClientId)
        ));
    }

    private boolean isConfigured(String clientId) {
        return clientId != null
                && !clientId.isBlank()
                && !clientId.startsWith("missing-");
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        UserResponse response = userService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = userService.login(request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        boolean verified = userService.verifyEmail(token);
        if (verified) {
            return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification token"));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestParam("token") String token) {
        boolean resent = userService.resendVerificationEmail(token);
        if (resent) {
            return ResponseEntity.ok(Map.of("message", "A new verification email has been sent"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Verification link is invalid or the account is already verified"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "If an account exists, a password reset link has been dispatched"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean success = userService.resetPassword(request.getToken(), request.getNewPassword());
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset token"));
        }
    }
}
