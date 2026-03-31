package com.example.demo.repository;

import com.example.demo.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Integer> {
    
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId1 AND m.receiver.id = :userId2) OR (m.sender.id = :userId2 AND m.receiver.id = :userId1) ORDER BY m.createdAt ASC")
    List<Message> findChatHistory(@Param("userId1") Integer userId1, @Param("userId2") Integer userId2);

    @Modifying
    @Query("UPDATE Message m SET m.status = 'SEEN' WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.status != 'SEEN'")
    int markMessagesAsSeen(@Param("senderId") Integer senderId, @Param("receiverId") Integer receiverId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.status != 'SEEN'")
    long countUnreadMessages(@Param("senderId") Integer senderId, @Param("receiverId") Integer receiverId);
}
