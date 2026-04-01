package com.example.demo.repository;

import com.example.demo.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    List<OrderItem> findByOrderId(Integer orderId);

    boolean existsByProductId(Integer productId);

    // Kiểm tra user đã mua sản phẩm này hay chưa
    boolean existsByOrderUserIdAndProductId(Integer userId, Integer productId);

    // Lấy tất cả order item của 1 sản phẩm để tính tổng sold
    List<OrderItem> findByProductId(Integer productId);
}



