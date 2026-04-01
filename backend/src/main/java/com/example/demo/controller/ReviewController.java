package com.example.demo.controller;

import com.example.demo.dto.ReviewRequest;
import com.example.demo.entity.Review;
import com.example.demo.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<Review> createReview(Authentication authentication,
                                               @RequestBody ReviewRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(reviewService.createReview(email, request));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsForProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(reviewService.getReviewsForProduct(productId));
    }

    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<Map<String, Object>> getStatsForProduct(@PathVariable Integer productId) {
        Double avgRating = reviewService.getAverageRating(productId);
        long totalSold = reviewService.getTotalSold(productId);

        Map<String, Object> body = new HashMap<>();
        body.put("averageRating", avgRating != null ? avgRating : 0.0);
        body.put("totalSold", totalSold);

        return ResponseEntity.ok(body);
    }
}

