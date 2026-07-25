package com.ashai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SaveItemRequest {

    @NotBlank(message = "Saved content cannot be blank")
    @Size(max = 50000, message = "Saved content is too large")
    private String content;

    @Size(max = 120, message = "Title cannot exceed 120 characters")
    private String title;

    @Size(max = 100, message = "Conversation ID is invalid")
    private String conversationId;
}
