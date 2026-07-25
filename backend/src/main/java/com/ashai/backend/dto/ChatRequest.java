package com.ashai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    public ChatRequest(String message, String conversationId, String model) {
        this.message = message;
        this.conversationId = conversationId;
        this.model = model;
    }

    @NotBlank(message = "Message prompt cannot be empty")
    @Size(max = 20000, message = "Message prompt is too large")
    private String message;

    @Size(max = 100, message = "Conversation ID is invalid")
    private String conversationId;

    @Size(max = 50, message = "Model selection is invalid")
    private String model;

    @Size(max = 160, message = "Attachment name is too long")
    private String attachmentName;

    @Pattern(
            regexp = "^(image/(jpeg|png|webp|gif)|text/plain|text/markdown|application/(json|xml))$",
            message = "Unsupported attachment type"
    )
    private String attachmentMimeType;

    @Size(max = 4_200_000, message = "Attachment is too large")
    private String attachmentData;
}
