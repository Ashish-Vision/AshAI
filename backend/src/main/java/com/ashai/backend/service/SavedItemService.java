package com.ashai.backend.service;

import com.ashai.backend.dto.SaveItemRequest;
import com.ashai.backend.model.SavedItem;
import com.ashai.backend.model.User;
import com.ashai.backend.repository.SavedItemRepository;
import com.ashai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedItemService {

    private final SavedItemRepository savedItemRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SavedItem> getSavedItems(String email) {
        return savedItemRepository.findByUserOrderByCreatedAtDesc(getUser(email));
    }

    @Transactional
    public SavedItem save(String email, SaveItemRequest request) {
        String content = request.getContent().trim();
        String title = request.getTitle() == null || request.getTitle().isBlank()
                ? buildTitle(content)
                : request.getTitle().trim();

        return savedItemRepository.save(SavedItem.builder()
                .title(title)
                .content(content)
                .conversationId(request.getConversationId())
                .user(getUser(email))
                .build());
    }

    @Transactional
    public void delete(String email, Long id) {
        User user = getUser(email);
        SavedItem item = savedItemRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved item not found"
                ));
        savedItemRepository.delete(item);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private String buildTitle(String content) {
        String oneLine = content.replaceAll("\\s+", " ").trim();
        return oneLine.length() <= 70 ? oneLine : oneLine.substring(0, 70) + "…";
    }
}
