package com.example.demo.controller;

import com.example.demo.dto.CartRequest;
import com.example.demo.entity.CartItem;
import com.example.demo.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItem>> getCartItems(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.getCartItems(email));
    }

    @PostMapping
    public ResponseEntity<CartItem> addToCart(Authentication authentication, @RequestBody CartRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.addToCart(email, request));
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItem> updateCartItemQuantity(Authentication authentication,
                                                           @PathVariable Integer cartItemId,
                                                           @RequestParam Integer quantity) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.updateCartItemQuantity(email, cartItemId, quantity));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(Authentication authentication, @PathVariable Integer cartItemId) {
        String email = authentication.getName();
        cartService.removeCartItem(email, cartItemId);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        String email = authentication.getName();
        cartService.clearCart(email);
        return ResponseEntity.ok().build();
    }
}

