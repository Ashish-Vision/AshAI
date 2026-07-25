package com.ashai.backend.controller;

import com.ashai.backend.dto.SaveItemRequest;
import com.ashai.backend.model.SavedItem;
import com.ashai.backend.service.SavedItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved")
@RequiredArgsConstructor
public class SavedItemController {

    private final SavedItemService savedItemService;

    @GetMapping
    public List<SavedItem> getSavedItems(Authentication authentication) {
        return savedItemService.getSavedItems(authentication.getName());
    }

    @PostMapping
    public ResponseEntity<SavedItem> save(
            @Valid @RequestBody SaveItemRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedItemService.save(authentication.getName(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(
            @PathVariable Long id,
            Authentication authentication
    ) {
        savedItemService.delete(authentication.getName(), id);
        return ResponseEntity.ok(Map.of("message", "Saved item deleted"));
    }
}
