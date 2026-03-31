package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic for pushing messages to clients
        config.enableSimpleBroker("/topic");
        // Prefix for server to handle messages from clients
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Enpoint to connect to WebSocket, e.g., ws://localhost:8080/ws
        // using SockJS fallback if native WS is unavailable
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // update dynamically according to your domains
                .withSockJS();
    }
}
