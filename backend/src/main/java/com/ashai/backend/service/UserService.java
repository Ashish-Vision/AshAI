package com.ashai.backend.service;

import com.ashai.backend.dto.RegisterRequest;
import com.ashai.backend.dto.UserResponse;
import com.ashai.backend.model.User;
import com.ashai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ashai.backend.exception.EmailAlreadyExistsException;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
}