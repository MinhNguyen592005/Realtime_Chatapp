package com.chatapp.repository;

import com.chatapp.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    @Query("SELECT m FROM Message m WHERE m.room.id = :roomId ORDER BY m.createdAt DESC")
    List<Message> findLatestMessageInRoom(@Param("roomId") Long roomId, Pageable pageable);

    default Optional<Message> findLastMessageByRoomId(Long roomId) {
        List<Message> list = findLatestMessageInRoom(roomId, Pageable.ofSize(1));
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}

