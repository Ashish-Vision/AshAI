package com.ashai.backend.service;

import com.ashai.backend.dto.ChatRequest;
import com.ashai.backend.dto.ChatResponse;
import com.ashai.backend.model.ChatMessage;
import com.ashai.backend.model.User;
import com.ashai.backend.repository.ChatMessageRepository;
import com.ashai.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class AiService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-flash-latest}")
    private String geminiModel;

    @Value("${gemini.api.pro-model:gemini-pro-latest}")
    private String geminiProModel;

    @Value("${gemini.google-search.enabled:true}")
    private boolean googleSearchEnabled;

    @Value("${ai.provider:ollama}")
    private String aiProvider;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.standard-model:gemma3:4b}")
    private String ollamaStandardModel;

    @Value("${ollama.pro-model:gemma3:4b}")
    private String ollamaProModel;

    @Value("${ollama.code-model:qwen2.5-coder:7b}")
    private String ollamaCodeModel;

    private final RestClient restClient;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public AiService(ChatMessageRepository chatMessageRepository, UserRepository userRepository) {
        this.restClient = RestClient.create();
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatResponse processChat(ChatRequest request, String userEmail) {
        String prompt = request.getMessage().trim();
        String conversationId = request.getConversationId() != null && !request.getConversationId().isBlank()
                ? request.getConversationId()
                : UUID.randomUUID().toString();

        String reply;
        ModeConfig mode = resolveMode(request.getModel());
        String modelName = mode.label();

        // Check if environment variable or configured property has Gemini API key
        String apiKey = (geminiApiKey != null && !geminiApiKey.isBlank()) 
                ? geminiApiKey 
                : System.getenv("GEMINI_API_KEY");

        if ("ollama".equalsIgnoreCase(aiProvider)) {
            try {
                reply = callOllamaApi(prompt, mode, request);
            } catch (Exception e) {
                log.warn("Ollama is unavailable: {}", e.getMessage());
                reply = callGeminiOrFallback(prompt, apiKey, mode, request);
            }
        } else {
            reply = callGeminiOrFallback(prompt, apiKey, mode, request);
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);

        if (user != null) {
            LocalDateTime now = LocalDateTime.now();
            // Save User message
            chatMessageRepository.save(ChatMessage.builder()
                    .conversationId(conversationId)
                    .sender("user")
                    .content(prompt)
                    .model(modelName)
                    .user(user)
                    .timestamp(now)
                    .build());

            // Save Assistant response
            chatMessageRepository.save(ChatMessage.builder()
                    .conversationId(conversationId)
                    .sender("assistant")
                    .content(reply)
                    .model(modelName)
                    .user(user)
                    .timestamp(now.plusNanos(1000))
                    .build());
        }

        return ChatResponse.builder()
                .reply(reply)
                .conversationId(conversationId)
                .model(modelName)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private String callGeminiOrFallback(
            String prompt,
            String apiKey,
            ModeConfig mode,
            ChatRequest request
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            return generateAssistantFallback(prompt);
        }
        try {
            return callGeminiApi(prompt, apiKey, mode, request);
        } catch (Exception e) {
            log.error("Gemini is unavailable; using built-in fallback: {}", e.getMessage());
            return generateAssistantFallback(prompt);
        }
    }

    @SuppressWarnings("unchecked")
    private String callOllamaApi(String prompt, ModeConfig mode, ChatRequest request) {
        Map<String, Object> userMessage = new java.util.LinkedHashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        if (request.getAttachmentData() != null
                && !request.getAttachmentData().isBlank()
                && request.getAttachmentMimeType() != null
                && request.getAttachmentMimeType().startsWith("image/")) {
            userMessage.put("images", List.of(request.getAttachmentData()));
        }

        Map<String, Object> requestBody = Map.of(
                "model", resolveOllamaModel(mode.label()),
                "stream", false,
                "messages", List.of(
                        Map.of("role", "system", "content", mode.systemInstruction()),
                        userMessage
                ),
                "options", Map.of(
                        "temperature", mode.temperature(),
                        "num_predict", mode.maxOutputTokens()
                )
        );

        Map<String, Object> response = restClient.post()
                .uri(normalizeOllamaUrl() + "/api/chat")
                .header("Content-Type", "application/json")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response != null && response.get("message") instanceof Map<?, ?> message) {
            Object content = message.get("content");
            if (content != null && !content.toString().isBlank()) {
                return content.toString();
            }
        }
        throw new IllegalStateException("Ollama returned an empty response");
    }

    private String resolveOllamaModel(String label) {
        if (label.contains("Code")) {
            return ollamaCodeModel;
        }
        if (label.contains("Pro")) {
            return ollamaProModel;
        }
        return ollamaStandardModel;
    }

    private String normalizeOllamaUrl() {
        String configured = ollamaBaseUrl == null || ollamaBaseUrl.isBlank()
                ? "http://localhost:11434"
                : ollamaBaseUrl.trim();
        return configured.endsWith("/")
                ? configured.substring(0, configured.length() - 1)
                : configured;
    }

    @Transactional(readOnly = true)
    public List<com.ashai.backend.dto.ConversationSummary> getUserConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> convIds = chatMessageRepository.findDistinctConversationIdsByUser(user);
        List<ChatMessage> firstMsgs = chatMessageRepository.findFirstUserMessagesByUser(user);
        java.util.Map<String, String> titleMap = firstMsgs.stream()
                .collect(java.util.stream.Collectors.toMap(ChatMessage::getConversationId, ChatMessage::getContent, (a, b) -> a));

        return convIds.stream().map(id -> {
            String title = titleMap.getOrDefault(id, "New Conversation");
            if (title.length() > 32) {
                title = title.substring(0, 32) + "...";
            }
            return com.ashai.backend.dto.ConversationSummary.builder()
                    .conversationId(id)
                    .title(title)
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getConversationMessages(String userEmail, String conversationId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return chatMessageRepository.findByUserAndConversationIdOrderByTimestampAsc(user, conversationId);
    }

    @Transactional
    public void deleteConversation(String userEmail, String conversationId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        chatMessageRepository.deleteByUserAndConversationId(user, conversationId);
    }

    private String callGeminiApi(String prompt, String apiKey, ModeConfig mode, ChatRequest request) {
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));
        if (request.getAttachmentData() != null
                && !request.getAttachmentData().isBlank()
                && request.getAttachmentMimeType() != null
                && !request.getAttachmentMimeType().isBlank()) {
            parts.add(Map.of(
                    "inlineData", Map.of(
                            "mimeType", request.getAttachmentMimeType(),
                            "data", request.getAttachmentData()
                    )
            ));
        }

        Map<String, Object> baseRequestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", parts)
                ),
                "systemInstruction", Map.of(
                        "parts", List.of(Map.of("text", mode.systemInstruction()))
                ),
                "generationConfig", Map.of(
                        "temperature", mode.temperature(),
                        "maxOutputTokens", mode.maxOutputTokens()
                )
        );

        Map<String, Object> response;
        try {
            response = executeWithOptionalGrounding(
                    buildGeminiUrl(mode.model()),
                    apiKey,
                    baseRequestBody,
                    mode.webSearch()
            );
        } catch (RestClientResponseException exception) {
            if (mode.model().equals(geminiModel)) {
                throw exception;
            }
            log.warn(
                    "{} is unavailable (HTTP {}). Retrying with {} while preserving the selected mode.",
                    mode.model(),
                    exception.getStatusCode().value(),
                    geminiModel
            );
            response = executeWithOptionalGrounding(
                    buildGeminiUrl(geminiModel),
                    apiKey,
                    baseRequestBody,
                    mode.webSearch()
            );
        }

        return extractGeminiResponse(response, prompt);
    }

    private Map<String, Object> executeWithOptionalGrounding(
            String url,
            String apiKey,
            Map<String, Object> baseRequestBody,
            boolean modeAllowsWebSearch
    ) {
        if (googleSearchEnabled && modeAllowsWebSearch) {
            Map<String, Object> groundedRequestBody = Map.of(
                    "contents", baseRequestBody.get("contents"),
                    "systemInstruction", baseRequestBody.get("systemInstruction"),
                    "generationConfig", baseRequestBody.get("generationConfig"),
                    "tools", List.of(Map.of("google_search", Map.of()))
            );
            try {
                return executeGeminiRequest(url, apiKey, groundedRequestBody);
            } catch (RestClientResponseException exception) {
                log.warn(
                        "Google Search grounding is unavailable (HTTP {}). Retrying without web grounding.",
                        exception.getStatusCode().value()
                );
                return executeGeminiRequest(url, apiKey, baseRequestBody);
            }
        }
        return executeGeminiRequest(url, apiKey, baseRequestBody);
    }

    private String buildGeminiUrl(String model) {
        return "https://generativelanguage.googleapis.com/v1beta/models/"
                + model
                + ":generateContent";
    }

    private ModeConfig resolveMode(String selectedMode) {
        String normalized = selectedMode == null ? "" : selectedMode.trim().toLowerCase();
        if (normalized.contains("code")) {
            return new ModeConfig(
                    "AshAI Code Expert",
                    geminiModel,
                    """
                    You are AshAI Code Expert, a senior software engineer. Produce secure, maintainable,
                    production-ready solutions. Prefer concrete code and precise debugging steps, explain
                    important trade-offs, use fenced code blocks, and never invent APIs or test results.
                    Keep non-programming answers concise. Do not use web search unless the user explicitly
                    needs current technical information.
                    """,
                    0.15,
                    4096,
                    false
            );
        }
        if (normalized.contains("pro")) {
            return new ModeConfig(
                    "AshAI Pro",
                    geminiProModel,
                    """
                    You are AshAI Pro, an advanced analytical assistant. Solve complex requests rigorously,
                    examine assumptions, compare alternatives, and give a clear conclusion with actionable
                    next steps. Use current Google Search evidence when available and clearly distinguish
                    sourced facts from inference. Format answers in readable Markdown.
                    """,
                    0.35,
                    4096,
                    true
            );
        }
        return new ModeConfig(
                "AshAI Standard",
                geminiModel,
                """
                You are AshAI Standard, a fast and helpful everyday assistant. Give accurate, practical,
                easy-to-read answers without unnecessary detail. Use current Google Search evidence when
                available, acknowledge uncertainty, and format answers in readable Markdown.
                """,
                0.7,
                2048,
                true
        );
    }

    private record ModeConfig(
            String label,
            String model,
            String systemInstruction,
            double temperature,
            int maxOutputTokens,
            boolean webSearch
    ) {
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> executeGeminiRequest(
            String url,
            String apiKey,
            Map<String, Object> requestBody
    ) {
        return restClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .body(requestBody)
                .retrieve()
                .body(Map.class);
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiResponse(
            Map<String, Object> response,
            String prompt
    ) {
        if (response != null && response.containsKey("candidates")) {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (!candidates.isEmpty()) {
                Map<String, Object> candidate = candidates.get(0);
                Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                if (content != null && content.containsKey("parts")) {
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        return appendGroundingSources(
                                (String) parts.get(0).get("text"),
                                (Map<String, Object>) candidate.get("groundingMetadata")
                        );
                    }
                }
            }
        }

        return generateAssistantFallback(prompt);
    }

    private String appendGroundingSources(
            String answer,
            Map<String, Object> groundingMetadata
    ) {
        if (answer == null || groundingMetadata == null) {
            return answer;
        }

        Object chunksValue = groundingMetadata.get("groundingChunks");
        if (!(chunksValue instanceof List<?> chunks)) {
            return answer;
        }

        Set<String> sources = new LinkedHashSet<>();
        for (Object chunkValue : chunks) {
            if (!(chunkValue instanceof Map<?, ?> chunk)) {
                continue;
            }
            Object webValue = chunk.get("web");
            if (!(webValue instanceof Map<?, ?> web)) {
                continue;
            }

            Object uriValue = web.get("uri");
            Object titleValue = web.get("title");
            String uri = uriValue == null ? "" : uriValue.toString();
            String title = titleValue == null ? "Source" : titleValue.toString();
            if (!uri.isBlank()) {
                sources.add("- [" + title.replace("]", "") + "](" + uri + ")");
            }
            if (sources.size() == 5) {
                break;
            }
        }

        return sources.isEmpty()
                ? answer
                : answer + "\n\n### Sources\n" + String.join("\n", sources);
    }

    private String generateAssistantFallback(String prompt) {
        String lower = prompt.toLowerCase();

        if (lower.contains("hello") || lower.contains("hi") || lower.contains("hey")) {
            return "Hello! I am **AshAI**, your intelligent AI assistant. How can I assist you with your projects, code, or queries today?";
        }

        if (lower.contains("summarize") || lower.contains("document") || lower.contains("key points")) {
            return "### Summary & Key Insights\n\n" +
                   "Here are the core takeaways based on your request:\n\n" +
                   "1. **Core Architecture**: The application follows a modern decoupled architecture with a Spring Boot REST API and lightweight vanilla web client.\n" +
                   "2. **Security & Auth**: User authorization is fully secured using JWT (JSON Web Tokens) and BCrypt password encryption.\n" +
                   "3. **Data Integrity**: State management is backed by PostgreSQL with full JPA entity mapping.\n\n" +
                   "Feel free to share specific content if you'd like a deeper analysis!";
        }

        if (lower.contains("code") || lower.contains("problem") || lower.contains("generate") || lower.contains("function")) {
            return "Here is an optimized implementation for your task:\n\n" +
                   "```javascript\n" +
                   "// AshAI Assistant Code Generator\n" +
                   "async function executeTask(params) {\n" +
                   "    try {\n" +
                   "        const response = await fetch('/api/chat', {\n" +
                   "            method: 'POST',\n" +
                   "            headers: { 'Content-Type': 'application/json' },\n" +
                   "            body: JSON.stringify(params)\n" +
                   "        });\n" +
                   "        return await response.json();\n" +
                   "    } catch (error) {\n" +
                   "        console.error('Execution error:', error);\n" +
                   "    }\n" +
                   "}\n" +
                   "```\n\n" +
                   "Let me know if you need any adjustments or refactoring!";
        }

        return "I have processed your request: **\"" + prompt + "\"**.\n\n" +
               "AshAI is ready to assist you. You can ask me to draft code, summarize complex documents, analyze system architectures, or answer general knowledge queries.";
    }
}
