package com.example.demo.service;

import com.example.demo.dto.CartRequest;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<CartItem> getCartItems(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return cartItemRepository.findByUserId(user.getId());
    }

    @Transactional
    public CartItem addToCart(String email, CartRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(request.getProductId()).orElseThrow(() -> new RuntimeException("Product not found"));      

        Optional<CartItem> existingItem;
        if (request.getColor() != null || request.getSize() != null) {
            existingItem = cartItemRepository.findByUserIdAndProductIdAndColorAndSize(user.getId(), product.getId(), request.getColor(), request.getSize());
        } else {
            existingItem = cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId());
        }

        if (existingItem.isPresent()) {
            CartItem cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
            if (request.getPrice() != null) {
                cartItem.setPrice(request.getPrice());
            }
            return cartItemRepository.save(cartItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(request.getQuantity())
                    .color(request.getColor())
                    .size(request.getSize())
                    .price(request.getPrice() != null ? request.getPrice() : (product.getSalePrice() != null ? product.getSalePrice().doubleValue() : product.getPrice().doubleValue()))
                    .build();
            return cartItemRepository.save(newItem);
        }
    }

    @Transactional
    public CartItem updateCartItemQuantity(String email, Integer cartItemId, Integer quantity) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CartItem cartItem = cartItemRepository.findById(cartItemId).orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        if (!cartItem.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    @Transactional
    public void removeCartItem(String email, Integer cartItemId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CartItem cartItem = cartItemRepository.findById(cartItemId).orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        if (!cartItem.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        cartItemRepository.delete(cartItem);
    }
    
    @Transactional
    public void clearCart(String email) {
         User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
         cartItemRepository.deleteByUserId(user.getId());
    }
}
