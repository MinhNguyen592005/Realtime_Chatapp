package com.chatapp.repository;

import com.chatapp.model.ChatRoom;
import com.chatapp.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("SELECT r FROM ChatRoom r JOIN r.members m WHERE m.user.id = :userId ORDER BY r.createdAt DESC")
    List<ChatRoom> findRoomsByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM ChatRoom r " +
            "JOIN r.members m1 JOIN r.members m2 " +
            "WHERE r.type = :type AND m1.user.id = :user1Id AND m2.user.id = :user2Id")
    Optional<ChatRoom> findDirectRoomBetweenUsers(
            @Param("type") RoomType type,
            @Param("user1Id") Long user1Id,
            @Param("user2Id") Long user2Id
    );
}

