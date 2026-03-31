package com.example.demo.service;

import com.example.demo.dto.MessageRequest;
import com.example.demo.entity.Message;
import com.example.demo.entity.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import com.example.demo.dto.ConversationDto;
import com.example.demo.entity.MessageStatus;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Message sendMessage(String senderEmail, MessageRequest request) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .status(MessageStatus.SENT)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Create a DTO map to prevent Jackson serialization issues (like LocalDateTime or Lazy proxies) over STOMP
        java.util.Map<String, Object> msgDto = new java.util.HashMap<>();
        msgDto.put("id", savedMessage.getId());
        msgDto.put("content", savedMessage.getContent());
        msgDto.put("createdAt", savedMessage.getCreatedAt() != null ? savedMessage.getCreatedAt().toString() : java.time.LocalDateTime.now().toString());
        msgDto.put("status", savedMessage.getStatus() != null ? savedMessage.getStatus().name() : "SENT");

        java.util.Map<String, Object> senderDto = new java.util.HashMap<>();
        senderDto.put("id", sender.getId());
        senderDto.put("email", sender.getEmail());
        msgDto.put("sender", senderDto);

        java.util.Map<String, Object> receiverDto = new java.util.HashMap<>();
        receiverDto.put("id", receiver.getId());
        receiverDto.put("email", receiver.getEmail());
        msgDto.put("receiver", receiverDto);

        // Gửi tin nhắn real-time tới người nhận qua WebSocket bằng DTO an toàn
        messagingTemplate.convertAndSend("/topic/messages/" + receiver.getId(), (Object) msgDto);

        return savedMessage;
    }

    public List<Message> getChatHistory(String email, Integer receiverId) {
        User user1 = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User user2 = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return messageRepository.findChatHistory(user1.getId(), user2.getId());
    }

    public Integer getAdminId() {
        return userRepository.findFirstByRole("ADMIN")
                .orElseThrow(() -> new RuntimeException("Admin not found"))
                .getId();
    }

    public List<ConversationDto> getConversations(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        List<User> users = userRepository.findAll().stream()
                .filter(u -> !"ADMIN".equals(u.getRole()))
                .toList();

        List<ConversationDto> dtos = new java.util.ArrayList<>();
        for (User u : users) {
             List<Message> history = messageRepository.findChatHistory(admin.getId(), u.getId());
             String lastMsg = "";
             java.time.LocalDateTime lastTime = null;
             if (!history.isEmpty()) {
                 Message last = history.get(history.size() - 1);
                 lastMsg = last.getContent();
                 lastTime = last.getCreatedAt();
             }
             long unread = messageRepository.countUnreadMessages(u.getId(), admin.getId());
             
             dtos.add(ConversationDto.builder()
                     .userId(u.getId())
                     .email(u.getEmail())
                     .lastMessage(lastMsg)
                     .lastUpdate(lastTime)
                     .unreadCount(unread)
                     .isActive(u.getIsActive())
                     .build());
        }
        
        // Cập nhật lại cho lên đầu
        dtos.sort((d1, d2) -> {
            if (d1.getLastUpdate() == null && d2.getLastUpdate() == null) return 0;
            if (d1.getLastUpdate() == null) return 1;
            if (d2.getLastUpdate() == null) return -1;
            return d2.getLastUpdate().compareTo(d1.getLastUpdate());
        });
        
        return dtos;
    }

    @org.springframework.transaction.annotation.Transactional
    public void markAsSeen(String receiverEmail, Integer senderId) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));
        messageRepository.markMessagesAsSeen(senderId, receiver.getId());
        
        // Notify sender that receiver has seen the messages
        java.util.Map<String, Object> msgDto = new java.util.HashMap<>();
        msgDto.put("type", "SEEN_EVENT");
        msgDto.put("readerId", receiver.getId());
        messagingTemplate.convertAndSend("/topic/messages/" + senderId, (Object) msgDto);
    }
}
