package com.example.demo.repository;

import com.example.demo.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Integer productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProduct(@Param("productId") Integer productId);

    boolean existsByUserIdAndProductId(Integer userId, Integer productId);

    boolean existsByOrderItemId(Integer orderItemId);

    Optional<Review> findByOrderItemId(Integer orderItemId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
