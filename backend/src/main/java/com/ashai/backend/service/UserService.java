package com.ashai.backend.service;

import com.ashai.backend.dto.LoginRequest;
import com.ashai.backend.dto.LoginResponse;
import com.ashai.backend.dto.RegisterRequest;
import com.ashai.backend.dto.UserResponse;
import com.ashai.backend.exception.EmailAlreadyExistsException;
import com.ashai.backend.exception.InvalidCredentialsException;
import com.ashai.backend.model.User;
import com.ashai.backend.repository.UserRepository;
import com.ashai.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponse register(RegisterRequest request) {

        String normalizedEmail = request
                .getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException(
                    "An account already exists with this email"
            );
        }

        User user = new User();

        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        return UserResponse.from(savedUser);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String normalizedEmail = request
                .getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(InvalidCredentialsException::new);

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!passwordMatches) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user.getEmail());

        return new LoginResponse(
                token,
                "Bearer",
                86400,
                UserResponse.from(user)
        );
    }
}