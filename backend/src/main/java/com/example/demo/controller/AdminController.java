package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam(required = false) Integer year) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("totalOrders", orderRepository.count());
        
        // Cập nhật tính tổng doanh thu như dự án thực tế qua csdl query
        Double totalRevenue = orderRepository.calculateTotalRevenue();
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);

        // Fetch Order Status Counts
        List<Object[]> statusCounts = orderRepository.countOrdersByStatus();
        List<Map<String, Object>> orderStatusStats = new ArrayList<>();
        for (Object[] row : statusCounts) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("value", row[1]);
            orderStatusStats.add(item);
        }
        stats.put("orderStatusStats", orderStatusStats);

        // Calculate Year
        int targetYear = (year != null) ? year : Year.now().getValue();
        stats.put("selectedYear", targetYear);

        // Find available years
        List<Integer> availableYears = orderRepository.findAvailableYears();
        // If DB doesn't have orders yet, just include current year
        if (!availableYears.contains(Year.now().getValue())) {
            availableYears.add(Year.now().getValue());
            availableYears.sort((a,b) -> b.compareTo(a)); // Descending
        }
        stats.put("availableYears", availableYears);

        // Fetch Revenue By Month (For selected year)
        List<Object[]> revenueByM = orderRepository.calculateRevenueByMonth(targetYear);
        List<Map<String, Object>> revenueByMonthStats = new ArrayList<>();
        
        // Initialize all 12 months with 0
        Map<Integer, Double> monthlyRevenueMap = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            monthlyRevenueMap.put(i, 0.0);
        }
        
        for (Object[] row : revenueByM) {
            Integer m = (Integer) row[0];
            Double rev = (Double) row[1];
            monthlyRevenueMap.put(m, rev != null ? rev : 0.0);
        }
        
        for (int i = 1; i <= 12; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("month", "Tháng " + i);
            item.put("revenue", monthlyRevenueMap.get(i));
            revenueByMonthStats.add(item);
        }
        
        stats.put("revenueByMonth", revenueByMonthStats);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/toggle-lock")
    public ResponseEntity<User> toggleUserLock(@PathVariable Integer id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(!user.getIsActive());
        return ResponseEntity.ok(userRepository.save(user));
    }
}
