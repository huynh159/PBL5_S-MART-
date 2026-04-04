package com.example.demo.service;

import com.example.demo.dto.ReviewRequest;
import com.example.demo.entity.OrderItem;
import com.example.demo.entity.Product;
import com.example.demo.entity.Review;
import com.example.demo.entity.User;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional
    public Review createReview(String email, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (request.getOrderItemId() != null) {
            OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                    .orElseThrow(() -> new RuntimeException("Order item not found"));

            if (!orderItem.getOrder().getUser().getId().equals(user.getId())) {
                throw new RuntimeException("This order item does not belong to you");
            }
            if (reviewRepository.existsByOrderItemId(request.getOrderItemId())) {
                throw new RuntimeException("You already reviewed this order item");
            }
        } else {
            // Fallback for generic product review if orderItemId is missing
            boolean hasPurchased = orderItemRepository
                    .existsByOrderUserIdAndProductId(user.getId(), product.getId());
            if (!hasPurchased) {
                throw new RuntimeException("User has not purchased this product");
            }
            if (reviewRepository.existsByUserIdAndProductId(user.getId(), product.getId())) {
                throw new RuntimeException("You already reviewed this product");
            }
        }

        int rating = request.getRating() != null ? request.getRating() : 5;
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(rating)
                .comment(request.getComment())
                .images(request.getImages())
                .variation(request.getVariation())
                .orderItemId(request.getOrderItemId())
                .build();

        return reviewRepository.save(review);
    }

    @Transactional
    public Review likeReview(Integer reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setLikes(review.getLikes() + 1);
        return reviewRepository.save(review);
    }

    @Transactional
    public Review updateReview(String email, Integer reviewId, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only update your own reviews");
        }

        int rating = request.getRating() != null ? request.getRating() : review.getRating();
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        review.setRating(rating);
        review.setComment(request.getComment());
        if (request.getImages() != null) {
            review.setImages(request.getImages());
        }

        return reviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public Review getReviewByOrderItemId(Integer orderItemId) {
        return reviewRepository.findByOrderItemId(orderItemId).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Review> getMyReviews(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public List<Review> getReviewsForProduct(Integer productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional(readOnly = true)
    public Double getAverageRating(Integer productId) {
        return reviewRepository.getAverageRatingByProduct(productId);
    }

    @Transactional(readOnly = true)
    public long getTotalSold(Integer productId) {
        // Đếm tổng quantity đã bán cho sản phẩm này
        List<OrderItem> items = orderItemRepository.findByProductId(productId);
        return items.stream().mapToLong(OrderItem::getQuantity).sum();
    }
}
