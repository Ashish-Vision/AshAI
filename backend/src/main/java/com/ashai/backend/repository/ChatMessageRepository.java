package com.ashai.backend.repository;

import com.ashai.backend.model.ChatMessage;
import com.ashai.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByUserAndConversationIdOrderByTimestampAsc(User user, String conversationId);

    @Query("SELECT m.conversationId FROM ChatMessage m WHERE m.user = :user GROUP BY m.conversationId ORDER BY MAX(m.timestamp) DESC")
    List<String> findDistinctConversationIdsByUser(@Param("user") User user);

    @Query("SELECT m FROM ChatMessage m WHERE m.user = :user AND m.sender = 'user' AND m.id IN (SELECT MIN(m2.id) FROM ChatMessage m2 WHERE m2.user = :user AND m2.sender = 'user' GROUP BY m2.conversationId)")
    List<ChatMessage> findFirstUserMessagesByUser(@Param("user") User user);

    void deleteByUserAndConversationId(User user, String conversationId);
}
