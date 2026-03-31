package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ConversationDto {
    private Integer userId;
    private String email;
    private String avatar;
    private String lastMessage;
    private LocalDateTime lastUpdate;
    private Long unreadCount;
    private Boolean isActive;
}
