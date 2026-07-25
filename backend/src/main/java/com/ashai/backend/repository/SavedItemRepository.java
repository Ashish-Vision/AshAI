package com.ashai.backend.repository;

import com.ashai.backend.model.SavedItem;
import com.ashai.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedItemRepository extends JpaRepository<SavedItem, Long> {

    List<SavedItem> findByUserOrderByCreatedAtDesc(User user);

    Optional<SavedItem> findByIdAndUser(Long id, User user);
}
