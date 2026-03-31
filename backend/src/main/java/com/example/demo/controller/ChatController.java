package com.example.demo.controller;

import com.example.demo.dto.MessageRequest;
import com.example.demo.dto.ConversationDto;
import com.example.demo.entity.Message;
import com.example.demo.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(Authentication authentication, @RequestBody MessageRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(messageService.sendMessage(email, request));
    }

    @GetMapping("/history/{receiverId}")
    public ResponseEntity<List<Message>> getChatHistory(Authentication authentication, @PathVariable Integer receiverId) {
        String email = authentication.getName();
        return ResponseEntity.ok(messageService.getChatHistory(email, receiverId));
    }

    @GetMapping("/admin-id")
    public ResponseEntity<Integer> getAdminId() {
        return ResponseEntity.ok(messageService.getAdminId());
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(messageService.getConversations(email));
    }

    @PutMapping("/mark-seen/{senderId}")
    public ResponseEntity<Void> markAsSeen(Authentication authentication, @PathVariable Integer senderId) {
        String email = authentication.getName();
        messageService.markAsSeen(email, senderId);
        return ResponseEntity.ok().build();
    }
}

