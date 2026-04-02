package com.example.demo.controller;

import com.example.demo.dto.OrderRequest;
import com.example.demo.entity.Order;
import com.example.demo.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> createOrder(Authentication authentication, @RequestBody OrderRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(orderService.createOrder(email, request));
    }

    @GetMapping
    public ResponseEntity<List<Order>> getOrderHistory(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(orderService.getOrderHistory(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderDetails(Authentication authentication, @PathVariable Integer id) {
        String email = authentication.getName();
        return ResponseEntity.ok(orderService.getOrderDetails(email, id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(Authentication authentication, @PathVariable Integer id) {
        String email = authentication.getName();
        return ResponseEntity.ok(orderService.cancelOrder(email, id));
    }

    // Admin APIs
    @GetMapping("/admin")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/admin/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Integer id, @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
}
