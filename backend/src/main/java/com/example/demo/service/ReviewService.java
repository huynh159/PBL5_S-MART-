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

        // Chỉ cho phép đánh giá nếu user đã mua sản phẩm
        boolean hasPurchased = orderItemRepository
                .existsByOrderUserIdAndProductId(user.getId(), product.getId());
        if (!hasPurchased) {
            throw new RuntimeException("User has not purchased this product");
        }

        // Mỗi user chỉ nên review 1 lần / product (simple rule)
        if (reviewRepository.existsByUserIdAndProductId(user.getId(), product.getId())) {
            throw new RuntimeException("You already reviewed this product");
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
                .build();

        return reviewRepository.save(review);
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

