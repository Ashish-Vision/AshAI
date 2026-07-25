package com.ashai.backend.security;

import com.ashai.backend.model.User;
import com.ashai.backend.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.frontend-url:http://localhost:5500}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken =
                (OAuth2AuthenticationToken) authentication;
        OAuth2User principal = oauthToken.getPrincipal();

        String email = principal.<String>getAttribute("email")
                .trim()
                .toLowerCase(Locale.ROOT);
        String fullName = firstNonBlank(
                principal.getAttribute("name"),
                principal.getAttribute("login"),
                email.substring(0, email.indexOf('@'))
        );
        String avatarUrl = firstNonBlank(
                principal.getAttribute("picture"),
                principal.getAttribute("avatar_url")
        );

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> User.builder()
                        .fullName(fullName)
                        .email(email)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .verified(true)
                        .avatarUrl(avatarUrl)
                        .build());

        if (user.getAvatarUrl() == null && avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }
        user.setVerified(true);
        userRepository.save(user);

        String jwt = jwtService.generateToken(user.getEmail());
        String callbackUrl = UriComponentsBuilder
                .fromUriString(frontendUrl)
                .path("/pages/oauth-callback.html")
                .fragment("token=" + jwt)
                .build()
                .toUriString();

        response.sendRedirect(callbackUrl);
    }

    @SafeVarargs
    private final <T> String firstNonBlank(T... values) {
        for (T value : values) {
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value).trim();
            }
        }
        return null;
    }
}
