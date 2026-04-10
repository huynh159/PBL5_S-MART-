package com.example.demo.controller;

import com.example.demo.dto.AiChatRequest;
import com.example.demo.service.AiChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/ai")
@CrossOrigin(origins = "*") // Or configure in WebConfigs
public class AiChatController {

    @Autowired
    private AiChatService aiChatService;

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askAi(@RequestBody AiChatRequest request) {
        String answer = aiChatService.getResponseFromGemini(request.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("answer", answer);
        return ResponseEntity.ok(response);
    }
}

