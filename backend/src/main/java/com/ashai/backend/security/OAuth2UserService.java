package com.ashai.backend.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OAuth2UserService
        implements org.springframework.security.oauth2.client.userinfo.OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final RestClient restClient = RestClient.create();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User user = delegate.loadUser(userRequest);
        Map<String, Object> attributes = new HashMap<>(user.getAttributes());
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        if ("google".equals(registrationId)
                && !Boolean.TRUE.equals(attributes.get("email_verified"))) {
            throw unverifiedEmail();
        }

        if ("github".equals(registrationId)) {
            String email = loadVerifiedGitHubEmail(
                    userRequest.getAccessToken().getTokenValue()
            );
            attributes.put("email", email);
        }

        if (isBlank(attributes.get("email"))) {
            throw unverifiedEmail();
        }

        String userNameAttribute = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                userNameAttribute
        );
    }

    private String loadVerifiedGitHubEmail(String accessToken) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> emails = restClient.get()
                .uri("https://api.github.com/user/emails")
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .body(List.class);

        if (emails == null) {
            return null;
        }

        return emails.stream()
                .filter(item -> Boolean.TRUE.equals(item.get("verified")))
                .sorted((first, second) -> Boolean.compare(
                        Boolean.TRUE.equals(second.get("primary")),
                        Boolean.TRUE.equals(first.get("primary"))
                ))
                .map(item -> String.valueOf(item.get("email")))
                .filter(email -> !email.isBlank() && !"null".equals(email))
                .findFirst()
                .orElse(null);
    }

    private boolean isBlank(Object value) {
        return value == null || String.valueOf(value).isBlank();
    }

    private OAuth2AuthenticationException unverifiedEmail() {
        return new OAuth2AuthenticationException(
                new OAuth2Error("verified_email_required"),
                "The OAuth provider did not return a verified email address"
        );
    }
}
