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

    @PutMapping("/{reviewId}")
    public ResponseEntity<Review> updateReview(Authentication authentication,
                                               @PathVariable Integer reviewId,
                                               @RequestBody ReviewRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(reviewService.updateReview(email, reviewId, request));
    }

    @GetMapping("/order-item/{orderItemId}")
    public ResponseEntity<Review> getReviewByOrderItem(@PathVariable Integer orderItemId) {
        Review review = reviewService.getReviewByOrderItemId(orderItemId);
        if (review != null) {
            return ResponseEntity.ok(review);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<Review>> getMyReviews(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(reviewService.getMyReviews(email));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsForProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(reviewService.getReviewsForProduct(productId));
    }

    @PutMapping("/{reviewId}/like")
    public ResponseEntity<Review> likeReview(@PathVariable Integer reviewId) {
        return ResponseEntity.ok(reviewService.likeReview(reviewId));
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
