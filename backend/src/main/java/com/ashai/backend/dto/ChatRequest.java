package com.ashai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "Message prompt cannot be empty")
    @Size(max = 20000, message = "Message prompt is too large")
    private String message;

    @Size(max = 100, message = "Conversation ID is invalid")
    private String conversationId;

    @Size(max = 50, message = "Model selection is invalid")
    private String model;
}
