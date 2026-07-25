package com.ashai.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String tokenType;
    private long expiresIn;
    private UserResponse user;
}