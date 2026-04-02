package com.example.demo.service;

import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void notifyUser(User user, String content, String link) {
        Notification notification = Notification.builder()
                .user(user)
                .content(content)
                .link(link)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // Chuyển toàn bộ notification thay vì chỉ string
        messagingTemplate.convertAndSend("/topic/user-" + user.getId(), notification);
    }

    public void notifyAdmins(String content, String link) {
        // Lấy tất cả user có Role là ADMIN
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> "ADMIN".equals(u.getRole()))
                .toList();

        // Lưu notification vào database cho từng admin
        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .content(content)
                    .link(link)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }

        Notification wsNotification = Notification.builder()
                .content(content)
                .link(link)
                .isRead(false)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        messagingTemplate.convertAndSend("/topic/admin-notifications", wsNotification);
    }

    public List<Notification> getNotificationsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public void markAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
}
