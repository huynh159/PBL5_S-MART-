package com.example.demo.repository;

import com.example.demo.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<Order> findByUserId(Integer userId);

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.status = 'DELIVERED'")
    Double calculateTotalRevenue();

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countOrdersByStatus();

    @Query("SELECT DISTINCT YEAR(o.createdAt) FROM Order o ORDER BY YEAR(o.createdAt) DESC")
    List<Integer> findAvailableYears();

    // Lấy doanh thu theo từng tháng của một năm cụ thể
    @Query("SELECT MONTH(o.createdAt), SUM(o.total) FROM Order o " +
           "WHERE YEAR(o.createdAt) = :year AND o.status = 'DELIVERED' " +
           "GROUP BY MONTH(o.createdAt) ORDER BY MONTH(o.createdAt)")
    List<Object[]> calculateRevenueByMonth(@Param("year") Integer year);
}
