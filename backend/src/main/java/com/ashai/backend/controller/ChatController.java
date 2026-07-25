package com.ashai.backend.controller;

import com.ashai.backend.dto.ChatRequest;
import com.ashai.backend.dto.ChatResponse;
import com.ashai.backend.model.ChatMessage;
import com.ashai.backend.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final AiService aiService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "anonymous";
        ChatResponse response = aiService.processChat(request, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<com.ashai.backend.dto.ConversationSummary>> getConversations(Authentication authentication) {
        List<com.ashai.backend.dto.ConversationSummary> conversations = aiService.getUserConversations(authentication.getName());
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/history/{conversationId}")
    public ResponseEntity<List<ChatMessage>> getConversationMessages(
            @PathVariable("conversationId") String conversationId,
            Authentication authentication
    ) {
        List<ChatMessage> messages = aiService.getConversationMessages(authentication.getName(), conversationId);
        return ResponseEntity.ok(messages);
    }

    @DeleteMapping("/history/{conversationId}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable("conversationId") String conversationId,
            Authentication authentication
    ) {
        aiService.deleteConversation(authentication.getName(), conversationId);
        return ResponseEntity.ok(Map.of("message", "Conversation deleted successfully"));
    }
}
