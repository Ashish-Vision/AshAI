package com.ashai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Token is required")
    @Size(max = 100, message = "Token is invalid")
    private String token;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 128, message = "New password must contain between 8 and 128 characters")
    private String newPassword;
}
