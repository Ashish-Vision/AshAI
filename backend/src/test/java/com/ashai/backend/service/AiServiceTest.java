package com.ashai.backend.service;

import com.ashai.backend.dto.ChatRequest;
import com.ashai.backend.dto.ChatResponse;
import com.ashai.backend.repository.ChatMessageRepository;
import com.ashai.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AiService aiService;

    @Test
    void processChat_ShouldReturnValidReply() {
        ChatRequest request = new ChatRequest("Hello, AshAI!", null, "test-model");

        ChatResponse response = aiService.processChat(request, "user@example.com");

        assertNotNull(response);
        assertNotNull(response.getReply());
        assertFalse(response.getReply().isBlank());
        assertNotNull(response.getConversationId());
    }
}
