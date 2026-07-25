package com.ashai.backend.service;

import com.ashai.backend.dto.ChatRequest;
import com.ashai.backend.dto.ChatResponse;
import com.ashai.backend.dto.RegisterRequest;
import com.ashai.backend.dto.UserResponse;
import com.ashai.backend.model.User;
import com.ashai.backend.repository.PasswordResetTokenRepository;
import com.ashai.backend.repository.UserRepository;
import com.ashai.backend.repository.VerificationTokenRepository;
import com.ashai.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encoded_password")
                .verified(false)
                .build();
    }

    @Test
    void register_ShouldSaveUserAndSendVerificationEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("test@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserResponse response = userService.register(request);

        assertNotNull(response);
        assertEquals("Test User", response.getFullName());
        assertEquals("test@example.com", response.getEmail());
        verify(emailService, times(1)).sendVerificationEmail(eq("test@example.com"), anyString());
    }

    @Test
    void getProfile_ShouldReturnUserProfile() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));

        UserResponse response = userService.getProfile("test@example.com");

        assertNotNull(response);
        assertEquals("Test User", response.getFullName());
    }

    @Test
    void resendVerificationEmailByAddress_ShouldReplaceTokenAndSendEmail() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));

        userService.resendVerificationEmailByAddress(" Test@Example.com ");

        verify(verificationTokenRepository).deleteByUser(sampleUser);
        verify(verificationTokenRepository).flush();
        verify(verificationTokenRepository).save(any());
        verify(emailService).sendVerificationEmail(eq("test@example.com"), anyString());
    }
}
